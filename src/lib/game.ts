import { useEffect, useMemo, useState } from 'react'
import type { Item } from './backend'
import type { Who } from './config'
import { BASE_PLOTS, DECO, PET_PRICES, SPECIES, speciesById, WEAR, type Art, type Species } from './content'
import { dayKey, daysBetween, parseDay } from './dates'
import { useStore } from './store'

export type Plot = { slot: number; species: string; name?: string; harvestedAt?: string; giftedTo?: Who; giftedBy?: Who; giftedAt?: string }
export type Water = { plot: string; day: string }
export type Purchase = { what: 'seed' | 'wear' | 'plot' | 'upgrade' | 'supply' | 'deco' | 'pet'; ref: string; price: number }
export type Use = { what: 'abono' | 'lluvia'; plot?: string }
export type Collect = { plot: string; n: number; species: string }
export type Care = { action: string; day: string; pet?: string; food?: string }
export type PetData = { species: string; name: string; trait?: string }

const H = 3600_000
export const ABONO_H = 12
/** Reloj compartido para que todo lo que crece en tiempo real se actualice solo. */
export function useNow(every = 30_000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every])
  return now
}

export const STAGES = ['Semillita', 'Brote', 'Creciendo', 'Pimpollo', 'En flor']
export const stageName = (stage: number, sp: Species) =>
  stage < 4 ? STAGES[stage] : sp.type === 'huerta' ? 'Lista para cosechar' : sp.type === 'frutal' ? 'Dando frutos' : 'En flor'

type Opts = { moistH: number; speed: number; every: number; cap: number }
function merge(list: [number, number][]) {
  list.sort((x, y) => x[0] - y[0])
  const out: [number, number][] = []
  for (const w of list) {
    const last = out[out.length - 1]
    if (last && w[0] <= last[1]) last[1] = Math.max(last[1], w[1])
    else out.push([w[0], w[1]])
  }
  return out
}
const covers = (list: [number, number][], t: number) => list.find((w) => w[0] <= t && t < w[1])

/**
 * Crecimiento en tiempo real: cada riego deja la tierra húmeda un rato (24 h, o 36 con la regadera grande).
 * Mientras la tierra está húmeda la planta crece; si están húmedos los riegos de los dos, crece el doble.
 * Si se seca, simplemente espera. Nunca se marchita.
 */
