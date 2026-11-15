import { animate, AnimatePresence, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'
import { Lamp, LampDesk, Paintbrush, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Art } from '../components/Art'
import { Achievements, ShopCard, useBuy } from '../components/Shop'
import { celebrate, Modal, PageHead, Seeds, Segmented, useToast } from '../components/ui'
import type { Item } from '../lib/backend'
import { BASIC_FOOD, DECO, DECO_SLOTS, decoById, PETS, petById, SPECIES, speciesById, TRAITS, type DecoSlot, type Gait, type Trait } from '../lib/content'
import { dayKey, dayPart, hash } from '../lib/dates'
import { useGame, type Care, type PetData } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'
import Placard from './Placard'
import '../styles/casita.css'

type Room = { slots: Partial<Record<DecoSlot, string | null>> }
const DEFAULT_ROOM: Room = { slots: { rincon: 'potted_plant', cama: 'basket' } }

export const traitOf = (p: Item<PetData>): Trait => TRAITS.find((t) => t.id === p.data.trait) ?? TRAITS[Math.floor(hash(p.id + 'trait') * TRAITS.length)]
const FOODS = SPECIES.filter((s) => s.type === 'huerta' || s.type === 'frutal')
export const favOf = (p: Item<PetData>) => FOODS[Math.floor(hash(p.id + 'food') * FOODS.length)]
const bond = (n: number) => (n < 10 ? 'Conociéndose' : n < 30 ? 'Amigos' : n < 80 ? 'Mejores amigos' : 'Familia para siempre')

type Tab = 'casita' | 'placard' | 'tienda' | 'logros'
export default function Casita() {
  const g = useGame()
  const [tab, setTab] = useState<Tab>('casita')
  const [adopting, setAdopting] = useState(false)
  return (
    <div className="stack-l">
      <PageHead art={{ img: 'house' }} title="La casita" sub="Acá viven los animalitos de los dos. Pasean, comen lo que cosechan en el jardín y duermen cuando se apaga la luz. Nunca se enferman ni se ponen tristes: los esperan tranquilos." right={<Seeds big />} />
      <Segmented<Tab> value={tab} onChange={setTab} options={[
        { id: 'casita', label: 'Casita' },
        { id: 'placard', label: 'Placard' },
        { id: 'tienda', label: 'Tienda' },
        { id: 'logros', label: 'Logros' },
      ]} />
      {tab === 'casita' && (g.pets.length ? <House onAdopt={() => setAdopting(true)} /> : <FirstAdopt onAdopt={() => setAdopting(true)} />)}
      {tab === 'placard' && <Placard />}
      {tab === 'tienda' && <DecoShop onAdopt={() => setAdopting(true)} />}
      {tab === 'logros' && <Achievements />}
      <Adopt open={adopting} onClose={() => setAdopting(false)} />
    </div>
  )
}

function FirstAdopt({ onAdopt }: { onAdopt: () => void }) {
  return (
    <div className="card center stack-m first-adopt">
      <div className="adopt-parade" aria-hidden>
        {['cat', 'dog', 'rabbit', 'hedgehog', 'penguin', 'chipmunk'].map((a, i) => (
          <motion.span key={a} animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4, delay: i * 0.25 }}><Art img={a} size={56} /></motion.span>
        ))}
      </div>
      <h2 className="display">La casita está lista</h2>
      <p className="muted">Falta alguien que la habite. Elijan juntos al primer animalito: el primero es gratis.</p>
      <button className="btn primary" onClick={onAdopt}><Plus size={16} /> Adoptar</button>
    </div>
  )
}

