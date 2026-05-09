export interface ServicioCatalogo {
  id: string
  nombre: string
  logoPath: string        // Ruta relativa para ser procesada por Vite
  categoria: string       // nombre de la categoría sugerida
  frecuenciaDefault: string
}

// Helper para resolver la ruta del logo
// En Vite, si usamos imágenes en src/assets, lo mejor es importarlas o usar URLs relativas correctas
const getLogo = (name: string) => `/src/assets/suscripciones/${name}`

export const CATALOGO_SUSCRIPCIONES: ServicioCatalogo[] = [
  // Streaming video
  { id: 'netflix',     nombre: 'Netflix',      logoPath: getLogo('netflix.png'),     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'hbomax',      nombre: 'HBO Max',      logoPath: getLogo('hbomax.png'),      categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'primevideo',  nombre: 'Prime Video',  logoPath: getLogo('primevideo.png'),  categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'paramount',   nombre: 'Paramount+',   logoPath: getLogo('paramount.png'),   categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'appletv',     nombre: 'Apple TV+',    logoPath: getLogo('appletv.png'),     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'crunchyroll', nombre: 'Crunchyroll',  logoPath: getLogo('crunchiroll.png'), categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'plutotv',     nombre: 'Pluto TV',     logoPath: getLogo('plutotv.png'),     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'peacock',     nombre: 'Peacock',      logoPath: getLogo('peacock.png'),     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  
  // Música
  { id: 'spotify',     nombre: 'Spotify',      logoPath: getLogo('spotify.png'),     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'applemusic',  nombre: 'Apple Music',  logoPath: getLogo('applemusic.png'),  categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'youtubemusic',nombre: 'YT Music',     logoPath: getLogo('youtubemusic.png'),categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'tidal',       nombre: 'Tidal',        logoPath: getLogo('tidal.png'),       categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'deezer',      nombre: 'Deezer',       logoPath: getLogo('deezer.png'),      categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  
  // Productividad & IA
  { id: 'icloud',      nombre: 'iCloud',       logoPath: getLogo('icloud.png'),      categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'googleone',   nombre: 'Google One',   logoPath: getLogo('googleone.png'),   categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'microsoft365',nombre: 'Microsoft 365',logoPath: getLogo('microsoft365.png'),categoria: 'Servicios digitales', frecuenciaDefault: 'anual' },
  { id: 'adobe',       nombre: 'Adobe CC',     logoPath: getLogo('adobecreativecloude.png'), categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'chatgpt',     nombre: 'ChatGPT Plus', logoPath: getLogo('chatgpt.png'),     categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'canva',       nombre: 'Canva',        logoPath: getLogo('canva.png'),       categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'notion',      nombre: 'Notion',       logoPath: getLogo('notion.png'),      categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'evernote',    nombre: 'Evernote',     logoPath: getLogo('evernote.png'),    categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'dropbox',     nombre: 'Dropbox',      logoPath: getLogo('dropbox.png'),     categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'grammarly',   nombre: 'Grammarly',    logoPath: getLogo('grammerly.png'),   categoria: 'Servicios digitales', frecuenciaDefault: 'anual' },
  
  // Gaming
  { id: 'xbox',        nombre: 'Xbox Pass',    logoPath: getLogo('xbox.png'),        categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'playstation', nombre: 'PlayStation+', logoPath: getLogo('playstation.png'), categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  
  // Delivery
  { id: 'rappi',       nombre: 'Rappi Prime',  logoPath: getLogo('rappipro.png'),    categoria: 'Alimentación', frecuenciaDefault: 'mensual' },
  { id: 'pedidosya',   nombre: 'PedidosYa Pass',logoPath: getLogo('pedidoya.png'),   categoria: 'Alimentación', frecuenciaDefault: 'mensual' },
  
  // Otros
  { id: 'duolingo',    nombre: 'Duolingo',     logoPath: getLogo('duolingo.png'),    categoria: 'Educación', frecuenciaDefault: 'mensual' },
]

// Categorías para agrupar en el picker
export const CATEGORIAS_CATALOGO = [
  { label: 'Streaming',      ids: ['netflix','hbomax','primevideo','paramount','appletv','crunchyroll','plutotv','peacock'] },
  { label: 'Música',         ids: ['spotify','applemusic','youtubemusic','tidal','deezer'] },
  { label: 'Productividad',  ids: ['icloud','googleone','microsoft365','adobe','chatgpt','canva','notion','evernote','dropbox','grammarly'] },
  { label: 'Gaming',         ids: ['xbox','playstation'] },
  { label: 'Delivery',       ids: ['rappi','pedidosya'] },
  { label: 'Otros',          ids: ['duolingo'] },
]
