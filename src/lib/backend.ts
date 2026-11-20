import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DEMO, DEMO_PASSWORDS, EMAILS, SUPABASE_ANON_KEY, SUPABASE_URL, type Who } from './config'

export type Item<T = any> = {
  id: string
  kind: string
  data: T
  author: Who | null
  created_at: string
  updated_at: string
}
export type Change = { type: 'upsert'; item: Item } | { type: 'delete'; id: string }

export interface Backend {
  /** Quién tiene la sesión abierta en este dispositivo (o null). */
  session(): Promise<Who | null>
  signIn(who: Who, password: string): Promise<boolean>
  signOut(): Promise<void>
  load(): Promise<Item[]>
  insert(item: Item): Promise<void>
  update(id: string, data: any): Promise<void>
  remove(id: string): Promise<void>
  subscribe(cb: (c: Change) => void): () => void
  uploadPhoto(file: Blob): Promise<string>
  photoUrl(ref: string): Promise<string>
}

/* ---------- Supabase: lo real, compartido entre los dos ---------- */
function supabaseBackend(): Backend {
  const sb: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  const urlCache = new Map<string, { url: string; exp: number }>()
  return {
    async session() {
      const { data } = await sb.auth.getSession()
      const email = data.session?.user.email?.toLowerCase()
      if (!email) return null
      if (email === EMAILS.a.toLowerCase()) return 'a'
      if (email === EMAILS.b.toLowerCase()) return 'b'
      return null
    },
    async signIn(who, password) {
      const { error } = await sb.auth.signInWithPassword({ email: EMAILS[who], password })
      if (!error) return true
      // Clave equivocada: false. Cualquier otra cosa (cuenta sin confirmar, datos de Vercel mal cargados) se muestra tal cual.
      if (error.code === 'invalid_credentials' || /invalid login/i.test(error.message)) return false
      throw error
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async load() {
      const out: Item[] = []
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from('items').select('*').order('created_at').range(from, from + 999)
        if (error) throw error
        out.push(...(data as Item[]))
        if (!data || data.length < 1000) break
      }
      return out
    },
    async insert(item) {
      const { error } = await sb.from('items').insert(item)
      if (error) throw error
    },
    async update(id, data) {
      const { error } = await sb.from('items').update({ data, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    async remove(id) {
      const { error } = await sb.from('items').delete().eq('id', id)
      if (error) throw error
    },
    subscribe(cb) {
      const ch = sb
        .channel('items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (p) => {
          if (p.eventType === 'DELETE') cb({ type: 'delete', id: (p.old as Item).id })
          else cb({ type: 'upsert', item: p.new as Item })
        })
        .subscribe()
      return () => void sb.removeChannel(ch)
    },
    async uploadPhoto(file) {
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`
      const { error } = await sb.storage.from('photos').upload(path, file, { contentType: 'image/jpeg' })
      if (error) throw error
      return path
    },
    async photoUrl(ref) {
      if (ref.startsWith('data:')) return ref
      const hit = urlCache.get(ref)
      if (hit && hit.exp > Date.now()) return hit.url
      const { data } = await sb.storage.from('photos').createSignedUrl(ref, 3600)
      const url = data?.signedUrl ?? ''
      urlCache.set(ref, { url, exp: Date.now() + 3500_000 })
      return url
    },
  }
}

/* ---------- Vista previa: guarda en este navegador y sincroniza pestañas ---------- */
function demoBackend(): Backend {
  const KEY = 'nl-demo-items'
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('nl-demo') : null
  const read = (): Item[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  }
  const write = (items: Item[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* lleno o bloqueado: sigue funcionando en memoria */
    }
  }
  let mem: Item[] | null = null
  const all = () => (mem ??= read())
  const listeners = new Set<(c: Change) => void>()
  bc?.addEventListener('message', (e) => {
    mem = read()
    listeners.forEach((l) => l(e.data as Change))
  })
  const emit = (c: Change) => bc?.postMessage(c)
  return {
    async session() {
      try {
        const v = localStorage.getItem('nl-demo-session')
        return v === 'a' || v === 'b' ? v : null
      } catch {
        return null
      }
    },
    async signIn(who, password) {
      const ok = password.trim().toLowerCase() === DEMO_PASSWORDS[who]
      if (ok) try { localStorage.setItem('nl-demo-session', who) } catch { /* */ }
      return ok
    },
    async signOut() {
      try { localStorage.removeItem('nl-demo-session') } catch { /* */ }
    },
    async load() {
      return [...all()]
    },
    async insert(item) {
      mem = [...all(), item]
      write(mem)
      emit({ type: 'upsert', item })
    },
    async update(id, data) {
      mem = all().map((i) => (i.id === id ? { ...i, data, updated_at: new Date().toISOString() } : i))
      write(mem)
      const item = mem.find((i) => i.id === id)
      if (item) emit({ type: 'upsert', item })
    },
    async remove(id) {
      mem = all().filter((i) => i.id !== id)
      write(mem)
      emit({ type: 'delete', id })
    },
    subscribe(cb) {
      listeners.add(cb)
      return () => void listeners.delete(cb)
    },
    async uploadPhoto(file) {
      return await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res(String(r.result))
        r.readAsDataURL(file)
      })
    },
    async photoUrl(ref) {
      return ref
    },
  }
}

export const backend: Backend = DEMO ? demoBackend() : supabaseBackend()

/** Achica la foto antes de subirla: carga rápido y ocupa poco. */
export async function shrinkImage(file: File, max = 1400, quality = 0.84): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s)
  c.height = Math.round(bmp.height * s)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return await new Promise((res) => c.toBlob((b) => res(b!), 'image/jpeg', quality))
}
