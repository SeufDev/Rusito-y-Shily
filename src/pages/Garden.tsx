import { AnimatePresence, motion } from 'motion/react'
import { CloudRain, Droplets, Gift, Pencil, ShoppingBasket, Sparkles as SparkIcon, Sprout } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { Art } from '../components/Art'
import { Achievements, ShopCard, useBuy } from '../components/Shop'
import { celebrate, flyToSeeds, Modal, PageHead, Seeds, Segmented, useToast } from '../components/ui'
import type { Item } from '../lib/backend'
import { MAX_PLOTS, PLOT_PRICE, SPECIES, speciesById, SUPPLIES, TYPE_LABEL, UPGRADES, type PlantType, type Species } from '../lib/content'
import { dayKey, dayPart, hash } from '../lib/dates'
import { ABONO_H, stageName, useGame, yieldValue, type Collect, type Growth, type Plot, type Use, type Water } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { usePeople, useStore } from '../lib/store'
import '../styles/garden.css'

type Tab = 'jardin' | 'tienda' | 'herbario' | 'logros'
export default function Garden() {
  const [tab, setTab] = useState<Tab>('jardin')
  const { unlocked } = useGame()
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f331' }} title="Nuestro jardín" sub="Crece de verdad, con el tiempo y el agüita de los dos. Nada se marchita: si la tierra se seca, la planta espera tranquila." right={<Seeds big />} />
      <Segmented<Tab> value={tab} onChange={setTab} options={[
        { id: 'jardin', label: 'Jardín' },
        { id: 'tienda', label: 'Tienda' },
        { id: 'herbario', label: 'Herbario' },
        { id: 'logros', label: `Logros · ${unlocked.length}` },
      ]} />
      {tab === 'jardin' && <Beds />}
      {tab === 'tienda' && <GardenShop />}
      {tab === 'herbario' && <Herbarium />}
      {tab === 'logros' && <Achievements />}
    </div>
  )
}

const hrs = (h: number) => (h >= 1.5 ? `${Math.round(h)} h` : h > 0.05 ? `${Math.max(1, Math.round(h * 60))} min` : 'un ratito')

function useGardenActions() {
  const g = useGame()
  const { add } = useStore()
  const toast = useToast()
  const calm = useCalmMotion()
  const water = async (plots: Item<Plot>[]) => {
    for (const p of plots) await add<Water>('water', { plot: p.id, day: dayKey() })
    toast({ text: plots.length > 1 ? `Regaste ${plots.length} plantitas. La tierra queda húmeda ${g.opts.moistH} h.` : `Regaste ${(plots[0].data.name || speciesById(plots[0].data.species).name).toLowerCase()}. Queda húmeda ${g.opts.moistH} h.`, art: { lottie: '1f4a7' } })
  }
  const collect = async (plots: Item<Plot>[], from?: DOMRect) => {
    let total = 0
    let fruits = 0
    for (const p of plots) {
      const gr = g.growths.get(p.id)
      if (!gr || gr.ready <= 0) continue
      await add<Collect>('collect', { plot: p.id, n: gr.ready, species: p.data.species })
      total += gr.ready * yieldValue(gr.sp)
      if (gr.sp.type === 'frutal') fruits += gr.ready
    }
    if (!total) return
    if (from) flyToSeeds(from, total, calm)
    toast({ text: <>+{total} semillas{fruits ? <>, y {fruits} {fruits === 1 ? 'fruta' : 'frutas'} para la despensa</> : null}</>, art: { lottie: '2728' } })
  }
  return { water, collect }
}

