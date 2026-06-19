# Diario Oficial de la Federación

[![CI](https://github.com/antoniotorres/dof/actions/workflows/ci.yml/badge.svg)](https://github.com/antoniotorres/dof/actions/workflows/ci.yml)
[![CodeQL](https://github.com/antoniotorres/dof/actions/workflows/codeql.yml/badge.svg)](https://github.com/antoniotorres/dof/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/antoniotorres/dof/badge)](https://scorecard.dev/viewer/?uri=github.com/antoniotorres/dof)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> An unofficial, fast reader and search interface for Mexico's
> **Diario Oficial de la Federación (DOF)** — the official gazette of the
> Mexican State. Browse decrees, agreements, standards (NOMs) and resolutions
> with a clean, modern reading experience.

🔗 **Live site:** https://dof.toniotgz.com

> [!IMPORTANT]
> This is an independent, community project. It is **not affiliated with,
> endorsed by, or operated by** the Government of Mexico or the official
> Diario Oficial de la Federación ([dof.gob.mx](https://dof.gob.mx)). The
> authoritative source is always [dof.gob.mx](https://dof.gob.mx).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)
- [Security](#security)
- [Privacy](#privacy)
- [License](#license)

## Features

- 🔎 Instant search over recent DOF publications.
- 📰 Clean, typography-first reading pane with a table of contents.
- ⚡ Server-rendered with the Next.js App Router and React Server Components.
- 🗂️ Transparent S3-backed cache of sanitized notes for fast, resilient reads.
- 🌎 Spanish-language UI tailored to Mexican readers.

## Tech stack

| Area            | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router)              |
| Language        | [TypeScript](https://www.typescriptlang.org)               |
| UI              | [React 19](https://react.dev)                              |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com)                 |
| Storage / cache | [AWS S3](https://aws.amazon.com/s3/) (AWS SDK v3)          |
| Package manager | [pnpm](https://pnpm.io)                                    |
| Runtime         | Node.js 24 (see [`.nvmrc`](.nvmrc))                        |
| Hosting         | [Vercel](https://vercel.com)                               |
| Analytics       | Vercel Web Analytics + Umami + Google Analytics (optional) |

## How it works

The app does not store the gazette itself. For each note it:

1. Tries the **S3 cache** first (`{id}.json`).
2. On a miss, downloads the original page from
   [`dof.gob.mx`](https://dof.gob.mx), **sanitizes the HTML**
   (see [`lib/sanitize.ts`](lib/sanitize.ts)), extracts metadata, and writes
   the result back to S3 so subsequent reads are fast.

If S3 is not configured the app still builds and runs — it simply serves an
empty listing instead of throwing (handy for local development and CI).

## Getting started

### Prerequisites

- **Node.js 24** (use [`nvm`](https://github.com/nvm-sh/nvm): `nvm use`)
- **pnpm 10** (`corepack enable` then `corepack use pnpm@10`)

### Setup

```bash
# 1. Clone
git clone https://github.com/antoniotorres/dof.git
cd dof

# 2. Use the pinned Node version
nvm use            # reads .nvmrc

# 3. Install dependencies
pnpm install

# 4. Configure environment (optional for a basic dev run)
cp .env.example .env.local
# …fill in values as needed (see below)

# 5. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in the values you
need. All AWS variables are **server-side only** and are never exposed to the
browser.

| Variable                       | Required | Description                                                            |
| ------------------------------ | :------: | ---------------------------------------------------------------------- |
| `SERVER_AWS_REGION`            |   No\*   | AWS region of the S3 bucket.                                           |
| `SERVER_AWS_BUCKET`            |   No\*   | S3 bucket name that holds the cached note JSON files.                  |
| `SERVER_AWS_ACCESS_KEY_ID`     |   No\*   | IAM access key id with read/write to the bucket.                       |
| `SERVER_AWS_ACCESS_SECRET`     |   No\*   | IAM secret access key.                                                 |
| `NEXT_PUBLIC_GA_TRACKING_ID`   |    No    | Google Analytics measurement id (production deploy only, not preview). |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` |  No\*\*  | Umami website id (production deploy only, not preview).                |
| `NEXT_PUBLIC_UMAMI_SRC`        |  No\*\*  | Umami tracker script URL (production deploy only, not preview).        |

> \* Without S3 the app builds and runs with an empty note listing. Configure
> all four AWS variables together to enable the cache.

> \*\* Umami loads only when **both** `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and
> `NEXT_PUBLIC_UMAMI_SRC` are set. Leave either blank to disable.

> [!WARNING]
> Never commit real credentials. `.env*` files are git-ignored; only
> `.env.example` (with empty values) is tracked.

## Available scripts

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start the Next.js dev server.      |
| `pnpm build`      | Production build.                  |
| `pnpm start`      | Serve the production build.        |
| `pnpm lint`       | Run ESLint.                        |
| `pnpm typecheck`  | Type-check with `tsc --noEmit`.    |
| `pnpm format:fix` | Format the codebase with Prettier. |

## Project structure

```
app/            # App Router routes (/, /notas, /notas/[id], sitemap, etc.)
components/      # UI components (Header, Footer, reader, home)
lib/            # Server logic: S3 client, note fetching, sanitizing, TOC
public/         # Static assets (icons, manifest)
```

## Deployment

The site is deployed on **Vercel**. Pushes to `main` deploy to production and
every pull request gets a preview deployment automatically. Configure the
environment variables above in the Vercel project settings.

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for
the development workflow, coding standards, and commit conventions, and our
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Support

Need help or have a question? See [`SUPPORT.md`](SUPPORT.md) for where to file
bugs, request features, and get help.

## Security

Found a vulnerability? Please **do not open a public issue**. See
[`SECURITY.md`](SECURITY.md) for how to report it responsibly.

## Privacy

The site uses privacy-conscious analytics and stores no personal data. See
[`PRIVACY.md`](PRIVACY.md) for the details.

## License

Released under the [MIT License](LICENSE). © 2021–2026 Antonio Torres.

The DOF source content itself is a public record of the Mexican State and is
not covered by this license.
