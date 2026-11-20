import type { CanalUsoAdmin, EstadoCuentaAdmin, EstadoVisibleAdmin } from '@/types/admin'

const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires'

const fmtPartes = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_ARGENTINA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function obtenerPartesAr(fecha: Date): {
  year: number
  month: string
  day: string
  hour: string
  minute: string
  fechaKey: string
} {
  const parts = fmtPartes.formatToParts(fecha)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00'
  const year = Number(get('year'))
  const month = get('month')
  const day = get('day')
  const hour = get('hour') === '24' ? '00' : get('hour')
  const minute = get('minute')
  return {
    year,
    month,
    day,
    hour,
    minute,
    fechaKey: `${year}-${month}-${day}`,
  }
}

function claveDiaAnteriorAr(hoyPartes: { year: number; month: string; day: string }): string {
  const utcMedioDia = Date.UTC(
    hoyPartes.year,
    Number(hoyPartes.month) - 1,
    Number(hoyPartes.day),
    12,
    0,
    0
  )
  const ayer = new Date(utcMedioDia - 86_400_000)
  return obtenerPartesAr(ayer).fechaKey
}

/**
 * Formatea una fecha ISO pasada respecto de `ahora` en zona horaria de Argentina.
 */
export function tiempoRelativo(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return 'Nunca'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return 'Nunca'

  const diffMs = ahora.getTime() - fecha.getTime()
  if (diffMs < 60_000) {
    return 'Recién'
  }

  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) {
    return `Hace ${diffMin} min`
  }

  const pAhora = obtenerPartesAr(ahora)
  const pFecha = obtenerPartesAr(fecha)

  if (pFecha.fechaKey === pAhora.fechaKey) {
    const diffHoras = Math.floor(diffMs / 3_600_000)
    return `Hace ${diffHoras} h`
  }

  if (pFecha.fechaKey === claveDiaAnteriorAr(pAhora)) {
    return `Ayer, ${pFecha.hour}:${pFecha.minute}`
  }

  if (pFecha.year === pAhora.year) {
    return `${pFecha.day}/${pFecha.month}`
  }

  return `${pFecha.day}/${pFecha.month}/${pFecha.year}`
}

/**
 * Formatea una fecha ISO futura respecto de `ahora` en zona horaria de Argentina.
 */
export function tiempoHasta(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'

  const diffMs = fecha.getTime() - ahora.getTime()
  if (diffMs <= 0) {
    return 'Ahora'
  }
  if (diffMs < 60_000) {
    return 'En menos de 1 min'
  }

  const minutosDiff = Math.floor(diffMs / 60_000)
  if (minutosDiff < 60) {
    return `En ${minutosDiff} min`
  }

  const horas = Math.floor(minutosDiff / 60)
  const minRest = minutosDiff % 60
  if (horas < 24) {
    return minRest === 0 ? `En ${horas} h` : `En ${horas} h ${minRest} min`
  }

  const p = obtenerPartesAr(fecha)
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`
}

const PRIORIDAD_ESTADO_TAREA: Record<string, number> = {
  'Falló': 0,
  'Atrasado': 1,
  'Sin datos': 2,
  'Al día': 3,
}

/**
 * Devuelve una copia ordenada de las tareas: problemas arriba y orden alfabético en cada grupo.
 */
export function ordenarTareas<T extends { estado: string; nombre: string }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const pa = PRIORIDAD_ESTADO_TAREA[a.estado] ?? 99
    const pb = PRIORIDAD_ESTADO_TAREA[b.estado] ?? 99
    if (pa !== pb) return pa - pb
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

/**
 * Devuelve texto y tono visual para el estado de cuenta de un usuario.
 */
export function estadoCuentaVisual(
  estado: EstadoCuentaAdmin
): { texto: string; tono: 'bien' | 'mal' | 'aviso' } {
  switch (estado) {
    case 'suspendida':
      return { texto: 'Suspendida', tono: 'mal' }
    case 'sin_verificar':
      return { texto: 'Sin verificar el mail', tono: 'aviso' }
    case 'activa':
    default:
      return { texto: 'Activa', tono: 'bien' }
  }
}

/**
 * Etiqueta legible del canal de uso.
 */
export function etiquetaCanal(canal: CanalUsoAdmin): string {
  if (canal === 'web') return 'Web'
  if (canal === 'whatsapp') return 'WhatsApp'
  return ''
}

/**
 * Texto de rango paginado ("1–20 de 37" o "0 de 0").
 */
export function rangoPagina(page: number, limit: number, total: number): string {
  if (total <= 0) return '0 de 0'
  const desde = (page - 1) * limit + 1
  const hasta = Math.min(page * limit, total)
  return `${desde}–${hasta} de ${total}`
}

/**
 * Formatea una fecha ISO como "dd/mm HH:mm" en horario de Argentina.
 */
export function formatearFechaHoraCortaAr(iso: string | null | undefined): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  const p = obtenerPartesAr(fecha)
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`
}

