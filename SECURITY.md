# Security Policy

## Supported versions

This is a continuously deployed web application; only the latest version
running on `main` (and live at https://dof.toniotgz.com) is supported. There
are no maintained release branches.

| Version            | Supported          |
| ------------------ | ------------------ |
| `main` (latest)    | :white_check_mark: |
| Older commits/tags | :x:                |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, use either of the following private channels:

1. **GitHub Security Advisories** — go to the repository's
   [**Security → Report a vulnerability**](https://github.com/antoniotorres/dof/security/advisories/new)
   tab (preferred; keeps the report private and tracked).
2. **Email** — write to **toniotgz@gmail.com** with the subject
   `SECURITY: DOF`.

Please include as much of the following as you can:

- A description of the issue and its potential impact.
- Steps to reproduce (proof-of-concept, requests, or screenshots).
- Affected URL(s), endpoint(s), or file(s).
- Any suggested remediation.

## What to expect

- **Acknowledgement** within **5 business days**.
- An assessment and, if confirmed, a remediation plan with a target timeline.
- Credit for the report once a fix ships, if you would like it.

Please act in good faith: give us a reasonable time to fix the issue before any
public disclosure, and avoid privacy violations, data destruction, or service
degradation while testing.

## Scope

In scope:

- This codebase and the deployed application at `dof.toniotgz.com`.
- Issues such as XSS (note that DOF HTML is sanitized in
  [`lib/sanitize.ts`](lib/sanitize.ts)), SSRF, injection, secret exposure,
  insecure storage configuration, and authentication/authorization flaws.

Out of scope:

- The upstream official source [`dof.gob.mx`](https://dof.gob.mx) — report
  those issues to the responsible Mexican government authority.
- Vulnerabilities in third-party platforms (Vercel, AWS, Google) — report
  those to the respective vendor.
- Automated scanner output with no demonstrated, realistic impact.

## A note on secrets

AWS credentials and all `SERVER_AWS_*` values are **server-side only** and must
never be exposed to the client or committed to the repository. If you believe a
credential has been leaked (e.g. committed by mistake), treat it as an incident:
report it privately as above and rotate the key immediately.
