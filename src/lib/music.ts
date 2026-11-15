// Canciones: se leen solas de src/audios. Cada subcarpeta es la lista de un perfil.
//   src/audios/shily/   → lista de Shily
//   src/audios/rusito/  → lista de Rusito
//   src/audios/*.mp3    → sueltas: aparecen en las dos listas
import type { Who } from './config'

const files = import.meta.glob('../audios/**/*.{mp3,MP3,m4a,ogg,wav,flac}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type Track = { id: string; url: string; owners: Who[]; file: string; title: string; artist: string }
export const FOLDER: Record<Who, string> = { a: 'shily', b: 'rusito' }

function fromFilename(file: string) {
  const base = file.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim()
  const parts = base.split(/\s+-\s+/)
  if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(' - ') }
  return { artist: '', title: base }
}

export const TRACKS: Track[] = Object.entries(files)
  .map(([path, url]) => {
    const rel = path.replace(/^\.\.\/audios\//, '')
    const segs = rel.split('/')
    const file = segs[segs.length - 1]
    const folder = segs.length > 1 ? segs[0].toLowerCase() : ''
    const owners: Who[] = folder === FOLDER.a ? ['a'] : folder === FOLDER.b ? ['b'] : ['a', 'b']
    return { id: rel, url, owners, file, ...fromFilename(file) }
  })
  .sort((x, y) => x.title.localeCompare(y.title, 'es'))

export const tracksOf = (w: Who) => TRACKS.filter((t) => t.owners.includes(w))

/* ---------- Datos dentro del mp3 (ID3): título, artista, disco y tapa ---------- */
export type Meta = { title?: string; artist?: string; album?: string; year?: string; cover?: string }
const metaCache = new Map<string, Promise<Meta>>()
export function readMeta(t: Track): Promise<Meta> {
  if (!metaCache.has(t.id)) metaCache.set(t.id, loadMeta(t.url).catch(() => ({})))
  return metaCache.get(t.id)!
}

/** Lee solo el comienzo del archivo (la etiqueta), sin bajar la canción entera. */
async function loadMeta(url: string): Promise<Meta> {
  const res = await fetch(url)
  if (!res.body) return {}
  const reader = res.body.getReader()
  let buf = new Uint8Array(0)
  let need = 10
  while (buf.length < need) {
    const { value, done } = await reader.read()
    if (done || !value) break
    const next = new Uint8Array(buf.length + value.length)
    next.set(buf)
    next.set(value, buf.length)
    buf = next
    if (need === 10 && buf.length >= 10) {
      if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) break // sin "ID3"
      need = 10 + syncsafe(buf, 6)
      if (need > 6_000_000) break
    }
  }
  reader.cancel().catch(() => {})
  if (buf.length < 10 || buf[0] !== 0x49) return {}
  return parseId3(buf.subarray(0, need))
}

const syncsafe = (b: Uint8Array, o: number) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3]
const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0

function decodeText(enc: number, b: Uint8Array) {
  const label = enc === 1 ? 'utf-16' : enc === 2 ? 'utf-16be' : enc === 3 ? 'utf-8' : 'latin1'
  return new TextDecoder(label).decode(b).replace(/\0+$/g, '').split('\0')[0].trim()
}

function parseId3(b: Uint8Array): Meta {
  const ver = b[3]
  const flags = b[5]
  let p = 10
  if (flags & 0x40) p += ver === 4 ? syncsafe(b, 10) : u32(b, 10) + 4
  const meta: Meta = {}
  while (p + 10 <= b.length) {
    const id = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3])
    if (!/^[A-Z0-9]{4}$/.test(id)) break
    const size = ver === 4 ? syncsafe(b, p + 4) : u32(b, p + 4)
    const body = b.subarray(p + 10, p + 10 + size)
    p += 10 + size
    if (!size || body.length < size) continue
    const enc = body[0]
    if (id === 'TIT2') meta.title = decodeText(enc, body.subarray(1))
    else if (id === 'TPE1') meta.artist = decodeText(enc, body.subarray(1))
    else if (id === 'TALB') meta.album = decodeText(enc, body.subarray(1))
    else if (id === 'TYER' || id === 'TDRC') meta.year = decodeText(enc, body.subarray(1)).slice(0, 4)
    else if (id === 'APIC' && !meta.cover) {
      let q = 1
      while (q < body.length && body[q] !== 0) q++
      const mime = new TextDecoder('latin1').decode(body.subarray(1, q)) || 'image/jpeg'
      q += 2 // fin del mime + tipo de imagen
      if (enc === 1 || enc === 2) {
        while (q + 1 < body.length && !(body[q] === 0 && body[q + 1] === 0)) q += 2
        q += 2
      } else {
        while (q < body.length && body[q] !== 0) q++
        q += 1
      }
      const img = body.slice(q)
      meta.cover = URL.createObjectURL(new Blob([img], { type: mime.includes('/') ? mime : `image/${mime.toLowerCase()}` }))
    }
  }
  return meta
}

export const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
