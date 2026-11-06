import api from './api'
import type { Suscripcion, SuscripcionCreate, SuscripcionUpdate, TotalMensualSuscripciones, HistorialSuscripcion } from '../types'
import { createUserCache, getCurrentUserId } from '@/utils/sessionCleanup'
import { setCachedSuscripciones } from '@/lib/utils/movimientoVisual.utils'

const SUSCRIPCIONES_TTL = 30 * 1000 // 30 seconds
const suscripcionesCache = createUserCache<Suscripcion[]>(SUSCRIPCIONES_TTL)
const totalMensualCache = createUserCache<TotalMensualSuscripciones>(SUSCRIPCIONES_TTL)
let suscripcionesPromise: Promise<Suscripcion[]> | null = null

const HAS_SUSCRIPCIONES_KEY = 'argentum_has_suscripciones_'

export function getStoredHasSuscripciones(userId?: string | null): boolean | null {
  if (!userId) return null
  try {
    const val = localStorage.getItem(`${HAS_SUSCRIPCIONES_KEY}${userId}`)
    if (val === 'true') return true
    if (val === 'false') return false
    return null
  } catch {
    return null
  }
}

export function setStoredHasSuscripciones(userId: string | null | undefined, hasSubs: boolean): void {
  if (!userId) return
  try {
    localStorage.setItem(`${HAS_SUSCRIPCIONES_KEY}${userId}`, hasSubs ? 'true' : 'false')
  } catch {
    // ignore
  }
}

export function invalidateSuscripcionesCache(): void {
  suscripcionesCache.clear()
  totalMensualCache.clear()
  suscripcionesPromise = null
}

const suscripcionService = {
  getSuscripciones: async (estado?: string, signal?: AbortSignal, forceRefresh = false): Promise<Suscripcion[]> => {
    if (!estado && !forceRefresh) {
      const cached = suscripcionesCache.get()
      if (cached) return cached
      if (suscripcionesPromise && !signal) return suscripcionesPromise
    }

    const fetchPromise = (async () => {
      try {
        const params = estado ? { estado } : {}
        const { data } = await api.get<Suscripcion[]>('/suscripciones', { params, signal })
        if (!estado) {
          suscripcionesCache.set(data)
          setCachedSuscripciones(data)
          const userId = getCurrentUserId()
          if (userId) {
            setStoredHasSuscripciones(userId, data.length > 0)
          }
        }
        return data
      } finally {
        if (!estado) suscripcionesPromise = null
      }
    })()

    if (!estado && !signal && !forceRefresh) {
      suscripcionesPromise = fetchPromise
    }

    return fetchPromise
  },

  getTotalMensual: async (signal?: AbortSignal, forceRefresh = false): Promise<TotalMensualSuscripciones> => {
    if (!forceRefresh) {
      const cached = totalMensualCache.get()
      if (cached) return cached
    }
    const { data } = await api.get<TotalMensualSuscripciones>('/suscripciones/total-mensual', { signal })
    totalMensualCache.set(data)
    return data
  },

  getSuscripcion: async (id: string, signal?: AbortSignal): Promise<Suscripcion> => {
    const { data } = await api.get<Suscripcion>(`/suscripciones/${id}`, { signal })
    return data
  },

  createSuscripcion: async (data: SuscripcionCreate): Promise<Suscripcion> => {
    const { data: res } = await api.post<Suscripcion>('/suscripciones', data)
    invalidateSuscripcionesCache()
    const userId = getCurrentUserId()
    if (userId) {
      setStoredHasSuscripciones(userId, true)
    }
    return res
  },

  updateSuscripcion: async (id: string, data: SuscripcionUpdate): Promise<Suscripcion> => {
    const { data: res } = await api.put<Suscripcion>(`/suscripciones/${id}`, data)
    invalidateSuscripcionesCache()
    return res
  },

  actualizarPrecio: async (id: string, data: { monto: number; moneda: string; vigente_desde: string }): Promise<HistorialSuscripcion> => {
    const { data: res } = await api.post<HistorialSuscripcion>(`/suscripciones/${id}/precio`, data)
    invalidateSuscripcionesCache()
    return res
  },

  pausarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/pausar`)
    invalidateSuscripcionesCache()
    return data
  },

  reactivarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/reactivar`)
    invalidateSuscripcionesCache()
    return data
  },

  cancelarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/cancelar`)
    invalidateSuscripcionesCache()
    return data
  },

  deleteSuscripcion: async (id: string): Promise<void> => {
    await api.delete(`/suscripciones/${id}`)
    invalidateSuscripcionesCache()
  }
}

export default suscripcionService
