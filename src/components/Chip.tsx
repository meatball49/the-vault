import type { ReactNode } from 'react'

type ChipProps = {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

/** Tappable quiz chip. aria-pressed carries the toggle state for AT. */
export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-5 py-2.5 text-base font-medium transition-colors duration-150 ${
        selected
          ? 'border-brass bg-brass text-ink font-semibold'
          : 'border-line bg-ink-2 text-cream hover:border-brass/60'
      }`}
    >
      {children}
    </button>
  )
}
