import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Art } from './Art'
import type { Art as ArtT } from '../lib/content'
import { useGame } from '../lib/game'

export function Modal({ open, onClose, children, wide, label }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean; label?: string }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label={label}
            className={`modal ${wide ? 'wide' : ''}`}
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="icon-btn modal-x" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function PageHead({ art, title, sub, right }: { art?: ArtT; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="page-head">
      {art && <Art {...art} size={56} />}
      <div className="grow">
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function Seeds({ big }: { big?: boolean }) {
  const { points } = useGame()
  return (
    <motion.span key={points} className={`seeds ${big ? 'big' : ''}`} initial={{ scale: 1.15 }} animate={{ scale: 1 }} title="Semillas de los dos, para la tienda">
      <Art lottie="2728" size={big ? 26 : 20} play="still" /> {points}
    </motion.span>
  )
}

export function Empty({ art, children }: { art: ArtT; children: ReactNode }) {
  return (
    <div className="empty">
      <Art {...art} size={72} />
      <p>{children}</p>
    </div>
  )
}

/* ---------- avisitos suaves (solo dentro de la web, nunca notificaciones) ---------- */
type Toast = { id: number; text: ReactNode; art?: ArtT }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastHost({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setList((l) => [...l, { ...t, id }])
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} className="toast" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
              {t.art && <Art {...t.art} size={30} />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function celebrate(calm: boolean, opts: confetti.Options = {}) {
  if (calm) return
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 28,
    gravity: 0.7,
    scalar: 0.9,
    ticks: 160,
    colors: ['#f4c7c3', '#c8dcc8', '#f6e3b4', '#d9cdee', '#ffffff'],
    disableForReducedMotion: true,
    ...opts,
  })
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: ReactNode }[] }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {value === o.id && <motion.span layoutId={`seg-${options.map((x) => x.id).join()}`} className="seg-pill" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Brillitos que vuelan desde un lugar hasta el contador de semillas. */
export function flyToSeeds(from: DOMRect, n: number, calm: boolean, img = 'sparkles') {
  if (calm || typeof document === 'undefined') return
  const target = [...document.querySelectorAll<HTMLElement>('.seeds')].find((el) => el.getBoundingClientRect().width > 0)
  if (!target) return
  const t = target.getBoundingClientRect()
  const sx = from.left + from.width / 2
  const sy = from.top + from.height / 2
  const count = Math.max(1, Math.min(n, 8))
  for (let i = 0; i < count; i++) {
    const el = document.createElement('img')
    el.src = `${import.meta.env.BASE_URL}fluent/${img}.png`
    el.className = 'fly-bit'
    el.style.left = `${sx - 13}px`
    el.style.top = `${sy - 13}px`
    document.body.appendChild(el)
    const dx = t.left + t.width / 2 - sx
    const dy = t.top + t.height / 2 - sy
    const mx = (Math.random() - 0.5) * 140
    const my = -60 - Math.random() * 70
    el.animate(
      [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy}px) scale(.35)`, opacity: 0.8 },
      ],
      { duration: 950, delay: i * 70, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' },
    ).onfinish = () => el.remove()
  }
  target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 420, delay: 900 + count * 70, easing: 'ease-out' })
}
