import { motion } from 'motion/react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Art } from '../components/Art'
import { Photo, PhotoPicker } from '../components/Photo'
import { Empty, Modal, PageHead, Segmented, useToast } from '../components/ui'
import { dayKey, daysBetween, fmtDay, hash, parseDay } from '../lib/dates'
import { useItems, usePeople, useStore } from '../lib/store'

type Memory = { title: string; date: string; text?: string; photo?: string; first?: boolean; place?: string }
type Capsule = { title: string; openAt: string; text: string; photo?: string }
type Song = { title: string; artist?: string; url?: string; why?: string }
type Tab = 'linea' | 'primeras' | 'capsulas' | 'musica'

export default function Memories() {
  const [tab, setTab] = useState<Tab>('linea')
  const [adding, setAdding] = useState(false)
  const labels: Record<Tab, string> = { linea: 'Guardar recuerdo', primeras: 'Guardar primera vez', capsulas: 'Enterrar cápsula', musica: 'Agregar canción' }
  return (
    <div className="stack-l">
      <PageHead art={{ lottie: '1f4f8' }} title="Caja de recuerdos" sub="Lo que vivimos, lo que fue la primera vez, lo que le mandamos al futuro y lo que suena de fondo."
        right={<button className="btn primary" onClick={() => setAdding(true)}><Plus size={16} /> {labels[tab]}</button>} />
      <Segmented value={tab} onChange={setTab} options={[{ id: 'linea', label: 'Línea del tiempo' }, { id: 'primeras', label: 'Primeras veces' }, { id: 'capsulas', label: 'Cápsulas' }, { id: 'musica', label: 'Nuestra música' }]} />
      {(tab === 'linea' || tab === 'primeras') && <Timeline firsts={tab === 'primeras'} />}
      {tab === 'capsulas' && <Capsules />}
      {tab === 'musica' && <Playlist />}
      {(tab === 'linea' || tab === 'primeras') && <AddMemory open={adding} onClose={() => setAdding(false)} first={tab === 'primeras'} />}
      {tab === 'capsulas' && <AddCapsule open={adding} onClose={() => setAdding(false)} />}
      {tab === 'musica' && <AddSong open={adding} onClose={() => setAdding(false)} />}
    </div>
  )
}

