import { describe, expect, it } from 'vitest'
import { AGE_BRACKET_MIN, computeTotals, getEligiblePerks, rankPerks } from './eligibility'
import type { Perk, Profile } from './types'

const VERIFIED = { url: 'https://example.com', verifiedOn: '2026-06-09' }

function perk(overrides: Partial<Perk> & { id: string }): Perk {
  return {
    name: overrides.id,
    blurb: 'test perk',
    value: 0,
    valueType: 'freeOrVaries',
    category: 'everyone',
    eligibility: {},
    interests: [],
    source: VERIFIED,
    flags: {},
    ...overrides,
  }
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    age: '25plus',
    student: 'none',
    communities: [],
    state: '',
    interests: [],
    ...overrides,
  }
}

// Fixture catalogue, one perk per rule we care about.
const collegeStreaming = perk({
  id: 'college-streaming',
  category: 'student',
  eligibility: { student: 'college' },
  value: 200,
  valueType: 'perYear',
  interests: ['stream'],
})
const anyStudentDeal = perk({
  id: 'any-student-deal',
  category: 'student',
  eligibility: { student: 'any' },
  value: 50,
  valueType: 'perYear',
})
const drinks21 = perk({
  id: 'drinks-21',
  category: 'age21',
  eligibility: { minAge: 21 },
  value: 30,
  valueType: 'perYear',
})
const sportsbook = perk({
  id: 'sportsbook',
  category: 'age21',
  eligibility: { minAge: 21, legalGate: 'sportsBetting' },
  value: 150,
  valueType: 'promo',
  interests: ['bet'],
  flags: { gambling: true },
})
const militaryOrTeacher = perk({
  id: 'military-or-teacher',
  category: 'community',
  eligibility: { communities: ['military', 'teacher'] },
  value: 100,
  valueType: 'perYear',
})
const freeForEveryone = perk({
  id: 'free-for-everyone',
  value: 0,
  valueType: 'freeOrVaries',
  interests: ['stream'],
})
const devTools = perk({
  id: 'dev-tools',
  value: 500,
  valueType: 'inTools',
  interests: ['dev'],
})

const ALL = [
  collegeStreaming,
  anyStudentDeal,
  drinks21,
  sportsbook,
  militaryOrTeacher,
  freeForEveryone,
  devTools,
]

const NJ_ONLY = new Set(['NJ'])

const ids = (perks: Perk[]) => perks.map((p) => p.id)

describe('AGE_BRACKET_MIN', () => {
  it('maps brackets to their guaranteed minimum age', () => {
    expect(AGE_BRACKET_MIN).toEqual({ under18: 0, '18to20': 18, '21to24': 21, '25plus': 25 })
  })
})

