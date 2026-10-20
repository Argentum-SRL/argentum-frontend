import { findServicioCatalogo } from '@/lib/constants/suscripciones'
import suscripcionService from '@/services/suscripcion.service'
import type { Suscripcion } from '@/types'

export interface VisualMovimientoEntrada {
  descripcion?: string | null
  suscripcion_id?: string | null
  suscripcion_nombre?: string | null
  movimiento_meta_id?: string | null
  subcategoria_nombre?: string | null
  subcategoria?: { nombre?: string | null; categoria_id?: string | null } | null
  categoria_nombre?: string | null
  categoria?: { nombre?: string | null } | null
  origen?: string | null
  estado_verificacion?: string | null
  tipo?: string | null
  es_cuota_hija?: boolean
}

export interface ResolverVisualMovimientoOpciones {
  suscripciones?: Array<{ id: string; nombre: string }>
}

export type TipoVisualMovimiento =
  | 'suscripcion_logo'
  | 'meta'
  | 'subcategoria'
  | 'categoria'
  | 'transferencia'
  | 'default'

export interface VisualMovimientoResultado {
  tipo: TipoVisualMovimiento
  logoUrl?: string
  alt?: string
  subcategoriaNombre?: string
  categoriaNombre?: string
  isPendienteIA?: boolean
}

let _cachedSuscripciones: Suscripcion[] | null = null
let _inFlightSuscripcionesPromise: Promise<Suscripcion[]> | null = null
const _subscribers = new Set<() => void>()

export function onSuscripcionesCacheChange(callback: () => void): () => void {
  _subscribers.add(callback)
  return () => {
    _subscribers.delete(callback)
  }
}

export async function getCachedSuscripciones(): Promise<Suscripcion[]> {
  if (_cachedSuscripciones) return _cachedSuscripciones
  if (_inFlightSuscripcionesPromise) return _inFlightSuscripcionesPromise
  _inFlightSuscripcionesPromise = suscripcionService.getSuscripciones()
    .then((data) => {
      _cachedSuscripciones = data
      _inFlightSuscripcionesPromise = null
      _subscribers.forEach(cb => {
        try { cb() } catch { /* ignore */ }
      })
      return data
    })
    .catch(() => {
      _inFlightSuscripcionesPromise = null
      return []
    })
  return _inFlightSuscripcionesPromise
}

export function getCachedSuscripcionesSync(): Suscripcion[] | null {
  return _cachedSuscripciones
}

export function setCachedSuscripciones(data: Suscripcion[]): void {
  _cachedSuscripciones = data
  _subscribers.forEach(cb => {
    try { cb() } catch { /* ignore */ }
  })
}

/**
 * Resolver único de visual para movimientos/transacciones/cuotas.
 * Implementa estrictamente el orden de resolución de reglas S1 - S6:
 * S1: Movimiento de suscripción -> logo de catálogo (o subcategoría si genérica)
 * S2: Aporte/retiro de meta -> Target
 * S3: Movimiento normal con subcategoría específica -> SubcategoriaIcon
 * S4: Subcategoría General/Otros/no catalogada -> Categoría padre
 * S5: Movimiento pendiente IA sin categoría -> Default + chispa
 * S6: Transferencias -> Ícono de transferencia
 */
export function resolverVisualMovimiento(
  entrada: VisualMovimientoEntrada,
  opciones?: ResolverVisualMovimientoOpciones
): VisualMovimientoResultado {
  const isPendienteIA = entrada.estado_verificacion === 'pendiente' && ['ia_wpp', 'ia_pdf'].includes(entrada.origen || '')

  // S6. Transferencias (no tienen subcategoría)
  if (entrada.tipo === 'transferencia') {
    return { tipo: 'transferencia', isPendienteIA }
  }

  // S1. Movimiento de suscripción
  const descNorm = (entrada.descripcion || '').trim().toLowerCase()
  const suscripcionesList = opciones?.suscripciones ?? _cachedSuscripciones ?? []

  const matchedSub = entrada.suscripcion_id
    ? suscripcionesList.find(s => s.id === entrada.suscripcion_id)
    : (descNorm ? suscripcionesList.find(s => s.nombre && s.nombre.trim().toLowerCase() === descNorm) : undefined)

  const isSuscripcion = Boolean(entrada.suscripcion_id || matchedSub)

  if (isSuscripcion) {
    const nombreBusqueda = entrada.suscripcion_nombre || matchedSub?.nombre || entrada.descripcion
    const catalogo = findServicioCatalogo(nombreBusqueda)
    const hasBrandLogo = Boolean(catalogo?.logoPath && !catalogo?.generico)

    if (hasBrandLogo && catalogo?.logoPath) {
      return {
        tipo: 'suscripcion_logo',
        logoUrl: catalogo.logoPath,
        alt: catalogo.nombre || entrada.descripcion || 'Suscripción',
        isPendienteIA,
      }
    }

    // Suscripción genérica o sin logo de marca (ej: "Gimnasio") -> ícono de la subcategoría
    const subcatNombre = entrada.subcategoria?.nombre || entrada.subcategoria_nombre || catalogo?.subcategoria || 'Gimnasio'
    const catNombre = entrada.categoria?.nombre || entrada.categoria_nombre || catalogo?.categoria || 'Salud'
    return {
      tipo: 'subcategoria',
      subcategoriaNombre: subcatNombre,
      categoriaNombre: catNombre,
      isPendienteIA,
    }
  }

  // S2. Aporte/retiro de meta (Target en todos los listados)
  const isMeta = Boolean(
    entrada.movimiento_meta_id ||
    entrada.descripcion?.startsWith('Aporte a la meta:') ||
    entrada.descripcion?.startsWith('Retiro de la meta:')
  )
  if (isMeta) {
    return { tipo: 'meta', isPendienteIA }
  }

  // S3 & S4. Movimiento normal con subcategoría o categoría padre
  const subcatNombre = entrada.subcategoria?.nombre || entrada.subcategoria_nombre || null
  const catNombre = entrada.categoria?.nombre || entrada.categoria_nombre || null

  if (subcatNombre) {
    return {
      tipo: 'subcategoria',
      subcategoriaNombre: subcatNombre,
      categoriaNombre: catNombre || undefined,
      isPendienteIA,
    }
  }

  if (catNombre) {
    return {
      tipo: 'categoria',
      categoriaNombre: catNombre,
      isPendienteIA,
    }
  }

  // S5. Fallback por defecto
  return {
    tipo: 'default',
    categoriaNombre: 'default',
    isPendienteIA,
  }
}
