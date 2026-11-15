import { AnimatePresence, motion } from 'motion/react'
import { Feather, KeyRound, Lock, Plus } from 'lucide-react'
import { useState } from 'react'
import { Art } from '../components/Art'
import { PLACES, type Note } from '../components/HiddenNotes'
import { celebrate, Empty, Modal, PageHead, Segmented, useToast } from '../components/ui'
import type { Item } from '../lib/backend'
import type { Who } from '../lib/config'
import { seal, unseal } from '../lib/crypto'
import { dayKey, fmtDay } from '../lib/dates'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'
import { useSections, type SectionId } from '../lib/sections'

type Letter = {
  to: Who
  title: string
  lock: 'none' | 'date' | 'word' | 'when'
  date?: string
  hint?: string
  when?: string
  body?: string
  sealed?: { cipher: string; salt: string; iv: string }
  openedAt?: string
}

export default function Letters() {
  const [tab, setTab] = useState<'recibidas' | 'enviadas' | 'notas'>('recibidas')
  const [write, setWrite] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  return (
    <div className="stack-l">
      <PageHead
        art={{ lottie: '1f48c' }}
        title="Cartas y secretos"
        sub="Cartas que se abren en una fecha, con una palabra secreta o “abrir cuando…”. Y notitas escondidas por toda la web."
        right={tab === 'notas'
          ? <button className="btn primary" onClick={() => setNoteOpen(true)}><Plus size={16} /> Esconder nota</button>
          : <button className="btn primary" onClick={() => setWrite(true)}><Feather size={16} /> Escribir</button>}
      />
      <Segmented value={tab} onChange={setTab} options={[{ id: 'recibidas', label: 'Para mí' }, { id: 'enviadas', label: 'Las que escribí' }, { id: 'notas', label: 'Notas escondidas' }]} />
      {tab !== 'notas' ? <LetterList mine={tab === 'enviadas'} /> : <Notes />}
      <WriteLetter open={write} onClose={() => setWrite(false)} />
      <HideNote open={noteOpen} onClose={() => setNoteOpen(false)} />
    </div>
  )
}

function lockState(l: Letter) {
  if (l.lock === 'date' && l.date && dayKey() < l.date) return { locked: true, label: `Se abre el ${fmtDay(l.date, { day: 'numeric', month: 'long', year: 'numeric' })}` }
  if (l.lock === 'word') return { locked: !l.openedAt, label: l.openedAt ? 'Abierta con la palabra secreta' : `Palabra secreta${l.hint ? ` · pista: ${l.hint}` : ''}` }
  if (l.lock === 'when') return { locked: false, label: `Abrir cuando ${l.when}` }
  return { locked: false, label: l.openedAt ? 'Abierta' : 'Sin abrir' }
}

