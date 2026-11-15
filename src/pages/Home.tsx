import { motion } from 'motion/react'
import { ArrowRight, Heart } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Art } from '../components/Art'
import { celebrate, Modal, useToast } from '../components/ui'
import type { Who } from '../lib/config'
import { MOODS, NEEDS, QUESTIONS, speciesById } from '../lib/content'
import { ago, dayKey, daysBetween, greeting, parseDay } from '../lib/dates'
import { daysTogether, useGame } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'

const stagger = { show: { transition: { staggerChildren: 0.07 } } }
const rise = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } }

export default function Home() {
  const { settings } = useStore()
  const { me, P } = usePeople()
  const n = daysTogether(settings.start) + 1
  const { visible } = useSections()
  return (
    <motion.div className="stack-l" variants={stagger} initial="hidden" animate="show">
      <motion.section variants={rise} className="hero">
        <Art lottie={P[me].animal} size={88} />
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="display xl">{greeting()}, {P[me].name}</h1>
          {visible('universo') ? <Link to="/universo" className="muted link-soft">Hoy brilla la estrella número {n} de nuestro universo <ArrowRight size={14} /></Link> : <p className="muted">Hoy es nuestro día número {n}.</p>}
        </div>
      </motion.section>

      <div className="grid-home">
        <motion.div variants={rise}><Clocks /></motion.div>
        <motion.div variants={rise}><Thinking /></motion.div>
        <motion.div variants={rise} className="span-2"><MoodCheck /></motion.div>
        <motion.div variants={rise} className="span-2"><DailyQuestion /></motion.div>
        <motion.div variants={rise}><GardenGlance /></motion.div>
        <motion.div variants={rise}><Countdown /></motion.div>
        <motion.div variants={rise} className="span-2"><Vase /></motion.div>
      </div>
    </motion.div>
  )
}

function Clocks() {
  const { P } = usePeople()
  const profiles = useItems<{ who: Who; tz: string; seen: string }>('profile')
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="card">
      <p className="eyebrow">Nuestras horas</p>
      <div className="clocks">
        {(['a', 'b'] as const).map((w) => {
          const p = profiles.find((x) => x.data.who === w)?.data
          const tz = p?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone
          const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz })
          const h = Number(now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: tz }))
          const night = h >= 21 || h < 6
          return (
            <div key={w} className="clock">
              <Art img={night ? 'crescent_moon' : 'sun'} size={30} />
              <div>
                <div className="clock-time">{time}</div>
                <div className="muted small">{P[w].name}{p?.seen ? ` · pasó ${ago(p.seen)}` : ''}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Thinking() {
  const { add, me } = useStore()
  const { other, P } = usePeople()
  const hugs = useItems('hug')
  const toast = useToast()
  const calm = useCalmMotion()
  const today = dayKey()
  const received = hugs.filter((h) => h.author === other && dayKey(new Date(h.created_at)) === today).length
  const sent = hugs.filter((h) => h.author === me && dayKey(new Date(h.created_at)) === today).length
  const [pulse, setPulse] = useState(0)
  return (
    <div className="card center thinking">
      <motion.button
        className="heart-btn"
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          add('hug', {})
          setPulse((p) => p + 1)
          toast({ text: <>Le llegó tu abrazo a <b>{P[other].name}</b></>, art: { lottie: '1f917' } })
          celebrate(calm, { particleCount: 25, spread: 50, origin: { y: 0.4 }, shapes: ['circle'] })
        }}
        aria-label={`Mandarle un abrazo a ${P[other].name}`}
      >
        <motion.span key={pulse} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 8 }}>
          <Heart size={34} fill="currentColor" strokeWidth={0} />
        </motion.span>
      </motion.button>
      <p className="strong">Estoy pensando en vos</p>
      <p className="muted small">
        {received ? `${P[other].name} te mandó ${received} ${received === 1 ? 'abrazo' : 'abrazos'} hoy` : 'Tocalo cuando te acuerdes del otro'}
        {sent ? ` · enviaste ${sent}` : ''}
      </p>
    </div>
  )
}

