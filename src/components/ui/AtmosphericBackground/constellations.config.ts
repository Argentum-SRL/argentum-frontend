/**
 * ── Argentum Astronomical Constellations Configuration ─────────────────────────
 * Definición astronómica verificada para Capricornio y Leo, sistema de tokens
 * de alta relojería y grabado de plata 925, y ciclo global de animación.
 */

export interface CelestialStar {
  id: string
  name: string
  x: number // Coordenada normalizada en viewBox 1000x600
  y: number
  mag: number // Magnitud visual astronómica (menor valor = mayor brillo)
  isPrimary?: boolean // Estrella principal de la constelación con halo contenido
}

export interface ConstellationDef {
  id: 'capricorn' | 'leo'
  name: string
  latinName: string
  stars: CelestialStar[]
  /**
   * Secuencia continua y conexa de puntos (IDs) que la estrella guía recorre
   * de forma continua y a velocidad constante para trazar la constelación.
   */
  traversalOrder: string[]
  /** Path SVG canónico precalculado a partir de los puntos */
  svgPath: string
  /** Puntos de conexión complementarios si aplican */
  additionalLines?: Array<[string, string]>
}

/**
 * ── 1. Constelación de Leo (El León) ──────────────────────────────────────────
 * Coordenadas relativas basadas en cartas celestes IAU y Norton's Star Atlas.
 * Conserva la icónica "hoz" (The Sickle, arco de la cabeza y cuello)
 * unida al triángulo de cuartos traseros y la estrella Denebola.
 *
 * Estrellas clave:
 * - Regulus (α Leonis): Corazón del león, mag 1.40
 * - Algieba (γ Leonis): Melena / cuello, estrella doble, mag 2.01
 * - Denebola (β Leonis): Cola del león, mag 2.14
 * - Zosma (δ Leonis): Lomo / grupa, mag 2.56
 * - Chertan (θ Leonis): Flanco posterior / vientre, mag 3.33
 * - Adhafera (ζ Leonis): Frente, mag 3.44
 * - Rasalas (μ Leonis): Coronilla, mag 3.88
 * - Ras Elased Australis (ε Leonis): Hocico / mandíbula, mag 2.98
 * - Al Jabbah (η Leonis): Garganta / pecho, mag 3.48
 */
export const LEO_STARS: CelestialStar[] = [
  { id: 'leo-eps', name: 'Ras Elased Australis (ε Leo)', x: 320, y: 160, mag: 2.98 },
  { id: 'leo-mu', name: 'Rasalas (μ Leo)', x: 345, y: 105, mag: 3.88 },
  { id: 'leo-zeta', name: 'Adhafera (ζ Leo)', x: 418, y: 125, mag: 3.44 },
  { id: 'leo-gamma', name: 'Algieba (γ Leo)', x: 432, y: 205, mag: 2.01, isPrimary: true },
  { id: 'leo-eta', name: 'Al Jabbah (η Leo)', x: 395, y: 275, mag: 3.48 },
  { id: 'leo-alpha', name: 'Regulus (α Leo)', x: 412, y: 365, mag: 1.40, isPrimary: true },
  { id: 'leo-theta', name: 'Chertan (θ Leo)', x: 620, y: 340, mag: 3.33 },
  { id: 'leo-beta', name: 'Denebola (β Leo)', x: 775, y: 250, mag: 2.14, isPrimary: true },
  { id: 'leo-delta', name: 'Zosma (δ Leo)', x: 635, y: 190, mag: 2.56, isPrimary: true },
]

/**
 * Trayectoria continua de trazado para Leo:
 * Hocico (ε) → Coronilla (μ) → Frente (ζ) → Melena (γ) →
 * Lomo (δ) → Cola (β) → Flanco (θ) → Lomo (δ) →
 * Flanco (θ) → Vientre hacia Corazón (α) → Garganta (η) → Cierre en Melena (γ).
 */
const LEO_TRAVERSAL = [
  'leo-eps',
  'leo-mu',
  'leo-zeta',
  'leo-gamma',
  'leo-delta',
  'leo-beta',
  'leo-theta',
  'leo-delta',
  'leo-theta',
  'leo-alpha',
  'leo-eta',
  'leo-gamma',
]

