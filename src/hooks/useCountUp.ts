import { useEffect, useState } from 'react'

/** Gentle count-up for KPI values (one intentional motion). */
export function useCountUp(target: number, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  if (decimals === 0) return Math.round(value).toLocaleString()
  return value.toFixed(decimals)
}
