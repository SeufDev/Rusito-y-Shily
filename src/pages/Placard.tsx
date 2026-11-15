import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Heart, RotateCcw, Shirt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Art } from '../components/Art'
import { ShopCard, useBuy } from '../components/Shop'
import { celebrate, Empty, Segmented, useToast } from '../components/ui'
import type { Who } from '../lib/config'
import { WEAR, wearById, WEAR_SLOTS, type Wear, type WearSlot } from '../lib/content'
import { hash } from '../lib/dates'
import { useGame } from '../lib/game'
import { useCalmMotion } from '../lib/motion'
import { useItems, usePeople, useStore } from '../lib/store'

export type Outfit = { name: string; for: Who; note?: string; pieces: Partial<Record<WearSlot, string>> }

// Dónde va cada prenda en la mesa (flat lay), en % del tablero.
const LAY: Record<WearSlot, { x: number; y: number; s: number }> = {
  cabeza: { x: 50, y: 13, s: 0.2 },
  arriba: { x: 50, y: 38, s: 0.34 },
  enterito: { x: 50, y: 46, s: 0.46 },
  abajo: { x: 50, y: 68, s: 0.32 },
  pies: { x: 50, y: 89, s: 0.2 },
  cartera: { x: 83, y: 58, s: 0.22 },
  accesorio: { x: 17, y: 32, s: 0.2 },
}

/** El placard: un ropero con lo que tienen, una mesa para armar outfits y un lookbook para regalárselos. */
export default function Placard() {
  const [tab, setTab] = useState<'armar' | 'lookbook' | 'vidriera'>('armar')
  const outfits = useItems<Outfit>('outfit')
  return (
    <div className="stack-m">
      <p className="muted">La ropa vive acá, en su placard. Armen outfits para ustedes: para la próxima cita, para un viaje soñado o para un domingo de lluvia. Y regálenselos.</p>
      <Segmented value={tab} onChange={setTab} options={[{ id: 'armar', label: 'Armar outfit' }, { id: 'lookbook', label: `Lookbook${outfits.length ? ` · ${outfits.length}` : ''}` }, { id: 'vidriera', label: 'Vidriera' }]} />
      {tab === 'armar' && <Builder onSaved={() => setTab('lookbook')} />}
      {tab === 'lookbook' && <Lookbook />}
      {tab === 'vidriera' && <Vitrine />}
    </div>
  )
}

