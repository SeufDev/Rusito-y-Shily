import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { Art } from '../components/Art'
import { useToast } from '../components/ui'
import type { Who } from '../lib/config'
import { MOODS } from '../lib/content'
import { dayKey, daysBetween, elapsed, hash, parseDay, startInstant } from '../lib/dates'
import { daysTogether } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'

function glowTexture(inner = 'rgba(255,255,255,1)') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, inner)
  grad.addColorStop(0.2, inner.replace(/[\d.]+\)$/, '0.55)'))
  grad.addColorStop(1, inner.replace(/[\d.]+\)$/, '0)'))
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
function starPos(i: number): [number, number, number] {
  const r = 1.4 + 0.9 * Math.sqrt(i + 1.5)
  const a = i * GOLDEN
  return [Math.cos(a) * r, (hash('z' + i) - 0.5) * (0.8 + r * 0.1), Math.sin(a) * r]
}
const dayOf = (start: string, i: number) => {
  const d = parseDay(start)
  d.setDate(d.getDate() + i)
  return dayKey(d)
}

type DayInfo = { memories: string[]; letters: number; answers: number; moods: string[]; hugs: number; wishes: { text: string; by: string }[] }

export function useStartInstant() {
  const { settings } = useStore()
  const profiles = useItems<{ who: Who; tz: string }>('profile')
  const tz = settings.startTz ?? profiles.find((p) => p.data.who === 'b')?.data.tz
  return useMemo(() => startInstant(settings.start, settings.startTime ?? '14:00', tz), [settings.start, settings.startTime, tz])
}

