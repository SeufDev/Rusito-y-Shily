import type { Who } from './config'
import { useStore } from './store'

export type SectionId = 'universo' | 'jardin' | 'casita' | 'cartas' | 'recuerdos' | 'juntos' | 'calma'
export type SectionState = 'on' | 'off' | Who

/**
 * Cómo arranca cada sección si nadie la tocó en Ajustes.
 * Para trabajar una sección tranquilo, ponela en 'off' (apagada para los dos)
 * o en 'b' (solo la ve Rusito). Desde Ajustes se puede cambiar sin tocar código.
 */
export const SECTION_DEFAULTS: Record<SectionId, SectionState> = {
  universo: 'on',
  jardin: 'on',
  casita: 'on',
  cartas: 'on',
  recuerdos: 'on',
  juntos: 'on',
  calma: 'on',
}

export function useSections() {
  const { settings, me } = useStore()
  const get = (id: SectionId): SectionState => (settings.sections?.[id] as SectionState | undefined) ?? SECTION_DEFAULTS[id]
  const visible = (id: SectionId) => {
    const s = get(id)
    return s === 'on' || s === me
  }
  /** visible solo para mí: la marco como "en obra" */
  const building = (id: SectionId) => get(id) === me
  return { get, visible, building }
}
