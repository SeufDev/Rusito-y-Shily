// Todo el contenido "de catálogo": plantas, animalitos, muebles, ropa, preguntas, ideas.
export type Art = { lottie?: string; img?: string }

// ───────────────────────── Jardín ─────────────────────────
/**
 * flor: florece y da néctar · huerta: se cosecha una vez (va a la despensa)
 * frutal: florece y da frutas para siempre · árbol: grande, da mucho néctar
 */
export type PlantType = 'flor' | 'huerta' | 'frutal' | 'árbol'
export type Species = Art & { id: string; name: string; days: number; price: number; type: PlantType; harvest?: number; note: string }
export const SPECIES: Species[] = [
  // flores
  { id: 'tulipan', name: 'Tulipán', lottie: '1f337', days: 3, price: 0, type: 'flor', note: 'La primera de todas. Siempre hay una de regalo.' },
  { id: 'trebol', name: 'Trébol', lottie: '1f340', days: 2, price: 8, type: 'flor', note: 'Dicen que trae suerte. Crece rapidito.' },
  { id: 'margarita', name: 'Margarita', lottie: '1f33c', days: 3, price: 10, type: 'flor', note: 'Sencilla y luminosa.' },
  { id: 'espiga', name: 'Espiga', img: 'sheaf_of_rice', days: 3, price: 12, type: 'flor', note: 'Se mueve con el viento.' },
  { id: 'hojitas', name: 'Hojitas al viento', lottie: '1f343', days: 4, price: 14, type: 'flor', note: 'Bailan todo el día.' },
  { id: 'hongo', name: 'Hongo', lottie: '1f344', days: 4, price: 15, type: 'flor', note: 'Le gusta la sombrita.' },
  { id: 'jacinto', name: 'Jacinto', lottie: '1fabb', days: 4, price: 16, type: 'flor', note: 'Huele a primavera.' },
  { id: 'jazmin', name: 'Jazmín', img: 'white_flower', days: 4, price: 18, type: 'flor', note: 'Blanquito y perfumado, para las noches de verano.' },
  { id: 'cactus', name: 'Cactus', lottie: '1f335', days: 5, price: 20, type: 'flor', note: 'Paciente, como el amor a distancia.' },
  { id: 'girasol', name: 'Girasol', img: 'sunflower', days: 5, price: 22, type: 'flor', note: 'Siempre mira hacia la luz.' },
  { id: 'otono', name: 'Hojas de otoño', lottie: '1f342', days: 5, price: 22, type: 'flor', note: 'Tibias, como una tarde de mate.' },
  { id: 'loto', name: 'Flor de loto', lottie: '1fab7', days: 6, price: 28, type: 'flor', note: 'Florece en calma.' },
  { id: 'rosa', name: 'Rosa', lottie: '1f339', days: 6, price: 30, type: 'flor', note: 'Clásica, para regalar.' },
  { id: 'hibisco', name: 'Hibisco', img: 'hibiscus', days: 6, price: 30, type: 'flor', note: 'Un pedacito de verano.' },
  { id: 'arce', name: 'Hojita de arce', lottie: '1f341', days: 7, price: 35, type: 'flor', note: 'Cambia de color con el tiempo.' },
  { id: 'cerezo', name: 'Flor de cerezo', lottie: '1f338', days: 8, price: 40, type: 'flor', note: 'Delicada y muy especial.' },
  { id: 'trebol4', name: 'Trébol de cuatro hojas', img: 'four_leaf_clover', days: 9, price: 50, type: 'flor', note: 'Difícil de encontrar. Por eso lo plantamos nosotros.' },
  { id: 'ramo', name: 'Ramo', lottie: '1f490', days: 10, price: 60, type: 'flor', note: 'Un ramo entero, para una ocasión linda.' },
  // huerta (se cosecha una vez)
  { id: 'lechuga', name: 'Lechuga', lottie: '1f96c', days: 3, price: 12, type: 'huerta', harvest: 18, note: 'Fresquita y rápida.' },
  { id: 'cebolla', name: 'Cebolla', lottie: '1f9c5', days: 4, price: 14, type: 'huerta', harvest: 22, note: 'No hace llorar si la cuidan con amor.' },
  { id: 'ajo', name: 'Ajo', lottie: '1f9c4', days: 4, price: 14, type: 'huerta', harvest: 22, note: 'Para las comidas de la abuela.' },
  { id: 'zanahoria', name: 'Zanahoria', lottie: '1f955', days: 4, price: 15, type: 'huerta', harvest: 22, note: 'Los conejitos la aman.' },
  { id: 'arvejas', name: 'Arvejas', lottie: '1fadb', days: 4, price: 16, type: 'huerta', harvest: 24, note: 'Siempre juntitas en la vaina.' },
  { id: 'frutilla', name: 'Frutilla', lottie: '1f353', days: 4, price: 18, type: 'huerta', harvest: 26, note: 'Dulce. Se cosecha y da semillas.' },
  { id: 'papa', name: 'Papa', lottie: '1f954', days: 5, price: 18, type: 'huerta', harvest: 28, note: 'Crece escondida bajo la tierra.' },
  { id: 'pepino', name: 'Pepino', lottie: '1f952', days: 5, price: 18, type: 'huerta', harvest: 28, note: 'Para una ensalada de verano.' },
  { id: 'tomate', name: 'Tomate', lottie: '1f345', days: 5, price: 20, type: 'huerta', harvest: 30, note: 'De la huerta a la mesa.' },
  { id: 'brocoli', name: 'Brócoli', lottie: '1f966', days: 5, price: 20, type: 'huerta', harvest: 28, note: 'Un arbolito comestible.' },
  { id: 'choclo', name: 'Choclo', lottie: '1f33d', days: 6, price: 22, type: 'huerta', harvest: 34, note: 'Para una humita compartida.' },
  { id: 'morron', name: 'Morrón', img: 'bell_pepper', days: 6, price: 24, type: 'huerta', harvest: 36, note: 'Rojo brillante.' },
  { id: 'berenjena', name: 'Berenjena', img: 'eggplant', days: 6, price: 24, type: 'huerta', harvest: 36, note: 'Violeta y elegante.' },
  { id: 'arandanos', name: 'Arándanos', lottie: '1fad0', days: 6, price: 26, type: 'huerta', harvest: 40, note: 'Chiquitos y llenos de cosas buenas.' },
  { id: 'kiwi', name: 'Kiwi', lottie: '1f95d', days: 7, price: 30, type: 'huerta', harvest: 42, note: 'Verde por dentro.' },
  { id: 'melon', name: 'Melón', lottie: '1f348', days: 8, price: 32, type: 'huerta', harvest: 50, note: 'Para una tarde de calor.' },
  { id: 'sandia', name: 'Sandía', lottie: '1f349', days: 8, price: 34, type: 'huerta', harvest: 52, note: 'Gigante y para compartir.' },
  { id: 'uvas', name: 'Uvas', lottie: '1f347', days: 9, price: 38, type: 'huerta', harvest: 58, note: 'De una parra chiquita.' },
  { id: 'anana', name: 'Ananá', lottie: '1f34d', days: 10, price: 40, type: 'huerta', harvest: 64, note: 'Tropical y con corona.' },
  // frutales (dan frutas para siempre)
  { id: 'limonero', name: 'Limonero', lottie: '1f34b', days: 10, price: 55, type: 'frutal', note: 'Da limones para siempre. Ácido y brillante.' },
  { id: 'mandarino', name: 'Mandarino', lottie: '1f34a', days: 10, price: 55, type: 'frutal', note: 'Mandarinas para el invierno.' },
  { id: 'manzano', name: 'Manzano', lottie: '1f34e', days: 11, price: 60, type: 'frutal', note: 'Una manzana por día.' },
  { id: 'peral', name: 'Peral', lottie: '1f350', days: 11, price: 60, type: 'frutal', note: 'Peras dulces y jugosas.' },
  { id: 'cerezas', name: 'Cerezo frutal', lottie: '1f352', days: 12, price: 65, type: 'frutal', note: 'Cerezas siempre de a dos.' },
  { id: 'mango', name: 'Mango', lottie: '1f96d', days: 12, price: 70, type: 'frutal', note: 'Un árbol de vacaciones.' },
  { id: 'palto', name: 'Palto', lottie: '1f951', days: 12, price: 70, type: 'frutal', note: 'Paltas para el desayuno.' },
  // árboles
  { id: 'pino', name: 'Pino', lottie: '1f332', days: 12, price: 70, type: 'árbol', note: 'Crece lento y queda para siempre.' },
  { id: 'arbol', name: 'Árbol', img: 'deciduous_tree', days: 14, price: 80, type: 'árbol', note: 'Nuestro árbol. Da sombra a todo el jardín.' },
  { id: 'palmera', name: 'Palmera', img: 'palm_tree', days: 14, price: 80, type: 'árbol', note: 'Para soñar con un viaje juntos.' },
  { id: 'deseos', name: 'Árbol de los deseos', img: 'tanabata_tree', days: 14, price: 90, type: 'árbol', note: 'Tiene papelitos colgados con deseos.' },
]
export const speciesById = (id: string) => SPECIES.find((s) => s.id === id) ?? SPECIES[0]
export const TYPE_LABEL: Record<PlantType, string> = { flor: 'Flores', huerta: 'Huerta', frutal: 'Frutales', árbol: 'Árboles' }
export const BASE_PLOTS = 6
export const MAX_PLOTS = 16
export const PLOT_PRICE = 50

