import type { Perk } from './types'

export function formatMoney(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US')
}

export function formatPerkValue(perk: Perk): string {
  if (perk.value === 0) return 'Free'
  const amount = perk.value.toLocaleString('en-US')
  switch (perk.valueType) {
    case 'perYear':
      return `$${amount}/yr`
    case 'inTools':
      return `$${amount} in tools`
    case 'promo':
      return `$${amount} promo`
    case 'freeOrVaries':
      return `~$${amount}`
  }
}

/** "2026-06-09" → "June 9, 2026" (parsed as local time, not UTC midnight). */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Newest verifiedOn across the dataset — drives "Offers last reviewed". */
export function newestVerifiedOn(perks: Perk[]): string | undefined {
  let newest: string | undefined
  for (const perk of perks) {
    if (!newest || perk.source.verifiedOn > newest) newest = perk.source.verifiedOn
  }
  return newest
}
