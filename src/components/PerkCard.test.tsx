import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Perk } from '../lib/types'
import { PerkCard } from './PerkCard'

const base: Perk = {
  id: 'test-perk',
  name: 'Test Perk',
  blurb: 'You get a thing.',
  value: 120,
  valueType: 'perYear',
  category: 'student',
  eligibility: { student: 'college' },
  interests: ['stream'],
  source: { url: 'https://example.com/offer', verifiedOn: '2026-06-09' },
  flags: {},
}

describe('PerkCard', () => {
  it('renders name, value, category, and a safe outbound claim link', () => {
    render(<PerkCard perk={base} index={0} />)
    expect(screen.getByText('Test Perk')).toBeInTheDocument()
    expect(screen.getByText('$120/yr')).toBeInTheDocument()
    expect(screen.getByText('Student')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'How to claim →' })
    expect(link).toHaveAttribute('href', 'https://example.com/offer')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows badges for expiring, verify-terms, and 21+ perks', () => {
    render(
      <PerkCard
        perk={{
          ...base,
          eligibility: { minAge: 21 },
          flags: { expiring: true, verifyTerms: true },
        }}
        index={0}
      />,
    )
    expect(screen.getByText('Ends soon')).toBeInTheDocument()
    expect(screen.getByText('Check terms')).toBeInTheDocument()
    expect(screen.getByText('21+')).toBeInTheDocument()
  })

  it('shows the responsible-gambling warning on gambling perks', () => {
    render(<PerkCard perk={{ ...base, flags: { gambling: true } }} index={0} />)
    expect(screen.getByText(/1-800-GAMBLER/)).toBeInTheDocument()
    expect(screen.getByText(/negative/)).toBeInTheDocument()
  })

  it('renders "Free" for zero-value perks', () => {
    render(<PerkCard perk={{ ...base, value: 0, valueType: 'freeOrVaries' }} index={0} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})