function LetterList({ mine }: { mine: boolean }) {
  const { me } = useStore()
  const { name } = usePeople()
  const letters = useItems<Letter>('letter').filter((l) => (mine ? l.author === me : l.data.to === me)).reverse()
  const [open, setOpen] = useState<Item<Letter> | null>(null)
  if (!letters.length)
    return <Empty art={{ img: 'love_letter' }}>{mine ? 'Todavía no escribiste ninguna. Una carta para dentro de un mes es un regalo hermoso.' : 'Acá van a llegar las cartas. Cuando llegue una, brilla.'}</Empty>
  return (
    <div className="letters">
      {letters.map((l, i) => {
        const st = lockState(l.data)
        return (
          <motion.button
            key={l.id}
            className={`envelope ${st.locked ? 'locked' : ''} ${!l.data.openedAt && !mine ? 'new' : ''}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
            whileHover={{ y: -4, rotate: i % 2 ? 0.6 : -0.6 }}
            onClick={() => setOpen(l)}
          >
            <span className="env-flap" />
            <span className="env-seal">{st.locked ? <Lock size={14} /> : l.data.lock === 'word' ? <KeyRound size={14} /> : <Art lottie="1f496" size={22} play="still" />}</span>
            <span className="env-body">
              <b>{l.data.title || 'Sin título'}</b>
              <span className="small muted">{mine ? `para ${name(l.data.to)}` : `de ${name(l.author)}`} · {st.label}</span>
            </span>
          </motion.button>
        )
      })}
      <ReadLetter letter={open} onClose={() => setOpen(null)} mine={mine} />
    </div>
  )
}

function ReadLetter({ letter, onClose, mine }: { letter: Item<Letter> | null; onClose: () => void; mine: boolean }) {
  const { update } = useStore()
  const { name } = usePeople()
  const calm = useCalmMotion()
  const [word, setWord] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [miss, setMiss] = useState(false)
  const l = letter?.data
  const st = l ? lockState(l) : null
  const body = l?.lock === 'word' ? text : l?.body
  const close = () => { setText(null); setWord(''); setMiss(false); onClose() }
  const markOpen = () => { if (letter && !mine && !letter.data.openedAt) update(letter.id, { ...letter.data, openedAt: new Date().toISOString() }) }
  const tryWord = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = await unseal(l!.sealed!, word)
    if (t === null) return setMiss(true)
    setText(t)
    celebrate(calm)
    markOpen()
  }
  const canRead = l && !(st!.locked && l.lock === 'date') && (l.lock !== 'word' || text !== null)
  if (l && canRead && !mine && !letter!.data.openedAt && l.lock !== 'word') queueMicrotask(markOpen)
  return (
    <Modal open={!!letter} onClose={close} wide label="Carta">
      {l && (
        <div className="letter-view">
          {canRead ? (
            <motion.div className="paper" initial={{ y: 60, opacity: 0, rotateX: -20 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.1 }}>
              <p className="eyebrow">{l.lock === 'when' ? `Abrir cuando ${l.when}` : fmtDay(dayKey(new Date(letter!.created_at)), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <h2 className="display">{l.title}</h2>
              <div className="paper-body">{body}</div>
              <p className="sign">— {name(letter!.author)}</p>
            </motion.div>
          ) : l.lock === 'date' ? (
            <div className="center stack-m">
              <Art img="locked" size={80} />
              <h2 className="display">Todavía no</h2>
              <p className="muted">{st!.label}. Va a estar esperándote acá.</p>
            </div>
          ) : (
            <form className="center stack-m" onSubmit={tryWord}>
              <Art img="old_key" size={80} />
              <h2 className="display">Necesita la palabra secreta</h2>
              {l.hint && <p className="muted">Pista: {l.hint}</p>}
              {mine ? <p className="muted small">La escribiste vos. Está cifrada con la palabra que elegiste.</p> : null}
              <motion.input className="input" value={word} onChange={(e) => { setWord(e.target.value); setMiss(false) }} placeholder="La palabra…" animate={miss ? { x: [0, -5, 5, -3, 3, 0] } : {}} autoFocus />
              <button className="btn primary" disabled={!word.trim()}>Abrir</button>
              <AnimatePresence>{miss && <motion.p className="small muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Casi. Probá de nuevo, no hay apuro ni límite.</motion.p>}</AnimatePresence>
            </form>
          )}
        </div>
      )}
    </Modal>
  )
}

const WHENS = ['me extrañes', 'no puedas dormir', 'tengas un día difícil', 'necesites reírte', 'estés orgullosa/o de vos', 'llueva', 'cumplamos un mes', 'quieras saber cuánto te quiero']

function WriteLetter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useStore()
  const { other, P } = usePeople()
  const toast = useToast()
  const [d, setD] = useState<Letter>({ to: other, title: '', lock: 'none', body: '' })
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = d.title.trim() && d.body?.trim() && (d.lock !== 'date' || d.date) && (d.lock !== 'word' || word.trim()) && (d.lock !== 'when' || d.when)
  const send = async () => {
    setBusy(true)
    let data: Letter = { ...d, to: other }
    if (d.lock === 'word') {
      data = { ...data, sealed: await seal(d.body!, word), body: undefined }
    }
    await add<Letter>('letter', data)
    toast({ text: <>Carta enviada a <b>{P[other].name}</b></>, art: { lottie: '1f48c' } })
    setD({ to: other, title: '', lock: 'none', body: '' })
    setWord('')
    setBusy(false)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} wide label="Escribir carta">
      <h2 className="display">Una carta para {P[other].name}</h2>
      <div className="stack-m mt-m">
        <input className="input" placeholder="Título" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <textarea className="input paper-input" rows={9} placeholder="Escribí con calma…" value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
        <div>
          <p className="small muted">¿Cómo se abre?</p>
          <div className="chips">
            {([['none', 'Cuando quiera'], ['when', 'Abrir cuando…'], ['date', 'En una fecha'], ['word', 'Con palabra secreta']] as const).map(([id, label]) => (
              <button key={id} className={`chip ${d.lock === id ? 'on' : ''}`} onClick={() => setD({ ...d, lock: id })}>{label}</button>
            ))}
          </div>
        </div>
        {d.lock === 'when' && (
          <div className="chips">
            {WHENS.map((w) => <button key={w} className={`chip ${d.when === w ? 'on' : ''}`} onClick={() => setD({ ...d, when: w })}>…{w}</button>)}
          </div>
        )}
        {d.lock === 'date' && <input className="input" type="date" min={dayKey()} value={d.date ?? ''} onChange={(e) => setD({ ...d, date: e.target.value })} />}
        {d.lock === 'word' && (
          <div className="row gap-s wrap">
            <input className="input grow" placeholder="Palabra secreta (sin importar mayúsculas ni tildes)" value={word} onChange={(e) => setWord(e.target.value)} />
            <input className="input grow" placeholder="Pista (opcional)" value={d.hint ?? ''} onChange={(e) => setD({ ...d, hint: e.target.value })} />
          </div>
        )}
        <button className="btn primary" disabled={!ok || busy} onClick={send}>{busy ? 'Sellando…' : 'Sellar y enviar'}</button>
      </div>
    </Modal>
  )
}

function Notes() {
  const { me } = useStore()
  const { name } = usePeople()
  const notes = useItems<Note>('note')
  const mine = notes.filter((n) => n.author === me).reverse()
  const found = notes.filter((n) => n.data.to === me && n.data.found).reverse()
  const waiting = notes.filter((n) => n.data.to === me && !n.data.found).length
  const place = (id: string) => PLACES.find((p) => p.id === id)?.label ?? id
  return (
    <div className="stack-l">
      <div className="card row gap-m">
        <Art lottie="2728" size={44} />
        <p className="muted">{waiting ? `Hay ${waiting} ${waiting === 1 ? 'notita escondida' : 'notitas escondidas'} para vos en algún rincón de la web. Buscá una lucecita que brilla.` : 'Escondé una notita en cualquier sección. El otro va a ver una lucecita y, al tocarla, la encuentra.'}</p>
      </div>
      {found.length > 0 && (
        <section>
          <h3 className="section-t">Las que encontré</h3>
          <div className="notes">{found.map((n) => <div key={n.id} className="note-card"><p>{n.data.text}</p><span className="small muted">de {name(n.author)} · en {place(n.data.place)}</span></div>)}</div>
        </section>
      )}
      <section>
        <h3 className="section-t">Las que escondí</h3>
        {mine.length ? (
          <div className="notes">{mine.map((n) => <div key={n.id} className="note-card"><p>{n.data.text}</p><span className="small muted">en {place(n.data.place)} · {n.data.found ? 'ya la encontró' : 'todavía escondida'}</span></div>)}</div>
        ) : <p className="muted small">Ninguna todavía.</p>}
      </section>
    </div>
  )
}

function HideNote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useStore()
  const { other, P } = usePeople()
  const toast = useToast()
  const [text, setText] = useState('')
  const [place, setPlace] = useState('/')
  const { visible } = useSections()
  return (
    <Modal open={open} onClose={onClose} label="Esconder nota">
      <h2 className="display">Esconder una notita</h2>
      <div className="stack-m mt-m">
        <textarea className="input" rows={4} placeholder={`Algo cortito para ${P[other].name}…`} value={text} onChange={(e) => setText(e.target.value)} />
        <p className="small muted">¿Dónde la escondo?</p>
        <div className="chips">{PLACES.filter((p) => p.id === '/' || visible(p.id.slice(1) as SectionId)).map((p) => <button key={p.id} className={`chip ${place === p.id ? 'on' : ''}`} onClick={() => setPlace(p.id)}>{p.label}</button>)}</div>
        <button className="btn primary" disabled={!text.trim()} onClick={async () => {
          await add<Note>('note', { to: other, place, text: text.trim() })
          toast({ text: 'Escondida. Shhh.', art: { lottie: '1f48b' } })
          setText('')
          onClose()
        }}>Esconder</button>
      </div>
    </Modal>
  )
}
