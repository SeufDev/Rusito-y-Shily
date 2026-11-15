import { motion } from 'motion/react'
import { BookHeart, Flower2, Home, Mail, PawPrint, Settings, Sparkles, Wind, Dices, type LucideIcon } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { Seeds } from './ui'
import { useSections, type SectionId } from '../lib/sections'

export const SECTIONS: { id?: SectionId; to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Hoy', icon: Home },
  { id: 'universo', to: '/universo', label: 'Universo', icon: Sparkles },
  { id: 'jardin', to: '/jardin', label: 'Jardín', icon: Flower2 },
  { id: 'casita', to: '/casita', label: 'Casita', icon: PawPrint },
  { id: 'cartas', to: '/cartas', label: 'Cartas', icon: Mail },
  { id: 'recuerdos', to: '/recuerdos', label: 'Recuerdos', icon: BookHeart },
  { id: 'juntos', to: '/juntos', label: 'Juntos', icon: Dices },
  { id: 'calma', to: '/calma', label: 'Calma', icon: Wind },
]

export function Nav() {
  const loc = useLocation()
  const { visible, building } = useSections()
  return (
    <>
      <nav className="nav" aria-label="Secciones">
        <div className="nav-brand">
          <span className="display">R & S</span>
        </div>
        <div className="nav-links">
          {SECTIONS.filter((x) => !x.id || visible(x.id)).map(({ id, to, label, icon: Icon }) => {
            const on = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} className={`nav-link ${on ? 'on' : ''}`} aria-label={label}>
                {id && building(id) && <i className="nav-wip" title="Solo la ves vos (en obra)" />}
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
