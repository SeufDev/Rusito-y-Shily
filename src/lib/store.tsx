import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend, type Change, type Item } from './backend'
import { DEFAULT_PEOPLE, DEFAULT_START, type Who } from './config'
import { dayKey } from './dates'

export type Person = { name: string; animal: string; color: string }
export type Settings = {
  people: Record<Who, Person>
  start: string
  nextMeet?: string
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
  const bump = () => setVersion((v) => v + 1)
  const meRef = useRef(me)
  meRef.current = me

  useEffect(() => {
    let off = () => {}
    backend.load().then((list) => {
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
    })
    return () => off()
  }, [])

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
      ...settingsItem?.data,
      people: {
        a: { ...DEFAULT_PEOPLE.a, ...settingsItem?.data.people?.a },
        b: { ...DEFAULT_PEOPLE.b, ...settingsItem?.data.people?.b },
      },
    }),
    [settingsItem],
  )
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
  if (!ready) return <div className="boot"><div className="boot-dot" /></div>
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
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
