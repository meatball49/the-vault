import { useState } from 'react'
import { trackEmailCapture } from '../lib/analytics'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailCapture() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'error' | 'done'>('idle')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus('error')
      return
    }
    trackEmailCapture(trimmed)
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-brass/40 bg-surface p-6 text-center">
        <p className="font-display text-lg font-semibold text-brass-bright">You're on the list.</p>
        <p className="mt-1 text-sm text-muted">
          We'll flag you before anything you qualify for expires. Nothing else.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-surface p-6">
      <h3 className="font-display text-lg font-semibold text-cream">
        Get flagged before something expires
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        One email when a perk you qualify for is about to end. No newsletter, no selling your
        data, unsubscribe any time.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email-capture" className="sr-only">
          Email address
        </label>
        <input
          id="email-capture"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status === 'error') setStatus('idle')
          }}
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? 'email-error' : undefined}
          className="min-h-12 grow rounded-full border border-line bg-ink-2 px-5 py-3 text-base text-cream placeholder:text-dim focus:border-brass"
        />
        <button
          type="submit"
          className="min-h-12 rounded-full bg-brass px-6 py-3 text-base font-semibold text-ink transition-colors hover:bg-brass-bright"
        >
          Flag me
        </button>
      </div>
      {status === 'error' && (
        <p id="email-error" role="alert" className="mt-2 text-sm text-warn">
          That doesn't look like an email address.
        </p>
      )}
    </form>
  )
}