/**
 * ── 2. Constelación de Capricornio (Capricornus) ──────────────────────────────
 * Coordenadas relativas basadas en cartas celestes IAU.
 * Conserva la icónica figura de cabra marina / cuña triangular: cuernos al oeste
 * (Algedi y Dabih), vientre cóncavo al sur (Psi, Omega, Zeta) y cola de pez al
 * este (Nashira y Deneb Algedi), unidos por la cresta dorsal (Theta, Iota).
 *
 * Estrellas clave:
 * - Deneb Algedi (δ Capricorni): Ápex de la cola, mag 2.85
 * - Dabih (β Capricorni): Base de los cuernos, mag 3.05
 * - Algedi (α Capricorni): Vértice superior de los cuernos, mag 3.58
 * - Nashira (γ Capricorni): Aleta caudal norte, mag 3.69
 * - Zeta Capricorni: Curva caudal sur, mag 3.77
 * - Theta Capricorni: Centro dorsal, mag 4.08
 * - Omega Capricorni (Baten Algiedi): Vientre inferior, mag 4.12
 * - Psi Capricorni: Declive ventral suroeste, mag 4.15
 * - Iota Capricorni: Espalda este, mag 4.28
 */
export const CAPRICORN_STARS: CelestialStar[] = [
  { id: 'cap-alpha', name: 'Algedi (α Cap)', x: 235, y: 185, mag: 3.58, isPrimary: true },
  { id: 'cap-beta', name: 'Dabih (β Cap)', x: 255, y: 250, mag: 3.05, isPrimary: true },
  { id: 'cap-psi', name: 'Psi Capricorni (ψ Cap)', x: 355, y: 440, mag: 4.15 },
  { id: 'cap-omega', name: 'Omega / Baten Algiedi (ω Cap)', x: 480, y: 485, mag: 4.12 },
  { id: 'cap-zeta', name: 'Zeta Capricorni (ζ Cap)', x: 645, y: 425, mag: 3.77 },
  { id: 'cap-delta', name: 'Deneb Algedi (δ Cap)', x: 785, y: 235, mag: 2.85, isPrimary: true },
  { id: 'cap-gamma', name: 'Nashira (γ Cap)', x: 745, y: 210, mag: 3.69, isPrimary: true },
  { id: 'cap-iota', name: 'Iota Capricorni (ι Cap)', x: 635, y: 240, mag: 4.28 },
  { id: 'cap-theta', name: 'Theta Capricorni (θ Cap)', x: 495, y: 260, mag: 4.08 },
]

/**
 * Trayectoria continua de trazado para Capricornio:
 * Cuerno superior (α) → Base cuerno (β) →
 * Espina dorsal: Theta (θ) → Iota (ι) → Nashira (γ) → Cola Deneb Algedi (δ) →
 * Curva ventral sur: Zeta (ζ) → Omega (ω) → Psi (ψ) → Cierre en Base cuerno (β).
 */
const CAPRICORN_TRAVERSAL = [
  'cap-alpha',
  'cap-beta',
  'cap-theta',
  'cap-iota',
  'cap-gamma',
  'cap-delta',
  'cap-zeta',
  'cap-omega',
  'cap-psi',
  'cap-beta',
]

/** Genera la cadena SVG d="M... L..." para una secuencia de IDs de estrellas */
function buildSvgPath(stars: CelestialStar[], order: string[]): string {
  const map = new Map<string, CelestialStar>()
  for (const s of stars) map.set(s.id, s)

  const coords = order.map((id) => map.get(id)).filter(Boolean) as CelestialStar[]
  if (coords.length === 0) return ''

  return coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')
}

export const CONSTELLATIONS: Record<'capricorn' | 'leo', ConstellationDef> = {
  capricorn: {
    id: 'capricorn',
    name: 'Capricornio',
    latinName: 'Capricornus',
    stars: CAPRICORN_STARS,
    traversalOrder: CAPRICORN_TRAVERSAL,
    svgPath: buildSvgPath(CAPRICORN_STARS, CAPRICORN_TRAVERSAL),
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    latinName: 'Leo',
    stars: LEO_STARS,
    traversalOrder: LEO_TRAVERSAL,
    svgPath: buildSvgPath(LEO_STARS, LEO_TRAVERSAL),
  },
}

/**
 * ── 3. Tiempos del Ciclo Global (Sección 6 del Brief) ────────────────────────
 * Centralizados aquí para evitar dispersión en múltiples componentes o estilos.
 * - Dibujo progresivo: 5–7 segundos (elegido 6000ms)
 * - Permanencia: 2–3 segundos (elegido 2500ms)
 * - Desvanecimiento: 3–4 segundos (elegido 3200ms)
 * - Pausa breve entre figuras: ~1200ms
 */
