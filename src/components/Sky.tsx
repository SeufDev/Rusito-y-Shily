import { useEffect, useMemo, useState } from 'react'
import { dayPart, hash, type DayPart } from '../lib/dates'

/** Fondo que cambia con la hora: amanecer, día, atardecer y noche (con estrellitas). */
export function Sky() {
  const [part, setPart] = useState<DayPart>(dayPart())
  useEffect(() => {
    const forced = new URLSearchParams(location.search).get('hora') as DayPart | null
    const tick = () => setPart(forced ?? dayPart())
    tick()
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.part = part
    const meta = document.querySelector('meta[name=theme-color]')
    meta?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
  }, [part])
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: hash('x' + i) * 100,
        y: hash('y' + i) * 70,
        s: 1 + hash('s' + i) * 2,
        d: hash('d' + i) * 6,
      })),
    [],
  )
  return (
    <div className="sky" aria-hidden>
      <div className="sky-base" />
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      {part === 'night' && (
        <div className="sky-stars">
          {stars.map((s, i) => (
            <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
          ))}
        </div>
      )}
      <div className="grain" />
    </div>
  )
}
