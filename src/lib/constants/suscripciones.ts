export interface ServicioCatalogo {
  id: string
  nombre: string
  logoPath: string
  categoria: string
  subcategoria?: string
  frecuenciaDefault: string
  color: string
  colorTexto: string
}

const getLogo = (name: string) => `/src/assets/suscripciones/${name}`

export const CATALOGO_SUSCRIPCIONES: ServicioCatalogo[] = [
  // Streaming video
  { id: 'netflix',     nombre: 'Netflix',      logoPath: getLogo('netflix.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#E50914', colorTexto: 'white' },
  { id: 'hbomax',      nombre: 'HBO Max',      logoPath: getLogo('hbomax.png'),      categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#5822B4', colorTexto: 'white' },
  { id: 'primevideo',  nombre: 'Prime Video',  logoPath: getLogo('primevideo.png'),  categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#00A8E0', colorTexto: 'white' },
  { id: 'paramount',   nombre: 'Paramount+',   logoPath: getLogo('paramount.png'),   categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#0064FF', colorTexto: 'white' },
  { id: 'appletv',     nombre: 'Apple TV+',    logoPath: getLogo('appletv.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#1C1C1E', colorTexto: 'white' },
  { id: 'crunchyroll', nombre: 'Crunchyroll',  logoPath: getLogo('crunchiroll.png'), categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#F47521', colorTexto: 'white' },
  { id: 'plutotv',     nombre: 'Pluto TV',     logoPath: getLogo('plutotv.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#9900FF', colorTexto: 'white' },
  { id: 'peacock',     nombre: 'Peacock',      logoPath: getLogo('peacock.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#000000', colorTexto: 'white' },
  
  // Música
  { id: 'spotify',     nombre: 'Spotify',      logoPath: getLogo('spotify.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#1DB954', colorTexto: 'white' },
  { id: 'applemusic',  nombre: 'Apple Music',  logoPath: getLogo('applemusic.png'),  categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#FC3C44', colorTexto: 'white' },
  { id: 'youtubemusic',nombre: 'YT Music',     logoPath: getLogo('youtubemusic.png'),categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#FF0000', colorTexto: 'white' },
  { id: 'tidal',       nombre: 'Tidal',        logoPath: getLogo('tidal.png'),       categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#000000', colorTexto: 'white' },
  { id: 'deezer',      nombre: 'Deezer',       logoPath: getLogo('deezer.png'),      categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#A238FF', colorTexto: 'white' },
  
  // Productividad & IA
  { id: 'icloud',      nombre: 'iCloud',       logoPath: getLogo('icloud.png'),      categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#3478F6', colorTexto: 'white' },
  { id: 'googleone',   nombre: 'Google One',   logoPath: getLogo('googleone.png'),   categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#4285F4', colorTexto: 'white' },
  { id: 'microsoft365',nombre: 'Microsoft 365',logoPath: getLogo('microsoft365.png'),categoria: 'Otros',      subcategoria: 'Otros',         frecuenciaDefault: 'anual',   color: '#0078D4', colorTexto: 'white' },
  { id: 'adobe',       nombre: 'Adobe CC',     logoPath: getLogo('adobecreativecloude.png'), categoria: 'Otros', subcategoria: 'Otros',       frecuenciaDefault: 'mensual', color: '#FF0000', colorTexto: 'white' },
  { id: 'chatgpt',     nombre: 'ChatGPT Plus', logoPath: getLogo('chatgpt.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#10A37F', colorTexto: 'white' },
  { id: 'canva',       nombre: 'Canva',        logoPath: getLogo('canva.png'),       categoria: 'Otros',      subcategoria: 'Otros',         frecuenciaDefault: 'mensual', color: '#00C4CC', colorTexto: 'white' },
  { id: 'notion',      nombre: 'Notion',       logoPath: getLogo('notion.png'),      categoria: 'Otros',      subcategoria: 'Otros',         frecuenciaDefault: 'mensual', color: '#000000', colorTexto: 'white' },
  { id: 'evernote',    nombre: 'Evernote',     logoPath: getLogo('evernote.png'),    categoria: 'Otros',      subcategoria: 'Otros',         frecuenciaDefault: 'mensual', color: '#00A82D', colorTexto: 'white' },
  { id: 'dropbox',     nombre: 'Dropbox',      logoPath: getLogo('dropbox.png'),     categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#0061FF', colorTexto: 'white' },
  { id: 'grammarly',   nombre: 'Grammarly',    logoPath: getLogo('grammerly.png'),   categoria: 'Otros',      subcategoria: 'Otros',         frecuenciaDefault: 'anual',   color: '#15C39A', colorTexto: 'white' },
  
  // Gaming
  { id: 'xbox',        nombre: 'Xbox Pass',    logoPath: getLogo('xbox.png'),        categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#107C10', colorTexto: 'white' },
  { id: 'playstation', nombre: 'PlayStation+', logoPath: getLogo('playstation.png'), categoria: 'Recreativo', frecuenciaDefault: 'mensual', color: '#003791', colorTexto: 'white' },
  
  // Delivery
  { id: 'rappi',       nombre: 'Rappi Prime',  logoPath: getLogo('rappipro.png'),    categoria: 'Restaurantes y delivery', subcategoria: 'Delivery', frecuenciaDefault: 'mensual', color: '#FF441F', colorTexto: 'white' },
  { id: 'pedidosya',   nombre: 'PedidosYa Pass',logoPath: getLogo('pedidoya.png'),   categoria: 'Restaurantes y delivery', subcategoria: 'Delivery', frecuenciaDefault: 'mensual', color: '#FF0050', colorTexto: 'white' },
  
  // Otros
  { id: 'duolingo',    nombre: 'Duolingo',     logoPath: getLogo('duolingo.png'),    categoria: 'Educación',  subcategoria: 'Idiomas',       frecuenciaDefault: 'mensual', color: '#58CC02', colorTexto: 'white' },
]

export const CATEGORIAS_CATALOGO = [
  { label: 'Streaming',      ids: ['netflix','hbomax','primevideo','paramount','appletv','crunchyroll','plutotv','peacock'] },
  { label: 'Música',         ids: ['spotify','applemusic','youtubemusic','tidal','deezer'] },
  { label: 'Productividad',  ids: ['icloud','googleone','microsoft365','adobe','chatgpt','canva','notion','evernote','dropbox','grammarly'] },
  { label: 'Gaming',         ids: ['xbox','playstation'] },
  { label: 'Delivery',       ids: ['rappi','pedidosya'] },
  { label: 'Otros',          ids: ['duolingo'] },
]