/** Mejoras para siempre. */
export type Upgrade = Art & { id: string; name: string; price: number; desc: string }
export const UPGRADES: Upgrade[] = [
  { id: 'regadera', name: 'Regadera grande', img: 'bucket', price: 60, desc: 'La tierra queda húmeda 36 horas en vez de 24. Pueden pasar menos seguido.' },
  { id: 'farolitos', name: 'Farolitos', img: 'red_paper_lantern', price: 70, desc: 'Las plantas guardan el doble de néctar y de noche el jardín se ilumina.' },
  { id: 'colmena', name: 'Colmena', img: 'honey_pot', price: 90, desc: 'Llegan abejitas: el néctar sale más rápido.' },
  { id: 'bebedero', name: 'Bebedero de pajaritos', img: 'fountain', price: 50, desc: 'Vienen pajaritos de visita. Solo porque es lindo.' },
  { id: 'invernadero', name: 'Invernadero', img: 'house_with_garden', price: 120, desc: 'Todo crece un 25% más rápido.' },
]
/** Cosas que se usan y se gastan. */
export const SUPPLIES: (Upgrade & { id: 'abono' | 'lluvia' })[] = [
  { id: 'abono', name: 'Abono', img: 'package', price: 12, desc: 'Una plantita crece 12 horas de golpe.' },
  { id: 'lluvia', name: 'Lluvia mágica', img: 'umbrella_with_rain_drops', price: 25, desc: 'Riega todo el jardín como si fueran los dos, por un día entero.' },
]

