import { useSyncExternalStore } from 'react'
// Movimiento reducido: respeta la configuración del sistema y además se puede activar a mano.
const KEY = 'nl-calm-motion'
const listeners = new Set<() => void>()
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
mq?.addEventListener('change', () => listeners.forEach((l) => l()))
function read(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    if (v === '1') return true
    if (v === '0') return false
  } catch { /* */ }
  return !!mq?.matches
}
export function setCalmMotion(on: boolean) {
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* */ }
  document.documentElement.dataset.calm = on ? '1' : '0'
  listeners.forEach((l) => l())
}
export function useCalmMotion() {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), read)
}
if (typeof document !== 'undefined') document.documentElement.dataset.calm = read() ? '1' : '0'