function Timeline({ firsts }: { firsts: boolean }) {
  const { name } = usePeople()
  const { remove, me } = useStore()
  const all = useItems<Memory>('memory')
  const groups = useMemo(() => {
    const list = all.filter((m) => !firsts || m.data.first).sort((a, b) => (a.data.date < b.data.date ? 1 : -1))
    const g = new Map<string, typeof list>()
    list.forEach((m) => {
      const k = m.data.date.slice(0, 7)
      if (!g.has(k)) g.set(k, [])
      g.get(k)!.push(m)
    })
    return [...g]
  }, [all, firsts])
  if (!groups.length) return <Empty art={{ lottie: firsts ? '2728' : '1f4f8' }}>{firsts ? 'La primera llamada, el primer “te quiero”, la primera foto juntos… Todo lo que fue primera vez va acá.' : 'La caja está esperando su primer recuerdo.'}</Empty>
  return (
    <div className="timeline">
      {groups.map(([month, list]) => (
        <section key={month}>
          <h3 className="tl-month">{parseDay(month + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3>
          {list.map((m, i) => (
            <motion.article key={m.id} className="tl-item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.05 }}>
              <span className="tl-dot" />
              <div className="tl-card">
                {m.data.photo && (
                  <div className="polaroid" style={{ rotate: `${(hash(m.id) - 0.5) * 5}deg` }}>
                    <Photo path={m.data.photo} className="polaroid-img" alt={m.data.title} />
                  </div>
                )}
                <div className="tl-text">
                  <p className="eyebrow">{fmtDay(m.data.date, { day: 'numeric', month: 'long' })}{m.data.place ? ` · ${m.data.place}` : ''}{m.data.first ? ' · primera vez' : ''}</p>
                  <h3 className="display">{m.data.title}</h3>
                  {m.data.text && <p>{m.data.text}</p>}
                  <div className="row between">
                    <span className="small muted">guardado por {name(m.author)}</span>
                    {m.author === me && <ConfirmDelete onYes={() => remove(m.id)} />}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ))}
    </div>
  )
}

export function ConfirmDelete({ onYes }: { onYes: () => void }) {
  const [ask, setAsk] = useState(false)
  return ask ? (
    <span className="row gap-s small"><span className="muted">¿Borrar?</span><button className="btn ghost small" onClick={onYes}>Sí</button><button className="btn ghost small" onClick={() => setAsk(false)}>No</button></span>
  ) : (
    <button className="icon-btn" onClick={() => setAsk(true)} aria-label="Borrar"><Trash2 size={15} /></button>
  )
}

function AddMemory({ open, onClose, first }: { open: boolean; onClose: () => void; first: boolean }) {
  const { add } = useStore()
  const toast = useToast()
  const [d, setD] = useState<Memory>({ title: '', date: dayKey(), first })
  return (
    <Modal open={open} onClose={onClose} label="Nuevo recuerdo">
      <h2 className="display">{first ? 'Una primera vez' : 'Un recuerdo'}</h2>
      <div className="stack-m mt-m">
        <input className="input" placeholder={first ? 'La primera vez que…' : '¿Qué pasó?'} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <div className="row gap-s wrap">
          <input className="input" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
          <input className="input grow" placeholder="Lugar (opcional)" value={d.place ?? ''} onChange={(e) => setD({ ...d, place: e.target.value })} />
        </div>
        <textarea className="input" rows={4} placeholder="Contalo como quieras…" value={d.text ?? ''} onChange={(e) => setD({ ...d, text: e.target.value })} />
        <PhotoPicker value={d.photo} onChange={(photo) => setD({ ...d, photo })} />
        <label className="row gap-s small"><input type="checkbox" checked={!!d.first} onChange={(e) => setD({ ...d, first: e.target.checked })} /> Fue una primera vez</label>
        <button className="btn primary" disabled={!d.title.trim()} onClick={async () => {
          await add<Memory>('memory', { ...d, title: d.title.trim() })
          toast({ text: 'Guardado en la caja', art: { lottie: '1f4f8' } })
          setD({ title: '', date: dayKey(), first })
          onClose()
        }}>Guardar</button>
      </div>
    </Modal>
  )
}

function Capsules() {
  const { name } = usePeople()
  const caps = useItems<Capsule>('capsule')
  const [open, setOpen] = useState<string | null>(null)
  if (!caps.length) return <Empty art={{ img: 'old_key' }}>Una cápsula del tiempo se escribe hoy y se abre en una fecha. Para el aniversario, para el reencuentro, para dentro de un año.</Empty>
  const today = dayKey()
  return (
    <div className="caps">
      {caps.map((c) => {
        const ready = today >= c.data.openAt
        const left = daysBetween(new Date(), parseDay(c.data.openAt))
        const isOpen = open === c.id
        return (
          <motion.div key={c.id} layout className={`cap ${ready ? 'ready' : ''}`} onClick={() => ready && setOpen(isOpen ? null : c.id)}>
            <Art img={ready ? 'sparkles' : 'locked'} size={46} />
            <div className="grow">
              <b>{c.data.title}</b>
              <div className="small muted">de {name(c.author)} · {ready ? 'lista para abrir' : `se abre en ${left} ${left === 1 ? 'día' : 'días'} (${fmtDay(c.data.openAt, { day: 'numeric', month: 'short', year: 'numeric' })})`}</div>
              {isOpen && (
                <motion.div className="cap-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  {c.data.photo && <Photo path={c.data.photo} className="cap-photo" />}
                  <p>{c.data.text}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function AddCapsule({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useStore()
  const toast = useToast()
  const inAYear = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return dayKey(d) })()
  const [d, setD] = useState<Capsule>({ title: '', openAt: inAYear, text: '' })
  return (
    <Modal open={open} onClose={onClose} label="Nueva cápsula">
      <h2 className="display">Cápsula del tiempo</h2>
      <p className="muted small">Ninguno de los dos la puede abrir antes de la fecha.</p>
      <div className="stack-m mt-m">
        <input className="input" placeholder="Nombre de la cápsula" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <label className="small muted">Se abre el <input className="input" type="date" min={dayKey()} value={d.openAt} onChange={(e) => setD({ ...d, openAt: e.target.value })} /></label>
        <textarea className="input" rows={6} placeholder="Querido futuro nosotros…" value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} />
        <PhotoPicker value={d.photo} onChange={(photo) => setD({ ...d, photo })} />
        <button className="btn primary" disabled={!d.title.trim() || !d.text.trim()} onClick={async () => {
          await add<Capsule>('capsule', d)
          toast({ text: 'Cápsula enterrada', art: { img: 'old_key' } })
          setD({ title: '', openAt: inAYear, text: '' })
          onClose()
        }}>Enterrar</button>
      </div>
    </Modal>
  )
}

function spotifyEmbed(url?: string) {
  const m = url?.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null
}
function Playlist() {
  const { name } = usePeople()
  const { remove, me } = useStore()
  const songs = useItems<Song>('song').slice().reverse()
  if (!songs.length) return <Empty art={{ lottie: '1f3b6' }}>Las canciones que nos representan. Pegá un link de Spotify o YouTube y se escucha acá mismo.</Empty>
  return (
    <div className="songs">
      {songs.map((s) => {
        const emb = spotifyEmbed(s.data.url)
        return (
          <div key={s.id} className="song">
            {emb ? <iframe src={emb} height="80" loading="lazy" allow="encrypted-media" title={s.data.title} /> : (
              <div className="row gap-m"><Art lottie="1f3b6" size={40} play="still" /><div className="grow"><b>{s.data.title}</b><div className="small muted">{s.data.artist}</div></div>{s.data.url && <a className="icon-btn" href={s.data.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}</div>
            )}
            <div className="row between mt-s">
              <span className="small muted">{s.data.why ? `“${s.data.why}” · ` : ''}la sumó {name(s.author)}</span>
              {s.author === me && <ConfirmDelete onYes={() => remove(s.id)} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddSong({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useStore()
  const [d, setD] = useState<Song>({ title: '' })
  return (
    <Modal open={open} onClose={onClose} label="Nueva canción">
      <h2 className="display">Una canción nuestra</h2>
      <div className="stack-m mt-m">
        <input className="input" placeholder="Canción" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <input className="input" placeholder="Artista" value={d.artist ?? ''} onChange={(e) => setD({ ...d, artist: e.target.value })} />
        <input className="input" placeholder="Link de Spotify o YouTube (opcional)" value={d.url ?? ''} onChange={(e) => setD({ ...d, url: e.target.value })} />
        <input className="input" placeholder="¿Por qué esta? (opcional)" value={d.why ?? ''} onChange={(e) => setD({ ...d, why: e.target.value })} />
        <button className="btn primary" disabled={!d.title.trim()} onClick={async () => { await add<Song>('song', d); setD({ title: '' }); onClose() }}>Agregar</button>
      </div>
    </Modal>
  )
}
