import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ambient } from '../../lib/ambient'
import { hash } from '../../lib/dates'
import { useCalmMotion } from '../../lib/motion'
import { useStore } from '../../lib/store'

/**
 * Farolitos: escribís algo que pesa, lo ponés en un farolito y lo soltás.
 * El texto no se guarda en ningún lado: se va con el farolito.
 */
type L = { id: number; text: string; x: number; drift: number }
export function Lanterns() {
  const { add } = useStore()
  const calm = useCalmMotion()
  const [text, setText] = useState('')
  const [list, setList] = useState<L[]>([])
  const [count, setCount] = useState(0)
  const far = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: 6 + hash('fx' + i) * 88, d: 30 + hash('fd' + i) * 30, delay: -hash('fl' + i) * 40, s: 0.35 + hash('fs' + i) * 0.35 })), [])
  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ x: hash('sx' + i) * 100, y: hash('sy' + i) * 62, d: hash('sd' + i) * 4, s: hash('ss' + i) > 0.85 ? 3 : 2 })), [])
  const release = () => {
    const t = text.trim()
    if (!t) return
    setList((l) => [...l, { id: Date.now(), text: t, x: 35 + Math.random() * 30, drift: (Math.random() - 0.5) * 30 }])
    setText('')
    setCount((c) => c + 1)
    ambient.chime(523, 0.07)
    setTimeout(() => ambient.chime(784, 0.05), 380)
    add('lantern', { at: new Date().toISOString() })
  }
  return (
    <div className="game-wrap">
      <div className="lantern-sky">
        {stars.map((s, i) => <i key={i} className="ls-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${-s.d}s` }} />)}
        <div className="ls-moon" />
        {!calm && far.map((f, i) => (
          <span key={i} className="ls-far" style={{ left: `${f.x}%`, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s`, scale: f.s }}><i className="lantern-body small" /></span>
        ))}
        <div className="ls-hills" />
        <div className="ls-water" />
        <AnimatePresence>
          {list.map((l) => (
            <motion.div
              key={l.id}
              className="ls-mine"
              style={{ left: `${l.x}%` }}
              initial={{ y: 0, x: 0, scale: 1, opacity: 0 }}
              animate={{ y: -460, x: [0, l.drift, -l.drift / 2, l.drift], scale: 0.32, opacity: [0, 1, 1, 0.9, 0] }}
              transition={{ duration: calm ? 14 : 24, ease: [0.3, 0, 0.6, 1], x: { duration: calm ? 14 : 24, ease: 'easeInOut' } }}
              onAnimationComplete={() => setList((x) => x.filter((y) => y.id !== l.id))}
            >
              <i className="lantern-body">
                <motion.span className="lantern-text" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 3, duration: 4 }}>{l.text}</motion.span>
              </i>
              <i className="lantern-glow" />
            </motion.div>
          ))}
        </AnimatePresence>
        {count > 0 && list.length === 0 && <p className="ls-after">Ya está. Se fue. Respirá hondo.</p>}
      </div>
      <form className="row gap-s wrap" onSubmit={(e) => { e.preventDefault(); release() }}>
        <input className="input grow" maxLength={90} placeholder="Algo que te pesa y querés soltar…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" disabled={!text.trim()}>Soltar el farolito</button>
      </form>
      <p className="small muted">Lo que escribas no se guarda en ningún lado. Solo se va volando.</p>
    </div>
  )
}
