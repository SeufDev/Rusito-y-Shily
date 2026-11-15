import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, Plus, Shuffle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Art } from '../components/Art'
import { Empty, Modal, PageHead, Segmented, useToast } from '../components/ui'
import type { Who } from '../lib/config'
import { useItems, usePeople, useStore } from '../lib/store'

const PATTERNS = {
  suave: { label: 'Suave · 4 · 2 · 6', steps: [['Inhalá', 4, 1], ['Sostené', 2, 1], ['Soltá despacio', 6, 0]] },
  cuadrada: { label: 'Cuadrada · 4 · 4 · 4 · 4', steps: [['Inhalá', 4, 1], ['Sostené', 4, 1], ['Exhalá', 4, 0], ['Descansá', 4, 0]] },
} as const
type P = keyof typeof PATTERNS

const KIND_WORDS = [
  'Está bien no estar bien hoy.',
  'No tenés que resolver nada ahora.',
  'Un pensamiento no es una orden.',
  'Ir despacio también es avanzar.',
  'Sos suficiente así, tal cual.',
  'Este momento va a pasar.',
  'Merecés la misma paciencia que le das a los demás.',
]

export default function Calm() {
  const [tab, setTab] = useState<'respirar' | 'anclar' | 'grises'>('respirar')
  const word = useMemo(() => KIND_WORDS[new Date().getDate() % KIND_WORDS.length], [])
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f60c' }} title="Rincón tranquilo" sub={word} />
      <Segmented value={tab} onChange={setTab} options={[{ id: 'respirar', label: 'Respirar' }, { id: 'anclar', label: 'Volver al cuerpo' }, { id: 'grises', label: 'Para días grises' }]} />
      {tab === 'respirar' && <Breathe />}
      {tab === 'anclar' && <Ground />}
      {tab === 'grises' && <Grey />}
    </div>
  )
}

function Breathe() {
  const [p, setP] = useState<P>('suave')
  const [on, setOn] = useState(false)
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(0)
  const steps = PATTERNS[p].steps
  useEffect(() => {
    if (!on) return
    setLeft(steps[i][1])
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    const n = setTimeout(() => setI((x) => (x + 1) % steps.length), steps[i][1] * 1000)
    return () => { clearInterval(t); clearTimeout(n) }
  }, [on, i, steps])
  const [label, secs, big] = steps[i]
  return (
    <div className="breathe">
      <div className="breathe-stage">
        <div className="breathe-ring" />
        <div className="breathe-orb" style={{ transform: `scale(${on ? (big ? 1 : 0.55) : 0.7})`, transitionDuration: `${on ? secs : 1}s` }} />
        <div className="breathe-text">
          <AnimatePresence mode="wait">
            <motion.span key={on ? label + i : 'idle'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="display">
              {on ? label : 'Cuando quieras'}
            </motion.span>
          </AnimatePresence>
          {on && <span className="muted">{left}</span>}
        </div>
      </div>
      <div className="row gap-s wrap center-x">
        <button className="btn primary" onClick={() => { setI(0); setOn(!on) }}>{on ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Empezar</>}</button>
        <Segmented value={p} onChange={(v) => { setP(v); setI(0) }} options={(Object.keys(PATTERNS) as P[]).map((k) => ({ id: k, label: PATTERNS[k].label }))} />
      </div>
      <p className="muted small center">No hay que hacerlo perfecto. Si te distraés, volvés y listo.</p>
    </div>
  )
}

const GROUND = [
  { n: 5, t: 'cosas que puedas ver', art: { lottie: '1f440' } },
  { n: 4, t: 'cosas que puedas tocar', art: { img: 'yarn' } },
  { n: 3, t: 'sonidos que puedas escuchar', art: { lottie: '1f3b6' } },
  { n: 2, t: 'olores que puedas sentir', art: { img: 'herb' } },
  { n: 1, t: 'cosa linda que te digas', art: { lottie: '1f90d' } },
]
function Ground() {
  const [s, setS] = useState(0)
  const done = s >= GROUND.length
  return (
    <div className="card center ground">
      <AnimatePresence mode="wait">
        <motion.div key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="stack-m center">
          {done ? (
            <>
              <Art lottie="1f60c" size={80} />
              <h2 className="display">Acá estás</h2>
              <p className="muted">Lo hiciste muy bien. Quedate un ratito más si querés.</p>
              <button className="btn ghost" onClick={() => setS(0)}>Otra vez</button>
            </>
          ) : (
            <>
              <Art {...GROUND[s].art} size={72} />
              <p className="display big-num">{GROUND[s].n}</p>
              <p className="strong">{GROUND[s].t}</p>
              <p className="muted small">Nombralas despacito, en voz alta o en tu cabeza. Sin apuro.</p>
              <button className="btn primary" onClick={() => setS(s + 1)}>Listo</button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="dots">{GROUND.map((_, i) => <i key={i} className={i < s ? 'on' : ''} />)}</div>
    </div>
  )
}

type Comfort = { to: Who; text: string }
function Grey() {
  const { add, me } = useStore()
  const { other, P, name } = usePeople()
  const toast = useToast()
  const list = useItems<Comfort>('comfort')
  const forMe = list.filter((c) => c.data.to === me)
  const fromMe = list.filter((c) => c.author === me).length
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * 1000))
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const cur = forMe.length ? forMe[idx % forMe.length] : null
  return (
    <div className="stack-l">
      {cur ? (
        <motion.div key={cur.id} className="card comfort" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Art lottie="1f90d" size={56} />
          <p className="comfort-text">{cur.data.text}</p>
          <p className="small muted">— {name(cur.author)}, para cuando lo necesites</p>
          {forMe.length > 1 && <button className="btn ghost small" onClick={() => setIdx((i) => i + 1)}><Shuffle size={14} /> Otro mensajito</button>}
        </motion.div>
      ) : (
        <Empty art={{ lottie: '1f90d' }}>Acá van a aparecer los mensajes que {P[other].name} te deje para los días difíciles.</Empty>
      )}
      <div className="card row between wrap gap-m">
        <p className="muted">Dejale a {P[other].name} algo para leer cuando no esté bien. {fromMe ? `Ya le dejaste ${fromMe}.` : ''}</p>
        <button className="btn primary" onClick={() => setWriting(true)}><Plus size={16} /> Escribir</button>
      </div>
      <Modal open={writing} onClose={() => setWriting(false)} label="Mensaje para días grises">
        <h2 className="display">Para cuando {P[other].name} esté mal</h2>
        <textarea className="input mt-m" rows={5} placeholder="Algo que te gustaría que lea en ese momento…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary mt-m" disabled={!text.trim()} onClick={async () => {
          await add<Comfort>('comfort', { to: other, text: text.trim() })
          toast({ text: 'Guardado para cuando lo necesite', art: { lottie: '1f90d' } })
          setText('')
          setWriting(false)
        }}>Guardar</button>
      </Modal>
    </div>
  )
}
