# The Vault — Notification & Backend Architecture Spec

*Phase 1 ("The Radar") engineering design. Last updated 2026-06-13. Companion:
[ROADMAP.md](ROADMAP.md). Verified against current (2026) PWA/push platform
behavior; key gotchas cited inline.*

---

## 1. Goal

Turn the static, no-backend MVP into a personalized **discount radar**:
persistent user profiles, a stored offer catalog, server-side detection of offer
changes, and push notifications to the people each change affects — delivered to
an installable PWA, with email as the universal fallback.

This is the deliberate graduation past the MVP's "no backend / no accounts / no
database" constraints. Those were correct MVP scoping; Phase 1 explicitly crosses
that line.

## 2. The constraint that drives the whole design

**iOS PWAs cannot run background timers.** There is no Background Sync, Periodic
Background Sync, or Background Fetch on iOS. A service worker cannot wake itself
to check for new deals. Therefore **all change-detection must run server-side on
a cron**, and the only job of the client is to *receive* pushes.

This single fact picks our architecture: we need a small always-available backend
with a scheduler, not a clever client.

### Other iOS push realities (must design around)

- **Web push works on iOS 16.4+, but only for PWAs added to the Home Screen** —
  never in a Safari tab. The user must install first, then subscribe *from inside
  the installed app*. (confidence: high)
- **No `beforeinstallprompt`, no auto-install banner on iOS.** We must show our
  own "Add to Home Screen" coachmark. The permission prompt requires a user
  gesture (a tapped button). (high)
- **EU is fine.** Apple briefly disabled EU home-screen PWAs in the iOS 17.4 beta,
  then reversed on 2024-03-01. Push + standalone work for EU users in 2026 —
  relevant since the team is in Greece. Ignore stale "DMA killed EU PWAs" posts. (high)
- **Declarative Web Push** (Safari 18.4 / iOS 18.4+): a top-level JSON payload the
  browser renders with no SW logic, still VAPID-based and backward-compatible.
  One payload can serve both modern Safari and classic SW-handled browsers. (high)
- Misc limits: ~50MB PWA storage, 7-day cache eviction if the app is unopened,
  numeric-only app badging, Safari push payload cap ~2KB (others ~4KB). (high)

## 3. Recommended stack

**Vercel (frontend, unchanged) + Supabase (backend) + Resend (transactional email).**

Supabase is the single best fit because it bundles everything Phase 1 needs on
one free tier:

| Need | Supabase piece |
|---|---|
| User profiles + offer catalog + subscriptions | Postgres (+ Row-Level Security) |
| Accounts without passwords | Built-in magic-link auth (`signInWithOtp`) |
| Send push from the server | Edge Function (Deno) running a VAPID sender |
| The change-detection scheduler | Supabase Cron (`pg_cron` + `pg_net`) |

Free tier (2026): 500MB Postgres, 50,000 MAU, 500K Edge Function calls/mo.
*Gotcha:* free projects pause after 7 idle days — but our cron job keeps it
warm. Use Resend as the SMTP provider for production-grade email deliverability.

**Rejected alternatives (and why):**
- **FCM / Firebase** — routes iOS through APNs with known PWA bugs (push token
  sometimes never retrieved, `fcmOptions.link` ignored). Adds a vendor without
  solving the hard part. Reserve only if we later ship native.
- **Vercel-native storage** — unbundled in 2025 (Postgres → Neon, KV → Upstash);
  you'd stitch multiple vendors and still need auth + cron. More moving parts.
- **Convex** — strong DX and native cron, but no native push and typically needs
  Clerk for auth. Supabase wins on bundled auth + EU data residency.
- **Vercel Cron** — Hobby tier is hourly-only with few jobs; Supabase `pg_cron`
  runs sub-minute to yearly on free. Use Supabase for the loop.

## 4. Data model (Postgres)

```sql
-- The quiz profile, now persisted and owned by an auth user.
profiles (
  id            uuid primary key references auth.users,
  age_bracket   text,           -- 'under18' | '18to20' | '21to24' | '25plus'
  student       text,           -- 'college' | 'highschool' | 'none'
  communities   text[],         -- ['military','teacher',...]
  state         text,           -- USPS code
  interests     text[],
  created_at    timestamptz default now()
)

-- The offer catalog, migrated out of src/data/perks.ts into the DB so the
-- cron can diff it. The repo file becomes the seed/source-of-truth import.
offers (
  id            text primary key,       -- same kebab ids as today
  name          text, blurb text, value int, value_type text, category text,
  eligibility   jsonb,                  -- { minAge, student, communities, legalGate }
  interests     text[],
  source_url    text, verified_on date,
  flags         jsonb,                  -- { expiring, verifyTerms, gambling }
  note          text,
  status        text default 'live',    -- 'live' | 'expiring' | 'dead' | 'new'
  content_hash  text,                   -- hash of the material fields, for diffing
  updated_at    timestamptz default now()
)

-- One row per browser/device push subscription.
push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users,
  endpoint      text unique,            -- from PushSubscription
  p256dh        text, auth text,        -- subscription keys
  created_at    timestamptz default now()
)

-- Idempotency: never notify the same user about the same change twice.
notifications_sent (
  user_id       uuid, offer_id text, change_type text, sent_at timestamptz,
  primary key (user_id, offer_id, change_type)
)
```

