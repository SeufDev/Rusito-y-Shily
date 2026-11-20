import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend, type Change, type Item } from './backend'
import { DEFAULT_PEOPLE, DEFAULT_START, DEFAULT_START_TIME, type Who } from './config'
import { dayKey } from './dates'

export type Person = { name: string; animal: string; color: string }
export type Settings = {
  people: Record<Who, Person>
  start: string
  /** 'HH:MM' del día que empezamos */
  startTime?: string
  /** huso horario de esa hora (si falta, se usa el de Rusito) */
  startTz?: string
  nextMeet?: string
  /** prender/apagar secciones: 'on' para los dos, 'off' apagada, 'a'/'b' solo la ve esa persona */
  sections?: Partial<Record<string, 'on' | 'off' | Who>>
  reducedMotion?: boolean
}

type Ctx = {
  items: Map<string, Item>
  version: number
  me: Who
  other: Who
  settings: Settings
  saveSettings: (s: Partial<Settings>) => Promise<void>
  add: <T>(kind: string, data: T) => Promise<Item<T>>
  update: <T>(id: string, data: T) => Promise<void>
  remove: (id: string) => Promise<void>
  incoming: Item | null
}
const StoreCtx = createContext<Ctx | null>(null)

/** `me` viene de la cuenta con la que se entró: cada uno tiene su propia clave. */
export function StoreProvider({ me, children }: { me: Who; children: ReactNode }) {
  const map = useRef(new Map<string, Item>())
  const [version, setVersion] = useState(0)
  const [ready, setReady] = useState(false)
  const [incoming, setIncoming] = useState<Item | null>(null)
  const [fail, setFail] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const bump = () => setVersion((v) => v + 1)
  const meRef = useRef(me)
  meRef.current = me

  useEffect(() => {
    let off = () => {}
    setFail(null)
    // Si la base tarda demasiado o responde con error, lo decimos en vez de quedar cargando para siempre.
    const slow = setTimeout(() => setFail('La base no responde. Puede ser la conexión, o que falte algún dato en Vercel.'), 15000)
    backend.load().then((list) => {
      clearTimeout(slow)
      list.forEach((i) => map.current.set(i.id, i))
      setReady(true)
      bump()
      off = backend.subscribe((c: Change) => {
        if (c.type === 'delete') map.current.delete(c.id)
        else {
          const isNew = !map.current.has(c.item.id)
          map.current.set(c.item.id, c.item)
          if (isNew && c.item.author && c.item.author !== meRef.current) setIncoming(c.item)
        }
        bump()
      })
    }).catch((e) => {
      clearTimeout(slow)
      setFail(e?.message || String(e))
    })
    return () => { clearTimeout(slow); off() }
  }, [attempt])

  const add = useCallback(
    async <T,>(kind: string, data: T) => {
      const now = new Date().toISOString()
      const item: Item<T> = { id: crypto.randomUUID(), kind, data, author: me, created_at: now, updated_at: now }
      map.current.set(item.id, item)
      bump()
      await backend.insert(item)
      return item
    },
    [me],
  )
  const update = useCallback(async <T,>(id: string, data: T) => {
    const cur = map.current.get(id)
    if (cur) map.current.set(id, { ...cur, data, updated_at: new Date().toISOString() })
    bump()
    await backend.update(id, data)
  }, [])
  const remove = useCallback(async (id: string) => {
    map.current.delete(id)
    bump()
    await backend.remove(id)
  }, [])

  const settingsItem = useMemo(() => {
    let found: Item<Settings> | undefined
    for (const i of map.current.values()) if (i.kind === 'settings' && (!found || i.created_at < found.created_at)) found = i
    return found
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])
  const settings: Settings = useMemo(
    () => ({
      start: DEFAULT_START,
      startTime: DEFAULT_START_TIME,
      ...settingsItem?.data,
      people: {
        a: { ...DEFAULT_PEOPLE.a, ...settingsItem?.data.people?.a },
        b: { ...DEFAULT_PEOPLE.b, ...settingsItem?.data.people?.b },
      },
    }),
    [settingsItem],
  )
  // La pantalla de entrada no puede leer los datos (están protegidos hasta que entrás),
  // así que cada dispositivo se acuerda de los nombres y animalitos que eligieron adentro.
  useEffect(() => {
    if (!ready) return
    const keep = (w: Who) => ({ name: settings.people[w].name, animal: settings.people[w].animal })
    try { localStorage.setItem(PEOPLE_CACHE, JSON.stringify({ a: keep('a'), b: keep('b') })) } catch { /* sin almacenamiento: queda el de siempre */ }
  }, [ready, settings.people])

  const saveSettings = useCallback(
    async (s: Partial<Settings>) => {
      const next = { ...settings, ...s }
      if (settingsItem) await update(settingsItem.id, next)
      else await add('settings', next)
    },
    [settings, settingsItem, update, add],
  )

  // Cada uno deja anotado su huso horario, así el otro ve qué hora es del otro lado.
  useEffect(() => {
    if (!ready) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const mine = [...map.current.values()].find((i) => i.kind === 'profile' && i.data.who === me)
    if (!mine) add('profile', { who: me, tz, seen: new Date().toISOString() })
    else update(mine.id, { ...mine.data, tz, seen: new Date().toISOString(), lastDay: dayKey() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, me])

  const value: Ctx = {
    items: map.current,
    version,
    me,
    other: me === 'a' ? 'b' : 'a',
    settings,
    saveSettings,
    add,
    update,
    remove,
    incoming,
  }
  if (!ready && fail)
    return (
      <div className="boot">
        <div className="card stack-s" style={{ maxWidth: 420, textAlign: 'center' }}>
          <b>No pude abrir sus cosas todavía.</b>
          <p className="small muted">{fail}</p>
          <div className="row gap-s" style={{ justifyContent: 'center' }}>
            <button className="btn primary small" onClick={() => setAttempt((a) => a + 1)}>Probar de nuevo</button>
            <button className="btn ghost small" onClick={() => backend.signOut().then(() => location.reload())}>Salir</button>
          </div>
        </div>
      </div>
    )
  if (!ready) return <div className="boot"><div className="boot-dot" /></div>
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

const PEOPLE_CACHE = 'nl-people'
/** Nombres y animalitos tal como los eligieron adentro (los últimos que vio este dispositivo). */
export function cachedPeople(): Record<Who, { name: string; animal: string }> {
  let saved: Partial<Record<Who, { name?: string; animal?: string }>> = {}
  try { saved = JSON.parse(localStorage.getItem(PEOPLE_CACHE) || '{}') } catch { /* nada guardado */ }
  return {
    a: { name: saved.a?.name || DEFAULT_PEOPLE.a.name, animal: saved.a?.animal || DEFAULT_PEOPLE.a.animal },
    b: { name: saved.b?.name || DEFAULT_PEOPLE.b.name, animal: saved.b?.animal || DEFAULT_PEOPLE.b.animal },
  }
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('fuera del StoreProvider')
  return c
}
export function useItems<T = any>(kind: string): Item<T>[] {
  const { items, version } = useStore()
  return useMemo(() => {
    const out: Item<T>[] = []
    for (const i of items.values()) if (i.kind === kind) out.push(i as Item<T>)
    return out.sort((x, y) => (x.created_at < y.created_at ? -1 : 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, version, kind])
}
export function usePeople() {
  const { settings, me, other } = useStore()
  return { me, other, P: settings.people, name: (w: Who | null) => (w ? settings.people[w].name : '') }
}