export function plotGrowth(plot: Item<Plot>, waters: Item<Water>[], rains: Item<Use>[], boosts: Item<Use>[], collects: Item<Collect>[], o: Opts, now: number) {
  const sp = speciesById(plot.data.species)
  const need = sp.days * 24
  const t0 = Date.parse(plot.created_at)
  const tEnd = Math.min(now, plot.data.harvestedAt ? Date.parse(plot.data.harvestedAt) : Infinity, plot.data.giftedAt ? Date.parse(plot.data.giftedAt) : Infinity)
  const win: Record<string, [number, number][]> = { a: [], b: [] }
  const today = new Set<string>()
  const dayWho = new Map<string, Set<string>>()
  for (const w of waters) {
    const t = Date.parse(w.created_at)
    const who = w.author ?? 'a'
    win[who]?.push([t, t + o.moistH * H])
    if (w.data.day === dayKey(new Date(now))) today.add(who)
    if (!dayWho.has(w.data.day)) dayWho.set(w.data.day, new Set())
    dayWho.get(w.data.day)!.add(who)
  }
  for (const r of rains) {
    const t = Date.parse(r.created_at)
    if (t >= t0 - 60_000) {
      win.a.push([t, t + 24 * H])
      win.b.push([t, t + 24 * H])
    }
  }
  const A = merge(win.a)
  const B = merge(win.b)
  const marks = new Set<number>([t0, tEnd])
  for (const w of [...A, ...B]) for (const t of w) if (t > t0 && t < tEnd) marks.add(t)
  const boostAt = boosts.map((b) => Date.parse(b.created_at)).filter((t) => t <= tEnd)
  for (const t of boostAt) if (t > t0) marks.add(t)
  const pts = [...marks].sort((x, y) => x - y)
  let growth = 0
  let bloomAt: number | undefined
  for (let i = 0; i < pts.length && bloomAt === undefined; i++) {
    const s = pts[i]
    for (const b of boostAt) if (b === s || (i === 0 && b < s)) growth += ABONO_H
    if (growth >= need) { growth = need; bloomAt = s; break }
    const e = pts[i + 1]
    if (e === undefined) break
    const mid = (s + e) / 2
    const rate = o.speed * ((covers(A, mid) ? 1 : 0) + (covers(B, mid) ? 1 : 0))
    const add = (rate * (e - s)) / H
    if (rate > 0 && growth + add >= need) {
      bloomAt = s + ((need - growth) / rate) * H
      growth = need
    } else growth += add
  }
  const ratio = Math.min(1, growth / need)
  const stage = ratio >= 1 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : ratio >= 0.1 ? 1 : 0
  const moist = { a: Math.max(0, ((covers(A, now)?.[1] ?? now) - now) / H), b: Math.max(0, ((covers(B, now)?.[1] ?? now) - now) / H) }
  let together = 0
  dayWho.forEach((s) => s.size >= 2 && together++)
  // néctar o frutas de las plantas que ya florecieron
  let ready = 0
  let nextIn = 0
  if (bloomAt !== undefined && sp.type !== 'huerta' && !plot.data.harvestedAt && !plot.data.giftedTo) {
    let last = bloomAt
    for (const c of collects) last = Math.max(last, Date.parse(c.created_at))
    const made = (now - last) / (o.every * H)
    ready = Math.min(o.cap, Math.floor(made))
    nextIn = ready >= o.cap ? 0 : (1 - (made % 1)) * o.every
  }
  return { sp, growth, need, ratio, stage, bloomAt, moist, wet: moist.a > 0 || moist.b > 0, both: moist.a > 0 && moist.b > 0, today, together, ready, nextIn, left: Math.max(0, need - growth) }
}
export type Growth = ReturnType<typeof plotGrowth>

/** Lo que vale cada gotita de néctar o fruta. */
export const yieldValue = (sp: Species) => (sp.type === 'árbol' ? 3 : sp.type === 'frutal' ? 2 : 1 + Math.floor(sp.price / 30))

