import { trackPerkClick } from '../lib/analytics'
import { formatPerkValue } from '../lib/format'
import type { Category, Perk } from '../lib/types'

const CATEGORY_LABELS: Record<Category, string> = {
  student: 'Student',
  age21: '21+',
  community: 'Community',
  everyone: 'Everyone',
}

type PerkCardProps = {
  perk: Perk
  index: number
}

export function PerkCard({ perk, index }: PerkCardProps) {
  const badges: string[] = []
  if (perk.flags.expiring) badges.push('Ends soon')
  if (perk.flags.verifyTerms) badges.push('Check terms')
  if ((perk.eligibility.minAge ?? 0) >= 21) badges.push('21+')

  return (
    <article
      className="animate-rise rounded-2xl border border-line bg-surface p-5"
      style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-muted uppercase">
          {CATEGORY_LABELS[perk.category]}
        </span>
        <span className="font-mono text-lg font-bold whitespace-nowrap text-brass-bright">
          {formatPerkValue(perk)}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold text-cream">{perk.name}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{perk.blurb}</p>

      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide uppercase ${
                badge === 'Ends soon' ? 'bg-warn/15 text-warn' : 'bg-raised text-muted'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {perk.note && <p className="mt-3 text-[13px] leading-relaxed text-dim">{perk.note}</p>}

      {perk.flags.gambling && (
        <p className="mt-2 text-[13px] leading-relaxed text-warn">
          Bonus bets, not cash — the expected value of gambling is negative. 21+, where legal. If
          it stops being fun: 1-800-GAMBLER.
        </p>
      )}

      <a
        href={perk.source.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPerkClick(perk)}
        className="mt-4 inline-block rounded-full border border-brass/50 px-4 py-2 text-sm font-semibold text-brass transition-colors hover:bg-brass hover:text-ink"
      >
        How to claim →
      </a>
    </article>
  )
}
