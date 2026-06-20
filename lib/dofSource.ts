import { formatISO, isValid, parse } from "date-fns";

import { sanitizeHTML } from "./sanitize";

/**
 * Pure (no `server-only`) helpers for fetching and parsing notes from the
 * upstream DOF site. Shared by the app read-path (`lib/getNote.ts`) and the
 * `scripts/ingest.ts` CLI so both produce byte-identical cached notes.
 */

export interface NoteMetadata {
  title: string;
  published_at: string;
}

export interface Note {
  metadata: NoteMetadata;
  content: string;
}

/** Generic site-chrome `<title>` that wraps every nota page; never the real
 *  document title. */
const GENERIC_TITLE = "DOF - Diario Oficial de la Federación";

const USER_AGENT =
  "dof-reader/0.1 (+https://dof.toniotgz.com; unofficial DOF reader)";

/** Build the canonical upstream URL for a nota. `fecha` (DD/MM/YYYY) is
 *  optional — the page resolves from the `codigo` alone — but including it
 *  matches the links the DOF index itself emits. */
export function buildSourceUrl(id: string, fecha?: string): string {
  const base = `https://dof.gob.mx/nota_detalle.php?codigo=${id}`;
  return fecha ? `${base}&fecha=${encodeURIComponent(fecha)}` : base;
}

export async function fetchFromSource(
  id: string,
  fecha?: string,
): Promise<string> {
  const response = await fetch(buildSourceUrl(id, fecha), {
    headers: { "User-Agent": USER_AGENT },
  });
  return response.text();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  Uuml: "Ü",
  auml: "ä",
  ouml: "ö",
  ccedil: "ç",
  Ccedil: "Ç",
  ordf: "ª",
  ordm: "º",
  deg: "°",
  laquo: "«",
  raquo: "»",
  iexcl: "¡",
  iquest: "¿",
  middot: "·",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

/** Decode the HTML entities the DOF emits in titles (named + numeric). */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name) =>
      name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : match,
    );
}

/**
 * Extract `{ title, published_at }` from a raw nota page.
 *
 * Title: a nota page embeds its own HTML document (with the real `<title>`)
 * inside the site chrome, so the page contains multiple `<title>` tags. We take
 * the last one that isn't the generic site title. Falls back to the `<h1>` in
 * the detail container, then to an empty string.
 *
 * Date: the upstream renders `<b>DOF: dd/mm/yyyy</b>`; we parse that to ISO.
 */
export function findMetadata(data: string): NoteMetadata {
  const titles = [...data.matchAll(/<title>([\s\S]*?)<\/title>/g)]
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const specific = titles.filter((title) => title !== GENERIC_TITLE);

  let rawTitle = specific.at(-1) ?? "";
  if (!rawTitle) {
    // Fallback: the bold first heading inside the detail container.
    const heading = data.match(
      /class=['"]?Titulo_1['"]?[^>]*>([\s\S]*?)<\/h1>/i,
    )?.[1];
    if (heading) rawTitle = heading.replace(/<[^>]+>/g, " ");
  }
  const title = decodeEntities(rawTitle).replace(/\s+/g, " ").trim();

  const dofMatch = data.match(/<b>DOF:(.*?)<\/b>/)?.[0] ?? "";
  const dateText = dofMatch.replace("<b>DOF:", "").replace("</b>", "").trim();
  // Guard against an unexpected/malformed date: don't let formatISO throw on an
  // Invalid Date and sink an otherwise-valid note. Downstream formatters treat
  // an empty published_at gracefully.
  const parsed = parse(dateText, "dd/MM/yyyy", new Date());
  const published_at = isValid(parsed) ? formatISO(parsed) : "";

  return { title, published_at };
}

/** Parse a raw nota page into the cached `Note` shape (metadata + sanitized
 *  content). Does not perform any I/O. */
export function noteFromSource(html: string): Note {
  return { metadata: findMetadata(html), content: sanitizeHTML(html) };
}
