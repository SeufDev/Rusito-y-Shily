import { AnimatePresence, motion } from 'motion/react'
import { Droplets, Gift, ShoppingBasket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Art } from '../components/Art'
import { Achievements, Shop } from '../components/Shop'
import { celebrate, Modal, PageHead, Seeds, Segmented, useToast } from '../components/ui'
import type { Item } from '../lib/backend'
import { SPECIES, speciesById } from '../lib/content'
import { dayKey, hash } from '../lib/dates'
import { STAGES, useGame, type Plot, type Water } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { usePeople, useStore } from '../lib/store'

type Tab = 'jardin' | 'tienda' | 'logros'
export default function Garden() {
  const [tab, setTab] = useState<Tab>('jardin')
  const { unlocked } = useGame()
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f331' }} title="Nuestro jardín" sub="Crece con el agüita de los dos. Nada se marchita: si un día no pasan, la tierra los espera." right={<Seeds big />} />
      <Segmented<Tab> value={tab} onChange={setTab} options={[
        { id: 'jardin', label: 'Jardín' },
        { id: 'tienda', label: 'Tienda' },
        { id: 'logros', label: `Logros · ${unlocked.length}` },
      ]} />
      {tab === 'jardin' && <Beds />}
      {tab === 'tienda' && <Shop show="jardin" />}
      {tab === 'logros' && <Achievements />}
    </div>
  )
}

