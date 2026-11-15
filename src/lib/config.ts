export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
/** Email de la cuenta compartida en Supabase. Ustedes solo escriben la clave. */
export const SHARED_EMAIL = (import.meta.env.VITE_SHARED_EMAIL as string | undefined) ?? ''

/** Sin Supabase configurado la web corre en modo vista previa (guarda en este navegador). */
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY
export const DEMO_PASSWORD = 'nosotros'

export type Who = 'a' | 'b'
/** 'a' es ella (el centro de todo), 'b' es Rusito (Rodri). Los nombres se cambian en Ajustes. */
export const DEFAULT_PEOPLE: Record<Who, { name: string; animal: string; color: string }> = {
  a: { name: 'Shily', animal: '1f98a', color: '#e8a3a3' },
  b: { name: 'Rusito', animal: '1f43b', color: '#8fb3a0' },
}
export const DEFAULT_START = '2026-11-14'
