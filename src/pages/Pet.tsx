import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Art } from '../components/Art'
import { Shop } from '../components/Shop'
import { celebrate, Empty, Modal, PageHead, Seeds, Segmented, useToast } from '../components/ui'
import { PETS, petById, WEAR, wearById } from '../lib/content'
import { dayKey } from '../lib/dates'
import { useGame, type Care } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { usePeople, useStore } from '../lib/store'

type PetData = { species: string; name: string; wear?: Partial<Record<'cabeza' | 'cara' | 'cuello', string>>; hatchedAt?: string }

const ACTIONS = [
  { id: 'comer', label: 'Darle de comer', art: { lottie: '1f36a' }, lines: ['¡Ñam! Gracias', 'Estaba riquísimo', 'Mmm, ¿hay más?'] },
  { id: 'mimos', label: 'Hacerle mimos', art: { lottie: '1f496' }, lines: ['Me encantan tus mimos', 'Ronroneo feliz', 'Quedate un ratito más'] },
  { id: 'jugar', label: 'Jugar', art: { img: 'yarn' }, lines: ['¡Otra vez!', 'Qué divertido', 'Gané yo, ¿no?'] },
  { id: 'banio', label: 'Bañito', art: { img: 'bubbles' }, lines: ['Quedé brillante', 'Burbujitas', 'Huelo a flores'] },
  { id: 'dormir', label: 'Hacerlo dormir', art: { lottie: '1f634' }, lines: ['Zzz…', 'Que sueñes lindo vos también', 'Buenas noches'] },
]

// Dónde va cada accesorio (en % del cuadro) según la forma del animalito.
const FIT: Record<string, { head: [number, number]; face: [number, number]; neck: [number, number] }> = {
  default: { head: [-14, 46], face: [30, 52], neck: [72, 46] },
  vaquita: { head: [-2, 40], face: [30, 52], neck: [74, 46] },
}

export default function Pet() {
  const { pet, hatched, careDays, cares } = useGame()
  const [tab, setTab] = useState<'casita' | 'ropero' | 'tienda'>('casita')
  const wasHatched = useRef(hatched)
  const [born, setBorn] = useState(false)
  useEffect(() => {
    if (hatched && !wasHatched.current) setBorn(true)
    wasHatched.current = hatched
  }, [hatched])
  if (!pet) return <Adopt />
  const d = pet.data as PetData
  const stage = careDays < 7 ? 'Bebé' : careDays < 30 ? 'Chiquito' : careDays < 100 ? 'Grande' : 'Sabio'
  return (
    <div className="stack-l">
      <PageHead
        art={{ lottie: hatched ? petById(d.species).lottie : '1f423' }}
        title={hatched ? d.name : 'Un huevito'}
        sub={hatched ? `${petById(d.species).name} · ${stage} · ${careDays} ${careDays === 1 ? 'día' : 'días'} de cuidados · ${cares.length} mimos en total` : `Pronto va a nacer ${d.name}.`}
        right={<Seeds big />}
      />
      {hatched ? (
        <>
          <Segmented value={tab} onChange={setTab} options={[{ id: 'casita', label: 'Casita' }, { id: 'ropero', label: 'Ropero' }, { id: 'tienda', label: 'Tienda' }]} />
          {tab === 'casita' && <Room />}
          {tab === 'ropero' && <Wardrobe />}
          {tab === 'tienda' && <Shop show="ropa" />}
        </>
      ) : (
        <Egg />
      )}
      <Modal open={born} onClose={() => setBorn(false)} label="Nació">
        <div className="center stack-m">
          <Art lottie="1f423" size={90} play="once" />
          <h2 className="display">¡Nació {d.name}!</h2>
          <PetFigure size={170} />
          <p className="muted">Bienvenido a casa. Ahora es de los dos.</p>
        </div>
      </Modal>
    </div>
  )
}

