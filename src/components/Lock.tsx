import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { backend } from '../lib/backend'
import { DEFAULT_PEOPLE, DEMO, DEMO_PASSWORDS, type Who } from '../lib/config'
import { Art } from './Art'

/** Entrada: cada uno elige su perfil y escribe su propia clave. */
export function Lock({ onOpen }: { onOpen: (w: Who) => void }) {
  const [who, setWho] = useState<Who | null>(null)
  const [pw, setPw] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'no'>('idle')
  const P = DEFAULT_PEOPLE
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!who) return
    setState('busy')
    const ok = await backend.signIn(who, pw)
    if (ok) onOpen(who)
    else setState('no')
  }
  return (
    <div className="center-screen">
      <motion.div className="lock" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="display">Rusito & Shily</h1>
        <p className="muted">Nuestro lugar seguro.</p>
        <AnimatePresence mode="wait">
          {!who ? (
            <motion.div key="pick" className="lock-pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="small muted">¿Quién entra?</p>
              <div className="lock-people">
                {(['a', 'b'] as const).map((w) => (
                  <motion.button key={w} className="lock-person" onClick={() => setWho(w)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Art lottie={P[w].animal} size={64} />
                    <span className="who-name">{P[w].name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form key="pw" className="lock-form" onSubmit={submit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="lock-me">
                <button type="button" className="icon-btn" onClick={() => { setWho(null); setPw(''); setState('idle') }} aria-label="Volver"><ArrowLeft size={16} /></button>
                <Art lottie={P[who].animal} size={44} />
                <b>Hola, {P[who].name}</b>
              </div>
              <motion.input
                className="input lock-input"
                type="password"
                placeholder="Tu clave"
                value={pw}
                autoFocus
                onChange={(e) => { setPw(e.target.value); setState('idle') }}
                animate={state === 'no' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                aria-label="Clave"
              />
              <button className="btn primary" disabled={!pw || state === 'busy'}>{state === 'busy' ? 'Abriendo…' : 'Entrar'}</button>
              <p className="hint">{state === 'no' ? 'Mmm, esa no es. Probá de nuevo, sin apuro.' : DEMO ? `Vista previa: la clave es "${DEMO_PASSWORDS[who]}".` : ' '}</p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
