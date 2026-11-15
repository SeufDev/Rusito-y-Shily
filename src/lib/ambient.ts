import { useEffect, useState } from 'react'

/**
 * Sonidos ambiente hechos en vivo con Web Audio (sin archivos): lluvia, olas, viento, fueguito,
 * pajaritos, grillos, arroyo y ruido marrón. Siguen sonando aunque se cambie de sección.
 */
export type Channel = 'lluvia' | 'olas' | 'viento' | 'fuego' | 'pajaros' | 'grillos' | 'arroyo' | 'marron'
type Built = { out: GainNode; stop: () => void }

const LS = 'nl-ambient'
class Ambient {
  ctx?: AudioContext
  master?: GainNode
  chans = new Map<Channel, Built>()
  vols: Partial<Record<Channel, number>> = {}
  masterVol = 0.8
  timerEnd = 0
  private timer = 0
  private subs = new Set<() => void>()
  private buffers = new Map<string, AudioBuffer>()

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS) || '{}')
      if (typeof saved.master === 'number') this.masterVol = saved.master
    } catch { /* */ }
  }
  on(fn: () => void) { this.subs.add(fn); return () => { this.subs.delete(fn) } }
  private emit() {
    this.subs.forEach((f) => f())
    try { localStorage.setItem(LS, JSON.stringify({ master: this.masterVol })) } catch { /* */ }
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AC()
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 3
      this.master = this.ctx.createGain()
      this.master.gain.value = this.masterVol
      this.master.connect(comp).connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }
  get playing() { return [...this.chans.keys()] }
  set(ch: Channel, vol: number) {
    const ctx = this.ensure()
    this.vols[ch] = vol
    if (vol <= 0) {
      const c = this.chans.get(ch)
      if (c) {
        c.out.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
        setTimeout(() => { if ((this.vols[ch] ?? 0) <= 0) { c.stop(); this.chans.delete(ch); this.emit() } }, 1800)
      }
    } else {
      let c = this.chans.get(ch)
      if (!c) {
        c = BUILD[ch](this, ctx)
        c.out.gain.value = 0
        c.out.connect(this.master!)
        this.chans.set(ch, c)
      }
      c.out.gain.setTargetAtTime(vol, ctx.currentTime, 0.6)
    }
    this.emit()
  }
  setMaster(v: number) {
    this.masterVol = v
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2)
    this.emit()
  }
  stopAll() {
    for (const ch of [...this.chans.keys()]) this.set(ch, 0)
    this.setTimer(0)
  }
  setTimer(min: number) {
    clearTimeout(this.timer)
    this.timerEnd = min ? Date.now() + min * 60_000 : 0
    if (min) this.timer = window.setTimeout(() => {
      // se apaga despacito
      if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 6)
      setTimeout(() => { this.stopAll(); this.setMaster(this.masterVol) }, 20_000)
    }, min * 60_000)
    this.emit()
  }
  noise(kind: 'white' | 'pink' | 'brown') {
    const ctx = this.ensure()
    if (!this.buffers.has(kind)) {
      const len = ctx.sampleRate * 6
      const buf = ctx.createBuffer(2, len, ctx.sampleRate)
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1
          if (kind === 'white') d[i] = w * 0.5
          else if (kind === 'pink') {
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
            b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
            b6 = w * 0.115926
          } else {
            last = (last + 0.02 * w) / 1.02
            d[i] = last * 3.5
          }
        }
      }
      this.buffers.set(kind, buf)
    }
    const src = ctx.createBufferSource()
    src.buffer = this.buffers.get(kind)!
    src.loop = true
    src.loopStart = Math.random() * 2
    src.start(0, Math.random() * 5)
    return src
  }
  /** un golpecito de ruido filtrado (gota, chispa, burbuja) */
  burst(to: AudioNode, at: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.buffers.get('white') ?? (this.noise('white').buffer as AudioBuffer)
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    src.connect(f).connect(g).connect(to)
    src.start(at, Math.random() * 4, dur + 0.05)
  }
  /** un sonidito suave para tocar el agua o soltar un farolito */
  chime(freq = 660, vol = 0.12) {
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    const o2 = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o2.type = 'sine'
    o.frequency.value = freq
    o2.frequency.value = freq * 2.01
    const g2 = ctx.createGain()
    g2.gain.value = 0.25
    const t = ctx.currentTime
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    o.connect(g)
    o2.connect(g2).connect(g)
    g.connect(this.master!)
    o.start(t); o2.start(t)
    o.stop(t + 2.3); o2.stop(t + 2.3)
  }
  plop(vol = 0.18) {
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ctx.currentTime
    o.frequency.setValueAtTime(520 + Math.random() * 200, t)
    o.frequency.exponentialRampToValueAtTime(160, t + 0.12)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(g).connect(this.master!)
    o.start(t)
    o.stop(t + 0.25)
  }
}

