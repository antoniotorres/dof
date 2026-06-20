# R2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AWS S3 storage layer with a Cloudflare R2 public bucket, upgrade to `@aws-sdk/client-s3` v3, and add repo-tracked R2 provisioning tooling.

**Architecture:** R2 is S3-compatible, so the storage layer is reimplemented against R2's S3 HTTP endpoint using the modular AWS SDK v3. Reads are served from an R2 public bucket URL; writes use `PutObjectCommand`. Application logic (fetch/parse/sanitize DOF notes) is untouched. Provisioning is handled by `wrangler.toml` (IaC) plus a `scripts/setup-r2.sh` first-time setup script.

**Tech Stack:** Next.js 10, TypeScript, `@aws-sdk/client-s3` v3, Cloudflare R2, Wrangler CLI.

## Global Constraints

- **Public repository** — no secrets in any tracked file (no account ID, keys, or tokens in `wrangler.toml`, scripts, or committed env files).
- All credentials come from environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
- R2 `S3Client` config: `region: "auto"`, `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.
- Keep public export signatures stable: `getFiles()` and `uploadFile(filename: string, data: string)`.
- No test framework exists; verification is manual via `next build` and runtime checks.
- Repo uses `yarn`.

---

### Task 1: Swap dependency and create R2 client module

**Files:**
- Create: `lib/r2.ts`
- Delete: `lib/aws.ts`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: env vars from Global Constraints.
- Produces:
  - `getFiles(): Promise<{ Key: string; LastModified: Date }[] | undefined>` — lists objects in the bucket (returns the `Contents` array from `ListObjectsV2Command`).
  - `uploadFile(filename: string, data: string): Promise<void>` — uploads a string body to the bucket under key `filename`.

- [ ] **Step 1: Update package.json dependencies**

Remove the `aws-sdk` line and add `@aws-sdk/client-s3`. In `package.json` `dependencies`, replace:

```json
    "aws-sdk": "2.853.0",
```

with:

```json
    "@aws-sdk/client-s3": "3.300.0",
```

- [ ] **Step 2: Install dependencies**

Run: `yarn install`
Expected: `aws-sdk` removed, `@aws-sdk/client-s3` added, no errors.

- [ ] **Step 3: Create `lib/r2.ts`**

```typescript
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

// R2 is S3-compatible. Credentials and endpoint come from env vars.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

/**
 * List the objects stored in the R2 bucket.
 */
export async function getFiles() {
  const output = await r2.send(
    new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET }),
  );
  return output.Contents;
}

/**
 * Store a string of data into the R2 bucket under the given key.
 * @param filename Key of the object to store
 * @param data String body to store
 */
export async function uploadFile(filename: string, data: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: filename,
      Body: data,
      ContentType: "application/json",
    }),
  );
  console.log(`File uploaded successfully: ${filename}`);
}
```

- [ ] **Step 4: Delete `lib/aws.ts`**

Run: `git rm lib/aws.ts`
Expected: file removed.

- [ ] **Step 5: Verify it type-checks (will fail to build until callers are updated)**

Run: `yarn tsc --noEmit`
Expected: errors ONLY about `lib/aws` imports in `lib/getNote.ts` and `pages/notas/[id].tsx` (fixed in Task 2). No errors inside `lib/r2.ts` itself.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock lib/r2.ts
git commit -m "feat(r2): Add R2 client module, replace aws-sdk with v3"
```

---

### Task 2: Update callers to use R2

**Files:**
- Modify: `lib/getNote.ts:2` (import) and `lib/getNote.ts:13-22` (`fetchFromS3`)
- Modify: `pages/notas/[id].tsx:8` (import)

**Interfaces:**
- Consumes: `getFiles`, `uploadFile` from `lib/r2.ts` (Task 1).
- Produces: app reads cached notes from `${R2_PUBLIC_URL}/<id>.json`.

- [ ] **Step 1: Update import in `lib/getNote.ts`**

Change line 2 from:

```typescript
import { uploadFile } from "./aws";
```

to:

```typescript
import { uploadFile } from "./r2";
```

- [ ] **Step 2: Update `fetchFromS3` to read from R2 public URL**

Rename the function and switch the URL. Replace lines 13-22:

```typescript
async function fetchFromS3(id: string) {
  const response = await fetch(
    `https://${process.env.SERVER_AWS_BUCKET}.s3.${process.env.SERVER_AWS_REGION}.amazonaws.com/${id}.json`,
  );
  const data = await response.text();
  if (response.status === 200) {
    return data;
  }
  throw new Error(data);
}
```

with:

```typescript
async function fetchFromR2(id: string) {
  const response = await fetch(`${process.env.R2_PUBLIC_URL}/${id}.json`);
  const data = await response.text();
  if (response.status === 200) {
    return data;
  }
  throw new Error(data);
}
```

- [ ] **Step 3: Update the call site and log messages in `getNote`**

In the `getNote` function body, replace:

```typescript
  try {
    const s3File = await fetchFromS3(id);
    console.log("File Found in S3 ... OK");
    if (s3File) {
      return JSON.parse(s3File);
    }
  } catch (e) {
    console.error(e);
  }

  // Download file from original DOF page
  console.log("Not Found in S3 ... Fallback to DOF");
