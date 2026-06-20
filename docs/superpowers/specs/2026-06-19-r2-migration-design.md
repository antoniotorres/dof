# Design: Migrate storage from AWS S3 to Cloudflare R2

**Date:** 2026-06-19
**Status:** Approved design — ready for implementation planning

## Summary

Replace the AWS S3 storage layer with Cloudflare R2 for easier maintenance. The
app caches DOF notes (fetched from `dof.gob.mx`) as JSON objects. Today it uses
the `aws-sdk` v2 to list/upload objects and reads cached notes over a public S3
HTTP URL. This migration swaps S3 for an **R2 public bucket**, upgrades the SDK
to the modern `@aws-sdk/client-s3` v3 (R2 is S3-compatible), and adds repository
tooling (`wrangler.toml` + a setup script) to provision R2.

No application behavior changes — only the storage backend.

## Goals

- Read and write cached note JSON to/from Cloudflare R2 instead of S3.
- Public reads served from an R2 public bucket (`pub-<hash>.r2.dev` or custom domain).
- Upgrade `aws-sdk` v2 → `@aws-sdk/client-s3` v3.
- Provide repo-tracked R2 setup: `wrangler.toml` (IaC) + `scripts/setup-r2.sh`.
- Maintain strict secret hygiene appropriate for a **public repository**.

## Non-Goals

- No change to the note-fetching, parsing, or sanitizing logic.
- No Cloudflare Worker proxy or presigned-URL flow (public bucket chosen).
- No test framework introduction (repo has none; verification is manual).
- No unrelated refactoring.

## Architecture

Data flow is unchanged:

```
request → check R2 cache (public URL) → hit?  → return JSON
                                       → miss → fetch dof.gob.mx
                                              → parse + sanitize
                                              → upload to R2 (S3 API)
                                              → return JSON
```

Only the storage layer is replaced.

### Files changed

| File | Change |
|------|--------|
| `lib/aws.ts` → `lib/r2.ts` | Rename + rewrite using `@aws-sdk/client-s3` v3 against R2 endpoint. Exposes `getFiles()` and `uploadFile(filename, data)` (same signatures). |
| `lib/getNote.ts` | Import from `./r2`; change public-read URL to `R2_PUBLIC_URL`. |
| `scripts/generate-sitemap.js` | Use v3 S3 client against R2; same list-objects → sitemap output. |
| `package.json` | Remove `aws-sdk`; add `@aws-sdk/client-s3`. |

### Files added

| File | Purpose |
|------|---------|
| `wrangler.toml` | Declares project name + R2 bucket (name/binding only). IaC documentation + target for `wrangler r2` commands. No secrets, no account ID. |
| `scripts/setup-r2.sh` | First-time provisioning: verify wrangler + auth, create bucket, enable public dev URL, print env-var checklist. |
| `.env.example` | Documents env var **names** with empty values. |

## SDK / Client configuration

`@aws-sdk/client-s3` v3 `S3Client`:

- `endpoint`: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- `region`: `"auto"` (R2 ignores region; SDK requires a value)
- `credentials`: `{ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }`

Operations: `ListObjectsV2Command` (list), `PutObjectCommand` (upload). The
`getFiles()` / `uploadFile()` exports keep their current signatures so callers
are unaffected. The sitemap script reads `Contents` (Key, LastModified) the same
way as today.

Public reads in `getNote.ts` switch from
`https://<bucket>.s3.<region>.amazonaws.com/<key>` to
`${R2_PUBLIC_URL}/<key>`.

## Environment variables

Replaces the `SERVER_AWS_*` set.

| Variable | Purpose | Secret |
|----------|---------|--------|
| `R2_ACCOUNT_ID` | Cloudflare account ID (endpoint URL) | Low |
| `R2_ACCESS_KEY_ID` | R2 API token key | **Yes** |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | **Yes** |
| `R2_BUCKET` | Bucket name | No |
| `R2_PUBLIC_URL` | Public read base URL (e.g. `https://pub-xxx.r2.dev`) | No |

## Security (public repository)

This is a public repo and must be held to public-repo supply-chain and
secret-hygiene standards.

- **No secrets in any tracked file.** `wrangler.toml` carries only bucket
  name/binding — no account ID, no keys.
- `scripts/setup-r2.sh` reads credentials from the shell environment or prompts
  interactively; it never writes secrets into repo files. It prints the env-var
  names/values for the operator to copy into their deploy platform manually.
- R2 API tokens are generated in the Cloudflare dashboard (cannot be safely
  scripted in a public repo) — the script reminds the operator to do this.
- `.env.example` documents names only, empty values.
- Verify `.env*` is gitignored before completion.

## Setup script (`scripts/setup-r2.sh`)

1. Check `wrangler` is installed; check `wrangler whoami` auth — clear guidance if missing.
2. `wrangler r2 bucket create <R2_BUCKET>`.
3. `wrangler r2 bucket dev-url enable <R2_BUCKET>` — enable + print `pub-<hash>.r2.dev` URL.
4. Print env-var checklist (names) and reminder to create an R2 API token in the dashboard.

## wrangler.toml

Declares project `name` and an R2 bucket binding (binding identifier + bucket
name only). Because the Next.js app talks to R2 via the S3 HTTP API (not a
Worker runtime binding), this file serves as IaC documentation and a target for
`wrangler r2` commands rather than a runtime binding.

## Verification (manual)

- `next build` succeeds.
- `scripts/setup-r2.sh` runs (or dry-run reviewed) and provisions the bucket.
- End-to-end: requesting a note results in an R2 cache read, and a cache miss
  uploads to R2 and returns correctly.
- `git` shows no secrets staged; `.env*` ignored.
