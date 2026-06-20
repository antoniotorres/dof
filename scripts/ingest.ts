/**
 * DOF ingestion CLI.
 *
 * Fetches every nota published on a date (or date range) from the DOF daily
 * index and caches each one as `<codigo>.json` in the R2 bucket — the same
 * shape the app read-path (`lib/getNote.ts`) writes on a cache miss. Parsing and
 * sanitizing are shared via `lib/dofSource.ts`, so ingested notes are identical
 * to lazily-cached ones.
 *
 * Usage:
 *   pnpm ingest <from> [to] [options]
 *   tsx scripts/ingest.ts 2026-06-18 2026-06-19 --dry-run
 *
 * Arguments:
 *   <from>            Start date, YYYY-MM-DD.
 *   [to]             End date, YYYY-MM-DD (inclusive). Defaults to <from>.
 *
 * Options:
 *   --dry-run        Fetch + parse and print the plan, but write nothing to R2.
 *   --force          Re-fetch and overwrite notes already cached in R2.
 *   --editions=LIST  Comma list of editions to pull. Default: MAT,VES.
 *   --concurrency=N  Max simultaneous upstream fetches. Default: 6.
 *
 * Env (loaded from .env.local when present): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 * R2_SECRET_ACCESS_KEY, R2_BUCKET. Credentials are only required for writes and
 * for the "already cached" check; a --dry-run works without them.
 */

import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { dofFetchText } from "../lib/dofCA";
import {
  buildSourceUrl,
  decodeEntities,
  noteFromSource,
  type Note,
} from "../lib/dofSource";

// --- Env -------------------------------------------------------------------

// Load .env.local if Node supports it (v20.12+/v22+) and the file exists. The
// app uses Next's loader; this CLI runs standalone, so load it ourselves.
try {
  (
    process as NodeJS.Process & { loadEnvFile?: (path?: string) => void }
  ).loadEnvFile?.(".env.local");
} catch {
  // No .env.local (e.g. CI with real env vars set) — fine.
}

const EDITIONS = ["MAT", "VES"] as const;
type Edition = (typeof EDITIONS)[number];

interface IndexEntry {
  codigo: string;
  /** DD/MM/YYYY as emitted by the index links. */
  fecha: string;
  edition: Edition;
  /** Best-effort title from the index anchor (the authoritative one comes from
   *  the note page itself during fetch). */
  indexTitle: string;
}

interface Plan {
  entry: IndexEntry;
  status: "new" | "cached" | "error";
  /** Authoritative title parsed from the note page (when fetched). */
  title: string;
  publishedAt: string;
  bytes: number;
  error?: string;
}

// --- Args ------------------------------------------------------------------

