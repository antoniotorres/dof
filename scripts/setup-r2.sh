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
