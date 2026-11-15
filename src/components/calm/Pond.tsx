import { useEffect, useRef, useState } from 'react'
import { ambient } from '../../lib/ambient'
import { useCalmMotion } from '../../lib/motion'

/**
 * Un estanque con kois dibujados en vivo. Tocar el agua hace ondas y deja comidita;
 * los peces se acercan despacito. No hay puntos ni objetivos: solo mirar.
 */
type V = { x: number; y: number }
type Koi = { segs: V[]; ang: number; speed: number; base: number; target: V; size: number; body: string; patch: string; spots: [number, number, number][]; phase: number; scare: number; fin: string }
type Food = { x: number; y: number; t: number }
type Ripple = { x: number; y: number; r: number; max: number; a: number }
type Pad = { x: number; y: number; r: number; rot: number; flower: boolean; drift: number }
type Petal = { x: number; y: number; rot: number; vr: number; vx: number; vy: number; s: number }

const SCHEMES = [
  { body: '#fbf6ef', patch: '#e2553b', fin: 'rgba(255,250,245,.75)' }, // kohaku
  { body: '#f2b545', patch: '#f7d77a', fin: 'rgba(255,220,140,.7)' }, // ogon
  { body: '#fbf3ea', patch: '#1f1f22', fin: 'rgba(255,245,240,.7)' }, // shiro
  { body: '#f08a5d', patch: '#fff4e6', fin: 'rgba(255,200,170,.7)' }, // naranja
  { body: '#f6c6c8', patch: '#e88a9a', fin: 'rgba(255,225,230,.75)' }, // rosadita (para ella)
  { body: '#a9b9c9', patch: '#e9784e', fin: 'rgba(220,230,240,.7)' }, // asagi
  { body: '#fbf6ef', patch: '#e2553b', fin: 'rgba(255,250,245,.75)' },
]
const N = 14