interface Args {
  from: string;
  to: string;
  dryRun: boolean;
  force: boolean;
  editions: Edition[];
  concurrency: number;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let dryRun = false;
  let force = false;
  let editions: Edition[] = [...EDITIONS];
  let concurrency = 6;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--force") force = true;
    else if (arg.startsWith("--editions=")) {
      editions = arg
        .slice("--editions=".length)
        .split(",")
        .map((part) => part.trim().toUpperCase())
        .filter((part): part is Edition =>
          (EDITIONS as readonly string[]).includes(part),
        );
    } else if (arg.startsWith("--concurrency=")) {
      const value = Number(arg.slice("--concurrency=".length));
      if (Number.isFinite(value) && value > 0) concurrency = Math.floor(value);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const [from, to = from] = positional;
  if (!from || !isISODate(from) || !isISODate(to)) {
    throw new Error(
      "Usage: tsx scripts/ingest.ts <from> [to] [--dry-run] [--force] " +
        "[--editions=MAT,VES] [--concurrency=N]   (dates are YYYY-MM-DD)",
    );
  }
  if (to < from)
    throw new Error(`End date ${to} is before start date ${from}.`);
  if (editions.length === 0) throw new Error("No valid editions specified.");

  return { from, to, dryRun, force, editions, concurrency };
}

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** Inclusive list of YYYY-MM-DD dates from `from` to `to`, computed in UTC to
 *  avoid DST/timezone drift. */
function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (
    let day = new Date(`${from}T00:00:00Z`);
    day <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

/** YYYY-MM-DD -> DD/MM/YYYY (the format the index links use). */
function toDofDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// --- Fetch helpers ---------------------------------------------------------
// HTTP to dof.gob.mx (with the TLS-chain workaround, retries and timeout) lives
// in lib/dofCA.ts (`dofFetchText`), shared with the app read-path.

/** Run `fn` over `items` with at most `limit` in flight, preserving order. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) break;
        results[index] = await fn(items[index], index);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

// --- DOF index parsing -----------------------------------------------------

function indexUrl(iso: string, edition: Edition): string {
  const [year, month, day] = iso.split("-");
  return `https://www.dof.gob.mx/index.php?year=${year}&month=${month}&day=${day}&edicion=${edition}`;
}

/**
 * Parse a daily-index page into nota entries. The DOF default index is
 * unreliable (it can omit notes), so we query each edition explicitly and parse
 * the `codigo` + `fecha` from the link hrefs, keeping only links whose `fecha`
 * matches the requested day. Anchor text gives a best-effort title.
 */
function parseIndex(html: string, iso: string, edition: Edition): IndexEntry[] {
  const wantFecha = toDofDate(iso);
  const byCodigo = new Map<string, IndexEntry>();

  // Titled anchors: <a href="...codigo=N&amp;fecha=DD/MM/YYYY" class="enlaces">TITLE</a>
  const anchorRe =
    /<a\b[^>]*?codigo=(\d+)(?:&amp;|&)fecha=(\d{2}\/\d{2}\/\d{4})[^>]*>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(anchorRe)) {
    const [, codigo, fecha, inner] = match;
    if (fecha !== wantFecha) continue;
    const indexTitle = decodeEntities(inner.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (!byCodigo.has(codigo)) {
      byCodigo.set(codigo, { codigo, fecha, edition, indexTitle });
    } else if (indexTitle && !byCodigo.get(codigo)!.indexTitle) {
      byCodigo.get(codigo)!.indexTitle = indexTitle;
    }
  }

  // Safety net: any codigo+fecha link the anchor regex missed (e.g. odd
  // attribute order) still gets ingested, just without an index title.
  const bareRe = /codigo=(\d+)(?:&amp;|&)fecha=(\d{2}\/\d{2}\/\d{4})/g;
  for (const match of html.matchAll(bareRe)) {
    const [, codigo, fecha] = match;
    if (fecha !== wantFecha || byCodigo.has(codigo)) continue;
    byCodigo.set(codigo, { codigo, fecha, edition, indexTitle: "" });
  }

  return [...byCodigo.values()];
}

async function collectEntries(
  iso: string,
  editions: Edition[],
): Promise<IndexEntry[]> {
  const byCodigo = new Map<string, IndexEntry>();
  for (const edition of editions) {
    let html: string;
    try {
      html = await dofFetchText(indexUrl(iso, edition));
    } catch (error) {
      noteIfTlsChainError(error);
      console.error(
        `  ! failed to fetch ${edition} index for ${iso}: ${describe(error)}`,
      );
      continue;
    }
    for (const entry of parseIndex(html, iso, edition)) {
      // First edition that lists a codigo wins (MAT before VES).
      if (!byCodigo.has(entry.codigo)) byCodigo.set(entry.codigo, entry);
    }
  }
  return [...byCodigo.values()].sort((a, b) =>
    a.codigo.localeCompare(b.codigo),
  );
}

// --- R2 --------------------------------------------------------------------

function makeR2(): S3Client | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/** Every object key currently in the bucket (paginated). */
async function listExistingKeys(
  client: S3Client,
  bucket: string,
): Promise<Set<string>> {
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      }),
    );
    for (const object of result.Contents ?? []) {
      if (object.Key) keys.add(object.Key);
    }
    token = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function uploadNote(
  client: S3Client,
  bucket: string,
  codigo: string,
  note: Note,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `${codigo}.json`,
      Body: JSON.stringify(note),
      ContentType: "application/json",
    }),
  );
}

// --- Reporting -------------------------------------------------------------

function errorCause(error: unknown): string | undefined {
  return error instanceof Error
    ? (error as { cause?: { code?: string } }).cause?.code
    : undefined;
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = errorCause(error);
  return code ? `${error.message} (${code})` : error.message;
}

/** The DOF site serves an incomplete TLS chain; this is the telltale error when
 *  the Go Daddy intermediate isn't trusted. */