// ───────────────────────── Casita ─────────────────────────
export type Gait = 'walk' | 'hop' | 'waddle' | 'slow'
/** faces: hacia dónde mira el dibujo original (para darlo vuelta al caminar). */
export type PetSpecies = { id: string; name: string; img: string; faces: 'left' | 'right'; size: number; gait: Gait }
export const PETS: PetSpecies[] = [
  { id: 'gatito', name: 'Gatito', img: 'cat', faces: 'left', size: 1, gait: 'walk' },
  { id: 'gatito-negro', name: 'Gatito negro', img: 'black_cat', faces: 'right', size: 1, gait: 'walk' },
  { id: 'perrito', name: 'Perrito', img: 'dog', faces: 'left', size: 1.05, gait: 'walk' },
  { id: 'caniche', name: 'Caniche', img: 'poodle', faces: 'left', size: 1.05, gait: 'walk' },
  { id: 'conejito', name: 'Conejito', img: 'rabbit', faces: 'left', size: 0.95, gait: 'hop' },
  { id: 'ardillita', name: 'Ardillita', img: 'chipmunk', faces: 'left', size: 0.9, gait: 'hop' },
  { id: 'erizo', name: 'Erizo', img: 'hedgehog', faces: 'left', size: 0.85, gait: 'walk' },
  { id: 'ratoncito', name: 'Ratoncito', img: 'mouse', faces: 'left', size: 0.75, gait: 'walk' },
  { id: 'chanchito', name: 'Chanchito', img: 'pig', faces: 'left', size: 1, gait: 'walk' },
  { id: 'ovejita', name: 'Ovejita', img: 'ewe', faces: 'left', size: 1.05, gait: 'walk' },
  { id: 'llamita', name: 'Llamita', img: 'llama', faces: 'left', size: 1.15, gait: 'walk' },
  { id: 'pinguino', name: 'Pingüino', img: 'penguin', faces: 'left', size: 0.95, gait: 'waddle' },
  { id: 'patito', name: 'Patito', img: 'duck', faces: 'left', size: 0.9, gait: 'waddle' },
  { id: 'pollito', name: 'Pollito', img: 'baby_chick', faces: 'left', size: 0.72, gait: 'hop' },
  { id: 'pajarito', name: 'Pajarito', img: 'bird', faces: 'left', size: 0.75, gait: 'hop' },
  { id: 'buho', name: 'Búho', img: 'owl', faces: 'left', size: 0.85, gait: 'hop' },
  { id: 'tortuguita', name: 'Tortuguita', img: 'turtle', faces: 'left', size: 0.85, gait: 'slow' },
  { id: 'caracol', name: 'Caracolito', img: 'snail', faces: 'left', size: 0.7, gait: 'slow' },
]
// Las mascotas de la primera versión eran caritas; ahora cada una tiene cuerpito entero.
const LEGACY_PET: Record<string, string> = { zorrito: 'ardillita', panda: 'conejito', osito: 'perrito', leoncito: 'gatito', lobito: 'caniche', vaquita: 'chanchito' }
export const petById = (id: string) => PETS.find((p) => p.id === (LEGACY_PET[id] ?? id)) ?? PETS[0]
/** Cuánto cuesta adoptar al 1º, 2º, 3º… animalito. */
export const PET_PRICES = [0, 60, 100, 150, 200]

