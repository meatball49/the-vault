import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { formatMoney } from '../lib/format'

type CountUpProps = {
  value: number
  durationMs?: number
  className?: string
}

/** Animated dollar count-up. Renders the final value immediately under reduced motion. */
export function CountUp({ value, durationMs = 1400, className }: CountUpProps) {
  const reducedMotion = useReducedMotion()
  const [animated, setAnimated] = useState(0)
  const frame = useRef<number>(0)

  useEffect(() => {
    if (reducedMotion) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimated(Math.round(value * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, durationMs, reducedMotion])

  const displayed = reducedMotion ? value : animated

  return (
    <span className={className} aria-label={formatMoney(value)}>
      <span aria-hidden="true">{formatMoney(displayed)}</span>
    </span>
  )
}
