# The Vault — Product Roadmap

*Working strategy doc. Last updated 2026-06-13. Companion: [ARCHITECTURE-NOTIFICATIONS.md](ARCHITECTURE-NOTIFICATIONS.md).*

> Market facts below come from a verified research pass (competitors, affiliate
> economics, local-data feasibility, push/PWA tech) run 2026-06-13. Dollar
> figures are industry estimates — directional, not contracts. Confidence is
> flagged where it matters.

---

## 1. The one-line thesis

The Vault is not a discount *finder* — it's a personalized **discount radar**.
It knows who you are, watches the entire benefits landscape for you, and taps
you on the shoulder the moment something you qualify for appears, returns, or is
about to expire.

A finder is a one-time visit. A radar is a reason to stay installed. Everything
in this roadmap serves that shift.

---

## 2. Why now — the gap is real

We mapped the incumbents. None of them ships what we're building:

| Player | Model | Why it isn't us |
|---|---|---|
| **UNiDAYS** | Affiliate + brand fees + data (~£53M rev, 800+ brands) | Students only. Browsable category catalog, not a "what do I qualify for" engine. |
| **Student Beans / Pion** | Per-verification fees + affiliate | Students only. Verification-gated catalog. |
| **SheerID** | Charges brands per identity check (~$75–80M rev) | Its own consumer shop (shop.sheerid.com) is a filterable directory — **no quiz, no ranking, no personalization, no alerts.** White space the enabler left open. |
| **ID.me Shop** | Verification fees + affiliate | Closest competitor (multi-cohort). But identity-gated up front, transaction-optimized, and doesn't rank what you qualify for or surface *free tiers*. |
| **Honey / Capital One Shopping** | Affiliate at checkout | Checkout coupons, not eligibility. Both hit with **2025 "commission-theft" class actions** — a trust gift to an honest entrant. |
| **Rakuten / RetailMeNot** | Affiliate cashback/coupons | National breadth, but no cohort model and no free-tier discovery. |
| **Groupon** | Merchant deal marketplace | The only real *local* player — and a cautionary tale: died on high CAC + stale data. |

**The unoccupied position:** a free-to-user, **multi-cohort**, **ranked-by-real-value**
eligibility engine that surfaces **free tiers** (not just % off), is **transparent
about how it earns**, and layers **proactive alerts + local deals**. That exact
combination is currently shipped by no one.

Our moat is not the catalog (anyone can list offers). It's two things incumbents
do manually and we do automatically: **continuous re-verification** of a
fast-decaying dataset, and an **honest, value-first ranking** that builds the
trust the lawsuits above are currently destroying for competitors.

---

## 3. Where we are today (Phase 0 — shipped)

- Live MVP: https://the-vault-plkassaris-9606s-projects.vercel.app
- 36 web-verified national offers, 5-question quiz → ranked eligible list.
- Pure eligibility engine, 48 tests, Lighthouse mobile 93/100/100/100.
- PostHog instrumentation wired (the 5 funnels in [../MEASURE.md](../MEASURE.md)).
- **Not yet:** PostHog key in prod (funnels aren't recording until it's set),
  accounts, notifications, local deals.

**Phase 0 exists to answer one question: do people finish, click out, and come
back?** No further build is justified until that data exists. The funnel is the
green light for everything below.

---

## 4. Platform decision: web → PWA → (maybe) native

**Stay web. Do not build native yet.** Reasoning:

- It's a low-frequency utility today, not a daily habit. Native earns its 3×
  build/maintenance cost on daily-engagement products.
- The growth loop is "text a link to friends." Links open instantly; an app
  store install drops most people at the install step.
- Apple Guideline 4.2 ("minimum functionality") scrutinizes affiliate-link
  wrappers; plus a 15–30% cut.
- Every "claim" is an outbound link to the open web — a native shell fights that.

**The one app-like feature that matters — push notifications — does not require
native.** iOS 16.4+ supports web push for **home-screen-installed PWAs** (and,
since Apple's March 2024 EU reversal, this works for EU users too — relevant: the
team is in Greece). So: ship a **PWA with push**. Earn native only if the product
becomes a sticky **subscription/benefits wallet** (tracks renewals, manages your
verified statuses) — and only if return-rate data says people want a daily habit.

