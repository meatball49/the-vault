import type { PostHog } from 'posthog-js'
import type { Perk, Profile } from './types'

/**
 * Thin wrapper around PostHog. Every event the MVP measures goes through
 * here so the event names and properties stay in one auditable place.
 *
 * The SDK is imported lazily to keep ~130KB of analytics off the critical
 * rendering path; events fired before it resolves are queued and flushed.
 *
 * Privacy rule (see MEASURE.md): no email or other identifying data ever
 * rides on an event. The email from the capture form is stored as a person
 * property only.
 */

let client: PostHog | null = null
let enabled = false
let queue: Array<(posthog: PostHog) => void> = []

export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY
  if (!key) return // local dev / no key: analytics no-ops
  enabled = true
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      defaults: '2025-05-24',
    })
    client = posthog
    const pending = queue
    queue = []
    for (const send of pending) send(posthog)
  })
}

function withClient(send: (posthog: PostHog) => void): void {
  if (!enabled) return
  if (client) send(client)
  else queue.push(send)
}

function capture(event: string, props?: Record<string, unknown>): void {
  withClient((posthog) => posthog.capture(event, props))
}

export function trackQuizStart(): void {
  capture('quiz_start')
}

export function trackQuizComplete(profile: Profile, eligibleCount: number, totalValue: number): void {
  capture('quiz_complete', {
    age_bracket: profile.age,
    is_student: profile.student !== 'none',
    student_type: profile.student,
    community_count: profile.communities.length,
    interests: profile.interests,
    state_answered: profile.state !== '',
    eligible_count: eligibleCount,
    total_value: totalValue,
  })
}

export function trackPerkClick(perk: Perk): void {
  capture('perk_click', {
    perk_id: perk.id,
    category: perk.category,
    value: perk.value,
  })
}

export function trackFilterChange(filter: string): void {
  capture('filter_change', { filter })
}

export function trackEmailCapture(email: string): void {
  withClient((posthog) => {
    posthog.capture('email_capture') // intentionally no properties
    posthog.setPersonProperties({ email })
  })
}
