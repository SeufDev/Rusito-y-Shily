import { Download, Eraser } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ambient } from '../../lib/ambient'
import { Art } from '../Art'

/**
 * Jardín zen: rastrillar la arena, dejar piedritas (que hacen sus propias ondas) y alisar todo cuando se quiera.
 * Nada se guarda, nada se puntúa. Si querés, se puede bajar como imagen.
 */
type Tool = 'rastrillo' | 'fino' | 'dedo' | 'rock' | 'spiral_shell' | 'fallen_leaf'
const TOOLS: { id: Tool; label: string; art?: { img: string } }[] = [
  { id: 'rastrillo', label: 'Rastrillo' },
  { id: 'fino', label: 'Rastrillo fino' },
  { id: 'dedo', label: 'Con el dedo' },
  { id: 'rock', label: 'Piedra', art: { img: 'rock' } },
  { id: 'spiral_shell', label: 'Caracol', art: { img: 'spiral_shell' } },
  { id: 'fallen_leaf', label: 'Hojita', art: { img: 'fallen_leaf' } },
]
const TINES: Record<string, { n: number; gap: number; w: number }> = {
  rastrillo: { n: 5, gap: 9, w: 2.4 },
  fino: { n: 7, gap: 5, w: 1.6 },
  dedo: { n: 1, gap: 0, w: 7 },
}