See the architecture companion for the full PWA-push reality and constraints.

---

## 5. The roadmap

Each phase is gated by the previous phase's numbers. Don't skip the gate.

### Phase 1 — The Radar (national notifications)
*Gate to start: Phase 0 shows non-trivial quiz-completion AND any 7-day return.*

Turn the catalog we already maintain into a living alert engine. This is the
cheapest, highest-retention move and it reuses the verification engine we already
built.

- **Accounts** (lightweight: email magic-link). Persist the quiz profile.
- **Web-push opt-in** for installed PWA users; email fallback for everyone else
  (the email capture already exists).
- **Alert types:**
  - *New match* — we add an offer matching your profile.
  - *Returning seasonal* — predictable annual deals (Apple Back-to-School /
    free-AirPods window ≈ June–Sept, Black Friday, Prime Day, tax season). These
    are a *calendar* — schedulable before they drop.
  - *Expiring* — the "flag me before it expires" promise (e.g. the Chase bonus
    expiry already in our data).
  - *Changed* — price drop, terms change, dead→revived. This is the
    re-verification loop surfacing as product.
- **Why it's defensible:** "we watch the decay for you" converts our maintenance
  burden into the core value prop. UNiDAYS/ID.me have category push; nobody has
  *personalized, cross-cohort, change-detecting* push.

**Success metric:** push opt-in rate, and return-visit rate among notified users
vs. not.

### Phase 2 — Local, one campus at a time
*Gate to start: Phase 1 shows notifications drive repeat engagement.*

The exciting expansion — and the data swamp. Honest findings:

- **There is no local-deals API to buy.** Google Places exposes no deals and its
  ToS bans building a competing copy DB; Yelp Fusion has no deals field (Yelp
  Deals retired late 2024) and caps caching at 24h. University/SGA "discounts
  near campus" pages exist but are fragmented, undated, and tiny.
- **So we manufacture the data**, two layers: national (affiliate aggregators,
  already have) + **local, hand-seeded and crowdsourced per campus.**
- **Campus wedge beats breadth.** ~50–150 merchants make a campus feel complete.
  Hand-seed one campus (founder's / nearest), partner with the SGA and local
  Chamber of Commerce for merchant intros, then templatize and expand.
- **Freshness is the feature, not a chore.** Decay timer on every local offer +
  one-tap geofenced "still here?" re-verification by verified students (the
  Foursquare/Waze model). Show a "last verified" date on every card — the same
  honesty signal we already use nationally.
- **Avoid the Groupon trap:** don't take a cut of merchant deals (high CAC,
  stale inventory). Monetize local via featured placement / per-verified-redemption
  once a campus has density.

**Success metric:** per-campus active users, % of local offers re-verified in the
last 30 days, crowdsource submissions per active user.

### Phase 3 — Scale the wedge / earn native
*Gate to start: one campus demonstrably retains and self-sustains its data.*

- Repeat the campus playbook; rank campuses by student density.
- If retention proves a daily-habit pattern, build native (the wallet product:
  renewal tracking, status management, receipt scanning).
- Pursue B2B/white-label in parallel (see §6) — it doesn't depend on the wedge.

---

## 6. How we make money

**Principle (non-negotiable): the NerdWallet / Points Guy firewall.** Rank perks
purely by user value, disclose monetization in plain language, and earn
underneath the recommendations — never let payout size touch the ranking. For a
new entrant this is the cheapest durable moat, and it's *exactly* the credibility
that Honey/Capital One are currently losing in court.

**Sequence by access difficulty, not by payout.** Get live revenue + conversion
data from the easy networks first; chase the gated high-CPA deals once we have
traffic to qualify.

### Revenue lines, in build order

1. **Easy affiliate (now-ish, once Phase 0 has click data).** Join **Impact**
   (DoorDash, Uber Eats, Instacart, Spotify) and **FlexOffers** (broad
   long-tail) — both accept small publishers with no traffic minimum. Swap the
   top-clicked perks' outbound links for affiliate links. Zero UX change.
   *Payouts here are low ($2–50/action) but it proves the model and funds the rest.*