export function Pond() {
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const calm = useCalmMotion()
  const [sound, setSound] = useState(true)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const lotus = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = `${import.meta.env.BASE_URL}fluent/lotus.png`
    lotus.current = img
    const canvas = cv.current!
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, dpr = 1
    let bg: HTMLCanvasElement | null = null
    const kois: Koi[] = []
    const food: Food[] = []
    const ripples: Ripple[] = []
    const pads: Pad[] = []
    const petals: Petal[] = []
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const randTarget = (): V => ({ x: rnd(W * 0.1, W * 0.9), y: rnd(H * 0.12, H * 0.88) })

    const resize = () => {
      const r = wrap.current!.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = r.width
      H = Math.max(320, Math.min(560, r.width * 0.62))
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bg = paintBg(W, H, dpr)
      if (!kois.length) {
        const count = W < 500 ? 5 : 7
        for (let i = 0; i < count; i++) {
          const s = SCHEMES[i % SCHEMES.length]
          const size = rnd(0.85, 1.2) * Math.min(1, Math.max(0.7, W / 900)) * 26
          const start = randTarget()
          const ang = rnd(0, Math.PI * 2)
          kois.push({
            segs: Array.from({ length: N }, (_, k) => ({ x: start.x - Math.cos(ang) * k * size * 0.42, y: start.y - Math.sin(ang) * k * size * 0.42 })),
            ang, speed: 0, base: rnd(0.55, 0.9), target: randTarget(), size, body: s.body, patch: s.patch, fin: s.fin, phase: rnd(0, 6), scare: 0,
            spots: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => [rnd(0.08, 0.75), rnd(-0.5, 0.5), rnd(0.35, 0.8)] as [number, number, number]),
          })
        }
        const padCount = W < 500 ? 4 : 6
        for (let i = 0; i < padCount; i++) {
          const edge = i % 2 ? rnd(0.06, 0.24) : rnd(0.76, 0.94)
          pads.push({ x: (i < padCount / 2 ? edge : rnd(0.25, 0.75)) * W, y: (i < padCount / 2 ? rnd(0.15, 0.85) : i % 2 ? rnd(0.06, 0.2) : rnd(0.82, 0.94)) * H, r: rnd(22, 38) * Math.min(1, W / 800 + 0.3), rot: rnd(0, 6.28), flower: i % 3 === 0, drift: rnd(0, 6) })
        }
      }
    }

    const touch = (x: number, y: number, feed: boolean) => {
      ripples.push({ x, y, r: 2, max: rnd(70, 110), a: 0.55 })
      ripples.push({ x, y, r: 0, max: rnd(40, 60), a: 0.4 })
      if (feed && food.length < 14) for (let i = 0; i < 3; i++) food.push({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), t: 0 })
      for (const k of kois) {
        const d = Math.hypot(k.segs[0].x - x, k.segs[0].y - y)
        if (!feed && d < 110) { k.scare = 1; k.target = { x: k.segs[0].x + (k.segs[0].x - x) * 2, y: k.segs[0].y + (k.segs[0].y - y) * 2 } }
      }
      if (soundRef.current) {
        if (feed) ambient.plop(0.12)
        const notes = [523, 587, 659, 784, 880, 1047]
        if (Math.random() < 0.5) ambient.chime(notes[Math.floor(Math.random() * notes.length)], 0.05)
      }
    }
    let last = { x: -999, y: -999, t: 0 }
    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const down = (e: PointerEvent) => { const p = pos(e); touch(p.x, p.y, true) }
    const move = (e: PointerEvent) => {
      const p = pos(e)
      const now = performance.now()
      if (Math.hypot(p.x - last.x, p.y - last.y) > 26 && now - last.t > 110) {
        ripples.push({ x: p.x, y: p.y, r: 0, max: 34, a: 0.28 })
        last = { ...p, t: now }
      }
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)

    const drawKoi = (k: Koi, shadow: boolean, t: number) => {
      const s = k.segs
      const L: V[] = []
      const R: V[] = []
      for (let i = 0; i < N; i++) {
        const a = s[Math.max(0, i - 1)]
        const b = s[Math.min(N - 1, i + 1)]
        const ang = Math.atan2(a.y - b.y, a.x - b.x)
        const u = i / (N - 1)
        const w = k.size * (u < 0.22 ? 0.42 + u * 1.6 : 0.78 * Math.pow(1 - (u - 0.22) / 0.78, 1.15) + 0.06)
        L.push({ x: s[i].x + Math.cos(ang + Math.PI / 2) * w * 0.5, y: s[i].y + Math.sin(ang + Math.PI / 2) * w * 0.5 })
        R.push({ x: s[i].x + Math.cos(ang - Math.PI / 2) * w * 0.5, y: s[i].y + Math.sin(ang - Math.PI / 2) * w * 0.5 })
      }
      const headAng = Math.atan2(s[0].y - s[1].y, s[0].x - s[1].x)
      const tailAng = Math.atan2(s[N - 2].y - s[N - 1].y, s[N - 2].x - s[N - 1].x)
      const ox = shadow ? 9 : 0
      const oy = shadow ? 12 : 0
      ctx.save()
      ctx.translate(ox, oy)
      // aletas de los costados
      const finA = Math.sin(t * 3 + k.phase) * 0.35
      const f = s[3]
      for (const side of [1, -1]) {
        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(headAng + side * (2.2 + finA * side))
        ctx.beginPath()
        ctx.ellipse(k.size * 0.36, 0, k.size * 0.42, k.size * 0.17, 0, 0, Math.PI * 2)
        ctx.fillStyle = shadow ? 'rgba(10,40,50,.22)' : k.fin
        ctx.fill()
        ctx.restore()
      }
      // cola que flamea
      const tl = s[N - 1]
      const sway = Math.sin(t * 4 + k.phase) * 0.45
      ctx.save()
      ctx.translate(tl.x, tl.y)
      ctx.rotate(tailAng + Math.PI)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(k.size * 0.45, -k.size * 0.3 + sway * k.size * 0.3, k.size * 1.05, -k.size * 0.62 + sway * k.size * 0.45)
      ctx.quadraticCurveTo(k.size * 0.78, sway * k.size * 0.25, k.size * 1.05, k.size * 0.62 + sway * k.size * 0.45)
      ctx.quadraticCurveTo(k.size * 0.45, k.size * 0.3 + sway * k.size * 0.3, 0, 0)
      ctx.fillStyle = shadow ? 'rgba(10,40,50,.22)' : k.fin
      ctx.fill()
      ctx.restore()
      // cuerpo
      ctx.beginPath()
      ctx.moveTo(L[0].x, L[0].y)
      for (let i = 1; i < N; i++) ctx.lineTo(L[i].x, L[i].y)
      for (let i = N - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y)
      // cabecita redondeada
      ctx.quadraticCurveTo(s[0].x + Math.cos(headAng) * k.size * 0.42, s[0].y + Math.sin(headAng) * k.size * 0.42, L[0].x, L[0].y)
      ctx.closePath()
      if (shadow) { ctx.fillStyle = 'rgba(10,40,50,.25)'; ctx.fill(); ctx.restore(); return }
      ctx.fillStyle = k.body
      ctx.fill()
      ctx.save()
      ctx.clip()
      for (const [u, off, r] of k.spots) {
        const i = Math.round(u * (N - 1))
        const p = s[i]
        const a = Math.atan2(s[Math.max(0, i - 1)].y - s[Math.min(N - 1, i + 1)].y, s[Math.max(0, i - 1)].x - s[Math.min(N - 1, i + 1)].x)
        ctx.beginPath()
        ctx.ellipse(p.x + Math.cos(a + Math.PI / 2) * off * k.size * 0.5, p.y + Math.sin(a + Math.PI / 2) * off * k.size * 0.5, k.size * r * 0.75, k.size * r * 0.45, a, 0, Math.PI * 2)
        ctx.fillStyle = k.patch
        ctx.fill()
      }
      // brillo del lomo, para que se vea redondito
      ctx.beginPath()
      for (let i = 1; i < N - 2; i++) i === 1 ? ctx.moveTo(s[i].x, s[i].y) : ctx.lineTo(s[i].x, s[i].y)
      ctx.strokeStyle = 'rgba(255,255,255,.35)'
      ctx.lineWidth = k.size * 0.12
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.restore()
      // ojitos
      for (const side of [1, -1]) {
        ctx.beginPath()
        ctx.arc(s[0].x + Math.cos(headAng) * k.size * 0.12 + Math.cos(headAng + side * Math.PI / 2) * k.size * 0.2, s[0].y + Math.sin(headAng) * k.size * 0.12 + Math.sin(headAng + side * Math.PI / 2) * k.size * 0.2, k.size * 0.05, 0, Math.PI * 2)
        ctx.fillStyle = '#2a2224'
        ctx.fill()
      }
      ctx.restore()
    }

    let raf = 0
    let prev = performance.now()
    let petalT = 0
    const frame = (now: number) => {
      const dt = Math.min(50, now - prev) / 16.67
      prev = now
      const t = now / 1000
      // peces
      for (const k of kois) {
        const h = k.segs[0]
        let goal = k.target
        if (food.length && k.scare < 0.2) {
          let best = food[0], bd = Infinity
          for (const f of food) { const d = Math.hypot(f.x - h.x, f.y - h.y); if (d < bd) { bd = d; best = f } }
          if (bd < Math.max(W, H) * 0.7) goal = best
        }
        const dx = goal.x - h.x
        const dy = goal.y - h.y
        const dist = Math.hypot(dx, dy)
        if (goal === k.target && dist < 30) k.target = randTarget()
        // comer
        for (let i = food.length - 1; i >= 0; i--) {
          if (Math.hypot(food[i].x - h.x, food[i].y - h.y) < k.size * 0.5) {
            ripples.push({ x: food[i].x, y: food[i].y, r: 0, max: 24, a: 0.4 })
            food.splice(i, 1)
            k.phase += 1.5
          }
        }
        let want = Math.atan2(dy, dx)
        // no chocar con los bordes
        const m = 50
        if (h.x < m) want = 0
        else if (h.x > W - m) want = Math.PI
        if (h.y < m) want = Math.PI / 2
        else if (h.y > H - m) want = -Math.PI / 2
        let diff = want - k.ang
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        const hungry = goal !== k.target
        k.ang += Math.max(-0.045, Math.min(0.045, diff)) * dt * (hungry ? 1.4 : 1) * (1 + k.scare)
        const target = k.base * (hungry ? 1.5 : 1) * (1 + k.scare * 2.4) * (calm ? 0.6 : 1)
        k.speed += (target - k.speed) * 0.04 * dt
        k.scare = Math.max(0, k.scare - 0.012 * dt)
        const wig = Math.sin(t * (3 + k.speed * 3) + k.phase) * 0.12
        h.x += Math.cos(k.ang + wig) * k.speed * dt * 1.4
        h.y += Math.sin(k.ang + wig) * k.speed * dt * 1.4
        const seg = k.size * 0.42
        for (let i = 1; i < N; i++) {
          const a = k.segs[i - 1], b = k.segs[i]
          const ang = Math.atan2(b.y - a.y, b.x - a.x)
          b.x = a.x + Math.cos(ang) * seg * (1 - i * 0.012)
          b.y = a.y + Math.sin(ang) * seg * (1 - i * 0.012)
        }
      }
      for (const f of food) f.t += dt
      for (let i = food.length - 1; i >= 0; i--) if (food[i].t > 900) food.splice(i, 1)
      for (const r of ripples) { r.r += 0.9 * dt; r.a *= Math.pow(0.975, dt) }
      for (let i = ripples.length - 1; i >= 0; i--) if (ripples[i].r > ripples[i].max || ripples[i].a < 0.02) ripples.splice(i, 1)
      petalT -= dt
      if (!calm && petalT <= 0 && petals.length < 6) {
        petals.push({ x: rnd(-20, W * 0.4), y: rnd(-20, H * 0.3), rot: rnd(0, 6), vr: rnd(-0.01, 0.01), vx: rnd(0.15, 0.35), vy: rnd(0.08, 0.2), s: rnd(5, 8) })
        petalT = rnd(200, 420)
      }
      for (const p of petals) { p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt }
      for (let i = petals.length - 1; i >= 0; i--) if (petals[i].x > W + 20 || petals[i].y > H + 20) petals.splice(i, 1)

      // dibujar
      ctx.clearRect(0, 0, W, H)
      if (bg) ctx.drawImage(bg, 0, 0, W, H)
      // luz que se mueve en el fondo
      ctx.save()
      ctx.globalCompositeOperation = 'soft-light'
      for (let i = 0; i < 4; i++) {
        const cx = W * (0.2 + 0.25 * i) + Math.sin(t * 0.21 + i * 2) * 60
        const cy = H * (0.35 + 0.15 * Math.sin(i * 3)) + Math.cos(t * 0.17 + i) * 40
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.28)
        g.addColorStop(0, 'rgba(255,255,255,.22)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }
      ctx.restore()
      // comida
      for (const f of food) {
        const a = Math.min(1, (900 - f.t) / 100)
        ctx.beginPath()
        ctx.arc(f.x, f.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(150,96,52,${0.95 * a})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(f.x - 1, f.y - 1, 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,230,190,${0.8 * a})`
        ctx.fill()
      }
      ctx.save()
      ctx.filter = 'blur(5px)'
      for (const k of kois) drawKoi(k, true, t)
      ctx.restore()
      for (const k of kois) drawKoi(k, false, t)
      // ondas
      for (const r of ripples) {
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,255,255,${r.a})`
        ctx.lineWidth = 1.6
        ctx.stroke()
        if (r.r > 4) {
          ctx.beginPath()
          ctx.arc(r.x, r.y + 1.5, r.r - 3, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0,40,50,${r.a * 0.35})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      }
      // hojas de loto (arriba de todo, flotan)
      for (const p of pads) {
        const x = p.x + Math.sin(t * 0.3 + p.drift) * 3
        const y = p.y + Math.cos(t * 0.25 + p.drift) * 2
        ctx.save()
        ctx.translate(x + 4, y + 6)
        ctx.beginPath()
        ctx.ellipse(0, 0, p.r, p.r * 0.86, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,30,30,.22)'
        ctx.fill()
        ctx.restore()
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.rot + Math.sin(t * 0.2 + p.drift) * 0.05)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.ellipse(0, 0, p.r, p.r * 0.86, 0, 0.32, Math.PI * 2 - 0.05)
        ctx.closePath()
        const g = ctx.createRadialGradient(-p.r * 0.2, -p.r * 0.2, 2, 0, 0, p.r)
        g.addColorStop(0, '#9fd38a')
        g.addColorStop(1, '#5d9e5a')
        ctx.fillStyle = g
        ctx.fill()
        ctx.strokeStyle = 'rgba(40,90,40,.35)'
        ctx.lineWidth = 1
        for (let v = 0; v < 7; v++) {
          const a = 0.5 + v * 0.8
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(a) * p.r * 0.85, Math.sin(a) * p.r * 0.72)
          ctx.stroke()
        }
        ctx.restore()
        if (p.flower && lotus.current?.complete) ctx.drawImage(lotus.current, x - p.r * 0.55, y - p.r * 0.8, p.r * 1.1, p.r * 1.1)
      }
      for (const p of petals) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.beginPath()
        ctx.ellipse(0, 0, p.s, p.s * 0.6, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(250,200,210,.9)'
        ctx.fill()
        ctx.restore()
      }
      raf = requestAnimationFrame(frame)
    }
    resize()
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => resize())
    ro.observe(wrap.current!)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="game-wrap">
      <div ref={wrap} className="pond">
        <canvas ref={cv} aria-label="Estanque con peces koi. Tocá el agua para darles de comer." />
      </div>
      <div className="row between wrap gap-s">
        <p className="small muted">Tocá el agua para darles comidita. Si pasás el dedo, se mueve el agua.</p>
        <label className="row gap-s small"><input type="checkbox" className="switch" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sonidito de agua</label>
      </div>
    </div>
  )
}