function Beds() {
  const g = useGame()
  const { add } = useStore()
  const { me } = usePeople()
  const toast = useToast()
  const [open, setOpen] = useState<number | null>(null)
  const [rain, setRain] = useState<Set<string>>(new Set())
  const bySlot = useMemo(() => new Map(g.activePlots.map((p) => [p.data.slot, p])), [g.activePlots])
  const today = dayKey()
  const thirsty = g.activePlots.filter((p) => !g.growths.get(p.id)!.today.has(me))

  const water = async (plots: Item<Plot>[]) => {
    setRain(new Set(plots.map((p) => p.id)))
    setTimeout(() => setRain(new Set()), 1600)
    for (const p of plots) await add<Water>('water', { plot: p.id, day: today })
    toast({ text: plots.length > 1 ? `Regaste ${plots.length} plantitas` : `Regaste ${speciesById(plots[0].data.species).name.toLowerCase()}`, art: { lottie: '1f4a7' } })
  }

  return (
    <div className="stack-m">
      <div className="row between wrap gap-m">
        <p className="muted small">
          Cada día que alguien riega, crece un pasito. Si riegan los dos el mismo día, crece el doble.
        </p>
        {thirsty.length > 1 && (
          <button className="btn soft" onClick={() => water(thirsty)}><Droplets size={16} /> Regar todo ({thirsty.length})</button>
        )}
      </div>
      <div className="garden">
        <Critters />
        <div className="beds">
          {Array.from({ length: g.plotCount }, (_, slot) => {
            const p = bySlot.get(slot)
            const gr = p ? g.growths.get(p.id)! : null
            return (
              <motion.button
                key={slot}
                className={`bed ${p ? 'planted' : 'empty'}`}
                onClick={() => setOpen(slot)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                aria-label={p ? `${gr!.sp.name}, ${STAGES[gr!.stage]}` : 'Maceta vacía'}
              >
                <div className="soil" />
                {p && gr ? (
                  <>
                    <PlantArt stage={gr.stage} species={p.data.species} />
                    <div className="drops">
                      {(['a', 'b'] as const).map((w) => (
                        <span key={w} className={`drop ${gr.today.has(w) ? 'on' : ''}`} title={gr.today.has(w) ? 'regó hoy' : ''} />
                      ))}
                    </div>
                    <div className="bed-bar"><motion.i initial={false} animate={{ width: `${gr.ratio * 100}%` }} /></div>
                  </>
                ) : (
                  <span className="bed-plus">+</span>
                )}
                <AnimatePresence>{p && rain.has(p.id) && <Rain />}</AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>
      <PlotModal slot={open} plot={open === null ? undefined : bySlot.get(open)} onClose={() => setOpen(null)} onWater={(p) => water([p])} />
      {(g.harvested.length > 0) && <Basket />}
    </div>
  )
}

export function PlantArt({ stage, species, size }: { stage: number; species: string; size?: number }) {
  const sp = speciesById(species)
  if (stage === 0) return <Art img="seedling" size={size ?? 34} className="plant seed" />
  if (stage === 1) return <Art lottie="1f331" size={size ?? 52} className="plant" />
  if (stage === 2) return <Art lottie="1f33f" size={size ?? 62} className="plant" />
  return <Art lottie={sp.lottie} img={sp.img} size={size ?? 76} className="plant bloom" />
}

function Rain() {
  return (
    <motion.div className="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {Array.from({ length: 7 }, (_, i) => (
        <motion.i key={i} style={{ left: `${12 + i * 12}%` }} initial={{ y: -20, opacity: 0 }} animate={{ y: 70, opacity: [0, 1, 0] }} transition={{ duration: 0.9, delay: i * 0.08, repeat: 1 }} />
      ))}
    </motion.div>
  )
}

/** Mariposas, abejitas y vaquitas de San Antonio que pasean por el jardín. */
function Critters() {
  const calm = useCalmMotion()
  const { activePlots } = useGame()
  if (calm || activePlots.length === 0) return null
  const list = ['1f98b', '1f41d', '1f41e'].slice(0, Math.min(3, Math.ceil(activePlots.length / 2)))
  return (
    <div className="critters" aria-hidden>
      {list.map((c, i) => (
        <motion.div
          key={c}
          className="critter"
          style={{ top: `${15 + hash(c) * 55}%` }}
          initial={{ x: '-10vw' }}
          animate={{ x: ['-10%', '105%'], y: [0, -18, 8, -12, 0] }}
          transition={{ duration: 26 + i * 9, repeat: Infinity, delay: i * 7, ease: 'linear' }}
        >
          <Art lottie={c} size={34} />
        </motion.div>
      ))}
    </div>
  )
}

function PlotModal({ slot, plot, onClose, onWater }: { slot: number | null; plot?: Item<Plot>; onClose: () => void; onWater: (p: Item<Plot>) => void }) {
  const g = useGame()
  const { add, update } = useStore()
  const { me, other, P, name } = usePeople()
  const toast = useToast()
  const calm = useCalmMotion()
  const gr = plot ? g.growths.get(plot.id)! : null
  const plant = async (species: string) => {
    await add<Plot>('plot', { slot: slot!, species })
    toast({ text: `Plantaron ${speciesById(species).name.toLowerCase()}`, art: { lottie: '1f331' } })
  }
  const harvest = async () => {
    await update<Plot>(plot!.id, { ...plot!.data, harvestedAt: new Date().toISOString() })
    celebrate(calm)
    toast({ text: <>Cosecha: <b>+{gr!.sp.harvest} semillas</b></>, art: { lottie: gr!.sp.lottie } })
    onClose()
  }
  const gift = async () => {
    await update<Plot>(plot!.id, { ...plot!.data, giftedTo: other, giftedBy: me, giftedAt: new Date().toISOString() })
    celebrate(calm)
    toast({ text: <>Le regalaste {gr!.sp.name.toLowerCase()} a <b>{P[other].name}</b>. Va a aparecer en su florero.</>, art: { lottie: '1f490' } })
    onClose()
  }
  const available = SPECIES.filter((s) => s.price === 0 || (g.seedStock[s.id] ?? 0) > 0)
  return (
    <Modal open={slot !== null} onClose={onClose} label="Maceta">
      {plot && gr ? (
        <div className="plot-detail">
          <div className="plot-hero"><PlantArt stage={gr.stage} species={plot.data.species} size={120} /></div>
          <p className="eyebrow">{STAGES[gr.stage]}</p>
          <h2 className="display">{gr.sp.name}</h2>
          <p className="muted small">{gr.sp.note} Plantada por {name(plot.author)}.</p>
          <div className="progress"><motion.i initial={{ width: 0 }} animate={{ width: `${gr.ratio * 100}%` }} /></div>
          <p className="small muted">{gr.stage === 3 ? 'Floreció. Se queda acá para siempre, salvo que la regalen o la cosechen.' : `${Math.min(gr.growth, gr.sp.days)} de ${gr.sp.days} pasitos`}</p>
          <div className="who-watered">
            {(['a', 'b'] as const).map((w) => (
              <span key={w} className={`pill ${gr.today.has(w) ? 'on' : ''}`}>
                <Art lottie="1f4a7" size={18} play="still" /> {P[w].name} {gr.today.has(w) ? 'regó hoy' : 'todavía no'}
              </span>
            ))}
          </div>
          <div className="row gap-s wrap center-x mt-m">
            {!gr.today.has(me) && gr.stage < 3 && <button className="btn primary" onClick={() => onWater(plot)}><Droplets size={16} /> Regar</button>}
            {gr.today.has(me) && gr.stage < 3 && <span className="muted small">Ya la regaste hoy. Mañana más.</span>}
            {gr.stage === 3 && gr.sp.harvest && <button className="btn primary" onClick={harvest}><ShoppingBasket size={16} /> Cosechar (+{gr.sp.harvest})</button>}
            {gr.stage === 3 && !gr.sp.harvest && <button className="btn soft" onClick={gift}><Gift size={16} /> Regalársela a {P[other].name}</button>}
            {gr.stage === 3 && !gr.sp.harvest && <button className="btn ghost" onClick={() => { onWater(plot); }} disabled={gr.today.has(me)}>Mimarla igual</button>}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="display">¿Qué plantamos?</h2>
          <p className="muted small">El tulipán siempre está. Las demás semillas se compran en la tienda.</p>
          <div className="seed-pick mt-m">
            {available.map((s) => (
              <button key={s.id} className="seed-opt" onClick={() => { plant(s.id); onClose() }}>
                <Art lottie={s.lottie} img={s.img} size={52} play="hover" />
                <b>{s.name}</b>
                <span className="small muted">{s.days} días{s.price ? ` · x${g.seedStock[s.id]}` : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Basket() {
  const { harvested } = useGame()
  const counts = new Map<string, number>()
  harvested.forEach((h) => counts.set(h.data.species, (counts.get(h.data.species) ?? 0) + 1))
  return (
    <div className="card">
      <p className="eyebrow">La canasta de cosechas</p>
      <div className="vase">
        {[...counts].map(([s, n]) => (
          <div key={s} className="vase-item"><Art lottie={speciesById(s).lottie} img={speciesById(s).img} size={44} play="still" /><span className="small muted">x{n}</span></div>
        ))}
      </div>
    </div>
  )
}
