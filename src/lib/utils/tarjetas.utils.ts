// ─── Helpers del módulo Tarjetas de crédito ───────────────────────────────────

export { getCardBrandById, findCardBrandByNombre } from '@/lib/constants/cards'

// Carga todos los assets de cards/ (SVG y PNG) como URLs estáticas via Vite glob import.
// La key resultante es la ruta relativa al módulo; se indexa por filename.
const _cardLogoModules = import.meta.glob('@/assets/cards/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const _cardLogoMap: Record<string, string> = {}
for (const [path, url] of Object.entries(_cardLogoModules)) {
  const filename = path.split('/').pop() ?? ''
  _cardLogoMap[filename] = url
}

/**
 * Devuelve la URL del SVG para un logoPath dado.
 * Retorna una cadena vacía si el archivo aún no existe en assets/cards/.
 */
export function getCardLogoUrl(logoPath: string): string {
  return _cardLogoMap[logoPath] ?? ''
}

export const MODERN_GRADIENTS = {
  GALICIA: 'linear-gradient(140deg, #FF6F00 0%, #D43800 55%, #8C1C00 100%)',
  GOLD: 'linear-gradient(140deg, #DFB756 0%, #A67B1E 60%, #5E430A 100%)',
  PLATINUM: 'linear-gradient(140deg, #E2E8F0 0%, #94A3B8 55%, #475569 100%)',
  BLACK: 'linear-gradient(140deg, #242830 0%, #111317 60%, #050608 100%)',
  SAPPHIRE: 'linear-gradient(140deg, #1E3A8A 0%, #0F172A 60%, #020617 100%)',
  RUBY: 'linear-gradient(140deg, #881337 0%, #4C0519 65%, #23010A 100%)',
  EMERALD: 'linear-gradient(140deg, #064E3B 0%, #022C22 65%, #011611 100%)',
  VIOLET: 'linear-gradient(140deg, #6B21A8 0%, #3B0764 65%, #19032E 100%)',
}

export function resolveModernCardBackground(color: string, billeteraNombre: string): {
  background: string
  isDarkText: boolean
  isGoldOrLight: boolean
} {
  const c = (color || '').trim()
  const lower = c.toLowerCase()
  const bLower = (billeteraNombre || '').toLowerCase()

  // Si ya es un gradiente, determinar contraste
  if (c.startsWith('linear-gradient') || c.startsWith('radial-gradient')) {
    const isDark =
      lower.includes('#dfb756') ||
      lower.includes('#e2e8f0') ||
      lower.includes('#e6c875') ||
      lower.includes('#d4af37') ||
      lower.includes('#e5e4e2')
    const isGold = lower.includes('#dfb756') || lower.includes('#e6c875') || lower.includes('#d4af37')
    return { background: c, isDarkText: isDark, isGoldOrLight: isGold || isDark }
  }

  // Mapeos limpios para hex
  if (lower === '#d4af37' || lower === '#c5a028' || lower.includes('gold')) {
    return { background: MODERN_GRADIENTS.GOLD, isDarkText: true, isGoldOrLight: true }
  }
  if (lower === '#e5e4e2' || lower === '#b4b4b4' || lower.includes('platinum') || lower.includes('silver')) {
    return { background: MODERN_GRADIENTS.PLATINUM, isDarkText: true, isGoldOrLight: true }
  }
  if (lower === '#1a1a1b' || lower === '#000000' || lower === '#111111' || lower.includes('black')) {
    return { background: MODERN_GRADIENTS.BLACK, isDarkText: false, isGoldOrLight: false }
  }
  if (lower === '#1e3a8a' || lower === '#0d2045' || lower.includes('navy') || lower.includes('marino') || lower.includes('zafiro')) {
    return { background: MODERN_GRADIENTS.SAPPHIRE, isDarkText: false, isGoldOrLight: false }
  }
  if (lower === '#be123c' || lower === '#ec0000' || lower === '#b30000' || lower.includes('red') || lower.includes('rojo') || lower.includes('rubi')) {
    return { background: MODERN_GRADIENTS.RUBY, isDarkText: false, isGoldOrLight: false }
  }
  if (lower === '#047857' || lower === '#166534' || lower.includes('emerald') || lower.includes('esmeralda') || lower.includes('verde')) {
    return { background: MODERN_GRADIENTS.EMERALD, isDarkText: false, isGoldOrLight: false }
  }
  if (lower === '#7c3aed' || lower === '#a200ff' || lower.includes('violet') || lower.includes('violeta') || lower.includes('purple')) {
    return { background: MODERN_GRADIENTS.VIOLET, isDarkText: false, isGoldOrLight: false }
  }
  if (lower === '#ff8c00' || lower === '#ff6200' || bLower.includes('galicia')) {
    return { background: MODERN_GRADIENTS.GALICIA, isDarkText: false, isGoldOrLight: false }
  }

  if (!c) {
    return { background: MODERN_GRADIENTS.GALICIA, isDarkText: false, isGoldOrLight: false }
  }

  const enriched = `linear-gradient(140deg, ${c} 0%, color-mix(in srgb, ${c}, black 35%) 100%)`
  return { background: enriched, isDarkText: false, isGoldOrLight: false }
}