function Beds() {
  const g = useGame()
  const { add } = useStore()
  const { me } = usePeople()
  const toast = useToast()
  const calm = useCalmMotion()
  const { water, collect } = useGardenActions()
  const [open, setOpen] = useState<number | null>(null)
  const [rain, setRain] = useState(0)
  const bySlot = useMemo(() => new Map(g.activePlots.map((p) => [p.data.slot, p])), [g.activePlots])
  const growing = g.activePlots.filter((p) => g.growths.get(p.id)!.stage < 4)
  const thirsty = growing.filter((p) => !g.growths.get(p.id)!.today.has(me))
  const ready = g.activePlots.filter((p) => g.growths.get(p.id)!.ready > 0)
  const wet = growing.filter((p) => g.growths.get(p.id)!.wet).length
  const part = dayPart()
  const lastRain = g.k<Use>('use').filter((u) => u.data.what === 'lluvia').at(-1)
  const raining = rain > Date.now() - 2500 || (!!lastRain && Date.now() - Date.parse(lastRain.created_at) < 10 * 60_000)

  const waterAll = async (plots: Item<Plot>[]) => {
    setRain(Date.now())
    await water(plots)
  }
  const magicRain = async () => {
    setRain(Date.now())
    await add<Use>('use', { what: 'lluvia' })
    celebrate(calm, { particleCount: 40, colors: ['#bcd8f0', '#e3f0fb', '#ffffff'] })
    toast({ text: 'Lluvia mágica: todo el jardín quedó regado por los dos, por un día entero.', art: { img: 'umbrella_with_rain_drops' } })
  }

  return (
    <div className="stack-m">
      <div className="garden-bar">
        <p className="muted small grow">
          {growing.length === 0
            ? 'Toquen una maceta para plantar algo.'
            : wet === growing.length
              ? `Toda la tierra está húmeda. Las plantas están creciendo ahora mismo.`
              : wet
                ? `${wet} de ${growing.length} plantitas creciendo ahora. Las otras esperan un poquito de agua.`
                : 'La tierra se secó. Las plantas esperan tranquilas a que alguien pase.'}
        </p>
        <div className="row gap-s wrap">
          {ready.length > 0 && (
            <motion.button className="btn primary" onClick={(e) => collect(ready, e.currentTarget.getBoundingClientRect())} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <SparkIcon size={16} /> Juntar todo ({g.readyTotal})
            </motion.button>
          )}
          {thirsty.length > 1 && <button className="btn soft" onClick={() => waterAll(thirsty)}><Droplets size={16} /> Regar todo ({thirsty.length})</button>}
          {(g.supplies.lluvia ?? 0) > 0 && growing.length > 0 && <button className="btn soft" onClick={magicRain}><CloudRain size={16} /> Lluvia mágica (x{g.supplies.lluvia})</button>}
        </div>
      </div>

      <div className={`garden2 part-${part}`}>
        <GardenSky part={part} />
        {g.upgrades.has('farolitos') && <Lanterns night={part === 'night' || part === 'dusk'} />}
        <div className="garden-props">
          {g.upgrades.has('invernadero') && <Art img="house_with_garden" size={70} className="prop prop-l" />}
          {g.upgrades.has('colmena') && <Art img="honey_pot" size={46} className="prop prop-r" />}
          {g.upgrades.has('bebedero') && <Art img="fountain" size={54} className="prop prop-r2" />}
        </div>
        <Critters part={part} />
        <div className="beds2">
          {Array.from({ length: g.plotCount }, (_, slot) => {
            const p = bySlot.get(slot)
            const gr = p ? g.growths.get(p.id)! : null
            return (
              <Planter key={slot} plot={p} gr={gr} me={me} onOpen={() => setOpen(slot)} onCollect={(e) => { e.stopPropagation(); collect([p!], e.currentTarget.getBoundingClientRect()) }} />
            )
          })}
        </div>
        <AnimatePresence>{raining && <Rain key="rain" />}</AnimatePresence>
      </div>
      <PlotModal slot={open} plot={open === null ? undefined : bySlot.get(open)} onClose={() => setOpen(null)} onWater={(p) => { setRain(Date.now()); water([p]) }} />
    </div>
  )
}