export type Trait = { id: string; name: string; desc: string; sleep: number; play: number; walk: number; cuddle: number }
export const TRAITS: Trait[] = [
  { id: 'dormilon', name: 'Dormilón', desc: 'Encuentra cualquier excusa para una siesta.', sleep: 3, play: 1, walk: 1, cuddle: 1 },
  { id: 'jugueton', name: 'Juguetón', desc: 'Si ve una pelotita, ya fue.', sleep: 1, play: 3, walk: 2, cuddle: 1 },
  { id: 'curioso', name: 'Curioso', desc: 'Recorre la casa revisando todo.', sleep: 1, play: 1, walk: 3, cuddle: 1 },
  { id: 'mimoso', name: 'Mimoso', desc: 'Siempre se acerca a saludar.', sleep: 1, play: 1, walk: 1, cuddle: 3 },
  { id: 'tranqui', name: 'Tranqui', desc: 'Mira por la ventana y disfruta.', sleep: 2, play: 1, walk: 1, cuddle: 2 },
]

export type DecoSlot = 'pared' | 'estante' | 'techo' | 'sillon' | 'rincon' | 'cama' | 'juguete'
export type Deco = { id: string; name: string; img: string; slot: DecoSlot; price: number }
export const DECO_SLOTS: { id: DecoSlot; name: string }[] = [
  { id: 'pared', name: 'Pared' },
  { id: 'estante', name: 'Estante' },
  { id: 'techo', name: 'Luz' },
  { id: 'sillon', name: 'Mueble' },
  { id: 'rincon', name: 'Rincón' },
  { id: 'cama', name: 'Camita' },
  { id: 'juguete', name: 'Juguete' },
]
export const DECO: Deco[] = [
  { id: 'framed_picture', name: 'Cuadrito', img: 'framed_picture', slot: 'pared', price: 30 },
  { id: 'mirror', name: 'Espejo', img: 'mirror', slot: 'pared', price: 35 },
  { id: 'kite', name: 'Barrilete', img: 'kite', slot: 'pared', price: 25 },
  { id: 'wind_chime', name: 'Campanita de viento', img: 'wind_chime', slot: 'pared', price: 30 },
  { id: 'books', name: 'Libros', img: 'books', slot: 'estante', price: 20 },
  { id: 'candle', name: 'Velita', img: 'candle', slot: 'estante', price: 15 },
  { id: 'teapot', name: 'Tetera', img: 'teapot', slot: 'estante', price: 25 },
  { id: 'mantelpiece_clock', name: 'Reloj', img: 'mantelpiece_clock', slot: 'estante', price: 35 },
  { id: 'radio', name: 'Radio', img: 'radio', slot: 'estante', price: 40 },
  { id: 'nesting_dolls', name: 'Mamushkas', img: 'nesting_dolls', slot: 'estante', price: 40 },
  { id: 'crystal_ball', name: 'Bola de cristal', img: 'crystal_ball', slot: 'estante', price: 45 },
  { id: 'light_bulb', name: 'Lamparita', img: 'light_bulb', slot: 'techo', price: 15 },
  { id: 'red_paper_lantern', name: 'Farolito', img: 'red_paper_lantern', slot: 'techo', price: 30 },
  { id: 'mirror_ball', name: 'Bola espejada', img: 'mirror_ball', slot: 'techo', price: 50 },
  { id: 'chair', name: 'Silla', img: 'chair', slot: 'sillon', price: 25 },
  { id: 'guitar', name: 'Guitarra', img: 'guitar', slot: 'sillon', price: 50 },
  { id: 'couch_and_lamp', name: 'Sillón con lámpara', img: 'couch_and_lamp', slot: 'sillon', price: 70 },
  { id: 'bathtub', name: 'Bañera', img: 'bathtub', slot: 'sillon', price: 60 },
  { id: 'potted_plant', name: 'Plantita', img: 'potted_plant', slot: 'rincon', price: 0 },
  { id: 'cactus', name: 'Cactus', img: 'cactus', slot: 'rincon', price: 15 },
  { id: 'evergreen_tree', name: 'Arbolito', img: 'evergreen_tree', slot: 'rincon', price: 45 },
  { id: 'basket', name: 'Canastita', img: 'basket', slot: 'cama', price: 0 },
  { id: 'bed', name: 'Cama grande', img: 'bed', slot: 'cama', price: 80 },
  { id: 'yarn', name: 'Ovillo', img: 'yarn', slot: 'juguete', price: 15 },
  { id: 'softball', name: 'Pelotita', img: 'softball', slot: 'juguete', price: 15 },
  { id: 'soccer_ball', name: 'Pelota', img: 'soccer_ball', slot: 'juguete', price: 20 },
  { id: 'teddy_bear', name: 'Peluche', img: 'teddy_bear', slot: 'juguete', price: 35 },
  { id: 'balloon', name: 'Globito', img: 'balloon', slot: 'juguete', price: 15 },
]
export const decoById = (id?: string | null) => DECO.find((d) => d.id === id)

