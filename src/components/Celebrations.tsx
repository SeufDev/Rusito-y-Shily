import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ACHIEVEMENTS, useGame } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { usePeople, useStore } from '../lib/store'
import { Art } from './Art'
import { celebrate, useToast } from './ui'

const SEEN = 'nl-achievements-seen'
const LABEL: Record<string, string> = {
  water: 'regó el jardín',
  plot: 'plantó algo nuevo',
  letter: 'te escribió una carta',
  note: 'escondió algo para vos en algún lado…',
  memory: 'guardó un recuerdo',
  capsule: 'enterró una cápsula del tiempo',
  answer: 'respondió la pregunta del día',
  mood: 'contó cómo está hoy',
  care: 'mimó a la mascota',
  song: 'agregó una canción',
  voucher: 'te dejó una raspadita',
  wish: 'pidió un deseo en una estrella',
  comfort: 'dejó un mensaje para tus días grises',
}

/** Logros nuevos y lo que hace el otro en vivo, siempre suave. */
export function Celebrations() {
  const { unlocked } = useGame()
  const { incoming } = useStore()
  const { name } = usePeople()
  const toast = useToast()
  const calm = useCalmMotion()
  const [hearts, setHearts] = useState<number[]>([])
  const first = useRef(true)

  useEffect(() => {
    let seen: string[] | null = null
    try { seen = JSON.parse(localStorage.getItem(SEEN) || 'null') } catch { /* */ }
    const ids = unlocked.map((a) => a.id)
    if (seen === null || first.current) {
      first.current = false
      if (seen === null) {
        try { localStorage.setItem(SEEN, JSON.stringify(ids)) } catch { /* */ }
        return
      }
    }
    const fresh = ids.filter((id) => !seen!.includes(id))
    if (!fresh.length) return
    try { localStorage.setItem(SEEN, JSON.stringify(ids)) } catch { /* */ }
    if (fresh.length > 2) {
      toast({ text: <><b>{fresh.length} logros nuevos</b> · +{fresh.length * 10} semillas. Están en el Jardín.</>, art: { lottie: '2728' } })
      celebrate(calm)
      return
    }
    fresh.forEach((id, i) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id)!
      setTimeout(() => {
        toast({ text: <><b>Logro: {a.name}</b> · +10 semillas</>, art: a })
        celebrate(calm)
      }, i * 900)
    })
  }, [unlocked, toast, calm])

  useEffect(() => {
    if (!incoming) return
    if (incoming.kind === 'hug') {
      setHearts((h) => [...h, Date.now()])
      toast({ text: <><b>{name(incoming.author)}</b> está pensando en vos</>, art: { lottie: '1f497' } })
      return
    }
    const l = LABEL[incoming.kind]
    if (l) toast({ text: <><b>{name(incoming.author)}</b> {l}</>, art: { lottie: '2728' } })
  }, [incoming, name, toast])

  return (
    <div className="hug-layer" aria-hidden>
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h}
            className="hug-burst"
            initial={{ opacity: 0, y: 40, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -120, scale: 1 }}
            transition={{ duration: calm ? 2 : 3.2, ease: 'easeOut' }}
            onAnimationComplete={() => setHearts((x) => x.filter((y) => y !== h))}
          >
            <Art lottie="1f497" size={110} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
