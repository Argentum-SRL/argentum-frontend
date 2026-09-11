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

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Busca un servicio en el catálogo de suscripciones por coincidencia exacta o por subcadena/variantes.
 * Soporta nombres como "Netflix Estándar", "Spotify Individual", "Amazon Prime", etc.
 */
export function findServicioCatalogo(texto?: string | null): ServicioCatalogo | undefined {
  if (!texto) return undefined
  const textoNorm = normalizeText(texto)
  if (!textoNorm) return undefined

  // 1. Coincidencia directa exacta por nombre, id o variantes
  for (const serv of CATALOGO_SUSCRIPCIONES) {
    if (normalizeText(serv.nombre) === textoNorm || normalizeText(serv.id) === textoNorm) {
      return serv
    }
    if (serv.variantes?.some(v => normalizeText(v) === textoNorm)) {
      return serv
    }
  }

  // 2. Coincidencia por delimitador de palabras, priorizando candidatos más largos
  const candidatos: { len: number; norm: string; serv: ServicioCatalogo }[] = []
  for (const serv of CATALOGO_SUSCRIPCIONES) {
    const variantes = [serv.nombre, serv.id, ...(serv.variantes ?? [])]
    for (const v of variantes) {
      const vNorm = normalizeText(v)
      if (vNorm.length >= 3) {
        candidatos.push({ len: vNorm.length, norm: vNorm, serv })
      }
    }
  }

  candidatos.sort((a, b) => b.len - a.len)

  for (const cand of candidatos) {
    const patron = new RegExp(`(?:^|\\s|[^a-z0-9])${escapeRegex(cand.norm)}(?:$|\\s|[^a-z0-9])`, 'i')
    if (patron.test(textoNorm)) {
      return cand.serv
    }
  }

  return undefined
}