describe('getEligiblePerks — age gate', () => {
  it('hides 21+ perks from 18-20 year olds', () => {
    const result = getEligiblePerks(profile({ age: '18to20' }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('drinks-21')
  })

  it('shows 21+ perks at 21-24 and 25+', () => {
    for (const age of ['21to24', '25plus'] as const) {
      const result = getEligiblePerks(profile({ age }), ALL, NJ_ONLY)
      expect(ids(result)).toContain('drinks-21')
    }
  })

  it('treats under18 as guaranteeing no adult age', () => {
    const result = getEligiblePerks(profile({ age: 'under18' }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('drinks-21')
  })
})

describe('getEligiblePerks — student status', () => {
  it('college students get both college-only and any-student perks', () => {
    const result = getEligiblePerks(profile({ student: 'college' }), ALL, NJ_ONLY)
    expect(ids(result)).toEqual(expect.arrayContaining(['college-streaming', 'any-student-deal']))
  })

  it('high schoolers get the any-student subset but not college-only perks', () => {
    const result = getEligiblePerks(
      profile({ age: 'under18', student: 'highschool' }),
      ALL,
      NJ_ONLY,
    )
    expect(ids(result)).toContain('any-student-deal')
    expect(ids(result)).not.toContain('college-streaming')
  })

  it('non-students get neither', () => {
    const result = getEligiblePerks(profile({ student: 'none' }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('college-streaming')
    expect(ids(result)).not.toContain('any-student-deal')
  })
})

describe('getEligiblePerks — sports betting gate', () => {
  it('shows sportsbook only when state is legal AND age >= 21', () => {
    const eligible = getEligiblePerks(profile({ age: '21to24', state: 'NJ' }), ALL, NJ_ONLY)
    expect(ids(eligible)).toContain('sportsbook')
  })

  it('hides sportsbook when 21+ but state is not legal', () => {
    const result = getEligiblePerks(profile({ age: '21to24', state: 'TX' }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('sportsbook')
  })

  it('hides sportsbook when state is legal but under 21', () => {
    const result = getEligiblePerks(profile({ age: '18to20', state: 'NJ' }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('sportsbook')
  })

  it('enforces 21+ via the gate even if the perk data omits minAge', () => {
    const sloppy = perk({
      id: 'sloppy-sportsbook',
      eligibility: { legalGate: 'sportsBetting' },
      flags: { gambling: true },
    })
    const result = getEligiblePerks(profile({ age: '18to20', state: 'NJ' }), [sloppy], NJ_ONLY)
    expect(result).toHaveLength(0)
  })
})

describe('getEligiblePerks — community any-match', () => {
  it('matches when the profile has at least one required community', () => {
    const result = getEligiblePerks(profile({ communities: ['teacher'] }), ALL, NJ_ONLY)
    expect(ids(result)).toContain('military-or-teacher')
  })

  it('does not match a community outside the required list', () => {
    const result = getEligiblePerks(profile({ communities: ['nurse'] }), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('military-or-teacher')
  })

  it('does not match with no communities selected', () => {
    const result = getEligiblePerks(profile(), ALL, NJ_ONLY)
    expect(ids(result)).not.toContain('military-or-teacher')
  })
})

describe('getEligiblePerks — open perks', () => {
  it('always includes perks with no eligibility constraints', () => {
    const result = getEligiblePerks(
      profile({ age: 'under18', student: 'none', state: '' }),
      ALL,
      NJ_ONLY,
    )
    expect(ids(result)).toEqual(expect.arrayContaining(['free-for-everyone', 'dev-tools']))
  })
})

describe('getEligiblePerks — a realistic profile end to end', () => {
  it('21-24 college student in NJ with no communities', () => {
    const result = getEligiblePerks(
      profile({ age: '21to24', student: 'college', state: 'NJ', interests: ['ai', 'bet'] }),
      ALL,
      NJ_ONLY,
    )
    expect(ids(result).sort()).toEqual(
      [
        'any-student-deal',
        'college-streaming',
        'dev-tools',
        'drinks-21',
        'free-for-everyone',
        'sportsbook',
      ].sort(),
    )
  })
})

describe('rankPerks', () => {
  it('sorts by value descending when no interests are selected', () => {
    const ranked = rankPerks([freeForEveryone, devTools, collegeStreaming], profile())
    expect(ids(ranked)).toEqual(['dev-tools', 'college-streaming', 'free-for-everyone'])
  })

  it('floats interest-matched perks above higher-value unmatched perks', () => {
    const ranked = rankPerks(
      [devTools, collegeStreaming, freeForEveryone],
      profile({ interests: ['stream'] }),
    )
    // stream-matched first (by value desc), then the rest
    expect(ids(ranked)).toEqual(['college-streaming', 'free-for-everyone', 'dev-tools'])
  })

  it('sorts by value desc within the matched group', () => {
    const ranked = rankPerks(
      [freeForEveryone, sportsbook, collegeStreaming],
      profile({ interests: ['stream', 'bet'] }),
    )
    expect(ids(ranked)).toEqual(['college-streaming', 'sportsbook', 'free-for-everyone'])
  })

  it('does not mutate the input array', () => {
    const input = [freeForEveryone, devTools]
    rankPerks(input, profile())
    expect(ids(input)).toEqual(['free-for-everyone', 'dev-tools'])
  })
})

describe('computeTotals', () => {
  it('sums all non-gambling value into total, perYear into recurring', () => {
    const totals = computeTotals([collegeStreaming, devTools, sportsbook, freeForEveryone])
    expect(totals).toEqual({ total: 700, recurringPerYear: 200 })
  })

  it('excludes gambling promos entirely, even big ones', () => {
    const bigPromo = perk({
      id: 'big-promo',
      value: 1500,
      valueType: 'promo',
      flags: { gambling: true },
    })
    expect(computeTotals([bigPromo])).toEqual({ total: 0, recurringPerYear: 0 })
  })

  it('counts one-time (inTools) value in total but not recurring', () => {
    expect(computeTotals([devTools])).toEqual({ total: 500, recurringPerYear: 0 })
  })

  it('returns zeros for an empty list', () => {
    expect(computeTotals([])).toEqual({ total: 0, recurringPerYear: 0 })
  })
})