export default function Universe() {
  const { settings, add } = useStore()
  const { name, P } = usePeople()
  const calm = useCalmMotion()
  const toast = useToast()
  const n = daysTogether(settings.start) + 1
  const memories = useItems<{ title: string; date: string }>('memory')
  const letters = useItems('letter')
  const answers = useItems<{ day: string }>('answer')
  const moods = useItems<{ day: string; mood: string }>('mood')
  const hugs = useItems('hug')
  const wishes = useItems<{ day: string; text: string }>('wish')
  const [sel, setSel] = useState<number | null>(null)
  const [us, setUs] = useState(false)
  const [wish, setWish] = useState('')
  const start = useStartInstant()

  const info = useMemo(() => {
    const m = new Map<string, DayInfo>()
    const get = (d: string) => {
      if (!m.has(d)) m.set(d, { memories: [], letters: 0, answers: 0, moods: [], hugs: 0, wishes: [] })
      return m.get(d)!
    }
    memories.forEach((x) => get(x.data.date ?? dayKey(new Date(x.created_at))).memories.push(x.data.title))
    letters.forEach((x) => get(dayKey(new Date(x.created_at))).letters++)
    answers.forEach((x) => get(x.data.day).answers++)
    moods.forEach((x) => get(x.data.day).moods.push(x.data.mood))
    hugs.forEach((x) => get(dayKey(new Date(x.created_at))).hugs++)
    wishes.forEach((x) => get(x.data.day).wishes.push({ text: x.data.text, by: name(x.author) }))
    return m
  }, [memories, letters, answers, moods, hugs, wishes, name])

  // aniversarios de meses (los que ya pasaron y el próximo)
  const months = useMemo(() => {
    const out: { idx: number; label: string; future: boolean }[] = []
    const s = parseDay(settings.start)
    for (let k = 1; k < 600; k++) {
      const d = new Date(s.getFullYear(), s.getMonth() + k, s.getDate())
      const idx = daysBetween(s, d)
      const label = k % 12 === 0 ? `${k / 12} ${k === 12 ? 'año' : 'años'}` : `${k} ${k === 1 ? 'mes' : 'meses'}`
      if (idx >= n) { out.push({ idx, label, future: true }); break }
      out.push({ idx, label, future: false })
    }
    return out
  }, [settings.start, n])

  const selDay = sel !== null ? dayOf(settings.start, sel) : null
  const selInfo = selDay ? info.get(selDay) : undefined
  const dist = 12 + Math.sqrt(n) * 1.3
  return createPortal(
    <div className="universe">
      <Canvas camera={{ position: [0, dist * 2.2, dist * 2.6], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }} raycaster={{ params: { Points: { threshold: 0.35 } } as any }}>
        <Nebula calm={calm} />
        <Dust n={n} calm={calm} />
        <Galaxy n={n} info={info} start={settings.start} sel={sel} onSelect={(i) => { setUs(false); setSel(i) }} calm={calm} months={months} />
        <Binary calm={calm} names={[P.a.name, P.b.name]} onClick={() => { setSel(null); setUs(true) }} />
        {!calm && <ShootingStars />}
        <Rig to={[0, dist * 0.72, dist]} calm={calm} />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.22} intensity={1.05} radius={0.75} />
          <Vignette eskil={false} offset={0.22} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <div className="uni-overlay">
        <motion.div className="uni-counter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }}>
          <p className="eyebrow">Nuestro universo desde el {start.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}, a las {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</p>
          <LiveCounter start={start} />
          <p className="uni-sub">Cada día se enciende una estrella. Las rosadas guardan recuerdos, las doradas deseos y los anillos marcan cada mes. En el centro están ustedes dos. Tocá cualquiera.</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {us && (
          <motion.aside className="uni-panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <button className="icon-btn modal-x" onClick={() => setUs(false)} aria-label="Cerrar"><X size={18} /></button>
            <p className="eyebrow">La estrella doble</p>
            <h2 className="display">{P.a.name} y {P.b.name}</h2>
            <p className="quote">Dos estrellas que giran una alrededor de la otra. Están lejos a veces, pero nunca se sueltan.</p>
            <div className="stack-s mt-m small">
              <div className="row gap-s"><Art lottie="1f31f" size={22} play="still" /> {n} {n === 1 ? 'estrella encendida' : 'estrellas encendidas'}</div>
              <div className="row gap-s"><Art lottie="1f4f8" size={22} play="still" /> {memories.length} {memories.length === 1 ? 'recuerdo guardado' : 'recuerdos guardados'}</div>
              <div className="row gap-s"><Art lottie="1f48c" size={22} play="still" /> {letters.length} {letters.length === 1 ? 'carta' : 'cartas'}</div>
              <div className="row gap-s"><Art lottie="1f497" size={22} play="still" /> {hugs.length} abrazos a distancia</div>
              {months.find((m) => m.future) && <div className="row gap-s"><Art lottie="1f381" size={22} play="still" /> Faltan {months.find((m) => m.future)!.idx - n + 1} días para los {months.find((m) => m.future)!.label}</div>}
            </div>
          </motion.aside>
        )}
        {sel !== null && selDay && (
          <motion.aside className="uni-panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <button className="icon-btn modal-x" onClick={() => setSel(null)} aria-label="Cerrar"><X size={18} /></button>
            <p className="eyebrow">Estrella {sel + 1}{months.find((m) => m.idx === sel) ? ` · ¡${months.find((m) => m.idx === sel)!.label}!` : ''}</p>
            <h2 className="display">{parseDay(selDay).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            {sel === 0 && <p className="quote">El día que empezó todo.</p>}
            <div className="stack-s mt-m">
              {selInfo?.memories.map((m, i) => <div key={i} className="row gap-s"><Art lottie="1f4f8" size={24} play="still" /> {m}</div>)}
              {!!selInfo?.letters && <div className="row gap-s"><Art lottie="1f48c" size={24} play="still" /> {selInfo.letters} {selInfo.letters === 1 ? 'carta' : 'cartas'}</div>}
              {!!selInfo?.answers && <div className="row gap-s"><Art lottie="1f917" size={24} play="still" /> Se respondieron la pregunta del día</div>}
              {!!selInfo?.hugs && <div className="row gap-s"><Art lottie="1f497" size={24} play="still" /> {selInfo.hugs} {selInfo.hugs === 1 ? 'abrazo' : 'abrazos'} a distancia</div>}
              {!!selInfo?.moods.length && (
                <div className="row gap-s">{selInfo.moods.map((m, i) => { const x = MOODS.find((y) => y.id === m); return x ? <Art key={i} lottie={x.lottie} size={26} play="still" /> : null })}</div>
              )}
              {selInfo?.wishes.map((w, i) => <div key={i} className="wish"><Art lottie="1f31f" size={22} play="still" /> “{w.text}” <span className="small muted">· {w.by}</span></div>)}
              {!selInfo && <p className="muted small">Un día tranquilo. También cuenta.</p>}
            </div>
            <form className="mt-m" onSubmit={(e) => {
              e.preventDefault()
              if (!wish.trim()) return
              add('wish', { day: selDay, text: wish.trim() })
              setWish('')
              toast({ text: 'Tu deseo quedó guardado en esa estrella', art: { lottie: '1f31f' } })
            }}>
              <input className="input dark" placeholder="Pedir un deseo en esta estrella…" value={wish} onChange={(e) => setWish(e.target.value)} />
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

function LiveCounter({ start }: { start: Date }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const e = elapsed(start, new Date(now))
  const p = (x: number) => String(x).padStart(2, '0')
  const parts = [
    e.y ? `${e.y} ${e.y === 1 ? 'año' : 'años'}` : '',
    e.mo ? `${e.mo} ${e.mo === 1 ? 'mes' : 'meses'}` : '',
    `${e.d} ${e.d === 1 ? 'día' : 'días'}`,
  ].filter(Boolean)
  if (now < start.getTime()) return <div className="counter"><span className="counter-small">Todavía no empezó… falta poquito.</span></div>
  return (
    <div className="counter">
      <div className="row gap-s counter-main">
        <span className="counter-big">{e.totalDays}</span>
        <span className="counter-unit">{e.totalDays === 1 ? 'día juntos' : 'días juntos'}</span>
      </div>
      <div className="counter-parts">
        <span>{parts.join(', ')}</span>
        <span className="counter-clock">{p(e.h)}<i>h</i> {p(e.mi)}<i>m</i> {p(e.s)}<i>s</i></span>
      </div>
    </div>
  )
}

/** La cámara llega volando desde lejos, una sola vez. */
function Rig({ to, calm }: { to: [number, number, number]; calm: boolean }) {
  const { camera } = useThree()
  const t = useRef(calm ? 1 : 0)
  const from = useRef(camera.position.clone())
  const [done, setDone] = useState(calm)
  useEffect(() => { if (calm) camera.position.set(...to) }, [calm, camera, to])
  useFrame((_, dt) => {
    if (done) return
    t.current = Math.min(1, t.current + dt / 3.6)
    const k = 1 - Math.pow(1 - t.current, 3)
    camera.position.lerpVectors(from.current, new THREE.Vector3(...to), k)
    camera.lookAt(0, 0, 0)
    if (t.current >= 1) setDone(true)
  })
  return <OrbitControls enabled={done} enablePan={false} minDistance={3} maxDistance={70} autoRotate={done && !calm} autoRotateSpeed={0.22} enableDamping />
}

const NEBULA_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vDir;
float h(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }
void main(){
  vec3 d = normalize(vDir);
  float t = uTime * 0.012;
  float n1 = fbm(d * 2.3 + vec3(t, 0., -t));
  float n2 = fbm(d * 4.6 - vec3(0., t * 1.4, t));
  float n3 = fbm(d * 3.2 + 7.0);
  float band = exp(-pow(d.y * 2.6 + 0.35 * sin(d.x * 3.0 + d.z * 2.0), 2.0));
  vec3 col = vec3(0.012, 0.016, 0.05);
  col += vec3(0.30, 0.11, 0.36) * smoothstep(0.38, 0.85, n1) * 0.65;
  col += vec3(0.85, 0.36, 0.52) * pow(smoothstep(0.48, 0.9, n2), 2.0) * 0.45 * (0.35 + band);
  col += vec3(0.10, 0.27, 0.46) * smoothstep(0.45, 0.82, n3) * 0.42;
  col += vec3(0.85, 0.8, 1.0) * band * 0.045 * (0.6 + n2);
  gl_FragColor = vec4(col, 1.0);
}`
const NEBULA_VERT = /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/** Una nebulosa pintada con ruido, envolviendo todo. */
function Nebula({ calm }: { calm: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((_, dt) => { if (mat.current && !calm) mat.current.uniforms.uTime.value += dt })
  return (
    <mesh>
      <sphereGeometry args={[90, 48, 32]} />
      <shaderMaterial ref={mat} side={THREE.BackSide} uniforms={uniforms} vertexShader={NEBULA_VERT} fragmentShader={NEBULA_FRAG} depthWrite={false} />
    </mesh>
  )
}

const STAR_VERT = /* glsl */ `
attribute float aSize; attribute vec3 aColor; attribute float aPhase;
uniform float uTime; uniform float uPR; uniform float uCalm;
varying vec3 vColor; varying float vTw;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = uCalm > .5 ? 1.0 : 0.78 + 0.22 * sin(uTime * (0.8 + aPhase * 1.6) + aPhase * 6.283);
  vTw = tw; vColor = aColor;
  gl_PointSize = aSize * (0.85 + 0.15 * tw) * uPR * (260.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`
const STAR_FRAG = /* glsl */ `
uniform float uSpikes;
varying vec3 vColor; varying float vTw;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = exp(-d * d * 90.0);
  float halo = exp(-d * d * 14.0) * 0.38;
  float sp = (exp(-abs(uv.x) * 70.0) * exp(-abs(uv.y) * 6.5) + exp(-abs(uv.y) * 70.0) * exp(-abs(uv.x) * 6.5)) * 0.6 * uSpikes;
  float a = core + halo + sp * vTw;
  a *= smoothstep(0.5, 0.42, d);
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a, a);
}`

function starMaterial(spikes: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: Math.min(2, window.devicePixelRatio || 1) }, uCalm: { value: 0 }, uSpikes: { value: spikes } },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** Polvo de galaxia en brazos espirales: le da forma y profundidad al universo. */
function Dust({ n, calm }: { n: number; calm: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const mat = useMemo(() => starMaterial(0), [])
  const geo = useMemo(() => {
    const R = Math.max(12, 1.4 + 0.9 * Math.sqrt(n + 300))
    const count = 6000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const inner = new THREE.Color('#ffd2c4')
    const mid = new THREE.Color('#e79ac0')
    const outer = new THREE.Color('#8e9cff')
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.7) * R
      const arm = (i % 3) * ((Math.PI * 2) / 3)
      const spin = r * 0.42
      const spread = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * (1.1 - (r / R) * 0.5)
      const a = arm + spin + spread
      const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
      pos[i * 3] = Math.cos(a) * r + g() * 0.6
      pos[i * 3 + 1] = g() * (1.1 - (r / R) * 0.7) * 0.8
      pos[i * 3 + 2] = Math.sin(a) * r + g() * 0.6
      const u = r / R
      c.copy(u < 0.4 ? inner : mid).lerp(u < 0.4 ? mid : outer, u < 0.4 ? u / 0.4 : (u - 0.4) / 0.6)
      const b = 0.35 + Math.random() * 0.5
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b
      size[i] = 0.25 + Math.random() * 0.55
      phase[i] = Math.random()
    }
    const gm = new THREE.BufferGeometry()
    gm.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    gm.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    gm.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    gm.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return gm
  }, [n])
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uCalm.value = calm ? 1 : 0
    if (ref.current && !calm) ref.current.rotation.y += dt * 0.012
  })
  return <points ref={ref} geometry={geo} material={mat} raycast={() => null} />
}

function Galaxy({ n, info, start, sel, onSelect, calm, months }: {
  n: number; info: Map<string, DayInfo>; start: string; sel: number | null; onSelect: (i: number) => void; calm: boolean; months: { idx: number; label: string; future: boolean }[]
}) {
  const lit = Math.max(1, n)
  const ghosts = 500
  const [hover, setHover] = useState<number | null>(null)
  const mat = useMemo(() => starMaterial(1), [])
  const ghostMat = useMemo(() => starMaterial(0), [])
  const days = useMemo(() => Array.from({ length: lit }, (_, i) => dayOf(start, i)), [lit, start])
  const monthIdx = useMemo(() => new Set(months.filter((m) => !m.future).map((m) => m.idx)), [months])
  const geo = useMemo(() => {
    const pos = new Float32Array(lit * 3)
    const col = new Float32Array(lit * 3)
    const size = new Float32Array(lit)
    const phase = new Float32Array(lit)
    days.forEach((d, i) => {
      pos.set(starPos(i), i * 3)
      const inf = info.get(d)
      let c: [number, number, number] = [2.0, 2.0, 2.5]
      if (inf?.memories.length) c = [3.2, 1.45, 2.05]
      else if (inf?.wishes.length) c = [3.3, 2.5, 1.15]
      else if (inf && (inf.letters || inf.answers || inf.hugs)) c = [1.9, 2.3, 3.4]
      if (i === lit - 1) c = [3.4, 3.0, 3.3]
      col.set(c, i * 3)
      size[i] = 1.05 + (inf?.memories.length ? 0.55 : 0) + (inf?.wishes.length ? 0.35 : 0) + (monthIdx.has(i) ? 0.5 : 0) + (i === lit - 1 ? 0.6 : 0) + hash('s' + i) * 0.3
      phase[i] = hash('p' + i)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [days, info, lit, monthIdx])
  const ghostGeo = useMemo(() => {
    const pos = new Float32Array(ghosts * 3)
    const col = new Float32Array(ghosts * 3)
    const size = new Float32Array(ghosts)
    const phase = new Float32Array(ghosts)
    for (let i = 0; i < ghosts; i++) {
      pos.set(starPos(lit + i), i * 3)
      const f = Math.max(0.12, 0.42 - i / ghosts * 0.3)
      col.set([0.62 * f, 0.66 * f, 1.0 * f], i * 3)
      size[i] = 0.55
      phase[i] = hash('g' + i)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    return g
  }, [lit])
  // el camino que vamos haciendo, día a día
  const path = useMemo(() => {
    if (lit < 2) return null
    const pts: [number, number, number][] = [[0, 0, 0]]
    const cols: [number, number, number][] = [[0.9, 0.6, 0.8]]
    for (let i = 0; i < lit; i++) {
      pts.push(starPos(i))
      const k = 0.35 + 0.65 * (i / lit)
      cols.push([0.95 * k, 0.62 * k, 0.85 * k])
    }
    return { pts, cols }
  }, [lit])
  const ring = useMemo(() => glowTexture('rgba(255,236,250,1)'), [])
  const group = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.Sprite>(null)
  useFrame(({ clock }, dt) => {
    for (const m of [mat, ghostMat]) { m.uniforms.uTime.value += dt; m.uniforms.uCalm.value = calm ? 1 : 0 }
    if (pulse.current) pulse.current.scale.setScalar(calm ? 1.1 : 1.0 + Math.sin(clock.getElapsedTime() * 1.6) * 0.25)
    if (group.current && !calm) group.current.rotation.y += dt * 0.008
  })
  const focus = hover ?? sel
  return (
    <group ref={group}>
      <points
        geometry={geo}
        material={mat}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.index !== undefined) onSelect(e.index) }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(e.index ?? null); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(null); document.body.style.cursor = '' }}
      />
      <points geometry={ghostGeo} material={ghostMat} raycast={() => null} />
      {path && <Line points={path.pts} vertexColors={path.cols} lineWidth={1} transparent opacity={0.4} />}
      <sprite ref={pulse} position={starPos(lit - 1)}>
        <spriteMaterial map={ring} color={[1.2, 1.05, 1.3]} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {focus !== null && focus < lit && (
        <sprite position={starPos(focus)} scale={[1.3, 1.3, 1]}>
          <spriteMaterial map={ring} color={[1.2, 1.1, 1.3]} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
      {months.map((m) => (
        <group key={m.idx} position={starPos(m.idx)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[0.42, 0.46, 48]} />
            <meshBasicMaterial color={m.future ? [0.5, 0.55, 0.9] : [2.4, 1.6, 2.2]} transparent opacity={m.future ? 0.35 : 0.7} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <Html center distanceFactor={14} style={{ pointerEvents: 'none' }} position={[0, 0.7, 0]}>
            <span className={`uni-label ${m.future ? 'future' : ''}`}>{m.future ? `pronto: ${m.label}` : m.label}</span>
          </Html>
        </group>
      ))}
    </group>
  )
}

/** Ustedes dos: una estrella doble girando en el centro de todo. */
function Binary({ calm, names, onClick }: { calm: boolean; names: [string, string]; onClick: () => void }) {
  const g = useRef<THREE.Group>(null)
  const tex = useMemo(() => glowTexture(), [])
  const [hover, setHover] = useState(false)
  useFrame((_, dt) => { if (g.current && !calm) g.current.rotation.y += dt * 0.5 })
  return (
    <group onClick={(e) => { e.stopPropagation(); onClick() }} onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer' }} onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
      <mesh visible={false}><sphereGeometry args={[0.9, 12, 12]} /></mesh>
      <group ref={g}>
        {([[0.42, [2.6, 1.15, 1.7]], [-0.42, [1.05, 2.1, 2.0]]] as const).map(([x, c], i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshBasicMaterial color={c as unknown as THREE.ColorRepresentation} toneMapped={false} />
            </mesh>
            <sprite scale={[0.9, 0.9, 1]}>
              <spriteMaterial map={tex} color={c as unknown as THREE.Color} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        ))}
      </group>
      <sprite scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={tex} color={[0.9, 0.7, 0.95]} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <Html center distanceFactor={12} position={[0, -0.75, 0]} style={{ pointerEvents: 'none' }}>
        <span className={`uni-label us ${hover ? 'on' : ''}`}>{names[0]} & {names[1]}</span>
      </Html>
    </group>
  )
}

/** De vez en cuando cruza una estrella fugaz. */
function ShootingStars() {
  const state = useRef({ t: -1, wait: 3, from: new THREE.Vector3(), dir: new THREE.Vector3() })
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([3, 2.8, 3, 0, 0, 0]), 3))
    return g
  }, [])
  const mat = useMemo(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [])
  const obj = useMemo(() => new THREE.Line(geo, mat), [geo, mat])
  useFrame((_, dt) => {
    const s = state.current
    const l = obj
    if (!l) return
    if (s.t < 0) {
      s.wait -= dt
      l.visible = false
      if (s.wait <= 0) {
        const a = Math.random() * Math.PI * 2
        s.from.set(Math.cos(a) * 34, 8 + Math.random() * 14, Math.sin(a) * 34)
        s.dir.set(-Math.cos(a + 0.8), -0.35 - Math.random() * 0.3, -Math.sin(a + 0.8)).normalize()
        s.t = 0
      }
      return
    }
    s.t += dt
    const head = s.from.clone().addScaledVector(s.dir, s.t * 32)
    const tail = head.clone().addScaledVector(s.dir, -Math.min(6, s.t * 32))
    const p = geo.attributes.position as THREE.BufferAttribute
    p.setXYZ(0, head.x, head.y, head.z)
    p.setXYZ(1, tail.x, tail.y, tail.z)
    p.needsUpdate = true
    mat.opacity = Math.max(0, 1 - s.t / 1.1)
    l.visible = true
    if (s.t > 1.1) { s.t = -1; s.wait = 5 + Math.random() * 9 }
  })
  return <primitive object={obj} />
}
