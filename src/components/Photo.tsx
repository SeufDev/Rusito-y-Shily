import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { backend, shrinkImage } from '../lib/backend'

export function Photo({ path: r, className, alt = '' }: { path?: string; className?: string; alt?: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (r) backend.photoUrl(r).then(setUrl)
  }, [r])
  if (!r) return null
  return url ? <img src={url} alt={alt} className={className} loading="lazy" /> : <div className={`${className} ph-loading`} />
}

export function PhotoPicker({ value, onChange }: { value?: string; onChange: (ref?: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="photo-pick">
      {value ? (
        <button className="photo-prev" onClick={() => onChange(undefined)} title="Quitar foto"><Photo path={value} className="photo-prev-img" /></button>
      ) : (
        <button className="btn soft" onClick={() => input.current?.click()} disabled={busy}><ImagePlus size={16} /> {busy ? 'Subiendo…' : 'Agregar foto'}</button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setBusy(true)
        try {
          const blob = await shrinkImage(f)
          onChange(await backend.uploadPhoto(blob))
        } finally {
          setBusy(false)
          e.target.value = ''
        }
      }} />
    </div>
  )
}