/** Comida de siempre (no se gasta). La de la huerta sale de la despensa. */
export const BASIC_FOOD = { id: 'galletita', name: 'Galletitas', img: 'cookie' }

// ───────────────────────── Placard ─────────────────────────
export type WearSlot = 'cabeza' | 'arriba' | 'enterito' | 'abajo' | 'pies' | 'cartera' | 'accesorio'
export type Wear = { id: string; name: string; img: string; slot: WearSlot; price: number }
export const WEAR_SLOTS: { id: WearSlot; name: string }[] = [
  { id: 'cabeza', name: 'Cabeza' },
  { id: 'arriba', name: 'Arriba' },
  { id: 'enterito', name: 'Vestidos y enteritos' },
  { id: 'abajo', name: 'Abajo' },
  { id: 'pies', name: 'Calzado' },
  { id: 'cartera', name: 'Carteras' },
  { id: 'accesorio', name: 'Accesorios' },
]
export const WEAR: Wear[] = [
  { id: 'ribbon', name: 'Moñito', img: 'ribbon', slot: 'cabeza', price: 25 },
  { id: 'billed_cap', name: 'Gorrita', img: 'billed_cap', slot: 'cabeza', price: 30 },
  { id: 'top_hat', name: 'Galera', img: 'top_hat', slot: 'cabeza', price: 40 },
  { id: 'womans_hat', name: 'Sombrero con flor', img: 'womans_hat', slot: 'cabeza', price: 45 },
  { id: 'graduation_cap', name: 'Birrete', img: 'graduation_cap', slot: 'cabeza', price: 50 },
  { id: 'crown', name: 'Coronita', img: 'crown', slot: 'cabeza', price: 80 },
  { id: 't-shirt', name: 'Remera', img: 't-shirt', slot: 'arriba', price: 0 },
  { id: 'womans_clothes', name: 'Blusa', img: 'womans_clothes', slot: 'arriba', price: 30 },
  { id: 'coat', name: 'Tapado', img: 'coat', slot: 'arriba', price: 40 },
  { id: 'dress', name: 'Vestido', img: 'dress', slot: 'enterito', price: 35 },
  { id: 'kimono', name: 'Kimono', img: 'kimono', slot: 'enterito', price: 45 },
  { id: 'sari', name: 'Sari', img: 'sari', slot: 'enterito', price: 50 },
  { id: 'one_piece_swimsuit', name: 'Malla', img: 'one_piece_swimsuit', slot: 'enterito', price: 30 },
  { id: 'jeans', name: 'Jean', img: 'jeans', slot: 'abajo', price: 0 },
  { id: 'shorts', name: 'Short', img: 'shorts', slot: 'abajo', price: 20 },
  { id: 'running_shoe', name: 'Zapatillas', img: 'running_shoe', slot: 'pies', price: 0 },
  { id: 'flat_shoe', name: 'Chatitas', img: 'flat_shoe', slot: 'pies', price: 30 },
  { id: 'ballet_shoes', name: 'Zapatillas de ballet', img: 'ballet_shoes', slot: 'pies', price: 35 },
  { id: 'high_heeled_shoe', name: 'Tacos', img: 'high_heeled_shoe', slot: 'pies', price: 40 },
  { id: 'womans_boot', name: 'Botas', img: 'womans_boot', slot: 'pies', price: 45 },
  { id: 'womans_sandal', name: 'Sandalias', img: 'womans_sandal', slot: 'pies', price: 30 },
  { id: 'hiking_boot', name: 'Borcegos', img: 'hiking_boot', slot: 'pies', price: 40 },
  { id: 'mans_shoe', name: 'Zapatos', img: 'mans_shoe', slot: 'pies', price: 35 },
  { id: 'thong_sandal', name: 'Ojotas', img: 'thong_sandal', slot: 'pies', price: 15 },
  { id: 'socks', name: 'Medias', img: 'socks', slot: 'pies', price: 15 },
  { id: 'handbag', name: 'Cartera', img: 'handbag', slot: 'cartera', price: 45 },
  { id: 'purse', name: 'Monedero', img: 'purse', slot: 'cartera', price: 25 },
  { id: 'clutch_bag', name: 'Sobre', img: 'clutch_bag', slot: 'cartera', price: 35 },
  { id: 'backpack', name: 'Mochila', img: 'backpack', slot: 'cartera', price: 35 },
  { id: 'shopping_bags', name: 'Bolsas de compras', img: 'shopping_bags', slot: 'cartera', price: 30 },
  { id: 'glasses', name: 'Anteojos', img: 'glasses', slot: 'accesorio', price: 30 },
  { id: 'sunglasses', name: 'Anteojos de sol', img: 'sunglasses', slot: 'accesorio', price: 35 },
  { id: 'scarf', name: 'Bufanda', img: 'scarf', slot: 'accesorio', price: 30 },
  { id: 'gloves', name: 'Guantes', img: 'gloves', slot: 'accesorio', price: 20 },
  { id: 'necktie', name: 'Corbata', img: 'necktie', slot: 'accesorio', price: 25 },
  { id: 'prayer_beads', name: 'Collar de cuentas', img: 'prayer_beads', slot: 'accesorio', price: 40 },
  { id: 'ring', name: 'Anillo', img: 'ring', slot: 'accesorio', price: 60 },
  { id: 'lipstick', name: 'Labial', img: 'lipstick', slot: 'accesorio', price: 20 },
  { id: 'folding_hand_fan', name: 'Abanico', img: 'folding_hand_fan', slot: 'accesorio', price: 30 },
  { id: 'closed_umbrella', name: 'Paraguas', img: 'closed_umbrella', slot: 'accesorio', price: 25 },
]
export const wearById = (id?: string | null) => WEAR.find((w) => w.id === id)

