export const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const daysBetween = (a: Date, b: Date) =>
  Math.floor((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000)
export const fmtDay = (k: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) =>
  parseDay(k).toLocaleDateString('es-AR', opts)
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) =>
  new Date(iso).toLocaleString('es-AR', opts)
export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'recién'
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  const d = Math.round(s / 86400)
  return d === 1 ? 'ayer' : `hace ${d} días`
}
export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'
export function dayPart(d = new Date()): DayPart {
  const h = d.getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 18) return 'day'
  if (h >= 18 && h < 21) return 'dusk'
  return 'night'
}
export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 5) return 'Buenas noches'
  if (h < 12) return 'Buen día'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
/** número estable a partir de un texto, para posiciones y elecciones "al azar" pero fijas */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967295
}

/** Diferencia (en minutos) entre la hora de un huso horario y UTC en ese instante. */
function tzOffset(tz: string, at: Date) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]))
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
    return (asUtc - at.getTime()) / 60000
  } catch {
    return -at.getTimezoneOffset()
  }
}
/** El instante exacto en que empezamos: fecha + hora, en el huso horario indicado. */
export function startInstant(day: string, time = '00:00', tz?: string) {
  const [y, m, d] = day.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if (!tz) return new Date(y, m - 1, d, hh || 0, mm || 0)
  const guess = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0))
  return new Date(guess.getTime() - tzOffset(tz, guess) * 60000)
}
/** Años, meses, días, horas, minutos y segundos entre dos instantes (calendario real). */
export function elapsed(from: Date, to = new Date()) {
  if (to <= from) return { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0, totalDays: 0 }
  let y = to.getFullYear() - from.getFullYear()
  let mo = to.getMonth() - from.getMonth()
  const anchor = (yy: number, mm: number) => new Date(from.getFullYear() + yy, from.getMonth() + mm, from.getDate(), from.getHours(), from.getMinutes(), from.getSeconds())
  let total = y * 12 + mo
  if (anchor(0, total) > to) total--
  y = Math.floor(total / 12)
  mo = total % 12
  let rest = to.getTime() - anchor(0, total).getTime()
  const d = Math.floor(rest / 86400000); rest -= d * 86400000
  const h = Math.floor(rest / 3600000); rest -= h * 3600000
  const mi = Math.floor(rest / 60000); rest -= mi * 60000
  const s = Math.floor(rest / 1000)
  return { y, mo, d, h, mi, s, totalDays: Math.floor((to.getTime() - from.getTime()) / 86400000) }
}
