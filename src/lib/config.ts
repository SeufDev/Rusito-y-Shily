export type Who = 'a' | 'b'
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
/** Cada uno tiene su propia cuenta en Supabase. Al entrar solo se elige quién sos y se escribe la clave. */
export const EMAILS = {
  a: (import.meta.env.VITE_EMAIL_SHILY as string | undefined) ?? '',
  b: (import.meta.env.VITE_EMAIL_RUSITO as string | undefined) ?? '',
}

/** Sin Supabase configurado la web corre en modo vista previa (guarda en este navegador). */
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY
/** Claves de la vista previa (solo sin Supabase). */
export const DEMO_PASSWORDS = { a: 'shily', b: 'rusito' } as const

/** 'a' es ella (el centro de todo), 'b' es Rusito (Rodri). Los nombres se cambian en Ajustes. */
export const DEFAULT_PEOPLE: Record<Who, { name: string; animal: string; color: string }> = {
  a: { name: 'Shily', animal: '1f98a', color: '#e8a3a3' },
  b: { name: 'Rusito', animal: '1f43b', color: '#8fb3a0' },
}
export const DEFAULT_START = '2026-11-14'
