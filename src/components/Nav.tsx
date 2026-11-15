import { motion } from 'motion/react'
import { BookHeart, Flower2, Home, Mail, PawPrint, Settings, Sparkles, Wind, Dices } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Seeds } from './ui'

export const SECTIONS = [
  { to: '/', label: 'Hoy', icon: Home },
  { to: '/universo', label: 'Universo', icon: Sparkles },
  { to: '/jardin', label: 'Jardín', icon: Flower2 },
  { to: '/mascota', label: 'Mascota', icon: PawPrint },
  { to: '/cartas', label: 'Cartas', icon: Mail },
  { to: '/recuerdos', label: 'Recuerdos', icon: BookHeart },
  { to: '/juntos', label: 'Juntos', icon: Dices },
  { to: '/calma', label: 'Calma', icon: Wind },
]

export function Nav() {
  const loc = useLocation()
  return (
    <>
      <nav className="nav" aria-label="Secciones">
        <div className="nav-brand">
          <span className="display">R & S</span>
        </div>
        <div className="nav-links">
          {SECTIONS.map(({ to, label, icon: Icon }) => {
            const on = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} className={`nav-link ${on ? 'on' : ''}`} aria-label={label}>
                {on && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />}
                <Icon size={20} strokeWidth={1.7} />
                <span className="nav-label">{label}</span>
              </NavLink>
            )
          })}
        </div>
        <div className="nav-foot">
          <Seeds />
          <NavLink to="/ajustes" className="icon-btn" aria-label="Ajustes"><Settings size={18} strokeWidth={1.7} /></NavLink>
        </div>
      </nav>
      <div className="topbar">
        <span className="display">R & S</span>
        <div className="row gap-s">
          <Seeds />
          <NavLink to="/ajustes" className="icon-btn" aria-label="Ajustes"><Settings size={18} strokeWidth={1.7} /></NavLink>
        </div>
      </div>
    </>
  )
}
