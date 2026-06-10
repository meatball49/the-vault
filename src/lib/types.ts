export type Category = 'student' | 'age21' | 'community' | 'everyone'

export type Community = 'military' | 'teacher' | 'nurse' | 'responder' | 'gov'

export type ValueType = 'perYear' | 'inTools' | 'freeOrVaries' | 'promo'

/** Interest keys used for ranking. Kept as a const list so the quiz and data stay in sync. */
export const INTERESTS = ['ai', 'dev', 'stream', 'create', 'shop', 'fit', 'bet'] as const
export type Interest = (typeof INTERESTS)[number]

export type Perk = {
  id: string
  name: string
  /** What you get, 1–2 sentences. */
  blurb: string
  /** Rough annual $ (savings or sticker); 0 = free/varies. */
  value: number
  valueType: ValueType
  category: Category
  eligibility: {
    /** e.g. 21 — profile's guaranteed minimum age must meet this. */
    minAge?: number
    student?: 'college' | 'any' | false
    /** Any-match: profile needs at least one of these. */
    communities?: Community[]
    /** Gated by state legality (and implies 21+). */
    legalGate?: 'sportsBetting'
  }
  interests: Interest[]
  source: {
    url: string
    /** ISO date the offer was last confirmed live. */
    verifiedOn: string
  }
  flags: {
    expiring?: boolean
    verifyTerms?: boolean
    gambling?: boolean
  }
  /** Honest caveat (country eligibility, auto-renew, negative EV, etc.). */
  note?: string
}

export type AgeBracket = 'under18' | '18to20' | '21to24' | '25plus'

export type StudentStatus = 'college' | 'highschool' | 'none'

export type Profile = {
  age: AgeBracket
  student: StudentStatus
  communities: Community[]
  /** Two-letter USPS code; '' when unanswered. */
  state: string
  interests: Interest[]
}
