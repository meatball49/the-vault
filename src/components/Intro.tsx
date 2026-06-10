import { formatDate } from '../lib/format'

type IntroProps = {
  perkCount: number
  lastReviewed?: string
  onStart: () => void
}

export function Intro({ perkCount, lastReviewed, onStart }: IntroProps) {
  return (
    <section className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16 text-center">
      <p className="animate-rise font-mono text-xs font-bold tracking-[0.35em] text-brass uppercase">
        The Vault
      </p>
      <h1
        className="animate-rise mt-5 font-display text-[2.6rem] leading-[1.05] font-semibold text-cream sm:text-6xl"
        style={{ animationDelay: '80ms' }}
      >
        You're leaving
        <br />
        money locked up.
      </h1>
      <p
        className="animate-rise mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted"
        style={{ animationDelay: '160ms' }}
      >
        Five quick questions. In return: every discount, free tier, and perk you actually qualify
        for — ranked by what it's worth.
      </p>
      <div className="animate-rise mt-10" style={{ animationDelay: '240ms' }}>
        <button
          type="button"
          onClick={onStart}
          className="min-h-12 rounded-full bg-brass px-8 py-3 text-lg font-semibold text-ink transition-colors hover:bg-brass-bright"
        >
          Open the vault
        </button>
      </div>
      <p
        className="animate-rise mt-8 text-sm text-dim"
        style={{ animationDelay: '320ms' }}
      >
        {perkCount} verified offers · free · takes about a minute
        {lastReviewed ? (
          <>
            <br />
            Offers last reviewed: {formatDate(lastReviewed)}
          </>
        ) : null}
      </p>
    </section>
  )
}
