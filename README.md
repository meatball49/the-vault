# The Vault

Answer five quick questions → get a single ranked list of every discount,
free tier, and perk you actually qualify for — student deals, 21+ offers,
community discounts, free-for-anyone stuff — with a rough dollar value on
each and the time-sensitive ones flagged.

This is an MVP built to be put in front of ~10 real people and **measured**:
do they finish the quiz, click through to claim, and come back?
[MEASURE.md](MEASURE.md) defines the five numbers that decide that.
[CONTENT.md](CONTENT.md) is the playbook for keeping the offers honest.
[DECISIONS.md](DECISIONS.md) logs the non-obvious build choices.

**Where this is going** (research-backed strategy docs):
[docs/ROADMAP.md](docs/ROADMAP.md) — the "discount radar" vision, competitive
gap, campus-wedge plan, and monetization sequence.
[docs/ARCHITECTURE-NOTIFICATIONS.md](docs/ARCHITECTURE-NOTIFICATIONS.md) — the
Phase 1 PWA-push + backend design.

## Stack

Vite + React 19 + TypeScript (strict) + Tailwind CSS v4. PostHog for product
analytics. Vitest + React Testing Library for unit/component tests,
Playwright for the end-to-end flow. No backend — eligibility runs entirely
client-side; email opt-ins land in PostHog as person properties.

## Architecture

```
src/
  data/
    perks.ts        ← the product: 36 web-verified offers (see CONTENT.md)
    states.ts       ← state list + online-sports-betting legal states
  lib/
    types.ts        ← Perk / Profile schema
    eligibility.ts  ← pure engine: getEligiblePerks, rankPerks, computeTotals
    analytics.ts    ← every PostHog event, in one auditable file
    format.ts       ← money/date formatting
  components/       ← Intro → Quiz (5 steps) → Results (+ PerkCard, EmailCapture…)
  App.tsx           ← the three-stage flow
e2e/                ← Playwright: core flow + the under-21 sportsbook gate
scripts/generate-og.mjs ← renders public/og.png + icon-180.png
```

Rules that keep the product honest: every offer carries an official
`source.url` and the `verifiedOn` date it was last confirmed live; gambling
promos count $0 toward the headline total and carry a negative-EV warning;
the total is labeled optimistic because nobody uses every subscription at
once. The test suite enforces the data invariants.

## Run it

```bash
npm install
cp .env.example .env        # optional — add your PostHog key; app works without
npm run dev
```

## Tests & checks

```bash
npm test            # Vitest: engine, components, data integrity (47 tests)
npm run e2e         # Playwright (first time: npx playwright install chromium)
npm run typecheck   # tsc -b
npm run lint        # eslint
npm run build       # production build
```

## Deploy

**Vercel (primary):**

```bash
npm i -g vercel       # if needed
vercel                # link/create project
vercel --prod
```

Set `VITE_POSTHOG_KEY` in Vercel → Project → Settings → Environment
Variables, then redeploy. It's a static Vite build — no server config.

**DigitalOcean App Platform (alternative, if using DO credits):** create an
App from the GitHub repo as a **Static Site**: build command `npm run build`,
output directory `dist`, and add `VITE_POSTHOG_KEY` as a build-time env var.
Add a catch-all route to `index.html` if you ever add client-side routing
(not needed today — single route).

## Refreshing the offers

The data decays fast. Monthly: follow [CONTENT.md](CONTENT.md) — open each
`source.url`, confirm price/terms, bump `verifiedOn`, delete dead offers,
run `npm test`. The "Offers last reviewed" line in the UI updates itself
from the newest `verifiedOn`.
