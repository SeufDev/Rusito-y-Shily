import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Art } from '../components/Art'
import { PageHead, useToast } from '../components/ui'
import { backend } from '../lib/backend'
import { DEMO, type Who } from '../lib/config'
import { PETS } from '../lib/content'
import { setCalmMotion, useCalmMotion } from '../lib/motion'
import { usePeople, useStore } from '../lib/store'

const AVATARS = [...PETS.map((p) => p.lottie), '1f438', '1f984', '1f427', '1f994', '1f9a6', '1f9a5', '1f422', '1f424', '1f98b', '1f41d', '1f426', '1f989', '1f42c']

export default function Settings() {
  const { settings, saveSettings, me } = useStore()
  const { P } = usePeople()
  const calm = useCalmMotion()
  const toast = useToast()
  const [names, setNames] = useState({ a: P.a.name, b: P.b.name })
  const savePerson = (w: Who, patch: Partial<(typeof P)['a']>) =>
    saveSettings({ people: { ...settings.people, [w]: { ...settings.people[w], ...patch } } })
  return (
    <div className="stack-l narrow">
      <PageHead art={{ img: 'key' }} title="Ajustes" />
      <section className="card stack-m">
        <h3 className="section-t">Nosotros</h3>
        {(['a', 'b'] as const).map((w) => (
          <div key={w} className="stack-s">
            <div className="row gap-s">
              <Art lottie={P[w].animal} size={40} play="still" />
              <input className="input grow" value={names[w]} onChange={(e) => setNames({ ...names, [w]: e.target.value })} onBlur={() => names[w].trim() && savePerson(w, { name: names[w].trim() })} aria-label="Nombre" />
            </div>
            <div className="avatar-row">
              {AVATARS.map((a) => (
                <button key={a} className={`avatar-opt ${P[w].animal === a ? 'on' : ''}`} onClick={() => savePerson(w, { animal: a })}><Art lottie={a} size={30} play="still" /></button>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="card stack-m">
        <h3 className="section-t">Fechas</h3>
        <label className="field">Empezamos el
          <input className="input" type="date" value={settings.start} onChange={(e) => e.target.value && saveSettings({ start: e.target.value })} />
        </label>
        <label className="field">Próximo encuentro
          <input className="input" type="date" value={settings.nextMeet ?? ''} onChange={(e) => saveSettings({ nextMeet: e.target.value || undefined })} />
        </label>
      </section>
      <section className="card stack-m">
        <h3 className="section-t">En este dispositivo</h3>
        <label className="row between gap-m toggle-row">
          <span><b>Movimiento tranquilo</b><br /><span className="small muted">Menos animaciones, nada que salte. Ideal para días sensibles.</span></span>
          <input type="checkbox" className="switch" checked={calm} onChange={(e) => setCalmMotion(e.target.checked)} />
        </label>
        <div className="row between gap-m wrap">
          <span>Entraste como <b>{P[me].name}</b>, con tu propia clave.</span>
          <button className="btn ghost small" onClick={async () => { await backend.signOut(); location.reload() }}><LogOut size={15} /> Cerrar sesión</button>
        </div>
        {DEMO && (
          <button className="btn ghost small" onClick={() => { localStorage.removeItem('nl-demo-items'); localStorage.removeItem('nl-achievements-seen'); toast({ text: 'Vista previa reiniciada' }); setTimeout(() => location.reload(), 600) }}>
            Reiniciar la vista previa
          </button>
        )}
      </section>
      <p className="small muted center">Animaciones: Noto Emoji de Google (CC BY 4.0). Ilustraciones 3D: Fluent Emoji de Microsoft (MIT).</p>
    </div>
  )
}
