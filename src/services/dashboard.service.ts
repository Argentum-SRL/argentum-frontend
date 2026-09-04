import api from './api'
import type { DashboardResumen, CotizacionDolar, Billetera, SubcategoriaGasto, ProyeccionesResponse } from '../types'
import { createUserCache, createKeyedUserCache } from '@/utils/sessionCleanup'

// Cache storage con validación automática por usuario autenticado
const DEFAULT_TTL = 60 * 1000 // 60 seconds

const cotizacionCache = createUserCache<CotizacionDolar>(DEFAULT_TTL)
let cotizacionPromise: Promise<CotizacionDolar> | null = null

const resumenCache = createKeyedUserCache<DashboardResumen>(DEFAULT_TTL)
let resumenPromises: Record<string, Promise<DashboardResumen> | undefined> = {}

const proyeccionCache = createUserCache<ProyeccionesResponse>(DEFAULT_TTL)
let proyeccionPromise: Promise<ProyeccionesResponse> | null = null

const periodoActualCache = createUserCache<{ fecha_inicio: string; fecha_fin: string }>(DEFAULT_TTL)
let periodoActualPromise: Promise<{ fecha_inicio: string; fecha_fin: string }> | null = null

export const dashboardService = {
  getPeriodoActual: async (signal?: AbortSignal): Promise<{ fecha_inicio: string; fecha_fin: string }> => {
    if (!signal && periodoActualPromise) return periodoActualPromise

    const cached = periodoActualCache.get()
    if (cached) {
      return cached
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<{ fecha_inicio: string; fecha_fin: string }>('/dashboard/periodo-actual', { signal })
        periodoActualCache.set(response.data)
        return response.data
      } finally {
        if (!signal) periodoActualPromise = null
      }
    })()

    if (!signal) periodoActualPromise = fetchPromise
    return fetchPromise
  },

  getResumen: async (desde?: string, hasta?: string, billeteraIds?: string[], signal?: AbortSignal): Promise<DashboardResumen> => {
    const key = `${desde || 'all'}-${hasta || 'all'}-${billeteraIds?.join(',') || 'all'}`
    
    if (!signal) {
      const pending = resumenPromises[key]
      if (pending) return pending
    }

    const cached = resumenCache.get(key)
    if (cached) {
      return cached
    }

    const promise = (async () => {
      try {
        const params: Record<string, string> = {}
        if (desde) params.desde = desde
        if (hasta) params.hasta = hasta
        if (billeteraIds && billeteraIds.length > 0) {
          params.billetera_ids = billeteraIds.join(',')
        }
        const response = await api.get<DashboardResumen>('/dashboard/resumen', {
          params,
          signal
        })
        resumenCache.set(key, response.data)
        return response.data
      } finally {
        if (!signal) delete resumenPromises[key]
      }
    })()

    if (!signal) resumenPromises[key] = promise
    return promise
  },

  getCotizacion: async (signal?: AbortSignal): Promise<CotizacionDolar> => {
    if (!signal && cotizacionPromise) return cotizacionPromise

    const cached = cotizacionCache.get()
    if (cached) {
      return cached
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<CotizacionDolar>('/dashboard/cotizacion', { signal })
        cotizacionCache.set(response.data)
        return response.data
      } finally {
        if (!signal) cotizacionPromise = null
      }
    })()

    if (!signal) cotizacionPromise = fetchPromise
    return fetchPromise
  },

  getProyeccion: async (signal?: AbortSignal): Promise<ProyeccionesResponse> => {
    if (!signal && proyeccionPromise) return proyeccionPromise

    const cached = proyeccionCache.get()
    if (cached) {
      return cached
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<ProyeccionesResponse>('/dashboard/proyeccion', { signal })
        proyeccionCache.set(response.data)
        return response.data
      } finally {
        if (!signal) proyeccionPromise = null
      }
    })()

    if (!signal) proyeccionPromise = fetchPromise
    return fetchPromise
  },

  getResumenCompleto: async (desde?: string, hasta?: string, billeteraIds?: string[], signal?: AbortSignal): Promise<{
    billeteras: Billetera[];
    resumen: DashboardResumen;
    cotizacion: CotizacionDolar;
  }> => {
    const params: Record<string, string> = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    if (billeteraIds && billeteraIds.length > 0) {
      params.billetera_ids = billeteraIds.join(',')
    }
    const response = await api.get('/dashboard/resumen-completo', {
      params,
      signal
    })
    return response.data
  },

  getSubcategoriasGasto: async (categoriaId: string, billeteraIds?: string[], signal?: AbortSignal): Promise<SubcategoriaGasto[]> => {
    const params: Record<string, string> = {}
    if (billeteraIds && billeteraIds.length > 0) {
      params.billetera_ids = billeteraIds.join(',')
    }
    const response = await api.get<SubcategoriaGasto[]>(`/dashboard/categorias/${categoriaId}/subcategorias`, {
      params,
      signal
    })
    return response.data
  },
}

export const invalidateDashboardCache = () => {
  resumenCache.clear()
  cotizacionCache.clear()
  proyeccionCache.clear()
  periodoActualCache.clear()
  cotizacionPromise = null
  proyeccionPromise = null
  periodoActualPromise = null
  resumenPromises = {}
}

export const invalidateResumen = () => {
  resumenCache.clear()
  resumenPromises = {}
}

export const invalidateCotizacion = () => {
  cotizacionCache.clear()
  cotizacionPromise = null
}