export const CONSTELLATION_TIMINGS = {
  drawDuration: 6000,
  holdDuration: 2500,
  fadeDuration: 3200,
  pauseDuration: 1200,
} as const

export type ConstellationPhase = 'draw' | 'hold' | 'fade' | 'pause'

/**
 * ── 4. Tokens Visuales de Relojería y Grabado 925 ─────────────────────────────
 */
export const CONSTELLATION_PALETTE = {
  dark: {
    bgGradient: 'radial-gradient(circle at 75% 20%, #0E1B33 0%, #071021 35%, #040813 65%, #020408 100%)',
    bgColor: '#020408',
    starBase: '#E2E8F0',
    starCool: '#93C5FD',
    starMuted: '#64748B',
    lineColor: '#CBD5E1', // Plata esterlina 925 nítida
    guideStarCore: '#FFFFFF',
    guideStarHalo: 'rgba(226, 232, 240, 0.45)',
    guideStarBlur: 'rgba(147, 197, 253, 0.25)',
    primaryStarHalo: 'rgba(203, 213, 225, 0.28)',
    ambientGlow: 'radial-gradient(circle, rgba(148, 163, 184, 0.12) 0%, rgba(96, 165, 250, 0.05) 50%, transparent 75%)',
  },
  light: {
    bgGradient: 'radial-gradient(circle at 75% 20%, #FFFDF8 0%, #FAF4EC 32%, #F3EBE0 65%, #ECE2D2 100%)',
    bgColor: '#FAF4EC',
    starBase: '#475569',
    starCool: '#1E3A8A',
    starMuted: '#94A3B8',
    lineColor: '#0D2045', // Azul marino institucional Argentum / plata envejecida para óptimo contraste sobre marfil
    guideStarCore: '#0D2045',
    guideStarHalo: 'rgba(13, 32, 69, 0.28)',
    guideStarBlur: 'rgba(26, 53, 104, 0.15)',
    primaryStarHalo: 'rgba(13, 32, 69, 0.18)',
    ambientGlow: 'radial-gradient(circle, rgba(13, 32, 69, 0.08) 0%, rgba(194, 94, 46, 0.03) 50%, transparent 75%)',
  },
} as const

/**
 * ── 5. Generador Determinista de Campo Estelar ────────────────────────────────
 * Genera coordenadas estables con semilla pseudo-aleatoria (LCG).
 * Cero saltos en render, cero flickering caótico, máxima eficiencia.
 */
export interface StaticStar {
  id: string
  x: number
  y: number
  r: number
  baseOpacity: number
  colorType: 'base' | 'cool' | 'muted'
  twinkleDelay: number
  twinkleDuration: number
}

function lcgRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateStarfield(count: number, seed = 92500): StaticStar[] {
  const rand = lcgRandom(seed)
  const stars: StaticStar[] = []

  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * 1000 * 10) / 10
    const y = Math.round(rand() * 600 * 10) / 10

    // Variación sutil de tamaño: 0.7px a 1.8px (óptico de micro-grabado)
    const sizeRoll = rand()
    let r = 0.8
    if (sizeRoll > 0.88) r = 1.7
    else if (sizeRoll > 0.6) r = 1.2
    else if (sizeRoll > 0.25) r = 0.95

    // Luminosidad sutil: 0.18 a 0.58
    const baseOpacity = Math.round((0.18 + rand() * 0.40) * 100) / 100

    const colorRoll = rand()
    const colorType: 'base' | 'cool' | 'muted' =
      colorRoll > 0.75 ? 'cool' : colorRoll > 0.35 ? 'base' : 'muted'

    // Micro-respiración desincronizada (solo en algunas estrellas)
    const twinkleDelay = Math.round(rand() * 8 * 10) / 10
    const twinkleDuration = Math.round((6 + rand() * 5) * 10) / 10

    stars.push({
      id: `s-${i}`,
      x,
      y,
      r,
      baseOpacity,
      colorType,
      twinkleDelay,
      twinkleDuration,
    })
  }

  return stars
}

// Campos estelares pregenerados para alto rendimiento
export const STARFIELD_PRESETS = {
  low: generateStarfield(45, 1024),
  medium: generateStarfield(80, 2048),
  high: generateStarfield(130, 4096),
} as const