RLS: a user can read/write only their own `profiles` and `push_subscriptions`
rows; `offers` is world-readable; writes to `offers` happen only via the
service-role cron.

## 5. The change-detection loop (the heart of the radar)

A Supabase Cron job, hourly or twice-daily:

1. **Re-verify** the catalog. Reuse the exact engine that built it: the
   parallel web-search verification workflow already in this project's history.
   For each offer, recompute `content_hash` and `status`.
2. **Diff** against the stored rows. Emit change events:
   - `new` — offer added.
   - `returning` — a `dead` offer flips back to `live` (seasonal, e.g. Apple BTS).
   - `expiring` — `verified_on`/flags indicate an end date within N days.
   - `changed` — material fields (value, terms) changed.
   - `dead` — gone (no notification; just hide it).
3. **Fan out**: for each change, find users whose stored profile is *eligible*
   for that offer (reuse `getEligiblePerks` logic, ported server-side or run as a
   shared module), minus anyone already in `notifications_sent` for that
   (offer, change_type).
4. **Send** push (and/or email) via an Edge Function. Record in
   `notifications_sent`.

Seasonal deals don't need to wait for detection — they're a *known calendar*
(Apple Back-to-School ≈ June–Sept, Black Friday, Prime Day, tax season). Pre-seed
these as scheduled alerts.

## 6. Sending push (Edge Function)

- Edge Functions run **Deno**, so use a Deno-native VAPID sender (`pushforge` or
  `web-push-browser`) — **not** the Node `web-push` library.
- Emit a payload that satisfies **both** Declarative Web Push (modern Safari) and
  the classic SW `push` event: include the top-level `web_push: 8030` field plus a
  `notification` object (`title` required, `body`, `navigate` URL, `app_badge`).
  Older browsers fall back to the SW handler. Keep it **under 2KB** for Safari.
- **Safari gotcha:** the VAPID `subject` must be a real `mailto:` or `https:`
  value — `localhost` throws `BadJwtToken`. Store the VAPID private key as a
  Supabase secret; ship only the public key to the client.
- Prune dead subscriptions on `404`/`410` responses.

## 7. Auth

Passwordless **email magic-link** (`supabase.auth.signInWithOtp`). Rationale: the
app has no accounts today and the audience won't tolerate password friction; an
email is also exactly what the "flag me before it expires" feature needs anyway.
On first sign-in, migrate the in-memory quiz profile into the `profiles` row.

## 8. Client changes (Vite + React, on Vercel)

- Add **`vite-plugin-pwa`** in **`injectManifest`** mode (not `generateSW` —
  we need a custom SW for push). Author the service worker in TypeScript;
  Workbox injects the precache manifest. Add a `manifest.webmanifest` (name,
  icons — we already generate `icon-180.png`, theme color `#16110b`).
- **Install + subscribe flow (order matters on iOS):**
  1. Detect `display-mode: standalone`. If not installed and on iOS Safari, show
     the "Add to Home Screen" coachmark — *not* the permission prompt.
  2. Once running installed, show a tapped "Get expiry alerts" button →
     `Notification.requestPermission()` → `PushManager.subscribe()` with the
     VAPID public key → POST the subscription to Supabase.
- The SW handles `push` (render notification) and `notificationclick` (focus/open
  the relevant offer URL).
- Everything degrades gracefully: no push permission → fall back to email alerts;
  no key/no backend in local dev → the app behaves exactly as the MVP does today.

## 9. Build plan (incremental, each step shippable)

1. **PWA shell** — `vite-plugin-pwa` + manifest + installability. No backend yet.
   (Also a small SEO/retention win on its own.)
2. **Supabase + auth** — magic-link sign-in, persist the quiz profile.
3. **Catalog in DB** — migrate `perks.ts` → `offers` table; repo file becomes the
   seed importer. App reads from DB (falls back to the bundled file offline).
4. **Push plumbing** — SW push handler, subscribe flow, `push_subscriptions`,
   a "send test push" Edge Function.
5. **The cron loop** — re-verify + diff + fan-out + `notifications_sent`.
6. **Seasonal calendar** — pre-scheduled known-deal alerts.
7. **Email fallback** — Resend, for users without push.

Steps 1–2 are independently valuable and low-risk; the radar only truly exists
after step 5.

## 10. Cost

Everything in Phase 1 fits the **free tiers** of Vercel + Supabase + Resend at
MVP scale (≤50K MAU, ≤500K function calls/mo). The cron keeps the Supabase
project from idling. No infra spend until there's real traction — consistent with
the "minimal moving parts" principle.

## 11. Open decisions (resolve before building step 5)

- **Re-verification compute:** run the existing web-search verification as a
  scheduled job — where does it execute (Edge Function time limits vs. an external
  worker)? Likely a separate longer-running task that writes results back to
  Supabase, with the cron just triggering + diffing.
- **Notification frequency cap** per user (avoid alert fatigue — e.g. max 1
  digest/day rather than one push per change).
- **Gambling alerts** — honor the §7 sportsbook decision in ROADMAP.md (if we
  don't monetize them, do we still *alert* on them? Probably yes as utility, but
  it's a policy choice).
