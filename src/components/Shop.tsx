import { motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import { MAX_PLOTS, PLOT_PRICE, SPECIES, WEAR } from '../lib/content'
import { useGame, type Purchase } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useStore } from '../lib/store'
import { Art } from './Art'
import { celebrate, useToast } from './ui'

export function Shop({ show }: { show: 'jardin' | 'ropa' }) {
  const { add } = useStore()
  const { points, owned, seedStock, plotCount } = useGame()
  const toast = useToast()
  const calm = useCalmMotion()
  const buy = async (p: Purchase, label: string) => {
    if (points < p.price) return
    await add<Purchase>('purchase', p)
    toast({ text: <>Compraron <b>{label}</b></>, art: { lottie: '1f381' } })
    celebrate(calm, { particleCount: 30, spread: 45 })
  }
  const Card = ({ art, title, sub, price, onBuy, done, badge }: any) => {
    const poor = points < price
    return (
      <motion.div className={`shop-card ${done ? 'owned' : ''}`} whileHover={{ y: -3 }}>
        {badge && <span className="badge">{badge}</span>}
        <Art {...art} size={64} play="hover" />
        <b>{title}</b>
        <span className="small muted shop-sub">{sub}</span>
        <button className={`btn small ${done ? 'ghost' : 'primary'}`} disabled={done || poor} onClick={onBuy}>
          {done ? <><Check size={14} /> Es nuestro</> : poor ? <><Lock size={13} /> {price}</> : <>Comprar · {price}</>}
        </button>
      </motion.div>
    )
  }
  if (show === 'jardin')
    return (
      <div className="stack-l">
        <p className="muted">Las semillas se ganan regando, respondiendo, guardando recuerdos y cuidándose. Son de los dos.</p>
        <div className="shop-grid">
          {SPECIES.filter((s) => s.price > 0).map((s) => (
            <Card key={s.id} art={s} title={s.name} price={s.price}
              sub={`${s.note} Florece con ${s.days} días de cuidado.${s.harvest ? ` Cosecha: +${s.harvest}.` : ''}`}
              badge={seedStock[s.id] ? `x${seedStock[s.id]} guardadas` : undefined}
              onBuy={() => buy({ what: 'seed', ref: s.id, price: s.price }, `semillas de ${s.name.toLowerCase()}`)} />
          ))}
          {plotCount < MAX_PLOTS && (
            <Card art={{ img: 'potted_plant' }} title="Una maceta más" price={PLOT_PRICE} sub={`Agranda el jardín. Tienen ${plotCount} de ${MAX_PLOTS}.`}
              onBuy={() => buy({ what: 'plot', ref: 'plot', price: PLOT_PRICE }, 'una maceta nueva')} />
          )}
        </div>
      </div>
    )
  const groups = [
    { id: 'cabeza', label: 'Para la cabecita' },
    { id: 'cara', label: 'Para la carita' },
    { id: 'cuello', label: 'Para el cuello' },
    { id: 'juguete', label: 'Para jugar y dormir' },
    { id: 'ropero', label: 'Para el ropero (colección)' },
  ]
  return (
    <div className="stack-l">
      {groups.map((g) => (
        <section key={g.id}>
          <h3 className="section-t">{g.label}</h3>
          <div className="shop-grid">
            {WEAR.filter((w) => w.slot === g.id).map((w) => (
              <Card key={w.id} art={{ img: w.img }} title={w.name} price={w.price} sub="" done={owned.has(w.id)}
                onBuy={() => buy({ what: 'wear', ref: w.id, price: w.price }, w.name.toLowerCase())} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function Achievements() {
  const { unlocked } = useGame()
  const ids = new Set(unlocked.map((a) => a.id))
  return (
    <div className="ach-grid">
      {ACH.map((a) => (
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
import { ACHIEVEMENTS as ACH } from '../lib/game'
