import { motion, useAnimate } from 'motion/react'
import { Check, Plus, RotateCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Art } from '../components/Art'
import { celebrate, Empty, Modal, PageHead, Segmented, useToast } from '../components/ui'
import type { Item } from '../lib/backend'
import type { Who } from '../lib/config'
import { DATE_IDEAS, VOUCHER_IDEAS } from '../lib/content'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'
import { ConfirmDelete } from './Memories'

type Tab = 'deseos' | 'ruleta' | 'raspaditas' | 'quiz'
export default function Together() {
  const [tab, setTab] = useState<Tab>('deseos')
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f3b2' }} title="Juntos" sub="Cosas para hacer de a dos, aunque haya kilómetros en el medio." />
      <Segmented value={tab} onChange={setTab} options={[{ id: 'deseos', label: 'Lista de sueños' }, { id: 'ruleta', label: 'Ruleta de citas' }, { id: 'raspaditas', label: 'Raspaditas' }, { id: 'quiz', label: '¿Cuánto me conocés?' }]} />
      {tab === 'deseos' && <Bucket />}
      {tab === 'ruleta' && <Roulette />}
      {tab === 'raspaditas' && <Vouchers />}
      {tab === 'quiz' && <Quiz />}
    </div>
  )
}

type Bucket = { text: string; done?: boolean; doneAt?: string }
function Bucket() {
  const { add, update, remove, me } = useStore()
  const { name } = usePeople()
  const calm = useCalmMotion()
  const list = useItems<Bucket>('bucket')
  const [text, setText] = useState('')
  const pending = list.filter((b) => !b.data.done)
  const done = list.filter((b) => b.data.done)
  const toggle = (b: Item<Bucket>) => {
    if (!b.data.done) celebrate(calm)
    update<Bucket>(b.id, { ...b.data, done: !b.data.done, doneAt: b.data.done ? undefined : new Date().toISOString() })
  }
  return (
    <div className="stack-l">
      <form className="row gap-s" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { add<Bucket>('bucket', { text: text.trim() }); setText('') } }}>
        <input className="input grow" placeholder="Algo que queremos hacer juntos algún día…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" disabled={!text.trim()}><Plus size={16} /></button>
      </form>
      {!list.length && <Empty art={{ lottie: '1f308' }}>Viajes, comidas, cosas chiquitas o enormes. Sin fechas ni apuro.</Empty>}
      <div className="bucket">
        {pending.map((b) => (
          <motion.div layout key={b.id} className="bucket-item">
            <button className="check" onClick={() => toggle(b)} aria-label="Cumplido" />
            <span className="grow">{b.data.text}</span>
            <span className="small muted">{name(b.author)}</span>
            {b.author === me && <ConfirmDelete onYes={() => remove(b.id)} />}
          </motion.div>
        ))}
      </div>
      {done.length > 0 && (
        <section>
          <h3 className="section-t">Cumplidos</h3>
          <div className="bucket">
            {done.map((b) => (
              <motion.div layout key={b.id} className="bucket-item done">
                <button className="check on" onClick={() => toggle(b)} aria-label="Desmarcar"><Check size={14} /></button>
                <span className="grow">{b.data.text}</span>
                <Art lottie="2728" size={22} play="still" />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const WHEEL_COLORS = ['#f6d6d3', '#dbe8d6', '#f5e7c4', '#e2d9f1', '#d3e6ec', '#f3dce8', '#e6ead2', '#f7e1cf']
function Roulette() {
  const { add } = useStore()
  const toast = useToast()
  const calm = useCalmMotion()
  const custom = useItems<{ t: string; d: string }>('dateidea')
  const pool = useMemo(() => [...DATE_IDEAS, ...custom.map((c) => c.data)], [custom])
  const [seed, setSeed] = useState(0)
  const slice = useMemo(() => {
    const arr = [...pool]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(((Math.sin(seed * 999 + i) + 1) / 2) * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, 8)
  }, [pool, seed])
  const [scope, animate] = useAnimate()
  const rot = useRef(0)
  const [result, setResult] = useState<(typeof slice)[number] | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [newIdea, setNewIdea] = useState('')
  const seg = 360 / slice.length
  const spin = async () => {
    setResult(null)
    setSpinning(true)
    const pick = Math.floor(Math.random() * slice.length)
    const target = rot.current + 360 * (calm ? 1 : 5) + (360 - (pick * seg + seg / 2) - (rot.current % 360))
    rot.current = target
    await animate(scope.current, { rotate: target }, { duration: calm ? 0.6 : 4.2, ease: [0.12, 0.8, 0.2, 1] })
    setSpinning(false)
    setResult(slice[pick])
    celebrate(calm, { particleCount: 40 })
  }
  const grad = `conic-gradient(${slice.map((_, i) => `${WHEEL_COLORS[i % 8]} ${i * seg}deg ${(i + 1) * seg}deg`).join(',')})`
  return (
    <div className="roulette">
      <div className="wheel-wrap">
        <span className="wheel-pin" />
        <div ref={scope} className="wheel" style={{ background: grad }}>
          {slice.map((s, i) => (
            <span key={i} className="wheel-label" style={{ transform: `rotate(${i * seg + seg / 2}deg) translateY(-34%)` }}>{s.t}</span>
          ))}
        </div>
        <button className="wheel-center" onClick={spin} disabled={spinning} aria-label="Girar"><Art lottie="1f496" size={44} play={spinning ? 'loop' : 'still'} /></button>
      </div>
      <div className="stack-m">
        {result ? (
          <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <p className="eyebrow">Nuestra próxima cita</p>
            <h2 className="display">{result.t}</h2>
            <p>{result.d}</p>
            <div className="row gap-s mt-m wrap">
              <button className="btn primary" onClick={() => { add<Bucket>('bucket', { text: `Cita: ${result.t}` }); toast({ text: 'Agregada a la lista de sueños', art: { lottie: '1f308' } }) }}>Guardarla</button>
              <button className="btn ghost" onClick={spin}><RotateCw size={15} /> Otra vez</button>
            </div>
          </motion.div>
        ) : (
          <div className="card"><p className="muted">Tocá el corazón para girar. Todas las ideas sirven a distancia.</p></div>
        )}
        <button className="btn ghost small" onClick={() => setSeed((s) => s + 1)}>Mezclar otras ideas</button>
        <form className="row gap-s" onSubmit={(e) => { e.preventDefault(); if (newIdea.trim()) { add('dateidea', { t: newIdea.trim(), d: 'Una idea nuestra.' }); setNewIdea('') } }}>
          <input className="input grow" placeholder="Sumar una idea propia a la ruleta" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} />
          <button className="btn soft" disabled={!newIdea.trim()}><Plus size={16} /></button>
        </form>
      </div>
    </div>
  )
}

type Voucher = { to: Who; text: string; scratchedAt?: string; usedAt?: string }
function Vouchers() {
  const { add, me } = useStore()
  const { other, P, name } = usePeople()
  const toast = useToast()
  const list = useItems<Voucher>('voucher')
  const forMe = list.filter((v) => v.data.to === me).reverse()
  const mine = list.filter((v) => v.author === me).reverse()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  return (
    <div className="stack-l">
      <div className="row between wrap gap-m">
        <p className="muted">Vales sorpresa para raspar. Se canjean cuando se vean (o cuando se pueda).</p>
        <button className="btn primary" onClick={() => setOpen(true)}><Plus size={16} /> Regalar una</button>
      </div>
      {!forMe.length && <Empty art={{ img: 'ticket' }}>Todavía no hay raspaditas para vos.</Empty>}
      <div className="vouchers">
        {forMe.map((v) => <ScratchCard key={v.id} v={v} from={name(v.author)} />)}
      </div>
      {mine.length > 0 && (
        <section>
          <h3 className="section-t">Las que regalé</h3>
          <div className="chips">{mine.map((v) => <span key={v.id} className="chip static">{v.data.text} · {v.data.usedAt ? 'canjeada' : v.data.scratchedAt ? 'raspada' : 'sin raspar'}</span>)}</div>
        </section>
      )}
      <Modal open={open} onClose={() => setOpen(false)} label="Nueva raspadita">
        <h2 className="display">Una raspadita para {P[other].name}</h2>
        <div className="chips mt-m">{VOUCHER_IDEAS.map((v) => <button key={v} className={`chip ${text === v ? 'on' : ''}`} onClick={() => setText(v)}>{v}</button>)}</div>
        <input className="input mt-m" placeholder="…o escribí la tuya" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary mt-m" disabled={!text.trim()} onClick={async () => {
          await add<Voucher>('voucher', { to: other, text: text.trim() })
          toast({ text: 'Raspadita enviada', art: { img: 'ticket' } })
          setText('')
          setOpen(false)
        }}>Regalar</button>
      </Modal>
    </div>
  )
}

function ScratchCard({ v, from }: { v: Item<Voucher>; from: string }) {
  const { update } = useStore()
  const calm = useCalmMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const revealed = !!v.data.scratchedAt
  useEffect(() => {
    const c = canvas.current
    if (!c || revealed) return
    const ctx = c.getContext('2d')!
    const r = c.getBoundingClientRect()
    c.width = r.width * 2
    c.height = r.height * 2
    const g = ctx.createLinearGradient(0, 0, c.width, c.height)
    g.addColorStop(0, '#e9d6c9'); g.addColorStop(0.5, '#f4e8df'); g.addColorStop(1, '#dcc6b8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.fillStyle = 'rgba(120,90,80,.55)'
    ctx.font = `600 ${28}px Nunito Variable, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Raspá con el dedo', c.width / 2, c.height / 2 + 10)
    let down = false
    const scratch = (e: PointerEvent) => {
      if (!down) return
      const b = c.getBoundingClientRect()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc((e.clientX - b.left) * 2, (e.clientY - b.top) * 2, 34, 0, Math.PI * 2)
      ctx.fill()
    }
    const up = () => {
      if (!down) return
      down = false
      const data = ctx.getImageData(0, 0, c.width, c.height).data
      let clear = 0
      for (let i = 3; i < data.length; i += 64) if (data[i] === 0) clear++
      if (clear / (data.length / 64) > 0.45) {
        celebrate(calm, { particleCount: 50 })
        update<Voucher>(v.id, { ...v.data, scratchedAt: new Date().toISOString() })
      }
    }
    const dn = (e: PointerEvent) => { down = true; c.setPointerCapture(e.pointerId); scratch(e) }
    c.addEventListener('pointerdown', dn)
    c.addEventListener('pointermove', scratch)
    c.addEventListener('pointerup', up)
    return () => { c.removeEventListener('pointerdown', dn); c.removeEventListener('pointermove', scratch); c.removeEventListener('pointerup', up) }
  }, [revealed, calm, update, v])
  return (
    <div className={`scratch ${v.data.usedAt ? 'used' : ''}`}>
      <div className="scratch-inner">
        <Art img="ticket" size={34} />
        <p className="strong">{v.data.text}</p>
        <span className="small muted">de {from}</span>
        {revealed && !v.data.usedAt && <button className="btn soft small" onClick={() => update<Voucher>(v.id, { ...v.data, usedAt: new Date().toISOString() })}>Ya lo canjeamos</button>}
        {v.data.usedAt && <span className="small muted">Canjeada</span>}
      </div>
      {!revealed && <canvas ref={canvas} className="scratch-cover" aria-label="Raspar" />}
      {!revealed && <button className="sr-only" onClick={() => update<Voucher>(v.id, { ...v.data, scratchedAt: new Date().toISOString() })}>Destapar sin raspar</button>}
    </div>
  )
}

type Quiz = { q: string; options: string[]; answer: number }
type QuizAns = { quiz: string; choice: number }
function Quiz() {
  const { add, me } = useStore()
  const { other, P, name } = usePeople()
  const toast = useToast()
  const calm = useCalmMotion()
  const quizzes = useItems<Quiz>('quiz')
  const answers = useItems<QuizAns>('quizans')
  const forMe = quizzes.filter((q) => q.author === other)
  const mine = quizzes.filter((q) => q.author === me)
  const ansOf = (id: string) => answers.find((a) => a.data.quiz === id)
  const right = forMe.filter((q) => ansOf(q.id)?.data.choice === q.data.answer).length
  const answered = forMe.filter((q) => ansOf(q.id)).length
  const [d, setD] = useState<Quiz>({ q: '', options: ['', '', ''], answer: 0 })
  const [creating, setCreating] = useState(false)
  return (
    <div className="stack-l">
      <div className="row between wrap gap-m">
        <p className="muted">Cada uno escribe preguntas sobre sí mismo. Equivocarse está buenísimo: así nos conocemos más.</p>
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> Pregunta sobre mí</button>
      </div>
      {answered > 0 && <div className="card row gap-m"><Art lottie="1f970" size={44} /><p>Acertaste {right} de {answered} sobre {P[other].name}. Las demás ahora ya las sabés.</p></div>}
      {!forMe.length && <Empty art={{ lottie: '1f914' }}>{P[other].name} todavía no escribió preguntas sobre sí.</Empty>}
      <div className="stack-m">
        {forMe.map((q) => {
          const a = ansOf(q.id)
          return (
            <div key={q.id} className="card">
              <p className="strong">{q.data.q}</p>
              <div className="chips mt-s">
                {q.data.options.map((o, i) => {
                  const st = a ? (i === q.data.answer ? 'right' : i === a.data.choice ? 'wrong' : '') : ''
                  return (
                    <button key={i} className={`chip quiz-opt ${st}`} disabled={!!a} onClick={() => {
                      add<QuizAns>('quizans', { quiz: q.id, choice: i })
                      if (i === q.data.answer) { celebrate(calm, { particleCount: 40 }); toast({ text: '¡Sí! Me conocés', art: { lottie: '1f970' } }) }
                      else toast({ text: `Era: ${q.data.options[q.data.answer]}. Ahora ya sabés`, art: { lottie: '1f60a' } })
                    }}>{o}</button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {mine.length > 0 && (
        <section>
          <h3 className="section-t">Las que escribí sobre mí</h3>
          <div className="chips">{mine.map((q) => { const a = ansOf(q.id); return <span key={q.id} className="chip static">{q.data.q} · {a ? (a.data.choice === q.data.answer ? `${name(other)} acertó` : 'respondida') : 'sin responder'}</span> })}</div>
        </section>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} label="Nueva pregunta">
        <h2 className="display">Una pregunta sobre vos</h2>
        <div className="stack-m mt-m">
          <input className="input" placeholder="¿Cuál es mi…?" value={d.q} onChange={(e) => setD({ ...d, q: e.target.value })} />
          {d.options.map((o, i) => (
            <div key={i} className="row gap-s">
              <button className={`check ${d.answer === i ? 'on' : ''}`} onClick={() => setD({ ...d, answer: i })} aria-label="Es la correcta">{d.answer === i && <Check size={14} />}</button>
              <input className="input grow" placeholder={`Opción ${i + 1}${d.answer === i ? ' (la correcta)' : ''}`} value={o} onChange={(e) => setD({ ...d, options: d.options.map((x, j) => (j === i ? e.target.value : x)) })} />
            </div>
          ))}
          {d.options.length < 4 && <button className="btn ghost small" onClick={() => setD({ ...d, options: [...d.options, ''] })}>+ otra opción</button>}
          <button className="btn primary" disabled={!d.q.trim() || d.options.some((o) => !o.trim())} onClick={async () => {
            await add<Quiz>('quiz', { ...d, q: d.q.trim() })
            setD({ q: '', options: ['', '', ''], answer: 0 })
            setCreating(false)
          }}>Guardar</button>
        </div>
      </Modal>
    </div>
  )
}
