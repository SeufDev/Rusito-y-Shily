import { motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Art as ArtT } from '../lib/content'
import { ACHIEVEMENTS, useGame, type Purchase } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useStore } from '../lib/store'
import { Art } from './Art'
import { celebrate, useToast } from './ui'

/** Comprar con las semillas de los dos. */
export function useBuy() {
  const { add } = useStore()
  const { points } = useGame()
  const toast = useToast()
  const calm = useCalmMotion()
  return async (p: Purchase, label: ReactNode, art: ArtT = { lottie: '1f381' }) => {
    if (points < p.price) return false
    await add<Purchase>('purchase', p)
    toast({ text: <>Compraron <b>{label}</b></>, art })
    celebrate(calm, { particleCount: 30, spread: 45 })
    return true
  }
}

export function ShopCard({ art, title, sub, price, onBuy, done, badge, doneLabel = 'Es nuestro', actionLabel }: {
  art: ArtT; title: ReactNode; sub?: ReactNode; price: number; onBuy: () => void; done?: boolean; badge?: ReactNode; doneLabel?: string; actionLabel?: string
}) {
  const { points } = useGame()
  const poor = points < price
  return (
    <motion.div className={`shop-card ${done ? 'owned' : ''}`} whileHover={{ y: -3 }} layout>
      {badge && <span className="badge">{badge}</span>}
      <div className="shop-art"><Art {...art} size={64} play="hover" /></div>
      <b>{title}</b>
      {sub && <span className="small muted shop-sub">{sub}</span>}
      <button className={`btn small ${done ? 'ghost' : 'primary'}`} disabled={done || poor} onClick={onBuy}>
        {done ? <><Check size={14} /> {doneLabel}</> : actionLabel ? actionLabel : poor ? <><Lock size={13} /> {price}</> : <>{price === 0 ? 'Gratis' : <>Comprar · {price}</>}</>}
      </button>
    </motion.div>
  )
}

export function Achievements() {
  const { unlocked } = useGame()
  const ids = new Set(unlocked.map((a) => a.id))
  return (
    <div className="ach-grid">
      {ACHIEVEMENTS.map((a) => (
        <motion.div key={a.id} className={`ach ${ids.has(a.id) ? 'on' : ''}`} whileHover={{ y: -2 }}>
          <Art lottie={a.lottie} img={a.img} size={52} play={ids.has(a.id) ? 'hover' : 'still'} />
          <div>
            <b>{a.name}</b>
            <div className="small muted">{a.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
