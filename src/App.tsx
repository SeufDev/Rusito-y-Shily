import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Celebrations } from './components/Celebrations'
import { HiddenNotes } from './components/HiddenNotes'
import { Lock } from './components/Lock'
import { Nav } from './components/Nav'
import { Player } from './components/Player'
import { Sky } from './components/Sky'
import { ToastHost } from './components/ui'
import { backend } from './lib/backend'
import type { Who } from './lib/config'
import { useCalmMotion } from './lib/motion'
import { StoreProvider } from './lib/store'
import { useSections, type SectionId } from './lib/sections'
import Home from './pages/Home'
import Garden from './pages/Garden'
import Pet from './pages/Pet'
import Letters from './pages/Letters'
import Memories from './pages/Memories'
import Together from './pages/Together'
import Calm from './pages/Calm'
import Settings from './pages/Settings'
const Universe = lazy(() => import('./pages/Universe'))
// La vista previa publicada usa un router en memoria (el visor no deja pasar rutas en el #).
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

export default function App() {
  const [me, setMe] = useState<Who | null | undefined>(undefined)
  const calm = useCalmMotion()
  useEffect(() => {
    backend.session().then(setMe)
  }, [])
  return (
    <MotionConfig reducedMotion={calm ? 'always' : 'never'}>
      <Sky />
      {me === undefined ? null : !me ? (
        <Lock onOpen={setMe} />
      ) : (
        <ToastHost>
          <StoreProvider me={me}>
            <Router>
              <Shell />
            </Router>
          </StoreProvider>
        </ToastHost>
      )}
    </MotionConfig>
  )
}

function Shell() {
  const loc = useLocation()
  const { visible } = useSections()
  const gate = (id: SectionId, el: ReactNode) => (visible(id) ? el : <Navigate to="/" replace />)
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
                <Route path="/universo" element={gate('universo', <Universe />)} />
                <Route path="/jardin" element={gate('jardin', <Garden />)} />
                <Route path="/casita" element={gate('casita', <Pet />)} />
                <Route path="/mascota" element={<Navigate to="/casita" replace />} />
                <Route path="/cartas" element={gate('cartas', <Letters />)} />
                <Route path="/recuerdos" element={gate('recuerdos', <Memories />)} />
                <Route path="/juntos" element={gate('juntos', <Together />)} />
                <Route path="/calma" element={gate('calma', <Calm />)} />
                <Route path="/ajustes" element={<Settings />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <HiddenNotes place={loc.pathname} />
      <Celebrations />
      <Player />
    </div>
  )
}