```

with:

```typescript
  try {
    const r2File = await fetchFromR2(id);
    console.log("File Found in R2 ... OK");
    if (r2File) {
      return JSON.parse(r2File);
    }
  } catch (e) {
    console.error(e);
  }

  // Download file from original DOF page
  console.log("Not Found in R2 ... Fallback to DOF");
```

- [ ] **Step 4: Update import in `pages/notas/[id].tsx`**

Change line 8 from:

```typescript
import { getFiles } from "../../lib/aws";
```

to:

```typescript
import { getFiles } from "../../lib/r2";
```

- [ ] **Step 5: Verify type-check passes**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Verify build succeeds**

Run: `yarn build`
Expected: build completes (pages relying on R2 env vars may log fetch fallbacks, but build does not fail).

- [ ] **Step 7: Commit**

```bash
git add lib/getNote.ts "pages/notas/[id].tsx"
git commit -m "feat(r2): Point note reads/writes at R2"
```

---

### Task 3: Migrate the sitemap generator script

**Files:**
- Modify: `scripts/generate-sitemap.js:5-29` (S3 client + list logic)

**Interfaces:**
- Consumes: same env vars; `ListObjectsV2Command` from `@aws-sdk/client-s3`.
- Produces: `public/sitemap.xml` built from R2 object keys (unchanged output shape).

- [ ] **Step 1: Replace the AWS SDK setup and list logic**

Replace lines 5-29 (the `const AWS = require(...)` through the end of `getFiles`):

```javascript
const AWS = require("aws-sdk");

// Load S3 with env variables
const s3 = new AWS.S3({
  region: process.env.SERVER_AWS_REGION,
  accessKeyId: process.env.SERVER_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SERVER_AWS_ACCESS_SECRET,
});

async function listObjectsBucket() {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.SERVER_AWS_BUCKET,
    };
    s3.listObjects(params, (s3Err, data) => {
      if (s3Err) reject(s3Err);
      resolve(data);
    });
  });
}

async function getFiles() {
  const list = await listObjectsBucket();
  return list.Contents;
}
```

with:

```javascript
const {
  S3Client,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

// R2 is S3-compatible; credentials and endpoint come from env vars.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function getFiles() {
  const output = await r2.send(
    new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET }),
  );
  return output.Contents;
}
```

Note: the downstream `.map` uses `page.Key` and `page.LastModified`, which `ListObjectsV2Command` returns identically — no other changes needed.

- [ ] **Step 2: Verify the script parses (syntax check)**

Run: `node --check scripts/generate-sitemap.js`
Expected: no output (valid syntax).

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-sitemap.js
git commit -m "feat(r2): Migrate sitemap generator to R2"
```

---

### Task 4: Add `.env.example` and wrangler.toml

**Files:**
- Create: `.env.example`
- Create: `wrangler.toml`

**Interfaces:**
- Consumes: nothing.
- Produces: documented env var names; IaC declaration of the R2 bucket.

- [ ] **Step 1: Create `.env.example`**

```bash
# Cloudflare R2 configuration
# Copy to .env.local and fill in. NEVER commit real values.

# Cloudflare account ID (found in the R2 dashboard)
R2_ACCOUNT_ID=

# R2 API token credentials (create in the Cloudflare dashboard: R2 > Manage API Tokens)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# Bucket name
R2_BUCKET=

# Public read base URL (e.g. https://pub-xxxxxxxx.r2.dev or your custom domain)
R2_PUBLIC_URL=
```

- [ ] **Step 2: Verify `.env.example` is NOT gitignored but real env files are**

Run: `git check-ignore .env.example .env.local; echo "exit: $?"`
Expected: `.env.local` printed (ignored), `.env.example` NOT printed.

- [ ] **Step 3: Create `wrangler.toml`**

Contains no secrets — only the bucket binding for use with `wrangler r2` commands. Replace `dof-notas` only if you choose a different bucket name (must match `R2_BUCKET`).

```toml
name = "dof"

# R2 bucket binding. No secrets here — account ID and credentials are
# provided via environment variables at runtime (see .env.example).
[[r2_buckets]]
binding = "NOTAS"
bucket_name = "dof-notas"
```

- [ ] **Step 4: Confirm no secrets present**

Run: `grep -iE "key|secret|token|[0-9a-f]{32}" wrangler.toml; echo "exit: $?"`
Expected: no matches (`exit: 1`).

- [ ] **Step 5: Commit**

```bash
git add .env.example wrangler.toml
git commit -m "chore(r2): Add env example and wrangler bucket config"
```

