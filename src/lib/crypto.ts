// Las cartas con palabra clave se guardan cifradas: ni mirando la base se pueden leer sin la palabra.
const enc = new TextEncoder()
const dec = new TextDecoder()
export const normalizeWord = (w: string) =>
  w.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function keyFrom(word: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', enc.encode(normalizeWord(word)), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 150000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
export async function seal(text: string, word: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await keyFrom(word, salt)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  return { cipher: b64(cipher), salt: b64(salt), iv: b64(iv) }
}
export async function unseal(box: { cipher: string; salt: string; iv: string }, word: string) {
  try {
    const key = await keyFrom(word, unb64(box.salt))
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) as BufferSource }, key, unb64(box.cipher) as BufferSource)
    return dec.decode(plain)
  } catch {
    return null
  }
}