let sawTlsChainError = false;
function noteIfTlsChainError(error: unknown): void {
  if (errorCause(error) === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    sawTlsChainError = true;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function printPlans(plans: Plan[]): void {
  for (const plan of plans) {
    const tag =
      plan.status === "error"
        ? "ERR "
        : plan.status === "cached"
          ? "skip"
          : "new ";
    const title =
      plan.status === "error"
        ? `(fetch failed: ${plan.error})`
        : truncate(plan.title || "(no title parsed)", 88);
    const date = plan.publishedAt
      ? plan.publishedAt.slice(0, 10)
      : "????-??-??";
    const kb = plan.bytes ? `${(plan.bytes / 1024).toFixed(1)}kb` : "    ";
    console.log(
      `  [${tag}] ${plan.entry.edition} ${plan.entry.codigo}  ${date}  ${kb.padStart(7)}  ${title}`,
    );
  }
}

// --- Main ------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const bucket = process.env.R2_BUCKET ?? "";
  const client = makeR2();

  console.log(
    `DOF ingest — ${args.from}${args.to !== args.from ? `..${args.to}` : ""} ` +
      `| editions: ${args.editions.join(",")} | concurrency: ${args.concurrency}` +
      (args.dryRun ? " | DRY RUN (no writes)" : "") +
      (args.force ? " | FORCE (overwrite cached)" : ""),
  );

  if (!args.dryRun && !client) {
    throw new Error(
      "R2 credentials missing (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / " +
        "R2_SECRET_ACCESS_KEY). Set them in .env.local or pass --dry-run.",
    );
  }
  if (!args.dryRun && !bucket) {
    throw new Error("R2_BUCKET is not set. Set it in .env.local.");
  }

  // One listing up front powers the cached/new classification.
  let existing = new Set<string>();
  if (client && bucket) {
    try {
      existing = await listExistingKeys(client, bucket);
      console.log(
        `R2 bucket "${bucket}" currently holds ${existing.size} notes.`,
      );
    } catch (error) {
      console.error(`! could not list R2 bucket: ${describe(error)}`);
      if (!args.dryRun) throw error;
    }
  } else {
    console.log("R2 not configured — classifying everything as new.");
  }

  const totals = { found: 0, uploaded: 0, skipped: 0, errored: 0 };

  for (const iso of dateRange(args.from, args.to)) {
    const entries = await collectEntries(iso, args.editions);
    console.log(`\n${iso} — ${entries.length} nota(s) on the index`);
    totals.found += entries.length;
    if (entries.length === 0) continue;

    const plans = await mapLimit(entries, args.concurrency, async (entry) => {
      const plan: Plan = {
        entry,
        status: "new",
        title: entry.indexTitle,
        publishedAt: "",
        bytes: 0,
      };

      const cached = existing.has(`${entry.codigo}.json`);
      if (cached && !args.force) {
        plan.status = "cached";
        return plan;
      }

      try {
        const html = await dofFetchText(
          buildSourceUrl(entry.codigo, entry.fecha),
        );
        const note = noteFromSource(html);
        plan.title = note.metadata.title || entry.indexTitle;
        plan.publishedAt = note.metadata.published_at;
        plan.bytes = JSON.stringify(note).length;

        if (!args.dryRun && client) {
          await uploadNote(client, bucket, entry.codigo, note);
        }
        // Stays "new" whether this was a fresh fetch or a --force overwrite.
        return plan;
      } catch (error) {
        noteIfTlsChainError(error);
        plan.status = "error";
        plan.error = describe(error);
        return plan;
      }
    });

    printPlans(plans);
    for (const plan of plans) {
      if (plan.status === "cached") totals.skipped++;
      else if (plan.status === "error") totals.errored++;
      else if (!args.dryRun) totals.uploaded++;
    }
  }

  console.log(
    `\n${args.dryRun ? "Would process" : "Done"} — ` +
      `${totals.found} found, ` +
      `${args.dryRun ? `${totals.found - totals.skipped - totals.errored} to upload` : `${totals.uploaded} uploaded`}, ` +
      `${totals.skipped} already cached, ${totals.errored} errored.`,
  );
  if (args.dryRun) {
    console.log(
      "Dry run — nothing was written to R2. Re-run without --dry-run to upload.",
    );
  }

  if (sawTlsChainError) {
    console.error(
      "\n! TLS chain error talking to dof.gob.mx (UNABLE_TO_VERIFY_LEAF_SIGNATURE).\n" +
        "  The site ships an incomplete certificate chain. Run via `pnpm ingest`,\n" +
        "  which sets NODE_EXTRA_CA_CERTS=scripts/dof-godaddy-g2-intermediate.pem.",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\ningest failed: ${describe(error)}`);
  process.exit(1);
});