/** El fondo del estanque se pinta una sola vez: agua, piedritas y bordes. */
function paintBg(W: number, H: number, dpr: number) {
  const c = document.createElement('canvas')
  c.width = W * dpr
  c.height = H * dpr
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  const water = g.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75)
  water.addColorStop(0, '#3f8f8c')
  water.addColorStop(0.55, '#2c6f72')
  water.addColorStop(1, '#173f4a')
  g.fillStyle = water
  g.fillRect(0, 0, W, H)
  // piedritas del fondo, borrosas por el agua
  g.filter = 'blur(2px)'
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 3 + Math.random() * 9
    g.beginPath()
    g.ellipse(x, y, r, r * 0.7, Math.random() * 3, 0, Math.PI * 2)
    g.fillStyle = `rgba(${180 + Math.random() * 40},${190 + Math.random() * 30},${170 + Math.random() * 30},${0.08 + Math.random() * 0.1})`
    g.fill()
  }
  // algas suaves
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    g.beginPath()
    g.ellipse(x, y, 30 + Math.random() * 40, 10 + Math.random() * 14, Math.random() * 3, 0, Math.PI * 2)
    g.fillStyle = 'rgba(70,130,80,.12)'
    g.fill()
  }
  g.filter = 'none'
  // borde de piedras
  const edge = g.createLinearGradient(0, 0, 0, H)
  edge.addColorStop(0, 'rgba(10,30,35,.45)')
  edge.addColorStop(0.12, 'rgba(10,30,35,0)')
  edge.addColorStop(0.88, 'rgba(10,30,35,0)')
  edge.addColorStop(1, 'rgba(10,30,35,.45)')
  g.fillStyle = edge
  g.fillRect(0, 0, W, H)
  const edge2 = g.createLinearGradient(0, 0, W, 0)
  edge2.addColorStop(0, 'rgba(10,30,35,.4)')
  edge2.addColorStop(0.1, 'rgba(10,30,35,0)')
  edge2.addColorStop(0.9, 'rgba(10,30,35,0)')
  edge2.addColorStop(1, 'rgba(10,30,35,.4)')
  g.fillStyle = edge2
  g.fillRect(0, 0, W, H)
  return c
}