export function useGame() {
  const { items, version, me } = useStore()
  const tick = useNow()
  return useMemo(() => {
    // el reloj avanza cada 30 s; si recién regaron, se usa la hora de ahora para que se note al instante
    const now = Math.max(tick, Date.now())
    const by: Record<string, Item[]> = {}
    for (const i of items.values()) (by[i.kind] ??= []).push(i)
    for (const k in by) by[k].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    const k = <T,>(kind: string) => (by[kind] ?? []) as Item<T>[]

    const plots = k<Plot>('plot')
    const waters = k<Water>('water')
    const purchases = k<Purchase>('purchase')
    const uses = k<Use>('use')
    const collects = k<Collect>('collect')
    const cares = k<Care>('care')
    const pets = k<PetData>('pet')
    const pet = pets[0]

    // --- mejoras ---
    const upgrades = new Set(purchases.filter((p) => p.data.what === 'upgrade').map((p) => p.data.ref))
    const supplies: Record<string, number> = {}
    purchases.filter((p) => p.data.what === 'supply').forEach((p) => (supplies[p.data.ref] = (supplies[p.data.ref] ?? 0) + 1))
    uses.forEach((u) => (supplies[u.data.what] = (supplies[u.data.what] ?? 0) - 1))
    const opts: Opts = {
      moistH: upgrades.has('regadera') ? 36 : 24,
      speed: upgrades.has('invernadero') ? 1.25 : 1,
      every: upgrades.has('colmena') ? 2.5 : 4,
      cap: upgrades.has('farolitos') ? 12 : 6,
    }

    // --- jardín ---
    const rains = uses.filter((u) => u.data.what === 'lluvia')
    const group = <T extends { plot?: string },>(list: Item<T>[]) => {
      const m = new Map<string, Item<T>[]>()
      for (const x of list) if (x.data.plot) (m.get(x.data.plot) ?? m.set(x.data.plot, []).get(x.data.plot)!).push(x)
      return m
    }
    const wBy = group(waters)
    const bBy = group(uses.filter((u) => u.data.what === 'abono'))
    const cBy = group(collects)
    const growths = new Map(plots.map((p) => [p.id, plotGrowth(p, wBy.get(p.id) ?? [], rains, bBy.get(p.id) ?? [], cBy.get(p.id) ?? [], opts, now)]))
    const activePlots = plots.filter((p) => !p.data.harvestedAt && !p.data.giftedTo)
    const extraPlots = purchases.filter((p) => p.data.what === 'plot').length
    const plotCount = BASE_PLOTS + extraPlots
    let bothDays = 0
    let blooms = 0
    const bloomedSpecies = new Map<string, { at: number; plot: Item<Plot> }>()
    growths.forEach((g, id) => {
      bothDays += g.together
      if (g.bloomAt !== undefined) {
        blooms++
        const p = plots.find((x) => x.id === id)!
        const prev = bloomedSpecies.get(p.data.species)
        if (!prev || g.bloomAt < prev.at) bloomedSpecies.set(p.data.species, { at: g.bloomAt, plot: p })
      }
    })
    const harvested = plots.filter((p) => p.data.harvestedAt)
    const gifted = plots.filter((p) => p.data.giftedTo)
    const waterDays = new Set(waters.map((w) => w.data.day)).size
    const readyTotal = activePlots.reduce((s, p) => s + (growths.get(p.id)?.ready ?? 0), 0)

    // --- despensa: lo cosechado y las frutas, menos lo que comieron los animalitos ---
    const pantry: Record<string, number> = {}
    harvested.forEach((p) => (pantry[p.data.species] = (pantry[p.data.species] ?? 0) + 2))
    collects.forEach((c) => {
      if (speciesById(c.data.species).type === 'frutal') pantry[c.data.species] = (pantry[c.data.species] ?? 0) + c.data.n
    })
    cares.forEach((c) => {
      if (c.data.action === 'comer' && c.data.food && c.data.food !== 'galletita') pantry[c.data.food] = (pantry[c.data.food] ?? 0) - 1
    })

    // --- casita ---
    const careDays = new Set(cares.map((c) => c.data.day)).size
    const decoIds = new Set(DECO.map((d) => d.id))
    const ownedDeco = new Set([...DECO.filter((d) => d.price === 0).map((d) => d.id), ...purchases.filter((p) => p.data.what === 'deco' || (p.data.what === 'wear' && decoIds.has(p.data.ref))).map((p) => p.data.ref)])
    const owned = new Set([...WEAR.filter((w) => w.price === 0).map((w) => w.id), ...purchases.filter((p) => p.data.what === 'wear' && !decoIds.has(p.data.ref)).map((p) => p.data.ref)])
    const nextPetPrice = PET_PRICES[pets.length] ?? null

    // --- semillas (puntos compartidos) ---
    const perDay = (list: Item<any>[], key: (i: Item<any>) => string) => new Set(list.map(key)).size
    const counts = {
      waters: waters.length,
      bothDays,
      blooms,
      harvests: harvested.length,
      gifts: gifted.length,
      species: bloomedSpecies.size,
      waterDays,
      plotsPlanted: plots.length,
      hatched: pets.length ? 1 : 0,
      pets: pets.length,
      careDays,
      cares: cares.length,
      nectar: collects.reduce((s, c) => s + c.data.n, 0),
      upgrades: upgrades.size,
      decos: ownedDeco.size,
      outfits: k('outfit').length,
      letters: k('letter').length,
      notes: k('note').length,
      memories: k('memory').length,
      capsules: k('capsule').length,
      songs: k('song').length,
      answers: k('answer').length,
      moods: k('mood').length,
      hugs: k('hug').length,
      bucketDone: k<any>('bucket').filter((b) => b.data.done).length,
      wishes: k('wish').length,
      vouchers: k('voucher').length,
      quiz: k('quiz').length + k('quizans').length,
      comfort: k('comfort').length,
      wears: owned.size - WEAR.filter((w) => w.price === 0).length,
      lanterns: k('lantern').length,
    }
    const unlocked = ACHIEVEMENTS.filter((a) => a.test(counts))
    const earned =
      20 +
      waters.length * 2 +
      bothDays * 3 +
      harvested.reduce((s, p) => s + (speciesById(p.data.species).harvest ?? 0), 0) +
      collects.reduce((s, c) => s + c.data.n * yieldValue(speciesById(c.data.species)), 0) +
      perDay(k('answer'), (i) => i.author + i.data.day) * 5 +
      perDay(k('mood'), (i) => i.author + i.data.day) * 2 +
      perDay(cares, (i) => i.author + i.data.action + (i.data.pet ?? '') + i.data.day) * 2 +
      counts.letters * 5 +
      counts.notes * 3 +
      counts.memories * 5 +
      counts.capsules * 5 +
      counts.songs * 2 +
      counts.bucketDone * 10 +
      counts.quiz * 3 +
      counts.wishes * 2 +
      counts.comfort * 5 +
      counts.outfits * 3 +
      unlocked.length * 10
    const spent = purchases.reduce((s, p) => s + p.data.price, 0)
    const seeds = purchases.filter((p) => p.data.what === 'seed').map((p) => p.data.ref)
    // semillas disponibles = compradas - plantadas (el tulipán es infinito)
    const seedStock: Record<string, number> = {}
    seeds.forEach((s) => (seedStock[s] = (seedStock[s] ?? 0) + 1))
    plots.forEach((p) => {
      if (speciesById(p.data.species).price > 0 && seedStock[p.data.species]) seedStock[p.data.species]--
    })
    return {
      k, now, opts, plots, waters, activePlots, growths, plotCount, harvested, gifted, bloomedSpecies, readyTotal,
      upgrades, supplies, pantry,
      pets, pet, cares, careDays, ownedDeco, nextPetPrice,
      counts, unlocked, points: earned - spent, earned, owned, seedStock, me,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, version, me, tick])
}
/** Especies que hay en el catálogo, para el herbario. */
export const ALL_SPECIES = SPECIES

type Counts = Record<string, number>
export type Achievement = Art & { id: string; name: string; desc: string; test: (c: Counts) => boolean }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primera-semilla', name: 'Primera semillita', desc: 'Plantaron la primera planta.', lottie: '1f331', test: (c) => c.plotsPlanted >= 1 },
  { id: 'primer-riego', name: 'Primer riego', desc: 'Alguien regó por primera vez.', lottie: '1f4a7', test: (c) => c.waters >= 1 },
  { id: 'a-dos-manos', name: 'A dos manos', desc: 'Los dos regaron la misma planta el mismo día.', lottie: '1f493', test: (c) => c.bothDays >= 1 },
  { id: 'primera-flor', name: 'Primera flor', desc: 'Una planta llegó a florecer.', lottie: '1f337', test: (c) => c.blooms >= 1 },
  { id: 'jardin-variado', name: 'Jardín variado', desc: 'Cinco especies distintas en flor.', lottie: '1f490', test: (c) => c.species >= 5 },
  { id: 'cosecha', name: 'Primera cosecha', desc: 'Cosecharon algo de la huerta.', lottie: '1f345', test: (c) => c.harvests >= 1 },
  { id: 'huerta-llena', name: 'Huerta generosa', desc: 'Diez cosechas.', lottie: '1f966', test: (c) => c.harvests >= 10 },
  { id: 'regalo-flor', name: 'Flor de regalo', desc: 'Se regalaron una flor del jardín.', lottie: '1f339', test: (c) => c.gifts >= 1 },
  { id: 'constancia-suave', name: 'Siete días de jardín', desc: 'Siete días distintos con algún riego (no importa cuándo).', lottie: '1f340', test: (c) => c.waterDays >= 7 },
  { id: 'treinta-dias', name: 'Un mes de verde', desc: 'Treinta días distintos con algún riego.', lottie: '1f332', test: (c) => c.waterDays >= 30 },
  { id: 'nacio', name: 'Llegó a casa', desc: 'Adoptaron al primer animalito.', img: 'house', test: (c) => c.hatched >= 1 },
  { id: 'familia', name: 'Familia grande', desc: 'Tres animalitos viviendo en la casita.', img: 'paw_prints', test: (c) => c.pets >= 3 },
  { id: 'nectar', name: 'Gotitas dulces', desc: 'Juntaron 50 gotitas de néctar y frutas.', img: 'honey_pot', test: (c) => c.nectar >= 50 },
  { id: 'mejoras', name: 'Jardineros', desc: 'Compraron la primera mejora del jardín.', img: 'bucket', test: (c) => c.upgrades >= 1 },
  { id: 'deco', name: 'Casita linda', desc: 'Cinco cosas para decorar la casita.', img: 'couch_and_lamp', test: (c) => c.decos >= 5 },
  { id: 'outfit', name: 'Lookbook', desc: 'Armaron el primer outfit.', img: 'dress', test: (c) => c.outfits >= 1 },
  { id: 'farolito', name: 'Soltar', desc: 'Dejaron ir algo en un farolito.', img: 'red_paper_lantern', test: (c) => c.lanterns >= 1 },
  { id: 'mimos', name: 'Muchos mimos', desc: 'Cincuenta mimos en la casita.', lottie: '1f43e', test: (c) => c.cares >= 50 },
  { id: 'ropita', name: 'Fashion', desc: 'Compraron la primera prenda para el placard.', img: 'womans_clothes', test: (c) => c.wears >= 1 },
  { id: 'placard', name: 'Placard lleno', desc: 'Diez prendas en el placard.', img: 'handbag', test: (c) => c.wears >= 10 },
  { id: 'primera-carta', name: 'Primera carta', desc: 'Alguien escribió una carta.', lottie: '1f48c', test: (c) => c.letters >= 1 },
  { id: 'nota-escondida', name: 'Secretitos', desc: 'Escondieron una nota.', lottie: '1f48b', test: (c) => c.notes >= 1 },
  { id: 'primer-recuerdo', name: 'Primer recuerdo', desc: 'Guardaron un recuerdo en la caja.', lottie: '1f4f8', test: (c) => c.memories >= 1 },
  { id: 'capsula', name: 'Al futuro', desc: 'Enterraron una cápsula del tiempo.', img: 'old_key', test: (c) => c.capsules >= 1 },
  { id: 'playlist', name: 'Nuestra música', desc: 'Cinco canciones en la playlist.', lottie: '1f3b6', test: (c) => c.songs >= 5 },
  { id: 'charlas', name: 'Charlas lindas', desc: 'Diez respuestas a la pregunta del día.', lottie: '1f917', test: (c) => c.answers >= 10 },
  { id: 'abrazos', name: 'Abrazos a distancia', desc: 'Veinte "pensando en vos".', lottie: '1f497', test: (c) => c.hugs >= 20 },
  { id: 'deseo', name: 'Pedir un deseo', desc: 'Dejaron un deseo en una estrella.', lottie: '1f31f', test: (c) => c.wishes >= 1 },
  { id: 'sueno-cumplido', name: 'Sueño cumplido', desc: 'Tacharon algo de la lista de deseos.', lottie: '1f308', test: (c) => c.bucketDone >= 1 },
  { id: 'cuidado', name: 'Para los días grises', desc: 'Dejaron un mensaje para cuando el otro esté mal.', lottie: '1f90d', test: (c) => c.comfort >= 1 },
]

export function daysTogether(start: string, now = new Date()) {
  return Math.max(0, daysBetween(parseDay(start), now))
}