function Adopt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useStore()
  const g = useGame()
  const toast = useToast()
  const calm = useCalmMotion()
  const [pick, setPick] = useState(PETS[0].id)
  const [name, setName] = useState('')
  const [trait, setTrait] = useState<string | null>(null)
  const price = g.nextPetPrice
  const go = async () => {
    if (price === null || g.points < price) return
    if (price > 0) await add('purchase', { what: 'pet', ref: pick, price })
    await add<PetData>('pet', { species: pick, name: name.trim(), trait: trait ?? undefined })
    celebrate(calm, { particleCount: 90, spread: 90 })
    toast({ text: <>¡Bienvenido a casa, <b>{name.trim()}</b>!</>, art: { img: petById(pick).img } })
    setName('')
    setTrait(null)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} label="Adoptar" wide>
      <h2 className="display">{g.pets.length ? 'Un animalito más' : 'El primer animalito'}</h2>
      <p className="muted small">{price === null ? 'La casita ya está llena de amor (son cinco).' : price ? `Cuesta ${price} semillas.` : 'El primero es de regalo.'} Viene a vivir con los demás.</p>
      <div className="pet-pick mt-m">
        {PETS.map((p) => (
          <button key={p.id} className={`seed-opt ${pick === p.id ? 'on' : ''}`} onClick={() => setPick(p.id)}>
            <motion.span animate={pick === p.id ? { y: [0, -8, 0] } : { y: 0 }} transition={{ duration: 0.5, repeat: pick === p.id ? Infinity : 0, repeatDelay: 1 }}><Art img={p.img} size={58} /></motion.span>
            <b>{p.name}</b>
          </button>
        ))}
      </div>
      <p className="eyebrow mt-m">¿Cómo es? (si no eligen, se descubre solo)</p>
      <div className="chips">
        {TRAITS.map((t) => <button key={t.id} className={`chip ${trait === t.id ? 'on' : ''}`} onClick={() => setTrait(trait === t.id ? null : t.id)} title={t.desc}>{t.name}</button>)}
      </div>
      <div className="row gap-s mt-m wrap">
        <input className="input grow" placeholder="¿Cómo se va a llamar?" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" disabled={!name.trim() || price === null || g.points < price} onClick={go}>Adoptar{price ? ` · ${price}` : ''}</button>
      </div>
    </Modal>
  )
}

/* ───────────────────────── la casita ───────────────────────── */
type Cmd = { id: number; type: 'eat' | 'ball' | 'pet'; food?: string; x?: number; y?: number }
const BOWL = { x: 55, y: 90 }
const BED = { x: 76, y: 86 }
const SPEED: Record<Gait, number> = { walk: 9, hop: 10, waddle: 6.5, slow: 3.2 }

const LINES = {
  mimos: ['Me encantan tus mimos', 'Quedate un ratito más', '¡Hola! Te extrañaba', 'Mmm, ahí, ahí', 'Sos mi persona favorita', 'Qué lindo que viniste'],
  comer: ['¡Ñam!', 'Riquísimo, gracias', 'Mmm, ¿hay más?', 'Esto lo plantaron ustedes, ¿no?'],
  fav: ['¡Mi favorita!', '¡Lo que más me gusta en el mundo!', '¿Cómo sabías?'],
  jugar: ['¡Otra vez!', '¡La tengo!', 'Qué divertido', 'Gané yo, ¿no?'],
  despierta: ['¡Buen día!', '*bosteza*', 'Soñé con ustedes'],
  durmiendo: ['Zzz…', '*sonríe dormido*', 'Zzz… cinco minutitos más…'],
}
const pickLine = (k: keyof typeof LINES) => LINES[k][Math.floor(Math.random() * LINES[k].length)]

function useRoom() {
  const { add, update } = useStore()
  const item = useItems<Room>('room')[0]
  const room = item?.data ?? DEFAULT_ROOM
  const save = async (r: Room) => (item ? update(item.id, r) : add('room', r))
  return { room, save }
}