export const MOODS = [
  { id: 'feliz', label: 'Feliz', lottie: '1f60a' },
  { id: 'amor', label: 'Con mucho amor', lottie: '1f970' },
  { id: 'calma', label: 'En calma', lottie: '1f60c' },
  { id: 'festejo', label: 'Con ganas de festejar', lottie: '1f973' },
  { id: 'pensativo', label: 'Pensando mucho', lottie: '1f914' },
  { id: 'sensible', label: 'Sensible', lottie: '1f97a' },
  { id: 'cansancio', label: 'Con sueño', lottie: '1f634' },
  { id: 'agotamiento', label: 'Sin energía', lottie: '1f62e_200d_1f4a8' },
  { id: 'abrumo', label: 'Con la cabeza a mil', lottie: '1fae0' },
  { id: 'triste', label: 'Triste', lottie: '1f622' },
  { id: 'malestar', label: 'Con el cuerpo mal', lottie: '1f912' },
]
export const NEEDS = ['Compañía, aunque sea en silencio', 'Que me distraigas', 'Que me escuches', 'Mimos y palabras lindas', 'Un poquito de espacio', 'Nada, solo quería contarte']

export const QUESTIONS = [
  '¿Qué fue lo más lindo de tu día, aunque sea chiquito?',
  '¿Qué canción te hace pensar en nosotros?',
  '¿Qué comida te gustaría que comamos juntos la próxima vez?',
  'Si pudiéramos teletransportarnos ahora, ¿a dónde iríamos?',
  '¿Qué es algo que te dio paz esta semana?',
  '¿Qué animal te representa hoy y por qué?',
  '¿Cuál es un recuerdo nuestro que te hace sonreír?',
  '¿Qué planta te gustaría tener en una casa nuestra?',
  '¿Qué prenda de ropa te hace sentir más vos?',
  '¿Qué te gustaría que hagamos el día que nos veamos?',
  '¿Qué te gustaría aprender este año?',
  '¿Qué olor te recuerda a tu infancia?',
  '¿Cómo sería nuestro domingo perfecto?',
  '¿Qué cosa mía te hace reír?',
  '¿Hay algo que te preocupe y quieras soltar un poquito acá?',
  '¿Cuál es tu lugar favorito para estar tranquila/o?',
  '¿Qué película veríamos esta noche si estuviéramos juntos?',
  '¿Qué es algo que te gustaría que te diga más seguido?',
  '¿Qué color tiene tu día hoy?',
  '¿Qué tres palabras usarías para describirnos?',
  'Si tuviéramos una mascota de verdad, ¿cómo se llamaría?',
  '¿Qué outfit te pondrías para nuestra próxima cita?',
  '¿Qué te hizo sentir orgullo de vos últimamente?',
  '¿Qué viaje soñás hacer conmigo?',
  '¿Qué pequeño ritual tuyo te gustaría compartir conmigo?',
  '¿Qué estación del año se parece a nosotros?',
  '¿Qué le dirías a tu yo de hace cinco años?',
  '¿Qué es algo simple que te hace feliz?',
  '¿Qué serie o libro me recomendarías ahora?',
  '¿Qué es lo primero que pensaste de mí?',
  '¿Qué te gustaría que tenga nuestra casa algún día?',
  '¿Qué sonido te relaja?',
  '¿Qué desayuno te gustaría que te prepare?',
  '¿Qué es algo que hago que te hace sentir cuidada/o?',
  '¿Cuál es tu flor favorita y por qué?',
  '¿Qué palabra te gusta cómo suena?',
  '¿Qué te gustaría que hagamos juntos aunque sea a distancia esta semana?',
  '¿Qué foto tuya o nuestra te gusta mucho?',
  '¿Qué cosa nueva te animarías a probar conmigo?',
  '¿Qué te hace sentir en casa?',
  '¿Qué es lo que más extrañás de mí hoy?',
  '¿Qué superpoder elegirías para un día?',
  '¿Qué es algo que agradecés hoy?',
  '¿Qué apodo nuevo me pondrías?',
  '¿Cómo te imaginás nuestro primer viaje largo?',
  '¿Qué dibujo animado mirabas de chiquita/o?',
  '¿Qué te gustaría escuchar de mí cuando tenés un día difícil?',
  '¿Qué te gusta de cómo somos juntos?',
  'Si nuestra historia fuera una película, ¿cómo se llamaría?',
  '¿Qué receta te gustaría que cocinemos por videollamada?',
  '¿Qué cosa del mundo te parece tierna?',
  '¿Cuál es tu momento favorito del día?',
  '¿Qué prenda mía te gustaría usar?',
  '¿Qué animal te gustaría ver en persona algún día?',
  '¿Qué meta chiquita tenés para esta semana?',
  '¿Qué recuerdo te gustaría guardar para siempre en esta caja?',
  '¿Qué sentís cuando pensás en el futuro juntos?',
  '¿Qué palabra en otro idioma te encanta?',
  '¿Qué te gustaría regalarme si pudieras cualquier cosa?',
  '¿Qué es lo más valiente que hiciste?',
]