function Planter({ plot, gr, me, onOpen, onCollect }: { plot?: Item<Plot>; gr: Growth | null; me: string; onOpen: () => void; onCollect: (e: MouseEvent<HTMLElement>) => void }) {
  const { P } = usePeople()
  const wet = gr ? Math.min(1, Math.max(gr.moist.a, gr.moist.b) / 12) : 0
  return (
    <motion.button
      className={`planter ${plot ? 'planted' : 'empty'} ${gr?.stage === 4 ? 'bloomed' : ''}`}
      onClick={onOpen}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      style={{ '--wet': wet } as CSSProperties}
      aria-label={plot && gr ? `${plot.data.name || gr.sp.name}, ${stageName(gr.stage, gr.sp)}` : 'Maceta vacía'}
    >
      <div className="plant-slot">
        {plot && gr ? <PlantArt stage={gr.stage} ratio={gr.ratio} species={plot.data.species} seed={plot.id} /> : <span className="bed-plus"><Sprout size={22} strokeWidth={1.5} /></span>}
      </div>
      <div className="planter-soil"><i className="glint" /></div>
      <div className="planter-box">
        {gr && gr.stage < 4 && <div className="planter-bar"><motion.i initial={false} animate={{ width: `${Math.max(4, gr.ratio * 100)}%` }} /></div>}
      </div>
      {gr && gr.stage < 4 && (
        <div className="drops2" aria-hidden>
          {(['a', 'b'] as const).map((w) => (
            <span key={w} className={`drop2 ${gr.moist[w] > 0 ? 'on' : ''} ${w === me ? 'me' : ''}`} style={{ '--c': P[w].color } as CSSProperties} title={gr.moist[w] > 0 ? `${P[w].name}: húmeda ${hrs(gr.moist[w])} más` : `${P[w].name}: seca`} />
          ))}
        </div>
      )}
      {plot?.data.name && <span className="plant-name">{plot.data.name}</span>}
      <AnimatePresence>
        {gr && gr.ready > 0 && (
          <motion.span
            role="button"
            tabIndex={0}
            className={`nectar ${gr.sp.type === 'frutal' ? 'fruit' : ''}`}
            onClick={onCollect}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            title="Juntar"
          >
            {gr.sp.type === 'frutal' ? <Art lottie={gr.sp.lottie} img={gr.sp.img} size={26} play="still" /> : <i className="honey" />}
            <b>{gr.ready}</b>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/** La planta según su etapa. Crece de a poquito dentro de cada etapa y se mece con el viento. */
export function PlantArt({ stage, ratio = 1, species, size = 92, seed = '' }: { stage: number; ratio?: number; species: string; size?: number; seed?: string }) {
  const sp = speciesById(species)
  const within = stage === 0 ? ratio / 0.1 : stage === 1 ? (ratio - 0.1) / 0.3 : stage === 2 ? (ratio - 0.4) / 0.35 : stage === 3 ? (ratio - 0.75) / 0.25 : 1
  const grow = 0.82 + 0.18 * Math.max(0, Math.min(1, within))
  const style = { '--sway-d': `${3.6 + hash(seed + 'd') * 2.6}s`, '--sway-delay': `${-hash(seed) * 6}s`, '--sway-a': sp.type === 'árbol' || sp.type === 'frutal' ? '1.4deg' : '3deg' } as CSSProperties
  const s = (k: number) => Math.round(size * k * grow)
  let body
  if (stage === 0) body = <Art img="seedling" size={s(0.42)} className="plant" />
  else if (stage === 1) body = <Art lottie="1f331" size={s(0.6)} className="plant" />
  else if (stage === 2) body = sp.type === 'frutal' || sp.type === 'árbol' ? <Art lottie="1f33f" size={s(0.78)} className="plant" /> : <Art lottie="1f33f" size={s(0.74)} className="plant" />
  else if (sp.type === 'huerta') body = <Bush sp={sp} size={size} grow={grow} ripe={stage === 4} />
  else if (sp.type === 'frutal') body = <Tree sp={sp} size={size} grow={grow} ripe={stage === 4} />
  else body = <Art lottie={sp.lottie} img={sp.img} size={s(stage === 3 ? 0.66 : sp.type === 'árbol' ? 1.05 : 0.9)} className={`plant ${stage === 3 ? 'bud' : 'bloom'}`} />
  return (
    <motion.span key={stage} className="sway" style={style} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 160 }}>
      {body}
    </motion.span>
  )
}

const FRUIT_SPOTS = [[-0.24, -0.38], [0.2, -0.5], [0.02, -0.2], [0.3, -0.24]]
function Bush({ sp, size, grow, ripe }: { sp: Species; size: number; grow: number; ripe: boolean }) {
  const s = Math.round(size * 0.8 * grow)
  return (
    <span className="bush" style={{ width: s, height: s }}>
      <Art lottie="1f33f" size={s} className="plant" />
      {FRUIT_SPOTS.slice(0, 3).map(([x, y], i) => (
        <span key={i} className={`fruit-on ${ripe ? 'ripe' : 'unripe'}`} style={{ left: `${50 + x * 100}%`, top: `${100 + y * 100}%`, animationDelay: `${-i * 0.9}s` }}>
          <Art lottie={sp.lottie} img={sp.img} size={Math.round(s * (ripe ? 0.32 : 0.22))} play="still" />
        </span>
      ))}
    </span>
  )
}
function Tree({ sp, size, grow, ripe }: { sp: Species; size: number; grow: number; ripe: boolean }) {
  const s = Math.round(size * 1.02 * grow)
  return (
    <span className="bush" style={{ width: s, height: s }}>
      <Art img="deciduous_tree" size={s} className="plant" />
      {ripe && FRUIT_SPOTS.map(([x, y], i) => (
        <span key={i} className="fruit-on ripe" style={{ left: `${50 + x * 90}%`, top: `${92 + y * 120}%`, animationDelay: `${-i * 0.7}s` }}>
          <Art lottie={sp.lottie} img={sp.img} size={Math.round(s * 0.24)} play="still" />
        </span>
      ))}
    </span>
  )
}

function GardenSky({ part }: { part: string }) {
  const night = part === 'night'
  return (
    <div className="garden-sky" aria-hidden>
      <Art img={night ? 'crescent_moon' : 'sun'} size={night ? 46 : 56} className="sky-orb" />
      {!night && <><Art img="cloud" size={70} className="sky-cloud c1" /><Art img="cloud" size={50} className="sky-cloud c2" /></>}
      {night && Array.from({ length: 18 }, (_, i) => <i key={i} className="g-star" style={{ left: `${hash('gs' + i) * 100}%`, top: `${hash('gt' + i) * 45}%`, animationDelay: `${-hash('gd' + i) * 4}s` }} />)}
      <div className="hill h1" />
      <div className="hill h2" />
      <div className="ground" />
    </div>
  )
}

function Lanterns({ night }: { night: boolean }) {
  return (
    <div className={`g-lanterns ${night ? 'lit' : ''}`} aria-hidden>
      <svg className="g-string" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 2 Q 50 22 100 2" /></svg>
      {[12, 31, 50, 69, 88].map((x, i) => (
        <span key={x} className="g-lantern" style={{ left: `${x}%`, top: `${6 + Math.sin((x / 100) * Math.PI) * 30}%`, animationDelay: `${-i * 0.8}s` }}>
          <Art img="red_paper_lantern" size={30} />
        </span>
      ))}
    </div>
  )
}

function Rain() {
  const drops = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ x: hash('rx' + i) * 100, d: 0.55 + hash('rd' + i) * 0.5, delay: -hash('rl' + i) * 1.2 })), [])
  return (
    <motion.div className="rain2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.2 } }} aria-hidden>
      {drops.map((r, i) => <i key={i} style={{ left: `${r.x}%`, animationDuration: `${r.d}s`, animationDelay: `${r.delay}s` }} />)}
    </motion.div>
  )
}

