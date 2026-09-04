import catalogoRaw from '@catalogo'

export interface RawServicioCatalogo {
  id: string
  nombre: string
  logo: string
  categoria: string
  subcategoria?: string | null
  frecuenciaDefault: string
  color: string
  colorTexto: string
  variantes?: string[]
  categoria_sugerida?: string
  frecuencia_tipica?: string
}

export interface ServicioCatalogo {
  id: string
  nombre: string
  logoPath: string
  categoria: string
  subcategoria?: string
  frecuenciaDefault: string
  color: string
  colorTexto: string
  variantes?: string[]
  categoria_sugerida?: string
  frecuencia_tipica?: string
}

// Carga todos los assets de suscripciones/ (SVG y PNG) como URLs estáticas via Vite glob import.
const _logoModules = import.meta.glob('@/assets/suscripciones/*.{svg,png,webp,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const _logoMap: Record<string, string> = {}
for (const [path, url] of Object.entries(_logoModules)) {
  const filename = path.split('/').pop() ?? ''
  _logoMap[filename] = url
}

export function getSubscriptionLogoUrl(logoName: string): string {
  return _logoMap[logoName] ?? ''
}

const getLogo = (name: string): string => _logoMap[name] ?? ''

export const CATALOGO_SUSCRIPCIONES: ServicioCatalogo[] = (catalogoRaw as RawServicioCatalogo[]).map(item => ({
  ...item,
  subcategoria: item.subcategoria ?? undefined,
  logoPath: getLogo(item.logo),
}))

export const CATEGORIAS_CATALOGO = [
  { label: 'Streaming',      ids: ['netflix','hbomax','primevideo','paramount','appletv','crunchyroll','plutotv','peacock'] },
  { label: 'Música',         ids: ['spotify','applemusic','youtubemusic','tidal','deezer'] },
  { label: 'Productividad',  ids: ['icloud','googleone','microsoft365','adobe','chatgpt','canva','notion','evernote','dropbox','grammarly'] },
  { label: 'Gaming',         ids: ['xbox','playstation'] },
  { label: 'Delivery',       ids: ['rappi','pedidosya'] },
  { label: 'Otros',          ids: ['duolingo'] },
]

