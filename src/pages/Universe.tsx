import { Line, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { Art } from '../components/Art'
import { useToast } from '../components/ui'
import { MOODS } from '../lib/content'
import { dayKey, hash, parseDay } from '../lib/dates'
import { daysTogether } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'

function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, inner)
  grad.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.6)'))
  grad.addColorStop(1, outer)
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
function starPos(i: number): [number, number, number] {
  const r = 0.9 * Math.sqrt(i + 1.5)
  const a = i * GOLDEN
  return [Math.cos(a) * r, (hash('z' + i) - 0.5) * (1.2 + r * 0.12), Math.sin(a) * r]
}
const dayOf = (start: string, i: number) => {
  const d = parseDay(start)
  d.setDate(d.getDate() + i)
  return dayKey(d)
}

type DayInfo = { memories: string[]; letters: number; answers: number; moods: string[]; hugs: number; wishes: { text: string; by: string }[] }

export default function Universe() {
  const { settings, add } = useStore()
  const { name } = usePeople()
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
  const [wish, setWish] = useState('')

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

  const selDay = sel !== null ? dayOf(settings.start, sel) : null
  const selInfo = selDay ? info.get(selDay) : undefined

  const dist = 7 + Math.sqrt(n) * 1.3
  return createPortal(
    <div className="universe">
      <Canvas camera={{ position: [0, dist * 0.55, dist], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#05060f']} />
        <fog attach="fog" args={['#05060f', 30, 90]} />
        <Stars radius={80} depth={50} count={calm ? 1500 : 4000} factor={3.2} saturation={0.4} fade speed={calm ? 0 : 0.6} />
        {!calm && <Sparkles count={70} scale={[30, 10, 30]} size={2.2} speed={0.25} color="#f7d9e3" opacity={0.5} />}
        <Galaxy n={n} info={info} start={settings.start} sel={sel} onSelect={setSel} calm={calm} />
        <OrbitControls enablePan={false} minDistance={4} maxDistance={45} autoRotate={!calm} autoRotateSpeed={0.25} enableDamping />
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.15} intensity={1.4} radius={0.75} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
        </EffectComposer>
      </Canvas>

      <div className="uni-overlay">
        <motion.div className="uni-counter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
          <p className="eyebrow">Nuestro universo desde el {parseDay(settings.start).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <LiveCounter start={settings.start} />
          <p className="uni-sub">Cada día que pasa se enciende una estrella. Las rosadas guardan recuerdos y las doradas, deseos. Tocá una para ver su día.</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {sel !== null && selDay && (
          <motion.aside className="uni-panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <button className="icon-btn modal-x" onClick={() => setSel(null)} aria-label="Cerrar"><X size={18} /></button>
            <p className="eyebrow">Estrella {sel + 1}</p>
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

function LiveCounter({ start }: { start: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = Math.max(0, now - parseDay(start).getTime())
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms / 3600000) % 24)
  const m = Math.floor((ms / 60000) % 60)
  const s = Math.floor((ms / 1000) % 60)
  const p = (x: number) => String(x).padStart(2, '0')
  return (
    <div className="counter">
      <span className="counter-big">{d}</span>
      <span className="counter-unit">{d === 1 ? 'día' : 'días'}</span>
      <span className="counter-small">{p(h)}:{p(m)}:{p(s)}</span>
    </div>
  )
}

function Galaxy({ n, info, start, sel, onSelect, calm }: { n: number; info: Map<string, DayInfo>; start: string; sel: number | null; onSelect: (i: number) => void; calm: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const today = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const [hover, setHover] = useState<number | null>(null)
  const lit = Math.max(1, n)
  const ghosts = 400
  const days = useMemo(() => Array.from({ length: lit }, (_, i) => dayOf(start, i)), [lit, start])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    days.forEach((d, i) => {
      const inf = info.get(d)
      const big = (inf?.memories.length ? 0.07 : 0) + (inf?.wishes.length ? 0.05 : 0) + (sel === i ? 0.08 : 0) + (hover === i ? 0.05 : 0)
      o.position.set(...starPos(i))
      o.scale.setScalar(0.11 + big + hash('s' + i) * 0.05)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (inf?.memories.length) c.setRGB(3.2, 1.5, 2.0)
      else if (inf?.wishes.length) c.setRGB(3.4, 2.6, 1.2)
      else if (inf && (inf.letters || inf.answers || inf.hugs)) c.setRGB(2.0, 2.2, 3.4)
      else c.setRGB(2.2, 2.2, 2.6)
      m.setColorAt(i, c)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.count = days.length
  }, [days, info, sel, hover])

  const dot = useMemo(() => glowTexture(), [])
  const NEBULA = useMemo(() => [
    { p: [0, 0, 0] as [number, number, number], s: 14 + Math.sqrt(lit) * 2, o: 0.16, t: glowTexture('rgba(236,170,200,1)', 'rgba(120,80,160,0)') },
    { p: [4, -1, -3] as [number, number, number], s: 18, o: 0.12, t: glowTexture('rgba(140,150,240,1)', 'rgba(40,40,120,0)') },
    { p: [-5, 1, 2] as [number, number, number], s: 16, o: 0.1, t: glowTexture('rgba(150,210,220,1)', 'rgba(40,80,120,0)') },
  ], [lit])
  const ghostGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(ghosts * 3)
    for (let i = 0; i < ghosts; i++) arr.set(starPos(lit + i), i * 3)
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [lit])

  const constellation = useMemo(() => {
    const pts = days.map((d, i) => (info.get(d)?.memories.length ? starPos(i) : null)).filter(Boolean) as [number, number, number][]
    return pts.length >= 2 ? pts : null
  }, [days, info])

  useFrame(({ clock }) => {
    if (today.current) {
      const t = clock.getElapsedTime()
      today.current.scale.setScalar(calm ? 0.3 : 0.28 + Math.sin(t * 1.6) * 0.06)
    }
    if (group.current && !calm) group.current.rotation.y += 0.0004
  })

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, Math.max(lit, 1)]}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.instanceId !== undefined) onSelect(e.instanceId) }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(e.instanceId ?? null); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(null); document.body.style.cursor = '' }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh ref={today} position={starPos(lit - 1)} onClick={(e) => { e.stopPropagation(); onSelect(lit - 1) }}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={[4, 3, 3.6]} toneMapped={false} transparent opacity={0.55} />
      </mesh>
      <points geometry={ghostGeo}>
        <pointsMaterial map={dot} size={0.14} color="#a9b0e6" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {NEBULA.map((nb, i) => (
        <sprite key={i} position={nb.p} scale={[nb.s, nb.s, 1]}>
          <spriteMaterial map={nb.t} transparent opacity={nb.o} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
      {constellation && <Line points={constellation} color="#f2b8c6" lineWidth={1} transparent opacity={0.35} />}
    </group>
  )
}