const lfo = (ctx: AudioContext, freq: number, depth: number, target: AudioParam) => {
  const o = ctx.createOscillator()
  o.frequency.value = freq
  const g = ctx.createGain()
  g.gain.value = depth
  o.connect(g).connect(target)
  o.start()
  return o
}
const filter = (ctx: AudioContext, type: BiquadFilterType, freq: number, q = 0.7) => {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  return f
}
/** repite algo a intervalos al azar mientras el canal esté prendido */
const every = (min: number, max: number, fn: () => void) => {
  let t = 0
  let alive = true
  const loop = () => { if (!alive) return; fn(); t = window.setTimeout(loop, min + Math.random() * (max - min)) }
  t = window.setTimeout(loop, Math.random() * max)
  return () => { alive = false; clearTimeout(t) }
}

const BUILD: Record<Channel, (a: Ambient, ctx: AudioContext) => Built> = {
  lluvia: (a, ctx) => {
    const out = ctx.createGain()
    const bed = a.noise('pink')
    const hp = filter(ctx, 'highpass', 450)
    const lp = filter(ctx, 'lowpass', 6500)
    const g = ctx.createGain(); g.gain.value = 0.55
    bed.connect(hp).connect(lp).connect(g).connect(out)
    const rumble = a.noise('brown')
    const rl = filter(ctx, 'lowpass', 260)
    const rg = ctx.createGain(); rg.gain.value = 0.25
    rumble.connect(rl).connect(rg).connect(out)
    a.noise('white').stop()
    const drops = every(18, 60, () => {
      const t = ctx.currentTime + 0.01
      a.burst(out, t, 0.02 + Math.random() * 0.05, 1800 + Math.random() * 4500, 1 + Math.random() * 3, 0.05 + Math.random() * 0.12)
    })
    return { out, stop: () => { drops(); bed.stop(); rumble.stop() } }
  },
  olas: (a, ctx) => {
    const out = ctx.createGain()
    const src = a.noise('brown')
    const lp = filter(ctx, 'lowpass', 700)
    const amp = ctx.createGain(); amp.gain.value = 0.5
    const o1 = lfo(ctx, 0.085, 0.32, amp.gain)
    const o2 = lfo(ctx, 0.13, 0.14, amp.gain)
    const o3 = lfo(ctx, 0.085, 420, lp.frequency)
    const hiss = a.noise('pink')
    const hp = filter(ctx, 'highpass', 1800)
    const hg = ctx.createGain(); hg.gain.value = 0.06
    const o4 = lfo(ctx, 0.085, 0.05, hg.gain)
    src.connect(lp).connect(amp).connect(out)
    hiss.connect(hp).connect(hg).connect(out)
    return { out, stop: () => { [src, hiss, o1, o2, o3, o4].forEach((n) => n.stop()) } }
  },
  viento: (a, ctx) => {
    const out = ctx.createGain()
    const src = a.noise('pink')
    const bp = filter(ctx, 'bandpass', 520, 0.9)
    const amp = ctx.createGain(); amp.gain.value = 0.6
    const o1 = lfo(ctx, 0.05, 260, bp.frequency)
    const o2 = lfo(ctx, 0.071, 0.35, amp.gain)
    const o3 = lfo(ctx, 0.23, 60, bp.frequency)
    src.connect(bp).connect(amp).connect(out)
    return { out, stop: () => { [src, o1, o2, o3].forEach((n) => n.stop()) } }
  },
  fuego: (a, ctx) => {
    const out = ctx.createGain()
    const src = a.noise('brown')
    const lp = filter(ctx, 'lowpass', 380)
    const g = ctx.createGain(); g.gain.value = 0.55
    const o = lfo(ctx, 0.4, 0.12, g.gain)
    src.connect(lp).connect(g).connect(out)
    a.noise('white').stop()
    const crackle = every(25, 160, () => {
      const t = ctx.currentTime + 0.005
      const big = Math.random() < 0.15
      a.burst(out, t, big ? 0.03 : 0.006 + Math.random() * 0.01, big ? 700 + Math.random() * 900 : 2200 + Math.random() * 3500, big ? 2 : 0.8, big ? 0.35 : 0.08 + Math.random() * 0.22, big ? 'bandpass' : 'highpass')
    })
    return { out, stop: () => { crackle(); src.stop(); o.stop() } }
  },
  pajaros: (_a, ctx) => {
    const out = ctx.createGain()
    const lp = filter(ctx, 'lowpass', 7000)
    const delay = ctx.createDelay(); delay.delayTime.value = 0.13
    const fb = ctx.createGain(); fb.gain.value = 0.28
    lp.connect(out); lp.connect(delay); delay.connect(fb).connect(delay); fb.connect(out)
    const phrase = every(1400, 5200, () => {
      const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8
      pan.connect(lp)
      const base = 2400 + Math.random() * 2200
      const n = 2 + Math.floor(Math.random() * 5)
      let t = ctx.currentTime + 0.02
      const kind = Math.random()
      for (let i = 0; i < n; i++) {
        const o = ctx.createOscillator(); o.type = 'sine'
        const g = ctx.createGain()
        const d = 0.05 + Math.random() * 0.1
        const f0 = base * (0.9 + Math.random() * 0.25)
        o.frequency.setValueAtTime(f0, t)
        if (kind < 0.4) o.frequency.exponentialRampToValueAtTime(f0 * 1.45, t + d)
        else if (kind < 0.75) o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + d)
        else { o.frequency.linearRampToValueAtTime(f0 * 1.2, t + d / 2); o.frequency.linearRampToValueAtTime(f0 * 0.9, t + d) }
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.09, t + 0.008)
        g.gain.exponentialRampToValueAtTime(0.0001, t + d)
        o.connect(g).connect(pan)
        o.start(t); o.stop(t + d + 0.02)
        t += d + 0.03 + Math.random() * 0.09
      }
    })
    return { out, stop: () => phrase() }
  },
  grillos: (_a, ctx) => {
    const out = ctx.createGain()
    const make = (freq: number, pan: number, gap: number) => {
      const p = ctx.createStereoPanner(); p.pan.value = pan
      p.connect(out)
      return every(gap * 0.8, gap * 1.4, () => {
        let t = ctx.currentTime + 0.02
        for (let k = 0; k < 3; k++) {
          const o = ctx.createOscillator(); o.frequency.value = freq + Math.random() * 40
          const g = ctx.createGain()
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.035, t + 0.004)
          g.gain.linearRampToValueAtTime(0, t + 0.018)
          o.connect(g).connect(p)
          o.start(t); o.stop(t + 0.03)
          t += 0.034
        }
      })
    }
    const c1 = make(4300, -0.5, 700)
    const c2 = make(4620, 0.6, 950)
    return { out, stop: () => { c1(); c2() } }
  },
  arroyo: (a, ctx) => {
    const out = ctx.createGain()
    const src = a.noise('white')
    const filters = [700, 1400, 2600].map((f) => filter(ctx, 'bandpass', f, 4))
    const g = ctx.createGain(); g.gain.value = 0.9
    filters.forEach((f) => { src.connect(f); f.connect(g) })
    g.connect(out)
    const jit = every(60, 140, () => {
      filters.forEach((f, i) => f.frequency.setTargetAtTime([700, 1400, 2600][i] * (0.75 + Math.random() * 0.6), ctx.currentTime, 0.03))
    })
    return { out, stop: () => { jit(); src.stop() } }
  },
  marron: (a, ctx) => {
    const out = ctx.createGain()
    const src = a.noise('brown')
    const lp = filter(ctx, 'lowpass', 520)
    src.connect(lp).connect(out)
    return { out, stop: () => src.stop() }
  },
}

export const ambient = new Ambient()

export function useAmbient() {
  const [, setV] = useState(0)
  useEffect(() => ambient.on(() => setV((v) => v + 1)), [])
  return ambient
}
