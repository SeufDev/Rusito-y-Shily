import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { Item } from '../lib/backend'
import type { Who } from '../lib/config'
import { hash } from '../lib/dates'
import { usePeople, useItems, useStore } from '../lib/store'
import { Art } from './Art'
import { Modal } from './ui'

export type Note = { to: Who; place: string; text: string; found?: string }
export const PLACES = [
  { id: '/', label: 'Hoy' },
  { id: '/jardin', label: 'el jardín' },
  { id: '/mascota', label: 'la casita de la mascota' },
  { id: '/cartas', label: 'las cartas' },
  { id: '/recuerdos', label: 'la caja de recuerdos' },
  { id: '/juntos', label: 'Juntos' },
  { id: '/calma', label: 'el rincón de calma' },
]

/** Lucecitas que aparecen en cada sección cuando el otro te escondió una nota ahí. */
export function HiddenNotes({ place }: { place: string }) {
  const { me, update } = useStore()
  const { name } = usePeople()
  const notes = useItems<Note>('note').filter((n) => n.data.to === me && !n.data.found && n.data.place === place)
  const [open, setOpen] = useState<Item<Note> | null>(null)
  return (
    <>
      <AnimatePresence>
        {notes.map((n) => {
          const x = 8 + hash(n.id) * 80
          const y = 18 + hash(n.id + 'y') * 64
          return (
            <motion.button
              key={n.id}
              className="firefly"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 2 }}
              aria-label="Algo brilla acá"
              onClick={() => {
                setOpen(n)
                update(n.id, { ...n.data, found: new Date().toISOString() })
              }}
            >
              <span className="firefly-glow" />
            </motion.button>
          )
        })}
      </AnimatePresence>
      <Modal open={!!open} onClose={() => setOpen(null)} label="Nota escondida">
        {open && (
          <div className="note-reveal">
            <Art lottie="1f48b" size={64} play="once" />
            <p className="eyebrow">Una nota escondida de {name(open.author)}</p>
            <p className="note-text">{open.data.text}</p>
          </div>
        )}
      </Modal>
    </>
  )
}
