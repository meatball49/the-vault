import type { AgeBracket, Perk, Profile } from './types'
import { BETTING_LEGAL_STATES } from '../data/states'

/**
 * The guaranteed minimum age for each quiz bracket. "under18" maps to 0
 * because we can't guarantee any adult age for that bracket.
 */
export const AGE_BRACKET_MIN: Record<AgeBracket, number> = {
  under18: 0,
  '18to20': 18,
  '21to24': 21,
  '25plus': 25,
}

function meetsAge(profile: Profile, minAge: number): boolean {
  return AGE_BRACKET_MIN[profile.age] >= minAge
}

function meetsStudent(profile: Profile, requirement: Perk['eligibility']['student']): boolean {
  if (requirement === 'college') return profile.student === 'college'
  if (requirement === 'any') return profile.student !== 'none'
  // undefined or false: no student requirement
  return true
}

function meetsCommunities(profile: Profile, required: Perk['eligibility']['communities']): boolean {
  if (!required || required.length === 0) return true
  return profile.communities.some((c) => required.includes(c))
}

function meetsLegalGate(
  profile: Profile,
  gate: Perk['eligibility']['legalGate'],
  legalStates: ReadonlySet<string>,
): boolean {
  if (gate !== 'sportsBetting') return true
  // The gate itself implies 21+, even if a perk's data forgets minAge.
  return meetsAge(profile, 21) && legalStates.has(profile.state)
}

/**
 * Filter perks down to what this profile can actually claim:
 * age gate, student status, community any-match, and state legality for gambling.
 */
export function getEligiblePerks(
  profile: Profile,
  perks: Perk[],
  legalStates: ReadonlySet<string> = BETTING_LEGAL_STATES,
): Perk[] {
  return perks.filter(
    (perk) =>
      meetsAge(profile, perk.eligibility.minAge ?? 0) &&
      meetsStudent(profile, perk.eligibility.student) &&
      meetsCommunities(profile, perk.eligibility.communities) &&
      meetsLegalGate(profile, perk.eligibility.legalGate, legalStates),
  )
}

/**
 * Rank perks for display: interest-matched perks float to the top,
 * then sort by value descending within each group. Stable for ties.
 */
export function rankPerks(perks: Perk[], profile: Profile): Perk[] {
  const matchesInterest = (perk: Perk) =>
    perk.interests.some((interest) => profile.interests.includes(interest))
  return [...perks].sort((a, b) => {
    const aMatch = matchesInterest(a) ? 1 : 0
    const bMatch = matchesInterest(b) ? 1 : 0
    if (aMatch !== bMatch) return bMatch - aMatch
    return b.value - a.value
  })
}

/**
 * Sum perk values for the headline number. Gambling perks contribute 0 —
 * a sportsbook promo is not money in your pocket. recurringPerYear counts
 * only perYear values (what you'd plausibly save annually).
 */
export function computeTotals(perks: Perk[]): { total: number; recurringPerYear: number } {
  let total = 0
  let recurringPerYear = 0
  for (const perk of perks) {
    if (perk.flags.gambling) continue
    total += perk.value
    if (perk.valueType === 'perYear') recurringPerYear += perk.value
  }
  return { total, recurringPerYear }
}
