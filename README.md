# Countdown Pro — Shopify countdown timer & urgency app

A public Shopify app that adds beautiful countdown timers to any storefront —
flash sales, evergreen per-visitor timers, and daily-resetting timers — to
create urgency and lift conversion rates.

Built on [Shopify App React Router](https://shopify.dev/docs/api/shopify-app-react-router),
[Prisma](https://www.prisma.io/), and the Shopify Theme App Extension (App
Blocks + App Embed) framework.

## Features

- **Three timer modes**
  - **Flash sale** — fixed end date, sitewide countdown.
  - **Evergreen** — per-visitor countdown (e.g. "10 minute offer just for you"),
    persisted in the visitor's browser via `localStorage`.
  - **Daily reset** — resets every day in the visitor's local timezone.
- **One-click theme install** — drop the **Countdown** app block into any
  product section, or enable the **Countdown bar** app embed to display a
  sitewide announcement bar. No theme code edits required (Online Store 2.0).
- **Pixel-perfect customization** — headline, subtext, expired text, hex
  colors for background / text / accent, days segment on/off, hide-when-ended.
- **Per-product or per-collection targeting** — show a timer only on specific
  products or collections.
- **GDPR-compliant** — handles all three mandatory compliance webhooks
  (`customers/data_request`, `customers/redact`, `shop/redact`).

## Project layout

```
.
├── app/                                # Admin app (React Router + Polaris)
│   ├── components/
│   │   └── TimerForm.tsx               # Shared create/edit form
│   ├── lib/
│   │   └── timers.server.ts            # Timer DAL + validation
│   └── routes/
│       ├── app._index.tsx              # Timer list / dashboard
│       ├── app.timers.new.tsx          # Create a timer
│       ├── app.timers.$id.tsx          # Edit a timer
│       ├── api.timers.tsx              # Public read API (theme block)
│       ├── webhooks.compliance.tsx     # GDPR mandatory webhooks
│       └── webhooks.app.uninstalled.tsx
├── extensions/
│   └── countdown-timer/                # Theme App Extension
│       ├── shopify.extension.toml
│       ├── blocks/
│       │   ├── countdown.liquid        # App block (product page)
│       │   └── announcement.liquid     # App embed (sitewide bar)
│       └── assets/
│           ├── countdown.css
│           └── countdown.js
├── prisma/
│   └── schema.prisma                   # Session + Timer models
└── shopify.app.toml
```

## How the data flow works

1. Merchant logs into the embedded admin and creates a **Timer** (DB row
   scoped to `shop`).
2. Merchant goes to **Online Store → Themes → Customize** and either:
   - adds the **Countdown** app block to a product section, **or**
   - enables the **Countdown bar** app embed under "App embeds".
3. On every storefront page load, the block renders Liquid with the merchant's
   inline settings for instant first paint (no CLS).
4. `countdown.js` boots on `DOMContentLoaded`, optionally fetches
   `/api/timers?shop=<shop>.myshopify.com` to resolve a server-managed timer
   by name, and starts ticking down once per second.

## Local development

### Prerequisites

- Node `>=20.19 <22 || >=22.12`
- npm
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/getting-started)
- A Shopify Partner account + a development store

### Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
shopify app config link              # connect to your Partners app
shopify app dev                      # tunnels + serves admin + theme extension
```

Press `p` to open the install URL when the CLI prompts you.

## Deployment

The app is a single Node process (`react-router-serve`) backed by a
Prisma-supported database. SQLite is fine for a single instance; switch the
`datasource` in `prisma/schema.prisma` to Postgres for production scale.

A `Dockerfile` is included for one-click deploys to Render, Fly.io,
Railway, or any container host.

After deploying, run:

```bash
shopify app deploy
```

…to push the latest theme app extension version and webhook subscriptions to
the Partners app.

## Submitting to the Shopify App Store

1. Fill out your app listing in the Partners Dashboard
   (name, tagline, screenshots, demo URL).
2. Make sure mandatory compliance webhooks return 200 OK (this app does).
3. Pick a billing model (this template ships with `shopifyApp({ ... })`; add
   the billing config in `app/shopify.server.ts` when you're ready to charge).
4. Submit for review.

## License

MIT — see `LICENSE.md`.
