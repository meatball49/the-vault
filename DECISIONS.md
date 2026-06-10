# DECISIONS.md — non-obvious choices

- **Prototype unavailable.** `eligibility-engine.html` wasn't on disk
  (searched ~/Projects, ~/Downloads, ~/Desktop, Spotlight). Built from the
  spec's design language (warm-ink/brass, Fraunces + Hanken Grotesk +
  JetBrains Mono, grain, staggered reveal, count-up) and the schema given in
  the brief. Nothing was blocked by this; flagging in case the prototype had
  offers not covered here.
- **Verification-first dataset.** All 40 candidate offers were verified by
  parallel web-search agents on 2026-06-09 before any data was committed.
  3 came back dead (Google AI Pro for students — promo ended after June 2026
  finals; Barnes & Noble educator program — discontinued; IRS Direct File —
  discontinued) and were dropped, not shipped with warnings. ChatGPT Plus
  student offer also dropped: the US/Canada promo ended May 2025; the only
  surviving variant is an Australia/Colombia referral, irrelevant to a US
  audience. 36 perks shipped.
- **Quiz brackets instead of raw age.** Age is asked as brackets
  (`under18 / 18–20 / 21–24 / 25+`) so eligibility uses the bracket's
  guaranteed minimum. Brackets align exactly with the only real gates in the
  data (18 and 21) and are less invasive than a date-of-birth field.
- **`legalGate: "sportsBetting"` implies 21+ in the engine itself**, even if
  a perk's data forgets `minAge`. Defense in depth for the one rule with
  legal exposure. (DC/KY/WY technically allow 18+; we gate at 21 everywhere
  — stricter is the safe direction for an MVP.)
- **Gambling promos always contribute $0** to the headline total
  (`computeTotals` skips `flags.gambling`) — bonus bets aren't money. Their
  face value still shows on the card, labeled as a promo with a negative-EV
  warning and 1-800-GAMBLER.
- **Ranking is interest-match-first, then value desc** (per spec). A $30
  interest-matched perk outranks a $1,500 unmatched one by design — the list
  should feel "for you" at the top, with everything else still there.
- **Email storage = PostHog person property only.** The `email_capture`
  event carries no properties at all; the address is set via
  `setPersonProperties`. Zero backend, satisfies the privacy rule, and the
  list is exportable from PostHog People. A serverless function was not
  "genuinely needed" (spec §7), so none exists.
- **Eligibility schema can't express OR across fields** (e.g. Peloton's
  "communities OR students", Amazon's "students OR age 18–24"). Chose the
  dominant audience for each (Peloton → communities, Prime → college
  students 18+) and let the blurb/note tell the full truth. Acceptable
  imprecision for an MVP; revisit only if perk_click data says these matter.
- **Nike Student is `student: "any"`** — the verified terms include high
  schoolers 16+. The rare under-16 high schooler sees one perk they can't
  claim yet; the note states the 16+ rule.
- **OG image is generated, not hand-made** (`npm run generate:og` renders
  HTML via Playwright into `public/og.png`, committed). Regenerate only if
  the brand line changes.
- **Vite template's new tsconfig ships without `strict`** — turned on
  `strict` + `noUncheckedIndexedAccess` explicitly.
