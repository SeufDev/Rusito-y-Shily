import { Moon, Square, Timer } from 'lucide-react'
import { ambient, useAmbient, type Channel } from '../../lib/ambient'
import { Art } from '../Art'

export const CHANNELS: { id: Channel; label: string; art: { lottie?: string; img?: string } }[] = [
  { id: 'lluvia', label: 'Lluvia', art: { lottie: '1f327' } },
  { id: 'olas', label: 'Olas', art: { lottie: '1f30a' } },
  { id: 'viento', label: 'Viento', art: { lottie: '1f32c' } },
  { id: 'fuego', label: 'Fueguito', art: { lottie: '1f525' } },
  { id: 'pajaros', label: 'Pajaritos', art: { lottie: '1f426' } },
  { id: 'grillos', label: 'Grillos', art: { lottie: '1f997' } },
  { id: 'arroyo', label: 'Arroyo', art: { img: 'water_wave' } },
  { id: 'marron', label: 'Ruido suave', art: { img: 'cloud' } },
]
const MIXES: { label: string; set: Partial<Record<Channel, number>> }[] = [
  { label: 'Tarde de lluvia', set: { lluvia: 0.7, fuego: 0.35 } },
  { label: 'Playa de noche', set: { olas: 0.7, grillos: 0.25, viento: 0.15 } },
  { label: 'Bosque', set: { pajaros: 0.55, arroyo: 0.4, viento: 0.2 } },
  { label: 'Para dormir', set: { marron: 0.6, lluvia: 0.3 } },
]

/** Mezclador de sonidos ambiente generados en vivo. */
export function Sounds() {
  const a = useAmbient()
  const on = (c: Channel) => (a.vols[c] ?? 0) > 0
  const left = a.timerEnd ? Math.max(0, Math.round((a.timerEnd - Date.now()) / 60000)) : 0
  return (
    <div className="game-wrap">
      <div className="sound-grid">
        {CHANNELS.map((c) => (
          <div key={c.id} className={`sound ${on(c.id) ? 'on' : ''}`}>
            <button className="sound-btn" onClick={() => ambient.set(c.id, on(c.id) ? 0 : 0.6)} aria-pressed={on(c.id)}>
              <Art {...c.art} size={44} play={on(c.id) ? 'loop' : 'still'} />
              <b>{c.label}</b>
            </button>
            <input type="range" min={0} max={1} step={0.01} value={a.vols[c.id] ?? 0} onChange={(e) => ambient.set(c.id, +e.target.value)} aria-label={`Volumen de ${c.label}`} />
          </div>
        ))}
      </div>
      <div className="chips">
        {MIXES.map((m) => (
          <button key={m.label} className="chip" onClick={() => { CHANNELS.forEach((c) => ambient.set(c.id, m.set[c.id] ?? 0)) }}>{m.label}</button>
        ))}
      </div>
      <div className="row between wrap gap-m">
        <label className="row gap-s grow vol-row"><Moon size={15} /> Volumen
          <input type="range" min={0} max={1} step={0.01} value={a.masterVol} onChange={(e) => ambient.setMaster(+e.target.value)} />
        </label>
        <div className="row gap-s wrap">
          <span className="small muted row gap-xs"><Timer size={14} /> {left ? `Se apaga en ${left} min` : 'Apagar en'}</span>
          {[15, 30, 60].map((m) => <button key={m} className="chip" onClick={() => ambient.setTimer(m)}>{m} min</button>)}
          {a.playing.length > 0 && <button className="btn ghost small" onClick={() => ambient.stopAll()}><Square size={13} /> Silencio</button>}
        </div>
      </div>
      <p className="small muted">Todos los sonidos se generan en vivo, sin archivos. Siguen sonando aunque vayas a otra parte de la web.</p>
    </div>
  )
}
