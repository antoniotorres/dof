# Privacy Notice

This document describes the data handling of the **Diario Oficial de la
Federación** reader at https://dof.toniotgz.com. It is developer-facing
documentation; a user-facing privacy page in Spanish on the site itself is
recommended for production.

## What we collect

The app has **no user accounts** and stores **no personal data** about
visitors. It uses two privacy-conscious analytics services:

- **Vercel Web Analytics** — aggregated, cookieless page-view metrics. No
  cross-site tracking and no personally identifiable information.
- **Google Analytics** — loaded **only in production builds** and **only if**
  `NEXT_PUBLIC_GA_TRACKING_ID` is configured (see
  [`app/layout.tsx`](app/layout.tsx)). Google Analytics uses cookies and
  collects usage data subject to
  [Google's Privacy Policy](https://policies.google.com/privacy).

## What we store

- The application caches **public DOF notes** (already public records) as
  sanitized JSON in an S3 bucket. This contains gazette content only — no
  visitor data.

## Third parties

- **Vercel** — hosting and analytics ([privacy](https://vercel.com/legal/privacy-policy)).
- **Google** — analytics, when enabled.
- **AWS S3** — note cache storage.

## Your choices

- Browser "Do Not Track" settings, privacy modes, and content blockers will
  prevent Google Analytics from loading.
- Vercel Web Analytics is cookieless and cannot be used to identify you.

## Questions

Privacy questions can be sent to **toniotgz@gmail.com**.