/** Mariposas de día, abejas si hay colmena, pajaritos si hay bebedero y luciérnagas de noche. */
function Critters({ part }: { part: string }) {
  const calm = useCalmMotion()
  const { activePlots, upgrades } = useGame()
  if (calm || activePlots.length === 0) return null
  const night = part === 'night'
  const list: { art: string; kind: string }[] = night
    ? []
    : [
        { art: '1f98b', kind: 'fly' },
        ...(activePlots.length > 3 ? [{ art: '1f41e', kind: 'fly' }] : []),
        ...(upgrades.has('colmena') ? [{ art: '1f41d', kind: 'fly' }, { art: '1f41d', kind: 'fly' }] : []),
        ...(upgrades.has('bebedero') ? [{ art: '1f426', kind: 'fly' }] : []),
      ]
  return (
    <div className="critters" aria-hidden>
      {list.map((c, i) => (
        <motion.div
          key={i}
          className="critter"
          style={{ top: `${18 + hash(c.art + i) * 50}%` }}
          initial={{ x: '-12%' }}
          animate={{ x: ['-12%', '108%'], y: [0, -22, 6, -14, 0] }}
          transition={{ duration: 24 + i * 7, repeat: Infinity, delay: i * 5, ease: 'linear', y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <Art lottie={c.art} size={c.art === '1f426' ? 30 : 32} />
        </motion.div>
      ))}
      {(night || part === 'dusk') && Array.from({ length: upgrades.has('farolitos') ? 16 : 9 }, (_, i) => (
        <i key={'f' + i} className="glowbug" style={{ left: `${hash('fx' + i) * 96}%`, top: `${30 + hash('fy' + i) * 60}%`, animationDelay: `${-hash('fd' + i) * 7}s`, animationDuration: `${6 + hash('fz' + i) * 5}s` }} />
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
  const { collect } = useGardenActions()
  const [naming, setNaming] = useState<string | null>(null)
  const gr = plot ? g.growths.get(plot.id)! : null
  const plant = async (species: string) => {
    await add<Plot>('plot', { slot: slot!, species })
    toast({ text: `Plantaron ${speciesById(species).name.toLowerCase()}. Ahora necesita agüita.`, art: { lottie: '1f331' } })
  }
  const harvest = async (e: MouseEvent<HTMLElement>) => {
    await update<Plot>(plot!.id, { ...plot!.data, harvestedAt: new Date().toISOString() })
    flyToSeeds(e.currentTarget.getBoundingClientRect(), gr!.sp.harvest ?? 10, calm)
    celebrate(calm)
    toast({ text: <>Cosecha: <b>+{gr!.sp.harvest} semillas</b> y 2 para la despensa de la casita</>, art: { lottie: gr!.sp.lottie, img: gr!.sp.img } })
    onClose()
  }
  const gift = async () => {
    await update<Plot>(plot!.id, { ...plot!.data, giftedTo: other, giftedBy: me, giftedAt: new Date().toISOString() })
    celebrate(calm)
    toast({ text: <>Le regalaste {gr!.sp.name.toLowerCase()} a <b>{P[other].name}</b>. Va a aparecer en su florero.</>, art: { lottie: '1f490' } })
    onClose()
  }
  const fertilize = async () => {
    await add<Use>('use', { what: 'abono', plot: plot!.id })
    toast({ text: `Abono: creció ${ABONO_H} horas de golpe`, art: { img: 'package' } })
  }
  const saveName = async () => {
    if (naming === null || !plot) return
    await update<Plot>(plot.id, { ...plot.data, name: naming.trim() || undefined })
    setNaming(null)
  }
  const types: PlantType[] = ['flor', 'huerta', 'frutal', 'árbol']
  const available = SPECIES.filter((s) => s.price === 0 || (g.seedStock[s.id] ?? 0) > 0)
  return (
    <Modal open={slot !== null} onClose={() => { setNaming(null); onClose() }} label="Maceta">
      {plot && gr ? (
        <div className="plot-detail">
          <div className="plot-hero2">
            <div className="hero-glow" />
            <PlantArt stage={gr.stage} ratio={gr.ratio} species={plot.data.species} size={150} seed={plot.id} />
            <div className="hero-soil" />
          </div>
          <p className="eyebrow">{stageName(gr.stage, gr.sp)}</p>
          {naming === null ? (
            <h2 className="display row gap-s center-x">
              {plot.data.name ? <>{plot.data.name} <span className="muted small">({gr.sp.name.toLowerCase()})</span></> : gr.sp.name}
              <button className="icon-btn" aria-label="Ponerle nombre" onClick={() => setNaming(plot.data.name ?? '')}><Pencil size={15} /></button>
            </h2>
          ) : (
            <form className="row gap-s mt-s" onSubmit={(e) => { e.preventDefault(); saveName() }}>
              <input className="input grow" autoFocus maxLength={24} placeholder={`Un nombre para ${gr.sp.name.toLowerCase()}…`} value={naming} onChange={(e) => setNaming(e.target.value)} />
              <button className="btn primary small">Listo</button>
            </form>
          )}
          <p className="muted small">{gr.sp.note} Plantada por {name(plot.author)}.</p>
          {gr.stage < 4 ? (
            <>
              <div className="progress"><motion.i initial={{ width: 0 }} animate={{ width: `${gr.ratio * 100}%` }} /></div>
              <p className="small muted">
                {gr.wet
                  ? <>Está creciendo {gr.both ? <b>al doble, porque regaron los dos</b> : 'ahora mismo'}. Le faltan unas {hrs(gr.left / (gr.both ? 2 : 1) / g.opts.speed)} de tierra húmeda.</>
                  : <>Está esperando agüita. Le faltan unas {hrs(gr.left / g.opts.speed)} de tierra húmeda para {gr.sp.type === 'huerta' ? 'estar lista' : 'florecer'}.</>}
              </p>
              <div className="who-watered">
                {(['a', 'b'] as const).map((w) => (
                  <span key={w} className={`pill ${gr.moist[w] > 0 ? 'on' : ''}`}>
                    <Art lottie="1f4a7" size={18} play="still" /> {P[w].name}: {gr.moist[w] > 0 ? `húmeda ${hrs(gr.moist[w])} más` : gr.today.has(w) ? 'regó hoy' : 'todavía no'}
                  </span>
                ))}
              </div>
            </>
          ) : gr.sp.type !== 'huerta' ? (
            <p className="small muted">
              Da {gr.sp.type === 'frutal' ? 'una fruta' : 'una gotita de néctar'} cada {String(g.opts.every).replace('.', ',')} h (vale {yieldValue(gr.sp)}) y guarda hasta {g.opts.cap}.
              {gr.ready > 0 ? ` Ahora tiene ${gr.ready} para juntar.` : ` La próxima en ${hrs(gr.nextIn)}.`} No hace falta venir a cada rato: espera.
            </p>
          ) : (
            <p className="small muted">Lista. Cuando quieran la cosechan y va a la despensa de la casita.</p>
          )}
          <div className="row gap-s wrap center-x mt-m">
            {gr.stage < 4 && !gr.today.has(me) && <button className="btn primary" onClick={() => onWater(plot)}><Droplets size={16} /> Regar</button>}
            {gr.stage < 4 && gr.today.has(me) && <span className="muted small">Ya la regaste hoy.</span>}
            {gr.stage < 4 && (g.supplies.abono ?? 0) > 0 && <button className="btn soft" onClick={fertilize}><Art img="package" size={18} /> Abono (x{g.supplies.abono})</button>}
            {gr.ready > 0 && <button className="btn primary" onClick={(e) => collect([plot], e.currentTarget.getBoundingClientRect())}><SparkIcon size={16} /> Juntar {gr.ready}</button>}
            {gr.stage === 4 && gr.sp.type === 'huerta' && <button className="btn primary" onClick={harvest}><ShoppingBasket size={16} /> Cosechar (+{gr.sp.harvest})</button>}
            {gr.stage === 4 && gr.sp.type === 'flor' && <button className="btn soft" onClick={gift}><Gift size={16} /> Regalársela a {P[other].name}</button>}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="display">¿Qué plantamos?</h2>
          <p className="muted small">El tulipán siempre está. Las demás semillas se compran en la tienda con lo que juntan entre los dos.</p>
          {types.map((t) => {
            const list = available.filter((s) => s.type === t)
            if (!list.length) return null
            return (
              <section key={t} className="mt-m">
                <p className="eyebrow">{TYPE_LABEL[t]}</p>
                <div className="seed-pick">
                  {list.map((s) => (
                    <button key={s.id} className="seed-opt" onClick={() => { plant(s.id); onClose() }}>
                      <Art lottie={s.lottie} img={s.img} size={52} play="hover" />
                      <b>{s.name}</b>
                      <span className="small muted">{s.days} días{s.price ? ` · x${g.seedStock[s.id]}` : ''}</span>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
          {available.length < 3 && <p className="small muted mt-m">Tip: con lo que vayan juntando, en la tienda hay más de 40 plantas distintas.</p>}
        </div>
      )}
    </Modal>
  )
}

function GardenShop() {
  const g = useGame()
  const buy = useBuy()
  const types: PlantType[] = ['flor', 'huerta', 'frutal', 'árbol']
  return (
    <div className="stack-l">
      <p className="muted">Las semillas se ganan regando, juntando néctar, cosechando, respondiendo, guardando recuerdos y cuidándose. Son de los dos.</p>
      <section>
        <h3 className="section-t">Mejoras para siempre</h3>
        <div className="shop-grid">
          {UPGRADES.map((u) => (
            <ShopCard key={u.id} art={u} title={u.name} sub={u.desc} price={u.price} done={g.upgrades.has(u.id)} doneLabel="Ya la tienen"
              onBuy={() => buy({ what: 'upgrade', ref: u.id, price: u.price }, u.name.toLowerCase(), u)} />
          ))}
          {g.plotCount < MAX_PLOTS && (
            <ShopCard art={{ img: 'potted_plant' }} title="Una maceta más" price={PLOT_PRICE} sub={`Agranda el jardín. Tienen ${g.plotCount} de ${MAX_PLOTS}.`}
              onBuy={() => buy({ what: 'plot', ref: 'plot', price: PLOT_PRICE }, 'una maceta nueva', { img: 'potted_plant' })} />
          )}
        </div>
      </section>
      <section>
        <h3 className="section-t">Para usar cuando quieran</h3>
        <div className="shop-grid">
          {SUPPLIES.map((u) => (
            <ShopCard key={u.id} art={u} title={u.name} sub={u.desc} price={u.price} badge={g.supplies[u.id] ? `x${g.supplies[u.id]} guardadas` : undefined}
              onBuy={() => buy({ what: 'supply', ref: u.id, price: u.price }, u.name.toLowerCase(), u)} />
          ))}
        </div>
      </section>
      {types.map((t) => (
        <section key={t}>
          <h3 className="section-t">{TYPE_LABEL[t]}</h3>
          <div className="shop-grid">
            {SPECIES.filter((s) => s.price > 0 && s.type === t).map((s) => (
              <ShopCard key={s.id} art={s} title={s.name} price={s.price}
                sub={`${s.note} ${s.days} días de tierra húmeda.${s.harvest ? ` Cosecha: +${s.harvest}.` : t === 'frutal' ? ' Frutas para siempre.' : ` Néctar: ${yieldValue(s)} por gotita.`}`}
                badge={g.seedStock[s.id] ? `x${g.seedStock[s.id]} guardadas` : g.bloomedSpecies.has(s.id) ? 'Ya floreció' : undefined}
                onBuy={() => buy({ what: 'seed', ref: s.id, price: s.price }, `semillas de ${s.name.toLowerCase()}`, s)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Lo que ya floreció alguna vez, con su fecha. Y la despensa y el florero de cosechas. */
function Herbarium() {
  const g = useGame()
  const { name } = usePeople()
  const list = [...g.bloomedSpecies].sort((a, b) => a[1].at - b[1].at)
  const pantry = Object.entries(g.pantry).filter(([, n]) => n > 0)
  return (
    <div className="stack-l">
      <div className="card herbarium">
        <p className="eyebrow">Nuestro herbario</p>
        <p className="muted small">Cada planta que florece por primera vez queda guardada acá, con su fecha. Como un álbum.</p>
        {list.length === 0 ? (
          <p className="muted mt-m">Todavía no floreció nada. La primera página está esperando.</p>
        ) : (
          <div className="herb-grid mt-m">
            {list.map(([id, { at, plot }], i) => {
              const sp = speciesById(id)
              return (
                <motion.div key={id} className="herb-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ rotate: `${(hash(id) - 0.5) * 4}deg` }}>
                  <Art lottie={sp.lottie} img={sp.img} size={58} play="hover" />
                  <b className="display">{sp.name}</b>
                  <span className="small muted">{new Date(at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="small muted">{plot.data.name ? `“${plot.data.name}”, ` : ''}plantada por {name(plot.author)}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <div className="card">
        <p className="eyebrow">La despensa de la casita</p>
        {pantry.length === 0 ? (
          <p className="muted small">Lo que cosechen de la huerta y las frutas de los frutales vienen acá, para darles de comer a los animalitos.</p>
        ) : (
          <div className="vase">
            {pantry.map(([s, n]) => (
              <div key={s} className="vase-item"><Art lottie={speciesById(s).lottie} img={speciesById(s).img} size={44} play="hover" /><span className="small muted">x{n}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
