import { useMemo, useState } from 'react'
import { trackFilterChange } from '../lib/analytics'
import { formatDate, formatMoney, newestVerifiedOn } from '../lib/format'
import type { Category, Perk } from '../lib/types'
import { Chip } from './Chip'
import { CountUp } from './CountUp'
import { EmailCapture } from './EmailCapture'
import { PerkCard } from './PerkCard'

const FILTER_LABELS: Record<Category, string> = {
  student: 'Student',
  age21: '21+',
  community: 'Community',
  everyone: 'Everyone',
}

type ResultsProps = {
  perks: Perk[] // already eligible + ranked
  total: number
  recurringPerYear: number
  onRestart: () => void
}

export function Results({ perks, total, recurringPerYear, onRestart }: ResultsProps) {
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const categories = useMemo(
    () => (['student', 'age21', 'community', 'everyone'] as const).filter((c) => perks.some((p) => p.category === c)),
    [perks],
  )
  const visible = filter === 'all' ? perks : perks.filter((p) => p.category === filter)
  const lastReviewed = newestVerifiedOn(perks)
  const hasGambling = perks.some((p) => p.flags.gambling)

  const changeFilter = (next: Category | 'all') => {
    setFilter(next)
    trackFilterChange(next)
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-12">
      <header className="text-center">
        <p className="animate-rise font-mono text-xs font-bold tracking-[0.35em] text-brass uppercase">
          Vault open
        </p>
        <p
          className="animate-rise mt-6 text-sm font-medium tracking-wide text-muted uppercase"
          style={{ animationDelay: '80ms' }}
        >
          Value on the table*
        </p>
        <CountUp
          value={total}
          className="animate-rise mt-1 block font-mono text-6xl font-bold text-brass-bright tabular-nums"
        />
        {recurringPerYear > 0 && (
          <p
            className="animate-rise mt-2 font-mono text-sm text-muted"
            style={{ animationDelay: '160ms' }}
          >
            {formatMoney(recurringPerYear)}/yr of that is recurring savings
          </p>
        )}
        <p
          className="animate-rise mt-4 text-sm text-dim"
          style={{ animationDelay: '240ms' }}
        >
          {perks.length} offers you can claim
          {lastReviewed ? ` · last reviewed ${formatDate(lastReviewed)}` : ''}
        </p>
      </header>

      {categories.length > 1 && (
        <nav
          aria-label="Filter perks by category"
          className="animate-rise mt-10 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: '300ms' }}
        >
          <Chip selected={filter === 'all'} onClick={() => changeFilter('all')}>
            All ({perks.length})
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={filter === category}
              onClick={() => changeFilter(category)}
            >
              {FILTER_LABELS[category]} ({perks.filter((p) => p.category === category).length})
            </Chip>
          ))}
        </nav>
      )}

      <div className="mt-8 flex flex-col gap-4" role="list" aria-label="Your eligible perks">
        {visible.map((perk, index) => (
          <div role="listitem" key={perk.id}>
            <PerkCard perk={perk} index={index} />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <EmailCapture />
      </div>

      <footer className="mt-10 border-t border-line pt-6 text-[13px] leading-relaxed text-dim">
        <p>
          * Optimistic math, on purpose: this adds up the sticker value of everything you qualify
          for, and nobody uses every subscription at once. Sportsbook promos count as $0 — bonus
          bets aren't money in your pocket.
        </p>
        {hasGambling && (
          <p className="mt-2">
            Sports betting offers are 21+, only where legal, and carry negative expected value.
            Problem? Call or text 1-800-GAMBLER.
          </p>
        )}
        <p className="mt-2">Every offer links to its official source — terms change fast, check before you count on it.</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 text-sm font-medium text-muted underline underline-offset-4 hover:text-cream"
        >
          Start over
        </button>
      </footer>
    </section>
  )
}