2. **High-value finance (after we have traffic).** Cards ($50–150/approval, up to
   $400 premium) and bank bonuses (~$250/funded account) are the real money — but
   you **cannot** join Chase/Amex/Capital One directly. Use a **sub-affiliate
   aggregator** (Bankrate/CreditCards.com or CardRatings via QuinStreet, or
   Fintel Connect): one integration unlocks dozens of issuers and offloads
   compliance. *(confidence: medium on exact CPA, high on the access mechanism.)*

3. **Local merchant monetization (Phase 2+, at density).** Featured placement or
   per-verified-redemption. Clean, no gambling-ethics issue, but needs a dense
   campus first.

4. **B2B / white-label (anytime — possibly the bigger, cleaner business).** The
   eligibility engine is reusable. Universities, employers, credit unions,
   military-support orgs, and HR/benefits platforms would pay to license a
   branded "perks you qualify for" widget for their members. Sells the *engine*,
   not eyeballs — and sidesteps the gambling question entirely.

5. **Premium "instant radar" (later).** "Alert me the moment anything I qualify
   for changes" is the rare thing a power user would pay a few dollars a month for.
   Only viable once the radar itself is proven.

**Permission-based email** compounds all of the above — deliver the affiliate
offers inside genuinely useful "before it expires" emails. Keep the brief's
"no data-selling" rule; the list's value is the channel, not the resale.

### What the data already tells us

Per-perk affiliate map of the current 36 offers (verified 2026-06-13):

- **High-payout ($50+/action):** the 3 sportsbooks + Chase checking bonus.
- **Medium ($5–50):** Amazon Prime Student, Adobe.
- **Low (<$5):** most streaming/retail/SaaS student & community deals (Spotify,
  Apple Music, Nike, Walmart, DoorDash, Headspace, Peloton, etc.).
- **No program (loss-leader content):** the free/gov utilities (NPS, library,
  AnnualCreditReport, Museums for All) and several dev tools (GitHub, JetBrains).

**Read:** the free/student offers drive engagement and word-of-mouth; the money
concentrates in **financial verticals**. Classic structure — loss-leader content
on top, monetize the financial layer underneath.

---

## 7. The one real values fork — sportsbooks

The single highest-CPA line is sportsbook referrals ($100–300 per first-time
funded depositor), and the app currently *warns users* that gambling is
negative-EV. Profiting from referrals to a product we warn against is a genuine
tension. It's also the **hardest** vertical operationally: manual approval that
favors big media, geo-restriction to legal states, and **per-state affiliate
license fees ($200–$11,200 across ~21 states).**

Three honest options:
1. **Take it** — legal, the warning stays.
2. **List but don't monetize** — keep sportsbooks as pure utility, no affiliate
   link. *(Recommended: preserves the honest-tool credibility that is our whole
   moat; we still make real money on cards + bank bonuses + B2B.)*
3. **Drop them.**

This is a founder decision about what the product *is*, not a technical one.

---

## 8. Honest risks

- **Local data kills apps.** It's the swamp that killed Groupon's margins. Only
  the campus-wedge + automated-re-verification approach makes it survivable —
  and even then it's the riskiest phase. Don't start it until Phase 1 retention
  is proven.
- **Incumbents own national brand deals.** Don't fight UNiDAYS/ID.me on
  national-brand breadth. Win on the combination they lack (multi-cohort + free
  tiers + ranking + alerts + local) and on trust.
- **Notifications graduate us past the MVP** — accounts, storage, a scheduler,
  push infra. That's a deliberate architecture step (see companion doc), gated
  by funnel data.
- **Affiliate credibility is fragile.** One pay-for-placement decision and we
  become the thing users distrust. The firewall is load-bearing.

---

## 9. Immediate next actions

1. **Add the PostHog key** to Vercel and redeploy — start recording the 5 funnels.
   *(Nothing below is justified without this data.)*
2. **Make it a PWA** (installable + the manifest/SW groundwork) so push is possible.
3. **Join Impact + FlexOffers**; once Phase 0 click data lands, affiliate-link the
   top-clicked perks.
4. Hold local (Phase 2) until Phase 1 retention is proven.

The sequencing discipline is the whole strategy: **measure → retain → localize →
scale**, and let each phase's numbers green-light the next.
