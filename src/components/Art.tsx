import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useCalmMotion } from '../lib/motion'
import type { Art as ArtT } from '../lib/content'

const BASE = import.meta.env.BASE_URL
const cache = new Map<string, Promise<any>>()
function loadLottie(code: string) {
  if (!cache.has(code)) cache.set(code, fetch(`${BASE}lottie/${code}.json`).then((r) => r.json()))
  return cache.get(code)!
}

type Props = ArtT & {
  size?: number | string
  play?: 'loop' | 'hover' | 'once' | 'still'
  className?: string
  style?: CSSProperties
  alt?: string
}

/** Emojis animados de Google Noto (Lottie) o ilustraciones 3D de Microsoft Fluent. */
export function Art({ lottie, img, size = 64, play = 'loop', className, style, alt = '' }: Props) {
  const calm = useCalmMotion()
  const s = typeof size === 'number' ? `${size}px` : size
  const box: CSSProperties = { width: s, height: s, display: 'inline-block', flex: 'none', ...style }
  if (lottie) return <LottieArt code={lottie} play={calm ? 'still' : play} className={className} style={box} />
  if (img) return <img src={`${BASE}fluent/${img}.png`} alt={alt} draggable={false} className={`art-img ${className ?? ''}`} style={box} loading="lazy" />
  return <span style={box} />
}

function LottieArt({ code, play, className, style }: { code: string; play: NonNullable<Props['play']>; className?: string; style: CSSProperties }) {
  const host = useRef<HTMLSpanElement>(null)
  const anim = useRef<AnimationItem | null>(null)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let alive = true
    loadLottie(code)
      .then((data) => {
        if (!alive || !host.current) return
        anim.current = lottie.loadAnimation({
          container: host.current,
          renderer: 'svg',
          loop: play === 'loop',
          autoplay: false,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
        })
        setReady(true)
      })
      .catch(() => {})
    return () => {
      alive = false
      anim.current?.destroy()
      anim.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])
  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const a = anim.current
    if (!a || !ready) return
    a.loop = play === 'loop'
    if (play === 'still' || play === 'hover') a.goToAndStop(Math.floor(a.totalFrames * 0.35), true)
    else if (play === 'loop') visible ? a.play() : a.pause()
    else if (play === 'once' && visible) a.goToAndPlay(0, true)
  }, [play, visible, ready])
  return (
    <span
      ref={host}
      className={`art-lottie ${className ?? ''}`}
      style={style}
      onMouseEnter={() => play === 'hover' && anim.current?.goToAndPlay(0, true)}
    />
  )
}
