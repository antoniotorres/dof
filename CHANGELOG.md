# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1](https://github.com/antoniotorres/dof/compare/v0.1.0...v0.1.1) (2026-06-20)


### Features

* activate Vercel Web Analytics ([4c2eab2](https://github.com/antoniotorres/dof/commit/4c2eab29afe67bb37b21c00173cb2e7565d29641))
* **analytics:** add Umami and gate analytics to production deployments ([668b997](https://github.com/antoniotorres/dof/commit/668b9974b5d79db74e0790fed38b9aeb073b8dc0))
* **header:** Replace img with Image ([fb96110](https://github.com/antoniotorres/dof/commit/fb96110c6b18709507cf05037358392f9348a5b0))
* implement DOF redesign concept across the site ([5e83494](https://github.com/antoniotorres/dof/commit/5e8349422d0cda646b58553b8753b6fd8d70dfb0))
* **ingest:** add DOF daily-index ingestion CLI and fix note parsing ([cb2e31c](https://github.com/antoniotorres/dof/commit/cb2e31c299507ce0ed3f17579fe2413aab5ce44b))
* **lib:** Add metadata to files ([783ca5a](https://github.com/antoniotorres/dof/commit/783ca5a7a539a2a3a057420da1c0e3f2d1e57ff6))
* **notas:** Add SEO and date ([7be1cfe](https://github.com/antoniotorres/dof/commit/7be1cfed1d2b7f5146e43b9635e30773ebfadb39))
* **notas:** Change to SSR to SSG ([2a27d2b](https://github.com/antoniotorres/dof/commit/2a27d2b45bfe1ec02b96a91b672faa8c5bd8c5c2))
* **r2:** Migrate storage from AWS S3 to Cloudflare R2 ([0e2eb88](https://github.com/antoniotorres/dof/commit/0e2eb882bc6f129843f19eef051c1337709adaa8))
* **seo:** Add SEO dependency ([7442ff1](https://github.com/antoniotorres/dof/commit/7442ff1f49d77466e078686e418d51f4f50b9ac0))
* **seo:** Add sitemap generator based on s3 files ([06ff4ad](https://github.com/antoniotorres/dof/commit/06ff4adaa1fa7564f049ff2f73889ef0ac96cbb8))


### Bug Fixes

* **css:** Change import of roboto font ([e0b6e71](https://github.com/antoniotorres/dof/commit/e0b6e71349ef0fc829794670971f4dac256ba0be))
* **deps:** override transitive postcss to &gt;=8.5.10 (GHSA-qx2v-qp2m-jg93) ([4d123db](https://github.com/antoniotorres/dof/commit/4d123db4cdd259b53b807a6bfe9d9081a9457288))
* **dof:** trust DOF's missing TLS intermediate in the app read-path ([1857f34](https://github.com/antoniotorres/dof/commit/1857f347a10f39d582ed0b4b652c6e51dce433e8))
* **header:** Change typo in text ([80a2f05](https://github.com/antoniotorres/dof/commit/80a2f0506dd2e41afc898676ad4dd1a46a9da598))
* **lib:** Change env var name ([ae8a8ba](https://github.com/antoniotorres/dof/commit/ae8a8ba57ec1e3389a118ca39ffecc4a1099a7b3))
* **lib:** Change env var name ([c7f5257](https://github.com/antoniotorres/dof/commit/c7f5257826610a8ad1d7893393da4e9bfe4b6a03))
* **seo:** Change title length and add jsonld ([d8deab5](https://github.com/antoniotorres/dof/commit/d8deab532fd3546a5063d2c056a0c2ea974254ae))
* **sitemap:** Change .php to .json ([0cdae18](https://github.com/antoniotorres/dof/commit/0cdae1822fc8ddae8cd35c1fa970a4658cb288d4))

## [Unreleased]

### Added

- Repository best-practices: `README`, `LICENSE` (MIT), `CONTRIBUTING`,
  `SECURITY`, `CODE_OF_CONDUCT`, and this changelog.
- Git configuration: `.gitattributes`, `.editorconfig`, and a `.gitmessage`
  commit template.
- GitHub automation: Dependabot, CODEOWNERS, issue/PR templates, and CI +
  CodeQL workflows.

### Changed

- Site redesign concept applied across the app.
- Upgraded to Next.js 16 (App Router), React 19, Tailwind CSS v4, AWS SDK v3,
  and pnpm; bumped Node to 24.
- Activated Vercel Web Analytics.

[Unreleased]: https://github.com/antoniotorres/dof/commits/main
