export interface ServicioCatalogo {
  id: string
  nombre: string
  logoPath: string        // src/assets/logos/suscripciones/netflix.png
  categoria: string       // nombre de la categoría sugerida
  frecuenciaDefault: string
}

export const CATALOGO_SUSCRIPCIONES: ServicioCatalogo[] = [
  // Streaming video
  { id: 'netflix',     nombre: 'Netflix',      logoPath: '/src/assets/logos/suscripciones/netflix.png',     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'disney',      nombre: 'Disney+',      logoPath: '/src/assets/logos/suscripciones/disney.png',      categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'hbo',         nombre: 'Max',          logoPath: '/src/assets/logos/suscripciones/hbo.png',         categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'amazon',      nombre: 'Prime Video',  logoPath: '/src/assets/logos/suscripciones/amazon.png',      categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'paramount',   nombre: 'Paramount+',   logoPath: '/src/assets/logos/suscripciones/paramount.png',   categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'apple_tv',    nombre: 'Apple TV+',    logoPath: '/src/assets/logos/suscripciones/appletv.png',     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  // Música
  { id: 'spotify',     nombre: 'Spotify',      logoPath: '/src/assets/logos/suscripciones/spotify.png',     categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'apple_music', nombre: 'Apple Music',  logoPath: '/src/assets/logos/suscripciones/applemusic.png',  categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  // Productividad
  { id: 'icloud',      nombre: 'iCloud',       logoPath: '/src/assets/logos/suscripciones/icloud.png',      categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'google_one',  nombre: 'Google One',   logoPath: '/src/assets/logos/suscripciones/googleone.png',   categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'microsoft',   nombre: 'Microsoft 365',logoPath: '/src/assets/logos/suscripciones/microsoft365.png',categoria: 'Servicios digitales', frecuenciaDefault: 'anual' },
  { id: 'adobe',       nombre: 'Adobe CC',     logoPath: '/src/assets/logos/suscripciones/adobe.png',       categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  { id: 'chatgpt',     nombre: 'ChatGPT Plus', logoPath: '/src/assets/logos/suscripciones/chatgpt.png',     categoria: 'Servicios digitales', frecuenciaDefault: 'mensual' },
  // Gaming
  { id: 'xbox',        nombre: 'Xbox Game Pass',logoPath: '/src/assets/logos/suscripciones/xbox.png',       categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  { id: 'playstation', nombre: 'PlayStation+', logoPath: '/src/assets/logos/suscripciones/playstation.png', categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
  // Delivery
  { id: 'rappi',       nombre: 'Rappi Prime',  logoPath: '/src/assets/logos/suscripciones/rappi.png',       categoria: 'Alimentación', frecuenciaDefault: 'mensual' },
  { id: 'pedidosya',   nombre: 'PedidosYa Pass',logoPath: '/src/assets/logos/suscripciones/pedidosya.png',  categoria: 'Alimentación', frecuenciaDefault: 'mensual' },
  // Otros
  { id: 'duolingo',    nombre: 'Duolingo Plus', logoPath: '/src/assets/logos/suscripciones/duolingo.png',   categoria: 'Educación', frecuenciaDefault: 'mensual' },
  { id: 'gym',         nombre: 'Gimnasio',      logoPath: '',                                                categoria: 'Entretenimiento y salidas', frecuenciaDefault: 'mensual' },
]

// Categorías para agrupar en el picker
export const CATEGORIAS_CATALOGO = [
  { label: 'Streaming',      ids: ['netflix','disney','hbo','amazon','paramount','apple_tv'] },
  { label: 'Música',         ids: ['spotify','apple_music'] },
  { label: 'Productividad',  ids: ['icloud','google_one','microsoft','adobe','chatgpt'] },
  { label: 'Gaming',         ids: ['xbox','playstation'] },
  { label: 'Delivery',       ids: ['rappi','pedidosya'] },
  { label: 'Otros',          ids: ['duolingo','gym'] },
]