function House({ onAdopt }: { onAdopt: () => void }) {
  const g = useGame()
  const { add, me } = useStore()
  const { name } = usePeople()
  const toast = useToast()
  const { room, save } = useRoom()
  const part = dayPart()
  const [lightsOff, setLightsOff] = useState(part === 'night')
  const [decor, setDecor] = useState<DecoSlot | null>(null)
  const [deco, setDeco] = useState(false)
  const [cmds, setCmds] = useState<Record<string, Cmd>>({})
  const [bowl, setBowl] = useState<string | null>(null)
  const [ball, setBall] = useState<{ x: number; y: number; id: number } | null>(null)
  const turn = useRef(0)
  const today = dayKey()
  const cared = useMemo(() => new Set(g.cares.filter((c) => c.author === me && c.data.day === today).map((c) => `${c.data.action}:${c.data.pet ?? ''}`)), [g.cares, me, today])
  const care = (action: string, pet: string, food?: string) => {
    if (action !== 'comer' && cared.has(`${action}:${pet}`)) return
    add<Care>('care', { action, day: today, pet, food })
  }
  const serve = (food: string) => {
    const pets = g.pets
    const fav = pets.find((p) => favOf(p).id === food)
    const p = fav ?? pets[turn.current++ % pets.length]
    setBowl(food)
    setCmds((c) => ({ ...c, [p.id]: { id: Date.now(), type: 'eat', food } }))
  }
  const ate = (p: Item<PetData>, food: string) => {
    setBowl(null)
    care('comer', p.id, food)
    if (food !== BASIC_FOOD.id) toast({ text: <>{p.data.name} comió {speciesById(food).name.toLowerCase()} de la huerta</>, art: { lottie: speciesById(food).lottie, img: speciesById(food).img } })
  }
  const throwBall = (x: number, y: number) => {
    const id = Date.now()
    setBall({ x, y, id })
    const awake = g.pets.filter(() => !lightsOff)
    if (!awake.length) return
    const best = [...awake].sort((a, b) => traitOf(b).play - traitOf(a).play + (hash(String(id) + b.id) - hash(String(id) + a.id)))[0]
    setCmds((c) => ({ ...c, [best.id]: { id, type: 'ball', x, y } }))
  }
  const slots = room.slots
  const lamp = decoById(slots.techo)
  const pantry = Object.entries(g.pantry).filter(([, n]) => n > 0)
  return (
    <div className="stack-m">
      <div className={`room2 part-${part} ${lightsOff ? 'lights-off' : ''} ${deco ? 'decorating' : ''}`}>
        <div className="r-wall" />
        <div className="r-floor" onClick={(e) => {
          if (deco || lightsOff) return
          const r = e.currentTarget.parentElement!.getBoundingClientRect()
          throwBall(Math.min(92, Math.max(8, ((e.clientX - r.left) / r.width) * 100)), Math.min(94, Math.max(72, ((e.clientY - r.top) / r.height) * 100)))
        }} />
        <div className="r-rug" />
        <RoomWindow part={part} />
        <div className="r-shelf" />
        <Slot id="pared" item={slots.pared} onPick={setDecor} deco={deco} />
        <Slot id="estante" item={slots.estante} onPick={setDecor} deco={deco} />
        <Slot id="techo" item={slots.techo} onPick={setDecor} deco={deco} hanging glow={lightsOff || part === 'night'} />
        <Slot id="sillon" item={slots.sillon} onPick={setDecor} deco={deco} />
        <Slot id="rincon" item={slots.rincon} onPick={setDecor} deco={deco} />
        <Slot id="cama" item={slots.cama} onPick={setDecor} deco={deco} />
        <Slot id="juguete" item={slots.juguete} onPick={setDecor} deco={deco} />
        <div className="r-bowl" style={{ left: `${BOWL.x}%`, top: `${BOWL.y}%` }}>
          <AnimatePresence>{bowl && (
            <motion.span className="r-bowl-food" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }}>
              {bowl === BASIC_FOOD.id ? <Art img={BASIC_FOOD.img} size={26} /> : <Art lottie={speciesById(bowl).lottie} img={speciesById(bowl).img} size={26} play="still" />}
            </motion.span>
          )}</AnimatePresence>
        </div>
        <AnimatePresence>
          {ball && (
            <motion.span key={ball.id} className="r-ball" initial={{ left: '50%', top: '104%', scale: 0.8 }} animate={{ left: `${ball.x}%`, top: `${ball.y}%`, scale: 1, rotate: 540 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.7, 0.3, 1] }} onAnimationComplete={() => setTimeout(() => setBall((b) => (b?.id === ball.id ? null : b)), 4200)}>
              <Art img="softball" size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {g.pets.map((p, i) => (
          <Animal key={p.id} pet={p} idx={i} total={g.pets.length} sleepy={lightsOff} hasBed={!!slots.cama} cmd={cmds[p.id]}
            onAte={(food) => ate(p, food)} onPet={() => care('mimos', p.id)} onPlay={() => care('jugar', p.id)} />
        ))}
        {lightsOff && <div className="r-dark" style={{ '--lamp': lamp ? 1 : 0 } as CSSProperties} />}
        <div className="r-tools">
          <button className="icon-btn glass" onClick={() => { setLightsOff(!lightsOff); if (!lightsOff) g.pets.forEach((p) => care('dormir', p.id)) }} aria-label={lightsOff ? 'Prender la luz' : 'Apagar la luz'} title={lightsOff ? 'Prender la luz' : 'Apagar la luz'}>
            {lightsOff ? <Lamp size={18} /> : <LampDesk size={18} />}
          </button>
          <button className={`icon-btn glass ${deco ? 'on' : ''}`} onClick={() => setDeco(!deco)} aria-label="Decorar" title="Decorar"><Paintbrush size={17} /></button>
        </div>
        {!lightsOff && !deco && <p className="r-hint">Tocá el piso para tirar la pelotita · tocá a un animalito para mimarlo</p>}
        {deco && <p className="r-hint">Tocá un lugar marcado para cambiar lo que hay</p>}
      </div>

      <div className="pantry card">
        <p className="eyebrow">Para comer</p>
        <div className="pantry-row">
          <button className="food" onClick={() => serve(BASIC_FOOD.id)} disabled={lightsOff}>
            <Art img={BASIC_FOOD.img} size={34} /><span>{BASIC_FOOD.name}</span><i>siempre</i>
          </button>
          {pantry.map(([s, n]) => (
            <button key={s} className="food" onClick={() => serve(s)} disabled={lightsOff}>
              <Art lottie={speciesById(s).lottie} img={speciesById(s).img} size={34} play="hover" /><span>{speciesById(s).name}</span><i>x{n}</i>
            </button>
          ))}
          {!pantry.length && <p className="small muted pantry-tip">Lo que cosechen en el jardín aparece acá. Cada animalito tiene una comida favorita.</p>}
        </div>
      </div>

      <div className="pet-cards">
        {g.pets.map((p) => <PetCard key={p.id} pet={p} cares={g.cares.filter((c) => c.data.pet === p.id || (!c.data.pet && p.id === g.pets[0].id)).length} name={name} />)}
        {g.nextPetPrice !== null && (
          <button className="pet-card add" onClick={onAdopt}><Plus size={22} /><b>Adoptar otro</b><span className="small muted">{g.nextPetPrice} semillas</span></button>
        )}
      </div>
      <DecoPicker slot={decor} room={room} onSave={save} onClose={() => setDecor(null)} />
    </div>
  )
}

