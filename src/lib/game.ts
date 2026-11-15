import { useMemo } from 'react'
import type { Item } from './backend'
import type { Who } from './config'
import { BASE_PLOTS, speciesById, type Art } from './content'
import { dayKey, daysBetween, parseDay } from './dates'
import { useStore } from './store'

export type Plot = { slot: number; species: string; harvestedAt?: string; giftedTo?: Who; giftedBy?: Who; giftedAt?: string }
export type Water = { plot: string; day: string }
export type Purchase = { what: 'seed' | 'wear' | 'plot'; ref: string; price: number }
export type Care = { action: string; day: string }

export const STAGES = ['Semillita', 'Brotecito', 'Creciendo', 'En flor']
export function plotGrowth(plot: Item<Plot>, waters: Item<Water>[]) {
  const days = new Map<string, Set<string>>()
  for (const w of waters) if (w.data.plot === plot.id) {
    if (!days.has(w.data.day)) days.set(w.data.day, new Set())
    days.get(w.data.day)!.add(w.author ?? '')
  }
  let growth = 0
  let together = 0
  days.forEach((s) => {
    growth += s.size >= 2 ? 2 : 1
    if (s.size >= 2) together++
  })
  const sp = speciesById(plot.data.species)
  const ratio = Math.min(1, growth / sp.days)
  const stage = growth === 0 ? 0 : ratio < 0.5 ? 1 : ratio < 1 ? 2 : 3
  const today = days.get(dayKey()) ?? new Set()
  return { growth, ratio, stage, together, today, sp }
}

export function useGame() {
  const { items, version, me } = useStore()
  return useMemo(() => {
    const by: Record<string, Item[]> = {}
    for (const i of items.values()) (by[i.kind] ??= []).push(i)
    for (const k in by) by[k].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    const k = <T,>(kind: string) => (by[kind] ?? []) as Item<T>[]

    const plots = k<Plot>('plot')
    const waters = k<Water>('water')
    const purchases = k<Purchase>('purchase')
    const cares = k<Care>('care')
    const pet = k<any>('pet')[0]

    // --- huerta ---
    const growths = new Map(plots.map((p) => [p.id, plotGrowth(p, waters)]))
    const activePlots = plots.filter((p) => !p.data.harvestedAt && !p.data.giftedTo)
    const extraPlots = purchases.filter((p) => p.data.what === 'plot').length
    const plotCount = BASE_PLOTS + extraPlots
    let bothDays = 0
    let blooms = 0
    const bloomedSpecies = new Set<string>()
    growths.forEach((g, id) => {
      bothDays += g.together
      if (g.stage === 3) {
        blooms++
        bloomedSpecies.add(plots.find((p) => p.id === id)!.data.species)
      }
    })
    const harvested = plots.filter((p) => p.data.harvestedAt)
    const gifted = plots.filter((p) => p.data.giftedTo)
    const waterDays = new Set(waters.map((w) => w.data.day)).size

    // --- mascota ---
    const careDays = new Set(cares.map((c) => c.data.day)).size
    const hatched = !!pet && cares.length >= 3

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
      hatched: hatched ? 1 : 0,
      careDays,
      cares: cares.length,
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
      wears: purchases.filter((p) => p.data.what === 'wear').length,
    }
    const unlocked = ACHIEVEMENTS.filter((a) => a.test(counts))
    const earned =
      20 +
      waters.length * 2 +
      bothDays * 3 +
      harvested.reduce((s, p) => s + (speciesById(p.data.species).harvest ?? 0), 0) +
      perDay(k('answer'), (i) => i.author + i.data.day) * 5 +
      perDay(k('mood'), (i) => i.author + i.data.day) * 2 +
      perDay(cares, (i) => i.author + i.data.action + i.data.day) * 2 +
      counts.letters * 5 +
      counts.notes * 3 +
      counts.memories * 5 +
      counts.capsules * 5 +
      counts.songs * 2 +
      counts.bucketDone * 10 +
      counts.quiz * 3 +
      counts.wishes * 2 +
      counts.comfort * 5 +
      unlocked.length * 10
    const spent = purchases.reduce((s, p) => s + p.data.price, 0)
    const owned = new Set(purchases.filter((p) => p.data.what === 'wear').map((p) => p.data.ref))
    const seeds = purchases.filter((p) => p.data.what === 'seed').map((p) => p.data.ref)
    // semillas disponibles = compradas - plantadas (el tulipán es infinito)
    const seedStock: Record<string, number> = {}
    seeds.forEach((s) => (seedStock[s] = (seedStock[s] ?? 0) + 1))
    plots.forEach((p) => {
      if (p.data.species !== 'tulipan' && seedStock[p.data.species]) seedStock[p.data.species]--
    })
    return {
      k, plots, waters, activePlots, growths, plotCount, harvested, gifted,
      pet, cares, hatched, careDays,
      counts, unlocked, points: earned - spent, earned, owned, seedStock, me,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, version, me])
}

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
  { id: 'nacio', name: '¡Nació!', desc: 'El huevito se abrió.', lottie: '1f423', test: (c) => c.hatched >= 1 },
  { id: 'mimos', name: 'Muchos mimos', desc: 'Cincuenta cuidados a la mascota.', lottie: '1f43e', test: (c) => c.cares >= 50 },
  { id: 'ropita', name: 'Fashion', desc: 'Compraron la primera prenda.', img: 'womans_clothes', test: (c) => c.wears >= 1 },
  { id: 'placard', name: 'Placard lleno', desc: 'Diez prendas en la colección.', img: 'handbag', test: (c) => c.wears >= 10 },
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
