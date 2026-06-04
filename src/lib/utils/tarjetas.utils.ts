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
