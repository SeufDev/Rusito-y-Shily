import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronDown, Disc3, FastForward, Headphones, ListMusic, Pause, Play, Repeat, Repeat1, Rewind,
  RotateCcw, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Who } from '../lib/config'
import { useCalmMotion } from '../lib/motion'
import { fmtTime, readMeta, TRACKS, tracksOf, type Meta, type Track } from '../lib/music'
import { useItems, usePeople, useStore } from '../lib/store'

type Repeat = 'off' | 'all' | 'one'
type Saved = { list: Who; id?: string; t?: number; vol: number; muted: boolean; shuffle: boolean; repeat: Repeat }
const KEY = 'nl-player'
function load(me: Who): Saved {
  const base: Saved = { list: me, vol: 0.8, muted: false, shuffle: false, repeat: 'all' }
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return base }
}
function save(s: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* */ }
}

function useMeta(t?: Track) {
  const [m, setM] = useState<Meta>({})
  useEffect(() => {
    setM({})
    if (t) readMeta(t).then(setM)
  }, [t])
  return m
}

/** Reproductor flotante. Cada perfil tiene su lista (carpetas en src/audios). */
export function Player() {
  const { me, other, P } = usePeople()
  const { update } = useStore()
  const profiles = useItems<any>('profile')
  const calm = useCalmMotion()
  const audio = useRef<HTMLAudioElement>(null)
  const [s, setS] = useState<Saved>(() => load(me))
  const [cur, setCur] = useState<Track | undefined>(() => TRACKS.find((t) => t.id === load(me).id))
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [open, setOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [tab, setTab] = useState<Who>(s.list)
  const history = useRef<string[]>([])
  const meta = useMeta(cur)
  const queue = useMemo(() => tracksOf(s.list), [s.list])
  const patch = (p: Partial<Saved>) => setS((x) => { const n = { ...x, ...p }; save(n); return n })

  // volumen
  useEffect(() => {
    const a = audio.current
    if (!a) return
    a.volume = s.vol
    a.muted = s.muted
  }, [s.vol, s.muted])

  // cargar canción
  const firstLoad = useRef(true)
  useEffect(() => {
    const a = audio.current
    if (!a || !cur) return
    if (a.dataset.id !== cur.id) {
      a.src = cur.url
      a.dataset.id = cur.id
      if (firstLoad.current && s.t) a.currentTime = s.t
    }
    firstLoad.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur])

  const play = useCallback((t?: Track, list?: Who) => {
    const a = audio.current
    if (!a) return
    if (list) patch({ list })
    if (t && t.id !== cur?.id) {
      if (cur) history.current.push(cur.id)
      setCur(t)
      a.src = t.url
      a.dataset.id = t.id
      a.currentTime = 0
      patch({ id: t.id, t: 0 })
    }
    a.play().catch(() => setPlaying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur])

  const pause = () => audio.current?.pause()
  const toggle = () => {
    if (!cur) return queue[0] && play(queue[0])
    playing ? pause() : play()
  }
  const restart = () => {
    const a = audio.current
    if (!a || !cur) return
    a.currentTime = 0
    play()
  }
  const seekBy = (d: number) => {
    const a = audio.current
    if (a) a.currentTime = Math.max(0, Math.min((a.duration || 0) - 0.5, a.currentTime + d))
  }
  const pickNext = useCallback((fromEnded = false): Track | undefined => {
    if (!queue.length) return
    if (s.shuffle && queue.length > 1) {
      let t: Track
      do t = queue[Math.floor(Math.random() * queue.length)]
      while (t.id === cur?.id)
      return t
    }
    const i = queue.findIndex((t) => t.id === cur?.id)
    if (i + 1 < queue.length) return queue[i + 1]
    if (!fromEnded || s.repeat === 'all') return queue[0]
    return undefined
  }, [queue, s.shuffle, s.repeat, cur])
  const next = () => { const t = pickNext(); if (t) play(t) }
  const prev = () => {
    const a = audio.current
    if (a && a.currentTime > 3) return restart()
    const back = history.current.pop()
    const t = (back && TRACKS.find((x) => x.id === back)) || (() => {
      const i = queue.findIndex((x) => x.id === cur?.id)
      return queue[(i - 1 + queue.length) % queue.length]
    })()
    if (t) { play(t); history.current.pop() }
  }
  const onEnded = () => {
    if (s.repeat === 'one') return restart()
    const t = pickNext(true)
    if (t) play(t)
    else setPlaying(false)
  }

  // "qué está escuchando" para que el otro lo vea
  const mine = profiles.find((p) => p.data.who === me)
  const lastShared = useRef('')
  useEffect(() => {
    if (!mine) return
    const listening = playing && cur ? { id: cur.id, title: meta.title || cur.title, artist: meta.artist || cur.artist, at: new Date().toISOString() } : null
    const key = listening ? listening.id + listening.title : ''
    if (key === lastShared.current) return
    lastShared.current = key
    const t = setTimeout(() => update(mine.id, { ...mine.data, listening }), 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, cur?.id, meta.title])
  const theirs = profiles.find((p) => p.data.who === other)?.data.listening as { id: string; title: string; artist: string; at: string } | null | undefined
  const theirsFresh = theirs && Date.now() - new Date(theirs.at).getTime() < 20 * 60_000 ? theirs : null

  // controles del celular / teclas multimedia
  useEffect(() => {
    if (!('mediaSession' in navigator) || !cur) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title || cur.title,
      artist: meta.artist || cur.artist || P[s.list].name,
      album: meta.album || `Lista de ${P[s.list].name}`,
      artwork: meta.cover ? [{ src: meta.cover, sizes: '512x512' }] : [],
    })
    const h: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()], ['pause', () => pause()], ['previoustrack', () => prev()], ['nexttrack', () => next()],
      ['seekbackward', () => seekBy(-10)], ['seekforward', () => seekBy(10)],
      ['seekto', (d) => { if (audio.current && d.seekTime != null) audio.current.currentTime = d.seekTime }],
    ]
    h.forEach(([a, f]) => { try { navigator.mediaSession.setActionHandler(a, f) } catch { /* */ } })
  })

  // guardar por dónde iba
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => audio.current && patch({ t: audio.current.currentTime }), 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const VolIcon = s.muted || s.vol === 0 ? VolumeX : s.vol < 0.5 ? Volume1 : Volume2
  const title = cur ? meta.title || cur.title : 'Nuestra música'
  const artist = cur ? meta.artist || cur.artist || `Lista de ${P[s.list].name}` : TRACKS.length ? 'Elegí una canción' : 'Todavía no hay canciones'
  const pct = dur ? (time / dur) * 100 : 0

  return (
    <div className={`player ${open ? 'open' : ''}`}>
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => { setPlaying(false); audio.current && patch({ t: audio.current.currentTime }) }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onProgress={(e) => { const a = e.currentTarget; if (a.buffered.length) setBuffered(a.buffered.end(a.buffered.length - 1)) }}
        onEnded={onEnded}
      />
      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div key="mini" className="mini" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <button className="mini-main" onClick={() => setOpen(true)} aria-label="Abrir reproductor">
              <Cover src={meta.cover} seed={cur?.id ?? 'x'} size={42} spin={playing && !calm} />
              <span className="mini-text">
                <b>{title}</b>
                <span>{theirsFresh && !playing ? `${P[other].name} escucha: ${theirsFresh.title}` : artist}</span>
              </span>
            </button>
            <button className="pl-btn" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'} disabled={!TRACKS.length}>
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button className="pl-btn" onClick={next} aria-label="Siguiente" disabled={!cur}><SkipForward size={17} /></button>
            <span className="mini-bar" style={{ width: `${pct}%` }} />
          </motion.div>
        ) : (
          <motion.div key="big" className="big" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}>
            {meta.cover && <div className="big-glow-wrap"><div className="big-glow" style={{ backgroundImage: `url(${meta.cover})` }} /></div>}
            <div className="big-top">
              <span className="eyebrow"><Headphones size={13} /> Lista de {P[s.list].name}</span>
              <button className="icon-btn" onClick={() => { setOpen(false); setListOpen(false) }} aria-label="Achicar"><ChevronDown size={18} /></button>
            </div>
            <Cover src={meta.cover} seed={cur?.id ?? 'x'} size={200} spin={false} breathe={playing && !calm} />
            <div className="big-info">
              <b className="big-title">{title}</b>
              <span className="muted">{artist}{meta.album ? ` · ${meta.album}` : ''}{meta.year ? ` · ${meta.year}` : ''}</span>
            </div>
            <div className="seek">
              <div className="seek-track">
                <span className="seek-buf" style={{ width: `${dur ? (buffered / dur) * 100 : 0}%` }} />
                <span className="seek-fill" style={{ width: `${pct}%` }} />
                <input
                  type="range" min={0} max={dur || 0} step={0.1} value={time} disabled={!cur}
                  onChange={(e) => { const a = audio.current; if (a) a.currentTime = +e.target.value; setTime(+e.target.value) }}
                  aria-label="Posición de la canción"
                />
              </div>
              <div className="seek-times"><span>{fmtTime(time)}</span><span>-{fmtTime(dur - time)}</span></div>
            </div>
            <div className="controls">
              <button className={`pl-btn sm ${s.shuffle ? 'on' : ''}`} onClick={() => patch({ shuffle: !s.shuffle })} aria-label="Aleatorio" title="Aleatorio"><Shuffle size={17} /></button>
              <button className="pl-btn" onClick={prev} aria-label="Anterior" title="Anterior (o al principio)" disabled={!cur}><SkipBack size={20} fill="currentColor" /></button>
              <motion.button className="pl-play" onClick={toggle} whileTap={{ scale: 0.92 }} aria-label={playing ? 'Pausar' : 'Reproducir'} disabled={!TRACKS.length}>
                {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" style={{ marginLeft: 3 }} />}
              </motion.button>
              <button className="pl-btn" onClick={next} aria-label="Siguiente" title="Siguiente" disabled={!cur}><SkipForward size={20} fill="currentColor" /></button>
              <button
                className={`pl-btn sm ${s.repeat !== 'off' ? 'on' : ''}`}
                onClick={() => patch({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })}
                aria-label={`Repetir: ${s.repeat === 'off' ? 'no' : s.repeat === 'all' ? 'toda la lista' : 'esta canción'}`}
                title={s.repeat === 'off' ? 'Sin repetir' : s.repeat === 'all' ? 'Repetir la lista' : 'Repetir esta canción'}
              >
                {s.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
              </button>
            </div>
            <div className="controls second">
              <button className="pl-btn sm" onClick={() => seekBy(-10)} disabled={!cur} title="Atrasar 10 segundos" aria-label="Atrasar 10 segundos"><Rewind size={16} /><small>10</small></button>
              <button className="pl-btn sm" onClick={restart} disabled={!cur} title="Reiniciar la canción" aria-label="Reiniciar la canción"><RotateCcw size={16} /></button>
              <button className="pl-btn sm" onClick={() => seekBy(10)} disabled={!cur} title="Adelantar 10 segundos" aria-label="Adelantar 10 segundos"><small>10</small><FastForward size={16} /></button>
              <div className="vol">
                <button className="pl-btn sm" onClick={() => patch({ muted: !s.muted })} aria-label={s.muted ? 'Activar sonido' : 'Silenciar'}><VolIcon size={17} /></button>
                <input type="range" min={0} max={1} step={0.01} value={s.muted ? 0 : s.vol} onChange={(e) => patch({ vol: +e.target.value, muted: false })} aria-label="Volumen" style={{ ['--v' as string]: `${(s.muted ? 0 : s.vol) * 100}%` }} />
              </div>
              <button className={`pl-btn sm ${listOpen ? 'on' : ''}`} onClick={() => { setTab(s.list); setListOpen(!listOpen) }} aria-label="Lista de reproducción" title="Lista de reproducción"><ListMusic size={18} /></button>
            </div>
            {theirsFresh && (
              <button className="together-now" onClick={() => { const t = TRACKS.find((x) => x.id === theirsFresh.id); if (t) play(t, t.owners.includes(other) ? other : me) }}>
                <span className="eq on"><i /><i /><i /></span>
                <span><b>{P[other].name}</b> está escuchando {theirsFresh.title}{TRACKS.some((x) => x.id === theirsFresh.id) ? '. Tocá para escuchar lo mismo.' : ''}</span>
              </button>
            )}
            <AnimatePresence>
              {listOpen && (
                <motion.div className="pl-list" initial={{ opacity: 0, scale: 0.96, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.96, x: 10 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}>
                  <div className="pl-list-head">
                    <div className="pl-tabs" role="tablist">
                      {(['a', 'b'] as const).map((w) => (
                        <button key={w} role="tab" aria-selected={tab === w} className={tab === w ? 'on' : ''} onClick={() => setTab(w)}>
                          {P[w].name} <small>{tracksOf(w).length}</small>
                        </button>
                      ))}
                    </div>
                    <button className="icon-btn" onClick={() => setListOpen(false)} aria-label="Cerrar lista"><X size={16} /></button>
                  </div>
                  <div className="pl-rows">
                    {tracksOf(tab).length === 0 && (
                      <p className="small muted pl-empty">Para sumar canciones a esta lista, poné los mp3 en <code>src/audios/{tab === 'a' ? 'shily' : 'rusito'}</code>.</p>
                    )}
                    {tracksOf(tab).map((t) => (
                      <Row key={t.id} t={t} current={cur?.id === t.id} playing={playing && cur?.id === t.id} onPlay={() => (cur?.id === t.id && s.list === tab ? toggle() : play(t, tab))} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ t, current, playing, onPlay }: { t: Track; current: boolean; playing: boolean; onPlay: () => void }) {
  const m = useMeta(t)
  return (
    <button className={`pl-row ${current ? 'on' : ''}`} onClick={onPlay}>
      <Cover src={m.cover} seed={t.id} size={38} />
      <span className="pl-row-text">
        <b>{m.title || t.title}</b>
        <span>{m.artist || t.artist || (t.owners.length === 2 ? 'de los dos' : '')}</span>
      </span>
      {current ? <span className={`eq ${playing ? 'on' : ''}`}><i /><i /><i /></span> : <Play size={14} className="pl-row-play" />}
    </button>
  )
}

function Cover({ src, seed, size, spin, breathe }: { src?: string; seed: string; size: number; spin?: boolean; breathe?: boolean }) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return (
    <span className={`cover ${spin ? 'spin' : ''} ${breathe ? 'breathe' : ''}`} style={{ width: size, height: size, ['--h' as string]: h }}>
      {src ? <img src={src} alt="" /> : <Disc3 size={size * 0.46} strokeWidth={1.4} />}
    </span>
  )
}