function Slot({ id, item, onPick, deco, hanging, glow }: { id: DecoSlot; item?: string | null; onPick: (s: DecoSlot) => void; deco: boolean; hanging?: boolean; glow?: boolean }) {
  const d = decoById(item)
  const size = { pared: 70, estante: 50, techo: 44, sillon: 132, rincon: 86, cama: d?.id === 'bed' ? 120 : 96, juguete: 40 }[id]
  if (!d && !deco) return null
  return (
    <button className={`r-slot s-${id} ${d ? 'has' : 'empty'} ${hanging ? 'hanging' : ''} ${glow ? 'glow' : ''}`} onClick={(e) => { if (deco) { e.stopPropagation(); onPick(id) } }} tabIndex={deco ? 0 : -1} aria-label={DECO_SLOTS.find((s) => s.id === id)!.name}>
      {hanging && d && <i className="r-cord" />}
      {d ? <Art img={d.img} size={size} /> : <span className="r-slot-plus"><Plus size={16} /></span>}
    </button>
  )
}

function RoomWindow({ part }: { part: string }) {
  return (
    <div className={`r-window w-${part}`} aria-hidden>
      <div className="r-glass">
        {part === 'night' ? (
          <>{Array.from({ length: 10 }, (_, i) => <i key={i} className="w-star" style={{ left: `${hash('ws' + i) * 100}%`, top: `${hash('wt' + i) * 70}%`, animationDelay: `${-hash('wd' + i) * 3}s` }} />)}<Art img="crescent_moon" size={30} className="w-orb" /></>
        ) : (
          <><Art img="sun" size={30} className="w-orb" /><Art img="cloud" size={44} className="w-cloud" /></>
        )}
        <div className="w-hill" />
      </div>
      <i className="r-curtain l" /><i className="r-curtain r" />
    </div>
  )
}

