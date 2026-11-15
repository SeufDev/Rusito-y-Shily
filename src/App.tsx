import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Art } from './components/Art'
import { Celebrations } from './components/Celebrations'
import { HiddenNotes } from './components/HiddenNotes'
import { Lock } from './components/Lock'
import { Nav } from './components/Nav'
import { Sky } from './components/Sky'
import { ToastHost } from './components/ui'
import { backend } from './lib/backend'
import { useCalmMotion } from './lib/motion'
import { StoreProvider } from './lib/store'
import Home from './pages/Home'
import Garden from './pages/Garden'
import Pet from './pages/Pet'
import Letters from './pages/Letters'
import Memories from './pages/Memories'
import Together from './pages/Together'
import Calm from './pages/Calm'
import Settings from './pages/Settings'
const Universe = lazy(() => import('./pages/Universe'))

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const calm = useCalmMotion()
  useEffect(() => {
    backend.hasSession().then(setAuthed)
  }, [])
  return (
    <MotionConfig reducedMotion={calm ? 'always' : 'never'}>
      <Sky />
      {authed === null ? null : !authed ? (
        <Lock onOpen={() => setAuthed(true)} />
      ) : (
        <ToastHost>
          <StoreProvider picker={(choose, people) => <WhoPicker choose={choose} people={people} />}>
            <HashRouter>
              <Shell />
            </HashRouter>
          </StoreProvider>
        </ToastHost>
      )}
    </MotionConfig>
  )
}

function Shell() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])
  const full = loc.pathname === '/universo'
  return (
    <div className={`shell ${full ? 'full' : ''}`}>
      <Nav />
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="page"
          >
            <Suspense fallback={<div className="boot"><div className="boot-dot" /></div>}>
              <Routes location={loc}>
                <Route path="/" element={<Home />} />
                <Route path="/universo" element={<Universe />} />
                <Route path="/jardin" element={<Garden />} />
                <Route path="/mascota" element={<Pet />} />
                <Route path="/cartas" element={<Letters />} />
                <Route path="/recuerdos" element={<Memories />} />
                <Route path="/juntos" element={<Together />} />
                <Route path="/calma" element={<Calm />} />
                <Route path="/ajustes" element={<Settings />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <HiddenNotes place={loc.pathname} />
      <Celebrations />
    </div>
  )
}

function WhoPicker({ choose, people }: { choose: (w: 'a' | 'b') => void; people: Record<'a' | 'b', { name: string; animal: string }> }) {
  return (
    <div className="center-screen">
      <motion.div className="who" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="display">¿Quién está entrando?</h1>
        <p className="muted">Se recuerda en este dispositivo. Lo podés cambiar en Ajustes.</p>
        <div className="who-cards">
          {(['a', 'b'] as const).map((w, i) => (
            <motion.button
              key={w}
              className="who-card"
              onClick={() => choose(w)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.1 } }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <Art lottie={people[w].animal} size={96} />
              <span className="who-name">{people[w].name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