type Mood = { day: string; mood: string; need?: string; note?: string }
function MoodCheck() {
  const { add, update, me } = useStore()
  const { other, P } = usePeople()
  const moods = useItems<Mood>('mood')
  const today = dayKey()
  const mine = moods.filter((m) => m.author === me && m.data.day === today).at(-1)
  const theirs = moods.filter((m) => m.author === other).at(-1)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Mood>({ day: today, mood: '' })
  const start = () => {
    setDraft(mine?.data ?? { day: today, mood: '' })
    setEditing(true)
  }
  const save = async () => {
    if (mine) await update(mine.id, draft)
    else await add('mood', draft)
    setEditing(false)
  }
  const m = (id?: string) => MOODS.find((x) => x.id === id)
  const soft = ['triste', 'abrumo', 'malestar', 'agotamiento', 'sensible']
  return (
    <div className="card">
      <div className="row between wrap gap-m">
        <div>
          <p className="eyebrow">¿Cómo estamos hoy?</p>
          <p className="muted small">Sin obligación. Contalo solo si tenés ganas, y cambialo cuando quieras.</p>
        </div>
      </div>
      <div className="mood-pair">
        <div className="mood-side">
          <span className="small muted">{P[me].name}</span>
          {mine && !editing ? (
            <button className="mood-now" onClick={start}>
              <Art lottie={m(mine.data.mood)!.lottie} size={54} />
              <div>
                <b>{m(mine.data.mood)!.label}</b>
                {mine.data.need && <div className="small muted">{mine.data.need}</div>}
              </div>
            </button>
          ) : !editing ? (
            <button className="btn soft" onClick={start}>Contar cómo estoy</button>
          ) : null}
        </div>
        <div className="mood-side">
          <span className="small muted">{P[other].name}</span>
          {theirs ? (
            <div className="mood-now static">
              <Art lottie={m(theirs.data.mood)!.lottie} size={54} />
              <div>
                <b>{m(theirs.data.mood)!.label}</b>
                <div className="small muted">{theirs.data.day === today ? 'hoy' : ago(theirs.updated_at)}{theirs.data.need ? ` · ${theirs.data.need}` : ''}</div>
                {theirs.data.note && <div className="small quote">“{theirs.data.note}”</div>}
                {soft.includes(theirs.data.mood) && theirs.data.day === today && (
                  <Link to="/calma" className="small link-soft">Dejale un mensajito para días grises <ArrowRight size={12} /></Link>
                )}
              </div>
            </div>
          ) : (
            <p className="small muted">Todavía no contó nada hoy, y está perfecto así.</p>
          )}
        </div>
      </div>
      {editing && (
        <motion.div className="mood-edit" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="mood-grid">
            {MOODS.map((x) => (
              <button key={x.id} className={`mood-opt ${draft.mood === x.id ? 'on' : ''}`} onClick={() => setDraft({ ...draft, mood: x.id })}>
                <Art lottie={x.lottie} size={44} play={draft.mood === x.id ? 'loop' : 'still'} />
                <span>{x.label}</span>
              </button>
            ))}
          </div>
          {draft.mood && (
            <>
              <p className="small muted mt-m">¿Qué te vendría bien? (opcional)</p>
              <div className="chips">
                {NEEDS.map((n) => (
                  <button key={n} className={`chip ${draft.need === n ? 'on' : ''}`} onClick={() => setDraft({ ...draft, need: draft.need === n ? undefined : n })}>{n}</button>
                ))}
              </div>
              <input className="input mt-s" placeholder="Algo más, si querés…" value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </>
          )}
          <div className="row gap-s mt-m">
            <button className="btn primary" disabled={!draft.mood} onClick={save}>Guardar</button>
            <button className="btn ghost" onClick={() => setEditing(false)}>Mejor después</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function questionOfDay(day = dayKey()) {
  const idx = daysBetween(new Date(2026, 0, 1), parseDay(day))
  return QUESTIONS[((idx % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length]
}
type Answer = { day: string; q: string; text: string }
function DailyQuestion() {
  const { add, me } = useStore()
  const { other, P } = usePeople()
  const answers = useItems<Answer>('answer')
  const today = dayKey()
  const q = questionOfDay(today)
  const mine = answers.find((a) => a.author === me && a.data.day === today)
  const theirs = answers.find((a) => a.author === other && a.data.day === today)
  const [text, setText] = useState('')
  const [past, setPast] = useState(false)
  const history = useMemo(() => {
    const days = [...new Set(answers.map((a) => a.data.day))].filter((d) => d !== today).sort().reverse()
    return days.map((d) => ({ d, list: answers.filter((a) => a.data.day === d) }))
  }, [answers, today])
  return (
    <div className="card question">
      <div className="row between gap-m">
        <p className="eyebrow">Pregunta del día</p>
        {history.length > 0 && <button className="btn ghost small" onClick={() => setPast(true)}>Ver anteriores</button>}
      </div>
      <h2 className="display q">{q}</h2>
      <div className="answers">
        <div className="answer">
          <span className="small muted">{P[me].name}</span>
          {mine ? (
            <p>{mine.data.text}</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) add<Answer>('answer', { day: today, q, text: text.trim() }) }}>
              <textarea className="input" rows={2} placeholder="Tu respuesta…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn primary small mt-s" disabled={!text.trim()}>Responder</button>
            </form>
          )}
        </div>
        <div className="answer">
          <span className="small muted">{P[other].name}</span>
          {theirs ? (
            mine ? <motion.p initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}>{theirs.data.text}</motion.p>
                 : <p className="blurred" title="Respondé para verla">{theirs.data.text}</p>
          ) : (
            <p className="muted small">Todavía no respondió.</p>
          )}
          {theirs && !mine && <span className="small muted">Ya respondió. Se destapa cuando respondas vos.</span>}
        </div>
      </div>
      <Modal open={past} onClose={() => setPast(false)} wide label="Preguntas anteriores">
        <h2 className="display">Lo que nos fuimos contando</h2>
        <div className="stack-m mt-m">
          {history.map(({ d, list }) => (
            <div key={d} className="past-q">
              <p className="small muted">{parseDay(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>
              <p className="strong">{list[0].data.q}</p>
              {list.map((a) => <p key={a.id}><span className="tag">{P[a.author!].name}</span> {a.data.text}</p>)}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function GardenGlance() {
  const { activePlots, growths, pets, readyTotal, k } = useGame()
  const { me, other, name } = usePeople()
  const { visible } = useSections()
  const thirsty = activePlots.filter((p) => !growths.get(p.id)!.today.has(me) && growths.get(p.id)!.stage < 4).length
  const gift = k<{ for: Who; name: string }>('outfit').filter((o) => o.data.for === me && o.author === other).at(-1)
  if (!visible('jardin') && !visible('casita')) return null
  return (
    <div className="card glance">
      {visible('jardin') && (
        <Link to="/jardin" className="glance-row">
          <Art lottie="1f331" size={46} />
          <div className="grow">
            <b>Jardín</b>
            <div className="small muted">
              {activePlots.length === 0 ? 'Listo para la primera semillita' : readyTotal ? `Hay ${readyTotal} ${readyTotal === 1 ? 'gotita' : 'gotitas'} de néctar para juntar` : thirsty ? `${thirsty} ${thirsty === 1 ? 'plantita se alegraría' : 'plantitas se alegrarían'} con agüita tuya` : 'Todo regado por vos hoy'}
            </div>
          </div>
          <ArrowRight size={16} />
        </Link>
      )}
      {visible('casita') && (
        <Link to="/casita" className="glance-row">
          {pets.length ? <Art img={petById(pets[0].data.species).img} size={46} /> : <Art lottie="1f43e" size={46} />}
          <div className="grow">
            <b>La casita</b>
            <div className="small muted">
              {gift && Date.now() - Date.parse(gift.created_at) < 7 * 86400000 ? `${name(other)} te armó un outfit: “${gift.data.name}”` : pets.length ? `${pets.map((p) => p.data.name).join(', ')} ${pets.length === 1 ? 'te espera' : 'te esperan'}` : 'Adopten al primer animalito'}
            </div>
          </div>
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}
import { petById } from '../lib/content'
import { useSections } from '../lib/sections'

function Countdown() {
  const { settings } = useStore()
  if (!settings.nextMeet)
    return (
      <Link to="/ajustes" className="card glance-row tall">
        <Art lottie="1f30d" size={52} />
        <div className="grow"><b>Próximo encuentro</b><div className="small muted">Cuando sepan la fecha, la ponen en Ajustes y la contamos juntos.</div></div>
      </Link>
    )
  const d = daysBetween(new Date(), parseDay(settings.nextMeet))
  return (
    <div className="card center">
      <Art lottie={d <= 0 ? '1f973' : '1f30d'} size={56} />
      <p className="eyebrow">Próximo encuentro</p>
      <p className="display big-num">{d > 0 ? d : '¡Hoy!'}</p>
      <p className="muted small">{d > 1 ? 'días para abrazarnos' : d === 1 ? 'día. ¡Mañana!' : d === 0 ? 'Hoy nos vemos' : 'Ya pasó. ¿Cuándo es el próximo?'}</p>
    </div>
  )
}

function Vase() {
  const { gifted } = useGame()
  const { me, name } = usePeople()
  const mine = gifted.filter((g) => g.data.giftedTo === me)
  if (!mine.length) return null
  return (
    <div className="card">
      <p className="eyebrow">Tu florero</p>
      <div className="vase">
        {mine.map((g) => {
          const sp = speciesById(g.data.species)
          return (
            <div key={g.id} className="vase-item" title={`${sp.name}, de ${name(g.data.giftedBy ?? g.author)}`}>
              <Art lottie={sp.lottie} img={sp.img} size={52} />
              <span className="small muted">de {name(g.data.giftedBy ?? g.author)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