function Animal({ pet, idx, total, sleepy, hasBed, cmd, onAte, onPet, onPlay }: {
  pet: Item<PetData>; idx: number; total: number; sleepy: boolean; hasBed: boolean; cmd?: Cmd
  onAte: (food: string) => void; onPet: () => void; onPlay: () => void
}) {
  const sp = petById(pet.data.species)
  const trait = traitOf(pet)
  const fav = favOf(pet)
  const calm = useCalmMotion()
  const x = useMotionValue(14 + ((idx + 0.5) / Math.max(1, total)) * 66)
  const y = useMotionValue(78 + (idx % 2) * 9)
  const left = useTransform(x, (v) => `${v}%`)
  const top = useTransform(y, (v) => `${v}%`)
  const depth = useTransform(y, (v) => 0.82 + ((v - 70) / 24) * 0.3)
  const z = useTransform(y, (v) => Math.round(v * 10))
  const [mode, setMode] = useState<'idle' | 'walk' | 'sleep' | 'eat' | 'play' | 'happy'>('idle')
  const [face, setFace] = useState<1 | -1>(hash(pet.id) > 0.5 ? 1 : -1)
  const [bubble, setBubble] = useState<{ t: string; id: number } | null>(null)
  const [hearts, setHearts] = useState<number[]>([])
  const token = useRef(0)
  const anims = useRef<AnimationPlaybackControls[]>([])
  const modeRef = useRef(mode)
  modeRef.current = mode
  const sleepyRef = useRef(sleepy)
  sleepyRef.current = sleepy

  const say = (t: string) => setBubble({ t, id: Date.now() })
  const love = (n = 3) => setHearts((h) => [...h, ...Array.from({ length: n }, (_, i) => Date.now() + i)])
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const walkTo = async (tx: number, ty: number, fast = 1) => {
    const my = ++token.current
    anims.current.forEach((a) => a.stop())
    const dx = tx - x.get()
    const dist = Math.hypot(dx, (ty - y.get()) * 1.8)
    if (Math.abs(dx) > 0.8) setFace(dx > 0 ? 1 : -1)
    if (dist < 0.5) return my
    setMode('walk')
    const duration = Math.max(0.4, dist / (SPEED[sp.gait] * fast))
    const a = animate(x, tx, { duration, ease: 'easeInOut' })
    const b = animate(y, ty, { duration, ease: 'easeInOut' })
    anims.current = [a, b]
    await Promise.all([a, b])
    if (token.current === my) setMode('idle')
    return my
  }
  const nap = async (ms: number) => {
    const spot = hasBed ? { x: BED.x + (idx % 3 - 1) * 5, y: BED.y + (idx % 2) * 2 } : { x: 46 + (idx % 3) * 6, y: 82 }
    const my = await walkTo(spot.x, spot.y)
    if (token.current !== my) return
    setMode('sleep')
    if (ms) {
      await wait(ms)
      if (token.current === my && !sleepyRef.current) setMode('idle')
    }
  }

  // la rutina: pasear, sentarse, mirar por la ventana, jugar, alguna siesta
  useEffect(() => {
    let alive = true
    let t = 0
    const tick = async () => {
      if (!alive) return
      const busy = modeRef.current === 'eat' || modeRef.current === 'happy' || modeRef.current === 'play'
      if (!busy) {
        if (sleepyRef.current) {
          if (modeRef.current !== 'sleep') await nap(0)
        } else {
          if (modeRef.current === 'sleep') { setMode('idle'); if (Math.random() < 0.5) say(pickLine('despierta')) }
          const r = Math.random() * (trait.walk + trait.sleep * 0.35 + trait.cuddle + 1.2)
          if (r < trait.walk) await walkTo(8 + Math.random() * 84, 72 + Math.random() * 21)
          else if (r < trait.walk + trait.sleep * 0.35) await nap(14000 + Math.random() * 20000)
          else if (r < trait.walk + trait.sleep * 0.35 + trait.cuddle) await walkTo(38 + Math.random() * 24, 89 + Math.random() * 4)
          else await walkTo(40 + Math.random() * 20, 73)
        }
      }
      if (alive) t = window.setTimeout(tick, 2200 + Math.random() * 5200)
    }
    t = window.setTimeout(tick, 700 + idx * 1100)
    return () => { alive = false; clearTimeout(t); anims.current.forEach((a) => a.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBed])

  // que se duerman o se despierten apenas cambia la luz
  useEffect(() => {
    if (sleepy) nap(0)
    else if (modeRef.current === 'sleep') { token.current++; setMode('idle'); setTimeout(() => say(pickLine('despierta')), 400 + idx * 500) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepy])

  // pedidos de afuera: comer, perseguir la pelotita
  useEffect(() => {
    if (!cmd) return
    ;(async () => {
      if (cmd.type === 'eat' && cmd.food) {
        const my = await walkTo(BOWL.x + (x.get() < BOWL.x ? -6 : 6), BOWL.y - 1)
        if (token.current !== my) return
        setFace(x.get() < BOWL.x ? 1 : -1)
        setMode('eat')
        await wait(2600)
        if (token.current !== my) return
        onAte(cmd.food)
        setMode('happy')
        say(cmd.food === fav.id ? pickLine('fav') : pickLine('comer'))
        love(cmd.food === fav.id ? 5 : 2)
        await wait(1400)
        if (token.current === my) setMode('idle')
      } else if (cmd.type === 'ball' && cmd.x !== undefined && cmd.y !== undefined) {
        await wait(350)
        const my = await walkTo(cmd.x + (x.get() < cmd.x ? -4 : 4), cmd.y, 1.9)
        if (token.current !== my) return
        setMode('play')
        onPlay()
        say(pickLine('jugar'))
        await wait(1500)
        if (token.current === my) setMode('idle')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd?.id])

  const pet_ = () => {
    if (modeRef.current === 'sleep') { say(pickLine('durmiendo')); love(1); onPet(); return }
    token.current++
    anims.current.forEach((a) => a.stop())
    setMode('happy')
    say(pickLine('mimos'))
    love(4)
    onPet()
    const my = token.current
    setTimeout(() => token.current === my && setMode('idle'), 1300)
  }
  const flip = (sp.faces === 'left' ? -1 : 1) * face
  const size = Math.round(86 * sp.size)
  return (
    <motion.div className={`animal m-${mode} g-${sp.gait} ${calm ? 'calm' : ''}`} style={{ left, top, zIndex: z, scale: depth }}>
      <div className="a-shadow" />
      <button className="a-body" onClick={(e) => { e.stopPropagation(); pet_() }} aria-label={`Mimar a ${pet.data.name}`} style={{ width: size, height: size }}>
        <span className="a-flip" style={{ transform: `scaleX(${flip})` }}>
          <span className="a-gait"><Art img={sp.img} size={size} /></span>
        </span>
        {mode === 'sleep' && <span className="a-blanket" />}
      </button>
      {mode === 'sleep' && <span className="a-zzz" aria-hidden><i>z</i><i>z</i><i>z</i></span>}
      <AnimatePresence>
        {bubble && (
          <motion.span key={bubble.id} className="a-bubble" initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} onAnimationComplete={() => setTimeout(() => setBubble((b) => (b?.id === bubble.id ? null : b)), 2200)}>
            {bubble.t}
          </motion.span>
        )}
      </AnimatePresence>
      {hearts.map((h, i) => (
        <motion.i key={h} className="a-heart" initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], x: (hash(String(h)) - 0.5) * 70, y: -60 - hash(h + 'y') * 40, scale: 1 }} transition={{ duration: 1.4, delay: (i % 5) * 0.12, ease: 'easeOut' }}
          onAnimationComplete={() => setHearts((l) => l.filter((x) => x !== h))} />
      ))}
      <span className="a-name">{pet.data.name}</span>
    </motion.div>
  )
}

function PetCard({ pet, cares, name }: { pet: Item<PetData>; cares: number; name: (w: 'a' | 'b' | null) => string }) {
  const { update } = useStore()
  const sp = petById(pet.data.species)
  const trait = traitOf(pet)
  const fav = favOf(pet)
  const [edit, setEdit] = useState<string | null>(null)
  return (
    <div className="pet-card">
      <Art img={sp.img} size={64} />
      <div className="grow stack-xs">
        {edit === null ? (
          <b className="row gap-xs">{pet.data.name}<button className="icon-btn tiny" onClick={() => setEdit(pet.data.name)} aria-label="Cambiar nombre"><Pencil size={13} /></button></b>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (edit.trim()) update<PetData>(pet.id, { ...pet.data, name: edit.trim() }); setEdit(null) }}>
            <input className="input small" autoFocus maxLength={20} value={edit} onChange={(e) => setEdit(e.target.value)} onBlur={() => setEdit(null)} />
          </form>
        )}
        <span className="small muted">{sp.name} · {trait.name.toLowerCase()} · llegó el {new Date(pet.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}{pet.author ? ` (lo adoptó ${name(pet.author)})` : ''}</span>
        <span className="small">Comida favorita: <Art lottie={fav.lottie} img={fav.img} size={18} play="still" /> {fav.name.toLowerCase()}</span>
        <span className="bond small"><i style={{ width: `${Math.min(100, (cares / 80) * 100)}%` }} /> {bond(cares)}</span>
      </div>
    </div>
  )
}

function DecoPicker({ slot, room, onSave, onClose }: { slot: DecoSlot | null; room: Room; onSave: (r: Room) => Promise<unknown>; onClose: () => void }) {
  const g = useGame()
  const buy = useBuy()
  if (!slot) return <Modal open={false} onClose={onClose}>{null}</Modal>
  const list = DECO.filter((d) => d.slot === slot)
  const cur = room.slots[slot]
  const put = async (id: string | null) => { await onSave({ slots: { ...room.slots, [slot]: id } }); onClose() }
  return (
    <Modal open={!!slot} onClose={onClose} label="Decorar">
      <h2 className="display">{DECO_SLOTS.find((s) => s.id === slot)!.name}</h2>
      <div className="seed-pick mt-m">
        {list.map((d) => {
          const own = g.ownedDeco.has(d.id)
          return (
            <button key={d.id} className={`seed-opt ${cur === d.id ? 'on' : ''}`} disabled={!own && g.points < d.price}
              onClick={async () => { if (!own && !(await buy({ what: 'deco', ref: d.id, price: d.price }, d.name.toLowerCase(), { img: d.img }))) return; put(d.id) }}>
              <Art img={d.img} size={50} />
              <b>{d.name}</b>
              <span className="small muted">{cur === d.id ? 'Puesto' : own ? 'Poner' : `Comprar · ${d.price}`}</span>
            </button>
          )
        })}
      </div>
      {cur && <button className="btn ghost small mt-m" onClick={() => put(null)}>Dejar el lugar vacío</button>}
    </Modal>
  )
}

function DecoShop({ onAdopt }: { onAdopt: () => void }) {
  const g = useGame()
  const buy = useBuy()
  const { room, save } = useRoom()
  return (
    <div className="stack-l">
      <p className="muted">Todo se compra con las semillas de los dos. Lo que compren lo ponen desde el pincelito de la casita (o acá mismo).</p>
      {g.nextPetPrice !== null && g.pets.length > 0 && (
        <div className="card row between wrap gap-m">
          <span className="row gap-s"><Art img="paw_prints" size={40} /> <span><b>Un animalito más</b><br /><span className="small muted">Viven todos juntos. Pueden ser hasta cinco.</span></span></span>
          <button className="btn primary" onClick={onAdopt}>Adoptar · {g.nextPetPrice}</button>
        </div>
      )}
      {DECO_SLOTS.map((s) => (
        <section key={s.id}>
          <h3 className="section-t">{s.name}</h3>
          <div className="shop-grid">
            {DECO.filter((d) => d.slot === s.id).map((d) => {
              const own = g.ownedDeco.has(d.id)
              const placed = room.slots[s.id] === d.id
              return own ? (
                <ShopCard key={d.id} art={{ img: d.img }} title={d.name} price={0} done={placed} doneLabel="Puesto" actionLabel="Poner en la casita" onBuy={() => save({ slots: { ...room.slots, [s.id]: d.id } })} badge="Es nuestro" />
              ) : (
                <ShopCard key={d.id} art={{ img: d.img }} title={d.name} price={d.price}
                  onBuy={async () => { if (await buy({ what: 'deco', ref: d.id, price: d.price }, d.name.toLowerCase(), { img: d.img })) save({ slots: { ...room.slots, [s.id]: d.id } }) }} />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