function Adopt() {
  const { add } = useStore()
  const [pick, setPick] = useState(PETS[0].id)
  const [name, setName] = useState('')
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f43e' }} title="Una mascota de los dos" sub="La crían juntos. Nunca se enferma ni se pone triste si no pasan: los espera tranquila." />
      <div className="card">
        <p className="eyebrow">¿A quién adoptamos?</p>
        <div className="pet-pick">
          {PETS.map((p) => (
            <button key={p.id} className={`seed-opt ${pick === p.id ? 'on' : ''}`} onClick={() => setPick(p.id)}>
              <Art lottie={p.lottie} size={60} play={pick === p.id ? 'loop' : 'still'} />
              <b>{p.name}</b>
            </button>
          ))}
        </div>
        <div className="row gap-s mt-m wrap">
          <input className="input grow" placeholder="¿Cómo se va a llamar?" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn primary" disabled={!name.trim()} onClick={() => add<PetData>('pet', { species: pick, name: name.trim(), wear: {} })}>Adoptar</button>
        </div>
        <p className="small muted mt-s">Primero llega como huevito. Con un poquito de calor de los dos, nace.</p>
      </div>
    </div>
  )
}

function Egg() {
  const { add } = useStore()
  const { cares } = useGame()
  const calm = useCalmMotion()
  const [wobble, setWobble] = useState(0)
  const left = 3 - cares.length
  return (
    <div className="card center egg-card">
      <motion.div key={wobble} animate={{ rotate: [0, -8, 8, -5, 5, 0] }} transition={{ duration: 0.8 }}>
        <Art img="egg" size={150} />
      </motion.div>
      <p className="display">{left === 1 ? '¡Ya casi!' : 'Necesita calorcito'}</p>
      <p className="muted small">Faltan {left} {left === 1 ? 'abracito' : 'abracitos'}. Pueden dárselos los dos.</p>
      <button
        className="btn primary mt-m"
        onClick={async () => {
          setWobble((w) => w + 1)
          await add<Care>('care', { action: 'abrigar', day: dayKey() })
          if (left === 1) celebrate(calm, { particleCount: 120, spread: 100 })
        }}
      >
        Darle calorcito
      </button>
    </div>
  )
}

export function PetFigure({ size = 220, bounce = 0 }: { size?: number; bounce?: number }) {
  const { pet } = useGame()
  const d = pet!.data as PetData
  const fit = FIT[d.species] ?? FIT.default
  const place = (slot: 'cabeza' | 'cara' | 'cuello', [top, w]: [number, number]) => {
    const it = d.wear?.[slot] && wearById(d.wear[slot]!)
    if (!it) return null
    return <img key={slot} src={`${import.meta.env.BASE_URL}fluent/${it.img}.png`} alt={it.name} className={`wear wear-${slot}`} style={{ top: `${top}%`, width: `${w}%` }} />
  }
  return (
    <motion.div key={bounce} className="pet-figure" style={{ width: size, height: size }} animate={bounce ? { y: [0, -24, 0, -8, 0], scale: [1, 1.04, 0.98, 1] } : {}} transition={{ duration: 0.8 }}>
      <Art lottie={petById(d.species).lottie} size="100%" />
      {place('cuello', fit.neck)}
      {place('cara', fit.face)}
      {place('cabeza', fit.head)}
    </motion.div>
  )
}