---

### Task 5: Add the R2 setup script

**Files:**
- Create: `scripts/setup-r2.sh`

**Interfaces:**
- Consumes: `wrangler` CLI, `R2_BUCKET` (env var or default).
- Produces: a provisioned R2 bucket with public dev URL enabled; printed env-var checklist.

- [ ] **Step 1: Create `scripts/setup-r2.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# First-time Cloudflare R2 provisioning for this project.
# Safe for a public repo: reads no secrets from tracked files and writes none.

BUCKET="${R2_BUCKET:-dof-notas}"

echo "==> Checking for wrangler..."
if ! command -v wrangler >/dev/null 2>&1; then
  echo "ERROR: wrangler is not installed."
  echo "Install it with: npm install -g wrangler"
  exit 1
fi

echo "==> Checking Cloudflare authentication..."
if ! wrangler whoami >/dev/null 2>&1; then
  echo "ERROR: not authenticated. Run: wrangler login"
  exit 1
fi

echo "==> Creating R2 bucket '${BUCKET}' (skips if it already exists)..."
wrangler r2 bucket create "${BUCKET}" || \
  echo "Bucket may already exist; continuing."

echo "==> Enabling public dev URL for '${BUCKET}'..."
wrangler r2 bucket dev-url enable "${BUCKET}"

echo ""
echo "============================================================"
echo "Setup complete. Set these environment variables in your"
echo "deploy platform (and .env.local for local dev):"
echo ""
echo "  R2_ACCOUNT_ID        (Cloudflare account ID)"
echo "  R2_ACCESS_KEY_ID     (from an R2 API token)"
echo "  R2_SECRET_ACCESS_KEY (from an R2 API token)"
echo "  R2_BUCKET=${BUCKET}"
echo "  R2_PUBLIC_URL        (the pub-<hash>.r2.dev URL printed above)"
echo ""
echo "Create an R2 API token in the Cloudflare dashboard:"
echo "  R2 > Manage R2 API Tokens > Create API Token"
echo "(Tokens cannot be created from this script for security.)"
echo "============================================================"
```

- [ ] **Step 2: Make the script executable**

Run: `chmod +x scripts/setup-r2.sh`
Expected: no output.

- [ ] **Step 3: Syntax-check the script**

Run: `bash -n scripts/setup-r2.sh`
Expected: no output (valid syntax).

- [ ] **Step 4: Confirm no secrets are baked in**

Run: `grep -iE "secret.*=.+|[0-9a-f]{32}" scripts/setup-r2.sh; echo "exit: $?"`
Expected: no matches (`exit: 1`).

- [ ] **Step 5: Commit**

```bash
git add scripts/setup-r2.sh
git commit -m "feat(r2): Add R2 provisioning setup script"
```

---

### Task 6: Final verification and cleanup

**Files:**
- Modify (if needed): `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a clean, building, secret-free repo.

- [ ] **Step 1: Confirm no remaining AWS references**

Run: `grep -rin "aws\|SERVER_AWS" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v node_modules`
Expected: no matches (or only unrelated incidental matches you can confirm are not storage code).

- [ ] **Step 2: Full build**

Run: `yarn build`
Expected: build succeeds.

- [ ] **Step 3: Scan staged history for secrets**

Run: `git log --oneline -8 && git grep -iE "[0-9a-f]{32}" $(git rev-parse HEAD) -- . ':(exclude)yarn.lock'; echo "exit: $?"`
Expected: no 32-hex secret matches in tracked files.

- [ ] **Step 4: Update README if it documents AWS env vars**

Check `README.md` for any `SERVER_AWS_*` mention. If present, replace with the R2 variable names from `.env.example`. If absent, skip.

- [ ] **Step 5: Commit any README changes**

```bash
git add README.md
git commit -m "docs(r2): Update env var documentation for R2"
```

(Skip if README needed no changes.)

---

## Self-Review

**Spec coverage:**
- R2 read/write storage layer → Tasks 1, 2 ✓
- Public bucket reads via `R2_PUBLIC_URL` → Task 2 ✓
- SDK v2 → v3 upgrade → Task 1 ✓
- Sitemap script migration → Task 3 ✓
- `wrangler.toml` (IaC) → Task 4 ✓
- `scripts/setup-r2.sh` → Task 5 ✓
- `.env.example` (names only) → Task 4 ✓
- Secret hygiene / public-repo safety → Tasks 4, 5, 6 ✓
- `.env*` gitignored verification → Task 4 Step 2 ✓
- Manual verification (build + e2e) → Tasks 2, 6 ✓

**Placeholder scan:** No TBD/TODO; all code shown in full.

**Type consistency:** `getFiles()` and `uploadFile(filename, data)` signatures consistent across `lib/r2.ts`, `getNote.ts`, `[id].tsx`, and sitemap script. `R2_*` env var names consistent across all files.