export function Sand() {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('rastrillo')
  const [sound, setSound] = useState(true)
  const st = useRef({ tool, sound })
  st.current = { tool, sound }
  const api = useRef<{ smooth: () => void; save: () => void } | null>(null)

  useEffect(() => {
    const canvas = cv.current!
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, dpr = 1
    let base: HTMLCanvasElement | null = null
    const imgs: Record<string, HTMLImageElement> = {}
    for (const n of ['rock', 'spiral_shell', 'fallen_leaf']) { const i = new Image(); i.src = `${import.meta.env.BASE_URL}fluent/${n}.png`; imgs[n] = i }
    const paintBase = () => {
      const c = document.createElement('canvas')
      c.width = W * dpr; c.height = H * dpr
      const g = c.getContext('2d')!
      g.scale(dpr, dpr)
      const grad = g.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, '#efe3cc'); grad.addColorStop(1, '#e6d6ba')
      g.fillStyle = grad
      g.fillRect(0, 0, W, H)
      for (let i = 0; i < W * H * 0.06; i++) {
        const v = Math.random()
        g.fillStyle = v < 0.5 ? `rgba(150,120,80,${Math.random() * 0.12})` : `rgba(255,252,240,${Math.random() * 0.25})`
        g.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }
      return c
    }
    const resize = () => {
      const r = wrap.current!.getBoundingClientRect()
      const keep = W ? (() => { const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; c.getContext('2d')!.drawImage(canvas, 0, 0); return c })() : null
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = r.width
      H = Math.max(300, Math.min(520, r.width * 0.6))
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      base = paintBase()
      ctx.drawImage(base, 0, 0, W, H)
      if (keep) ctx.drawImage(keep, 0, 0, W, H)
      else waves()
    }
    // arranca con unas ondas lindas
    const waves = () => {
      const t = TINES.rastrillo
      for (let y = 40; y < H; y += t.n * t.gap + 10) {
        let px = -10, py = y
        for (let x = 0; x <= W + 10; x += 6) {
          const ny = y + Math.sin(x / 70) * 8
          groove(px, py, x, ny, t)
          px = x; py = ny
        }
      }
    }
    const groove = (x0: number, y0: number, x1: number, y1: number, t: { n: number; gap: number; w: number }) => {
      const a = Math.atan2(y1 - y0, x1 - x0)
      const nx = Math.cos(a + Math.PI / 2)
      const ny = Math.sin(a + Math.PI / 2)
      ctx.lineCap = 'round'
      for (let i = 0; i < t.n; i++) {
        const o = (i - (t.n - 1) / 2) * t.gap
        const ax = x0 + nx * o, ay = y0 + ny * o, bx = x1 + nx * o, by = y1 + ny * o
        ctx.beginPath(); ctx.moveTo(ax + 0.9, ay + 1.1); ctx.lineTo(bx + 0.9, by + 1.1)
        ctx.strokeStyle = 'rgba(255,250,236,.75)'; ctx.lineWidth = t.w * 0.75; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ax - 0.7, ay - 0.8); ctx.lineTo(bx - 0.7, by - 0.8)
        ctx.strokeStyle = 'rgba(120,92,58,.38)'; ctx.lineWidth = t.w * 0.7; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by)
        ctx.strokeStyle = 'rgba(196,170,128,.55)'; ctx.lineWidth = t.w * 0.55; ctx.stroke()
      }
    }
    const place = (name: string, x: number, y: number) => {
      const img = imgs[name]
      const s = name === 'rock' ? 46 + Math.random() * 30 : 34 + Math.random() * 10
      // ondas alrededor, como en los jardines japoneses
      if (name === 'rock') {
        for (let k = 1; k <= 3; k++) {
          const r = s * 0.62 + k * 13
          let px = x + r, py = y
          for (let a = 0.12; a <= Math.PI * 2 + 0.13; a += 0.12) {
            const nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r * 0.82
            groove(px, py, nx, ny, { n: 1, gap: 0, w: 2.4 })
            px = nx; py = ny
          }
        }
      }
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(x + 5, y + s * 0.32, s * 0.48, s * 0.18, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(90,70,40,.22)'
      ctx.filter = 'blur(3px)'
      ctx.fill()
      ctx.restore()
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((Math.random() - 0.5) * 0.8)
      if (img.complete) ctx.drawImage(img, -s / 2, -s / 2, s, s)
      ctx.restore()
      if (st.current.sound) ambient.plop(0.08)
    }

    // sonido de arena: ruido filtrado que sube con la velocidad
    let scrape: { g: GainNode; src: AudioBufferSourceNode } | null = null
    const startScrape = () => {
      if (!st.current.sound || scrape) return
      const ac = ambient.ensure()
      const src = ambient.noise('pink')
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.6
      const g = ac.createGain(); g.gain.value = 0
      src.connect(f).connect(g).connect(ambient.master!)
      scrape = { g, src }
    }
    const stopScrape = () => { if (scrape) { const s = scrape; s.g.gain.setTargetAtTime(0, ambient.ctx!.currentTime, 0.05); setTimeout(() => s.src.stop(), 300); scrape = null } }

    let drawing = false
    let last = { x: 0, y: 0 }
    let lastT = 0
    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const down = (e: PointerEvent) => {
      const p = pos(e)
      const t = st.current.tool
      if (t === 'rock' || t === 'spiral_shell' || t === 'fallen_leaf') { place(t, p.x, p.y); return }
      drawing = true
      last = p
      lastT = performance.now()
      canvas.setPointerCapture(e.pointerId)
      startScrape()
    }
    const move = (e: PointerEvent) => {
      if (!drawing) return
      const p = pos(e)
      const d = Math.hypot(p.x - last.x, p.y - last.y)
      if (d < 3) return
      const now = performance.now()
      const steps = Math.ceil(d / 3)
      const t = TINES[st.current.tool]
      let px = last.x, py = last.y
      for (let i = 1; i <= steps; i++) {
        const nx = last.x + ((p.x - last.x) * i) / steps
        const ny = last.y + ((p.y - last.y) * i) / steps
        groove(px, py, nx, ny, t)
        px = nx; py = ny
      }
      if (scrape) scrape.g.gain.setTargetAtTime(Math.min(0.5, (d / Math.max(8, now - lastT)) * 0.5), ambient.ctx!.currentTime, 0.05)
      last = p
      lastT = now
    }
    const up = () => { drawing = false; stopScrape() }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    api.current = {
      smooth: () => {
        if (!base) return
        let k = 0
        const step = () => {
          ctx.globalAlpha = 0.12
          ctx.drawImage(base!, 0, 0, W, H)
          ctx.globalAlpha = 1
          if (++k < 26) requestAnimationFrame(step)
          else ctx.drawImage(base!, 0, 0, W, H)
        }
        step()
      },
      save: () => {
        canvas.toBlob((b) => {
          if (!b) return
          const a = document.createElement('a')
          a.href = URL.createObjectURL(b)
          a.download = 'jardin-zen.png'
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 2000)
        })
      },
    }
    resize()
    const ro = new ResizeObserver(() => { const r = wrap.current!.getBoundingClientRect(); if (Math.abs(r.width - W) > 2) resize() })
    ro.observe(wrap.current!)
    return () => { ro.disconnect(); stopScrape(); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up) }
  }, [])

  return (
    <div className="game-wrap">
      <div className="tool-row">
        {TOOLS.map((t) => (
          <button key={t.id} className={`chip ${tool === t.id ? 'on' : ''}`} onClick={() => setTool(t.id)}>
            {t.art ? <Art img={t.art.img} size={18} /> : <RakeIcon n={TINES[t.id].n} />} {t.label}
          </button>
        ))}
      </div>
      <div ref={wrap} className="sandbox">
        <canvas ref={cv} aria-label="Arena para rastrillar" />
      </div>
      <div className="row between wrap gap-s">
        <div className="row gap-s">
          <button className="btn ghost small" onClick={() => api.current?.smooth()}><Eraser size={14} /> Alisar la arena</button>
          <button className="btn ghost small" onClick={() => api.current?.save()}><Download size={14} /> Guardar imagen</button>
        </div>
        <label className="row gap-s small"><input type="checkbox" className="switch" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sonido de arena</label>
      </div>
    </div>
  )
}

function RakeIcon({ n }: { n: number }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      {Array.from({ length: Math.min(n, 5) }, (_, i) => {
        const x = n === 1 ? 9 : 3 + (i * 12) / (Math.min(n, 5) - 1)
        return <line key={i} x1={x} y1="4" x2={x} y2="14" stroke="currentColor" strokeWidth={n === 1 ? 3 : 1.4} strokeLinecap="round" />
      })}
    </svg>
  )
}