/**
 * Formatea una fecha ISO como "dd/mm/aaaa HH:mm" en horario de Argentina.
 */
export function formatearFechaHoraAr(iso: string | null | undefined): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  const p = obtenerPartesAr(fecha)
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`
}

/**
 * Formatea una fecha YYYY-MM-DD como "dd/mm".
 */
export function formatearDiaMes(fechaStr: string): string {
  const partes = fechaStr.split('-')
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`
  }
  return fechaStr
}

/**
 * Porcentaje acotado [0, 100] para ancho de barras visuales.
 */
export function porcentajeBarra(actual: number, maximo: number): number {
  if (maximo <= 0 || actual <= 0) return 0
  return Math.min(100, (actual / maximo) * 100)
}

/**
 * Formatea una cantidad entera con separadores de miles de Argentina.
 */
export function formatearCantidad(n: number): string {
  return new Intl.NumberFormat('es-AR').format(n)
}

/**
 * Convierte un nombre de clave interno con guiones bajos en texto legible.
 */
export function textoIntent(intent: string | null): string {
  if (!intent) return '—'
  const limpio = intent.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
  if (!limpio) return '—'
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

/**
 * Devuelve las iniciales del usuario para mostrar cuando no hay foto de perfil.
 */
export function inicialesDe(
  nombre: string | null | undefined,
  apellido: string | null | undefined,
  email: string | null | undefined
): string {
  const n = nombre?.trim()
  const a = apellido?.trim()
  if (n && a) return `${n[0]}${a[0]}`.toUpperCase()
  if (n) return n[0].toUpperCase()
  if (a) return a[0].toUpperCase()
  const e = email?.trim()
  if (e) return e[0].toUpperCase()
  return '?'
}

export type TonoEstadoAdmin = 'bien' | 'info' | 'aviso' | 'mal' | 'apagado'

/**
 * Devuelve la etiqueta y el tono visual del estado de uso del usuario.
 */
export function estadoVisual(
  estado: EstadoVisibleAdmin
): { texto: string; tono: TonoEstadoAdmin } {
  switch (estado) {
    case 'activo':
      return { texto: 'Activo', tono: 'bien' }
    case 'nuevo':
      return { texto: 'Nuevo', tono: 'info' }
    case 'poco_uso':
      return { texto: 'Poco uso', tono: 'aviso' }
    case 'en_desuso':
      return { texto: 'En desuso', tono: 'apagado' }
    case 'sin_empezar':
      return { texto: 'Sin empezar', tono: 'aviso' }
    case 'suspendida':
      return { texto: 'Suspendida', tono: 'mal' }
    case 'sin_verificar':
    default:
      return { texto: 'Mail sin verificar', tono: 'aviso' }
  }
}

/**
 * Devuelve la explicación corta del estado de uso para mostrar en el detalle.
 */
export function explicacionEstado(estado: EstadoVisibleAdmin): string {
  switch (estado) {
    case 'activo':
      return 'Usó la app en los últimos 7 días.'
    case 'nuevo':
      return 'Se registró hace 7 días o menos.'
    case 'poco_uso':
      return 'Entre 8 y 30 días sin usar la app.'
    case 'en_desuso':
      return 'Más de 30 días sin usar la app.'
    case 'sin_empezar':
      return 'No terminó el inicio de la app.'
    case 'suspendida':
      return 'No puede entrar a la app.'
    case 'sin_verificar':
    default:
      return 'No confirmó su mail.'
  }
}

export const AYUDA_COSTO_ESTIMADO = {
  titulo: 'Costo estimado',
  texto:
    'Lo que esta persona le costó a Argentum este mes: lo que gastó en IA, pasado a pesos con el dólar oficial, más los mensajes de WhatsApp que cobra Meta. Es una estimación: el total real de la IA está en WhatsApp e IA, según OpenAI.',
} as const
