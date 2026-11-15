import { motion } from 'motion/react'
import { useState } from 'react'
import { backend } from '../lib/backend'
import { DEMO, DEMO_PASSWORD } from '../lib/config'
import { Art } from './Art'

export function Lock({ onOpen }: { onOpen: () => void }) {
  const [pw, setPw] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'no'>('idle')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('busy')
    const ok = await backend.signIn(pw)
    if (ok) onOpen()
    else setState('no')
  }
  return (
    <div className="center-screen">
      <motion.form className="lock" onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="lock-art">
          <Art lottie="1f98a" size={74} />
          <Art lottie="1f496" size={40} style={{ marginBottom: 14 }} />
          <Art lottie="1f43b" size={74} />
        </div>
        <h1 className="display">Rusito & Shily</h1>
        <p className="muted">Nuestro lugar seguro.</p>
        <motion.input
          className="input lock-input"
          type="password"
          placeholder="Nuestra clave"
          value={pw}
          autoFocus
          onChange={(e) => { setPw(e.target.value); setState('idle') }}
          animate={state === 'no' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          aria-label="Clave"
        />
        <button className="btn primary" disabled={!pw || state === 'busy'}>{state === 'busy' ? 'Abriendo…' : 'Entrar'}</button>
        <p className="hint">{state === 'no' ? 'Mmm, esa no es. Probá de nuevo, sin apuro.' : DEMO ? `Vista previa: la clave es "${DEMO_PASSWORD}".` : ' '}</p>
      </motion.form>
    </div>
  )
}
