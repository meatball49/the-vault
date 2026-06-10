# MEASURE.md — what this build exists to find out

The Vault is an MVP put in front of ~10 real people. **These five numbers are
the point of the build.** Everything else is supporting machinery.

| # | Question | Number |
|---|----------|--------|
| 1 | Do people finish the quiz? | **Quiz completion rate** |
| 2 | Do they act on a perk? | **Claim rate** |
| 3 | What do they act on? | **Top perks clicked** |
| 4 | Do they come back? | **7-day return rate** |
| 5 | Will they leave an email? | **Email opt-in rate** |

## Events the app sends

| Event | Fired when | Properties |
|-------|-----------|------------|
| `quiz_start` | "Open the vault" tapped on the intro | — |
| `quiz_complete` | Final quiz step submitted | `age_bracket`, `is_student`, `student_type`, `community_count`, `interests`, `state_answered`, `eligible_count`, `total_value` |
| `perk_click` | "How to claim →" tapped on a card | `perk_id`, `category`, `value` |
| `filter_change` | A category filter chip tapped | `filter` |
| `email_capture` | Valid email submitted | — (deliberately none) |

Pageviews, sessions, and returning-visitor identity use PostHog's built-in
autocapture/person tracking — nothing custom.

**Privacy rule:** no event property ever contains an email or anything
identifying. The email from the capture form is stored as a **person
property** (`email`) only, set via `setPersonProperties` at the moment of
`email_capture`. Find opt-ins under People → filter by `email is set`.

## Set up these insights in PostHog (≈10 minutes)

1. **Quiz completion rate** — Funnel: `quiz_start` → `quiz_complete`,
   conversion window 1 hour. Secondary: `$pageview` → `quiz_start` shows
   whether the intro itself loses people.
2. **Claim rate** — Funnel: `quiz_complete` → `perk_click`, window 1 hour.
   This is the core behavioral signal: results compelling enough to act on.
3. **Top perks clicked** — Trend: `perk_click` broken down by `perk_id`
   (bar chart, last 30 days). Secondary breakdown by `category` shows which
   audience the value concentrates in.
4. **7-day return rate** — Retention insight: people who did `$pageview`,
   returning to do `$pageview`, weekly. Read the Week 1 column.
5. **Email opt-in rate** — Funnel: `quiz_complete` → `email_capture`,
   window 1 hour.

## How to read the experiment

- Completion rate **< 60%**: the quiz is too long or the promise is weak —
  look at the `quiz_start → quiz_complete` drop-off, cut a question.
- Claim rate **< 20%**: ranked list isn't convincing; check whether clicks
  concentrate in one category and consider leading with it.
- Returns ≈ 0 and opt-ins ≈ 0: it's a one-shot toy — the "flag me before
  it expires" loop is the retention hypothesis to rework, not the quiz.
- Whatever wins the `perk_id` breakdown is the seed for v2 content.