export const DATE_IDEAS = [
  { t: 'Peli sincronizada', d: 'Le dan play al mismo tiempo y se quedan en llamada.' },
  { t: 'Cocinar lo mismo', d: 'Elijan una receta y cocinen en videollamada, cada uno en su cocina.' },
  { t: 'Cita de cafecito', d: 'Cada uno se prepara su bebida favorita y charlan sin apuro.' },
  { t: 'Paseo con cámara', d: 'Uno sale a caminar y le muestra al otro su barrio en vivo.' },
  { t: 'Noche de playlist', d: 'Cada uno elige cinco canciones y cuenta por qué.' },
  { t: 'Dibujar al otro', d: 'Cinco minutos para dibujarse de memoria. Prohibido reírse (o no).' },
  { t: 'Leer juntos', d: 'Elijan un cuento corto y lean en voz alta, una página cada uno.' },
  { t: 'Armar un outfit', d: 'Cada uno arma un outfit para el otro con lo que tiene en el placard.' },
  { t: 'Juego online', d: 'Un juego de a dos, cooperativo, sin presión de ganar.' },
  { t: 'Dormir en llamada', d: 'Se quedan en llamada hasta dormirse.' },
  { t: 'Museo virtual', d: 'Recorran un museo en línea y elijan cada uno su obra favorita.' },
  { t: 'Planear el reencuentro', d: 'Armen juntos el plan del próximo día que se vean.' },
  { t: 'Picnic en casa', d: 'Mantita en el piso, algo rico, y la cámara apoyada.' },
  { t: 'Spa a distancia', d: 'Mascarillas, música tranqui, y nada de apuro.' },
  { t: 'Cartas en vivo', d: 'Escriban una carta cada uno y léanla en voz alta.' },
  { t: 'Mirar las estrellas', d: 'Cada uno sale a la ventana y se cuentan qué ven.' },
  { t: 'Karaoke tímido', d: 'Una canción cada uno. Vale cantar bajito.' },
  { t: 'Quiz de nosotros', d: 'Se hacen preguntas del quiz de la web y se ríen de las respuestas.' },
  { t: 'Jardinería juntos', d: 'Rieguen la huerta de la web y una planta real cada uno.' },
  { t: 'Desayuno compartido', d: 'Arranquen el día juntos aunque sea por diez minutos.' },
  { t: 'Puzzle online', d: 'Armen un rompecabezas compartido mientras charlan.' },
  { t: 'Show de mascotas', d: 'Presenten sus mascotas, plantas o peluches como si fueran estrellas.' },
  { t: 'Tour de placard', d: 'Muestren su prenda favorita y la historia detrás.' },
  { t: 'Tarde sin pantalla', d: 'Cada uno hace algo lindo offline y después se lo cuentan.' },
]

export const VOUCHER_IDEAS = [
  'Vale por un abrazo de diez minutos sin soltarte',
  'Vale por una cita elegida 100% por vos',
  'Vale por un masaje en la espalda',
  'Vale por un desayuno en la cama',
  'Vale por una noche de peli que elegís vos',
  'Vale por una llamada larga sin apuro',
  'Vale por un día de mimos ilimitados',
  'Vale por un paseo a donde quieras',
  'Vale por una carta escrita a mano',
  'Vale por un "tenés razón" sin discutir',
]
