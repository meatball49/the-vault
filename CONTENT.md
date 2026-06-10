# CONTENT.md — the perks maintenance playbook

The dataset in [`src/data/perks.ts`](src/data/perks.ts) is the product. It
decays fast: prices rise, promos end, programs die (three died during the
initial build). This file is the playbook for keeping it honest **without
touching the engine**. No engineering knowledge needed beyond editing one
file and running two commands.

## The schema

Each perk is one object:

```ts
{
  id: "spotify-premium-student",      // kebab-case, unique, never reuse
  name: "Spotify Premium Student",    // display name
  blurb: "What you get, 1–2 honest sentences.",
  value: 216,                         // rough ANNUAL $ (savings or sticker); 0 = free/varies
  valueType: "perYear",               // perYear | inTools | freeOrVaries | promo
  category: "student",                // student | age21 | community | everyone
  eligibility: {
    minAge: 21,                       // optional — age gate
    student: "college",               // optional — "college" | "any" (any includes high school)
    communities: ["military"],        // optional — any-match: military|teacher|nurse|responder|gov
    legalGate: "sportsBetting",       // optional — show only in legal states (implies 21+)
  },
  interests: ["stream"],              // ai|dev|stream|create|shop|fit|bet — drives ranking
  source: {
    url: "https://www.spotify.com/us/student/",  // OFFICIAL page, not a blog
    verifiedOn: "2026-06-09",                    // the day YOU confirmed it live
  },
  flags: {
    expiring: true,                   // confirmed end date within ~90 days (put date in note)
    verifyTerms: true,                // terms are regional/murky/changing
    gambling: true,                   // sportsbook promos ONLY — forces $0 in totals
  },
  note: "One honest caveat (auto-renew, US-only, exclusions…).",
}
```

Rules the test suite enforces (`npm test` fails if you break them):

- ids unique; source URLs are `https`; `verifiedOn` is `YYYY-MM-DD`
- every `gambling` perk has `minAge: 21`, `legalGate: "sportsBetting"`,
  category `age21`, valueType `promo`, and a negative-EV note
- `value: 0` only with `valueType: "freeOrVaries"`
- `everyone` perks have no eligibility constraints

## Value rules (keep the total honest)

- `value` is the **optimistic annual** number: savings vs. the normal price
  (Spotify: $6.99 vs $12.99/mo ≈ $216/yr with the Hulu bundle), or sticker
  value of what you get (JetBrains pack ≈ $289/yr).
- One-time bundles (GitHub pack) use `valueType: "inTools"` — counted in the
  headline total, not in "recurring per year".
- Gambling promos always `value` = max bonus, `valueType: "promo"`,
  `flags.gambling: true` → the engine counts them as **$0**.
- When in doubt, round down.

## Add a perk

1. Find the **official** offer page (brand or .gov — never a coupon blog).
2. Confirm today, on that page: live, price, who qualifies, any end date.
3. Copy an existing perk of the same category in `src/data/perks.ts`, edit
   every field. Set `verifiedOn` to today.
4. Run `npm test` then `npm run build`. Both green → commit.

## Re-verify (do this monthly, ~30 minutes)

1. For each perk, open `source.url` and check: still live? price unchanged?
   terms unchanged?
2. Unchanged → just bump `verifiedOn` to today.
3. Changed → update `blurb`/`value`/`note` too.
4. Can't confirm from the official page → retire it (below) or set
   `flags.verifyTerms: true` if it merely got murky.
5. The "Offers last reviewed" line in the UI shows the **newest** `verifiedOn`
   automatically — no other date to update.

Fastest path: ask Claude to "re-verify every perk in src/data/perks.ts
against its source.url via web search today, update values/blurbs/notes,
bump verifiedOn, and drop anything dead" — that's exactly how the initial
dataset was built.

## Retire a perk

Delete its object from the array. Done — never leave dead offers with a
warning, dead data is worse than missing data. (Git history keeps it if it
ever comes back; three offers already died this way: Google AI Pro for
students, B&N educator discount, IRS Direct File.)

## Sports-betting legal states

`BETTING_LEGAL_STATES` in [`src/data/states.ts`](src/data/states.ts) lists
states with **live online** sports betting (retail-only states excluded).
When a state launches or a law changes, add/remove its two-letter code and
update the comment's verified date. Last verified 2026-06-09; WI was signed
April 2026 but hadn't launched online yet — re-check it first.