function Room() {
  const { add } = useStore()
  const { pet, owned, cares } = useGame()
  const { me, P, name } = usePeople()
  const toast = useToast()
  const [say, setSay] = useState<{ t: string; k: number; art: any } | null>(null)
  const [bounce, setBounce] = useState(0)
  const [sleep, setSleep] = useState(false)
  const d = pet!.data as PetData
  const today = dayKey()
  const todays = cares.filter((c) => c.data.day === today && c.data.action !== 'abrigar')
  const toys = WEAR.filter((w) => w.slot === 'juguete' && owned.has(w.id))
  const closet = WEAR.filter((w) => w.slot === 'ropero' && owned.has(w.id))
  const doIt = async (a: (typeof ACTIONS)[number]) => {
    const t = a.lines[Math.floor(Math.random() * a.lines.length)]
    setSay({ t, k: Date.now(), art: a.art })
    setBounce((b) => b + 1)
    setSleep(a.id === 'dormir')
    const first = !cares.some((c) => c.author === me && c.data.day === today && c.data.action === a.id)
    await add<Care>('care', { action: a.id, day: today })
    if (first) toast({ text: <>{d.name} está feliz · +2 semillas</>, art: a.art })
  }
  return (
    <div className="stack-m">
      <div className={`room ${sleep ? 'asleep' : ''}`}>
        <div className="room-wall" />
        <div className="room-floor" />
        {closet.length > 0 && (
          <div className="rail" title="El ropero">
            <span className="rail-bar" />
            {closet.slice(0, 8).map((c, i) => (
              <motion.img key={c.id} src={`${import.meta.env.BASE_URL}fluent/${c.img}.png`} alt={c.name} className="hanger" style={{ animationDelay: `${i * 0.4}s` }} whileHover={{ rotate: 6 }} />
            ))}
          </div>
        )}
        <div className="toys">
          {toys.map((t) => <Art key={t.id} img={t.img} size={54} />)}
        </div>
        <div className="pet-stage">
          <AnimatePresence>
            {say && (
              <motion.div key={say.k} className="bubble" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
                {say.t}
              </motion.div>
            )}
          </AnimatePresence>
          <PetFigure bounce={bounce} size={200} />
          {sleep && <motion.span className="zzz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>z z z</motion.span>}
        </div>
      </div>
      <div className="actions">
        {ACTIONS.map((a) => (
          <motion.button key={a.id} className="action" onClick={() => doIt(a)} whileTap={{ scale: 0.94 }} whileHover={{ y: -2 }}>
            <Art {...a.art} size={40} play="hover" />
            <span>{a.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="card">
        <p className="eyebrow">Hoy en la casita</p>
        {todays.length === 0 ? (
          <p className="muted small">Un día tranquilo. {d.name} está tomando sol y esperando a quien pase.</p>
        ) : (
          <div className="chips">
            {(['a', 'b'] as const).flatMap((w) => {
              const acts = [...new Set(todays.filter((c) => c.author === w).map((c) => c.data.action))]
              return acts.map((x) => <span key={w + x} className="chip static">{P[w].name}: {ACTIONS.find((a) => a.id === x)?.label.toLowerCase()}</span>)
            })}
          </div>
        )}
        <p className="small muted mt-s">{d.name} fue adoptado por {name(pet!.author)} el {new Date(pet!.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.</p>
      </div>
    </div>
  )
}

function Wardrobe() {
  const { update } = useStore()
  const { pet, owned } = useGame()
  const d = pet!.data as PetData
  const slots = [
    { id: 'cabeza', label: 'Cabeza' },
    { id: 'cara', label: 'Cara' },
    { id: 'cuello', label: 'Cuello' },
  ] as const
  const set = (slot: (typeof slots)[number]['id'], id?: string) => update<PetData>(pet!.id, { ...d, wear: { ...d.wear, [slot]: id } })
  const any = slots.some((s) => WEAR.some((w) => w.slot === s.id && owned.has(w.id)))
  return (
    <div className="wardrobe">
      <div className="card center"><PetFigure size={240} /></div>
      <div className="stack-m">
        {!any && <Empty art={{ img: 'shopping_bags' }}>Todavía no hay ropita. En la Tienda hay gorritos, anteojos y bufandas.</Empty>}
        {slots.map((s) => {
          const list = WEAR.filter((w) => w.slot === s.id && owned.has(w.id))
          if (!list.length) return null
          return (
            <div key={s.id}>
              <h3 className="section-t">{s.label}</h3>
              <div className="chips">
                <button className={`wear-opt ${!d.wear?.[s.id] ? 'on' : ''}`} onClick={() => set(s.id)}>Nada</button>
                {list.map((w) => (
                  <button key={w.id} className={`wear-opt ${d.wear?.[s.id] === w.id ? 'on' : ''}`} onClick={() => set(s.id, w.id)} title={w.name}>
                    <Art img={w.img} size={40} />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
