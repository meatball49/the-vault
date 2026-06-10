import { describe, expect, it } from 'vitest'
import { INTERESTS } from '../lib/types'
import { PERKS } from './perks'
import { BETTING_LEGAL_STATES, US_STATES } from './states'

/**
 * Integrity checks for the dataset itself. These are the guardrails the
 * CONTENT.md maintenance playbook leans on: if a future edit breaks an
 * invariant, the suite fails before the data ships.
 */

describe('perks dataset integrity', () => {
  it('has unique ids', () => {
    const ids = PERKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every perk has an https source URL and ISO verifiedOn date', () => {
    for (const p of PERKS) {
      expect(p.source.url, p.id).toMatch(/^https:\/\//)
      expect(p.source.verifiedOn, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('every gambling perk is 21+, state-gated, category age21, and valueType promo', () => {
    for (const p of PERKS.filter((perk) => perk.flags.gambling)) {
      expect(p.eligibility.minAge, p.id).toBe(21)
      expect(p.eligibility.legalGate, p.id).toBe('sportsBetting')
      expect(p.category, p.id).toBe('age21')
      expect(p.valueType, p.id).toBe('promo')
      expect(p.note, p.id).toMatch(/negative expected value/i)
    }
  })

  it('values are non-negative and zero implies freeOrVaries', () => {
    for (const p of PERKS) {
      expect(p.value, p.id).toBeGreaterThanOrEqual(0)
      if (p.value === 0) expect(p.valueType, p.id).toBe('freeOrVaries')
    }
  })

  it('interests only use known keys', () => {
    for (const p of PERKS) {
      for (const interest of p.interests) {
        expect(INTERESTS, `${p.id}: ${interest}`).toContain(interest)
      }
    }
  })

  it('category matches the eligibility shape', () => {
    for (const p of PERKS) {
      if (p.category === 'student') expect(p.eligibility.student, p.id).toBeTruthy()
      if (p.category === 'community') {
        expect(p.eligibility.communities?.length, p.id).toBeGreaterThan(0)
      }
      if (p.category === 'everyone') {
        expect(p.eligibility.student, p.id).toBeUndefined()
        expect(p.eligibility.communities, p.id).toBeUndefined()
        expect(p.eligibility.minAge, p.id).toBeUndefined()
      }
    }
  })

  it('has a meaningful catalogue: every category represented', () => {
    const categories = new Set(PERKS.map((p) => p.category))
    expect(categories).toEqual(new Set(['student', 'age21', 'community', 'everyone']))
  })
})

describe('states data integrity', () => {
  it('covers 50 states + DC', () => {
    expect(US_STATES).toHaveLength(51)
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(51)
  })

  it('every betting-legal state is a real state code', () => {
    const codes = new Set(US_STATES.map((s) => s.code))
    for (const state of BETTING_LEGAL_STATES) {
      expect(codes, state).toContain(state)
    }
  })
})