function Builder({ onSaved }: { onSaved: () => void }) {
  const g = useGame()
  const { add } = useStore()
  const { me, other, P } = usePeople()
  const toast = useToast()
  const calm = useCalmMotion()
  const [pieces, setPieces] = useState<Partial<Record<WearSlot, string>>>({})
  const [name, setName] = useState('')
  const [forWho, setFor] = useState<Who>(other)
  const owned = WEAR.filter((w) => g.owned.has(w.id))
  const toggle = (w: Wear) => {
    setPieces((p) => {
      const n = { ...p }
      if (n[w.slot] === w.id) delete n[w.slot]
      else {
        n[w.slot] = w.id
        if (w.slot === 'enterito') { delete n.arriba; delete n.abajo }
        if (w.slot === 'arriba' || w.slot === 'abajo') delete n.enterito
      }
      return n
    })
  }
  const worn = new Set(Object.values(pieces))
  const save = async () => {
    await add<Outfit>('outfit', { name: name.trim() || 'Sin nombre', for: forWho, pieces })
    celebrate(calm, { particleCount: 50, spread: 60 })
    toast({ text: forWho === me ? 'Guardado en el lookbook' : <>Le regalaste el outfit a <b>{P[other].name}</b></>, art: { img: 'dress' } })
    setPieces({})
    setName('')
    onSaved()
  }
  const rail = owned.filter((w) => w.slot === 'arriba' || w.slot === 'enterito' || w.slot === 'abajo')
  const shelf = owned.filter((w) => w.slot === 'cabeza' || w.slot === 'accesorio' || w.slot === 'cartera')
  const shoes = owned.filter((w) => w.slot === 'pies')
  return (
    <LayoutGroup>
      <div className="placard">
        <div className="wardrobe">
          <div className="wd-top">
            {shelf.map((w) => <Piece key={w.id} w={w} on={worn.has(w.id)} onClick={() => toggle(w)} size={46} />)}
          </div>
          <div className="wd-rail">
            <i className="wd-bar" />
            {rail.map((w) => (
              <button key={w.id} className={`hanger ${worn.has(w.id) ? 'out' : ''}`} onClick={() => toggle(w)} aria-label={w.name} style={{ animationDelay: `${-hash(w.id) * 4}s` }}>
                <i className="hook" />
                {!worn.has(w.id) && <motion.span layoutId={`w-${w.id}`} className="hanger-art"><Art img={w.img} size={70} /></motion.span>}
                <span className="hanger-name">{w.name}</span>
              </button>
            ))}
          </div>
          <div className="wd-shoes">
            {shoes.map((w) => <Piece key={w.id} w={w} on={worn.has(w.id)} onClick={() => toggle(w)} size={44} />)}
          </div>
          <p className="small muted wd-tip">Tocá una prenda para ponerla en la mesa. En la vidriera hay más.</p>
        </div>

        <div className="lay-wrap">
          <div className="flatlay">
            <AnimatePresence>
              {Object.entries(pieces).map(([slot, id]) => {
                const w = wearById(id)!
                const l = LAY[slot as WearSlot]
                return (
                  <motion.button key={id} layoutId={`w-${id}`} className="lay-piece" onClick={() => toggle(w)} aria-label={`Sacar ${w.name}`}
                    style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.s * 100}%`, rotate: `${(hash(id) - 0.5) * 14}deg` }}
                    exit={{ opacity: 0, scale: 0.6 }} transition={{ type: 'spring', damping: 22, stiffness: 220 }}>
                    <Art img={w.img} size="100%" />
                  </motion.button>
                )
              })}
            </AnimatePresence>
            {!Object.keys(pieces).length && <p className="lay-empty">La mesa está libre.<br />Elegí algo del placard.</p>}
          </div>
          <div className="stack-s">
            <input className="input" placeholder="Nombre del outfit (ej: “para nuestra primera cena”)" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="row gap-s wrap">
              <div className="mini-seg">
                <button className={forWho === other ? 'on' : ''} onClick={() => setFor(other)}>Para {P[other].name}</button>
                <button className={forWho === me ? 'on' : ''} onClick={() => setFor(me)}>Para mí</button>
              </div>
              <button className="btn ghost small" onClick={() => setPieces({})} disabled={!Object.keys(pieces).length}><RotateCcw size={14} /> Vaciar</button>
              <button className="btn primary grow" onClick={save} disabled={!Object.keys(pieces).length}><Heart size={15} /> {forWho === me ? 'Guardar' : 'Regalar'}</button>
            </div>
          </div>
        </div>
      </div>
    </LayoutGroup>
  )
}

function Piece({ w, on, onClick, size }: { w: Wear; on: boolean; onClick: () => void; size: number }) {
  return (
    <button className={`wd-piece ${on ? 'out' : ''}`} onClick={onClick} aria-label={w.name} title={w.name}>
      {!on ? <motion.span layoutId={`w-${w.id}`} style={{ display: 'inline-flex' }}><Art img={w.img} size={size} /></motion.span> : <span style={{ width: size, height: size, display: 'inline-block' }} />}
    </button>
  )
}

function MiniLay({ o }: { o: Outfit }) {
  return (
    <div className="flatlay mini">
      {Object.entries(o.pieces).map(([slot, id]) => {
        const w = wearById(id)
        if (!w) return null
        const l = LAY[slot as WearSlot]
        return (
          <span key={id} className="lay-piece" style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.s * 100}%`, rotate: `${(hash(id) - 0.5) * 14}deg` }}>
            <Art img={w.img} size="100%" />
          </span>
        )
      })}
    </div>
  )
}

function Lookbook() {
  const outfits = useItems<Outfit>('outfit')
  const { me, P, name } = usePeople()
  const { remove } = useStore()
  if (!outfits.length) return <Empty art={{ img: 'dress' }}>Todavía no hay outfits. Armen el primero y aparece acá, como una revista de los dos.</Empty>
  const list = [...outfits].reverse()
  return (
    <div className="lookbook">
      {list.map((o, i) => (
        <motion.figure key={o.id} className={`look ${o.data.for === me && o.author !== me ? 'gift' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <MiniLay o={o.data} />
          <figcaption>
            <b className="display">{o.data.name}</b>
            <span className="small muted">
              {o.author === o.data.for ? `De ${name(o.author)}, para su placard` : `${name(o.author)} se lo armó a ${P[o.data.for].name}`}
            </span>
          </figcaption>
          {o.author === me && <button className="icon-btn tiny look-x" onClick={() => remove(o.id)} aria-label="Borrar"><Trash2 size={13} /></button>}
        </motion.figure>
      ))}
    </div>
  )
}

function Vitrine() {
  const g = useGame()
  const buy = useBuy()
  return (
    <div className="stack-l">
      {WEAR_SLOTS.map((s) => {
        const list = WEAR.filter((w) => w.slot === s.id && w.price > 0)
        if (!list.length) return null
        return (
          <section key={s.id}>
            <h3 className="section-t">{s.name}</h3>
            <div className="shop-grid">
              {list.map((w) => (
                <ShopCard key={w.id} art={{ img: w.img }} title={w.name} price={w.price} done={g.owned.has(w.id)} doneLabel="En el placard"
                  onBuy={() => buy({ what: 'wear', ref: w.id, price: w.price }, w.name.toLowerCase(), { img: w.img })} />
              ))}
            </div>
          </section>
        )
      })}
      <p className="small muted center"><Shirt size={13} /> La remera, el jean y las zapatillas vienen de regalo.</p>
    </div>
  )
}
