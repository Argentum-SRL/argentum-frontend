import { useMemo, useSyncExternalStore } from 'react'

export const CONSULTA_CELULAR = '(max-width: 767.98px)'
export const CONSULTA_ESCRITORIO = '(min-width: 1024px)'

export type TipoViewport = 'celular' | 'tablet' | 'escritorio'

export interface EstadoViewport {
  tipo: TipoViewport
  esCelular: boolean
  esTablet: boolean
  esEscritorio: boolean
}

type MediaQueryLegacy = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

/**
 * Clasifica el viewport en 'celular', 'tablet' o 'escritorio'.
 * Si ambas consultas coinciden, prevalece 'celular'.
 */
export function clasificarViewport(esCelular: boolean, esEscritorio: boolean): TipoViewport {
  if (esCelular) return 'celular'
  if (esEscritorio) return 'escritorio'
  return 'tablet'
}

function leerSnapshotViewport(): TipoViewport {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'escritorio'
  }
  const esCelular = window.matchMedia(CONSULTA_CELULAR).matches
  const esEscritorio = window.matchMedia(CONSULTA_ESCRITORIO).matches
  return clasificarViewport(esCelular, esEscritorio)
}

function obtenerServerSnapshotViewport(): TipoViewport {
  return 'escritorio'
}

function suscribirMediaQuery(mq: MediaQueryLegacy, onChange: () => void): () => void {
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  // Respaldo para versiones anteriores de Safari sin addEventListener en MediaQueryList
  if (typeof mq.addListener === 'function') {
    mq.addListener(onChange)
    return () => {
      mq.removeListener?.(onChange)
    }
  }
  return () => {}
}

function suscribirViewport(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mqCelular = window.matchMedia(CONSULTA_CELULAR) as MediaQueryLegacy
  const mqEscritorio = window.matchMedia(CONSULTA_ESCRITORIO) as MediaQueryLegacy

  const desuscribirCelular = suscribirMediaQuery(mqCelular, onStoreChange)
  const desuscribirEscritorio = suscribirMediaQuery(mqEscritorio, onStoreChange)

  return () => {
    desuscribirCelular()
    desuscribirEscritorio()
  }
}

/**
 * Hook único para consultar el rango de ancho activo ('celular' | 'tablet' | 'escritorio').
 * Lee el estado de forma sincrónica en el primer render y reacciona a cambios de tamaño.
 */
export function useViewport(): EstadoViewport {
  const tipo = useSyncExternalStore(
    suscribirViewport,
    leerSnapshotViewport,
    obtenerServerSnapshotViewport
  )

  return useMemo(
    () => ({
      tipo,
      esCelular: tipo === 'celular',
      esTablet: tipo === 'tablet',
      esEscritorio: tipo === 'escritorio',
    }),
    [tipo]
  )
}
