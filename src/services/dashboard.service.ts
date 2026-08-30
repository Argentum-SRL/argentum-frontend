import api from './api'
import type { DashboardResumen, CotizacionDolar, Billetera, SubcategoriaGasto, ProyeccionesResponse } from '../types'

// Cache storage
let cotizacionCache: { data: CotizacionDolar; timestamp: number } | null = null
let cotizacionPromise: Promise<CotizacionDolar> | null = null

let resumenCache: Record<string, { data: DashboardResumen; timestamp: number }> = {}
const resumenPromises: Record<string, Promise<DashboardResumen> | undefined> = {}

let proyeccionCache: { data: ProyeccionesResponse; timestamp: number } | null = null
let proyeccionPromise: Promise<ProyeccionesResponse> | null = null

let periodoActualCache: { data: { fecha_inicio: string; fecha_fin: string }; timestamp: number } | null = null
let periodoActualPromise: Promise<{ fecha_inicio: string; fecha_fin: string }> | null = null

const DEFAULT_TTL = 60 * 1000 // 60 seconds

export const dashboardService = {
  getPeriodoActual: async (signal?: AbortSignal): Promise<{ fecha_inicio: string; fecha_fin: string }> => {
    if (!signal && periodoActualPromise) return periodoActualPromise

    if (periodoActualCache && Date.now() - periodoActualCache.timestamp < DEFAULT_TTL) {
      return periodoActualCache.data
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<{ fecha_inicio: string; fecha_fin: string }>('/dashboard/periodo-actual', { signal })
        periodoActualCache = { data: response.data, timestamp: Date.now() }
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

    const cached = resumenCache[key]
    if (cached && Date.now() - cached.timestamp < DEFAULT_TTL) {
      return cached.data
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
        resumenCache[key] = { data: response.data, timestamp: Date.now() }
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

    if (cotizacionCache && Date.now() - cotizacionCache.timestamp < DEFAULT_TTL) {
      return cotizacionCache.data
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<CotizacionDolar>('/dashboard/cotizacion', { signal })
        cotizacionCache = { data: response.data, timestamp: Date.now() }
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

    if (proyeccionCache && Date.now() - proyeccionCache.timestamp < DEFAULT_TTL) {
      return proyeccionCache.data
    }

    const fetchPromise = (async () => {
      try {
        const response = await api.get<ProyeccionesResponse>('/dashboard/proyeccion', { signal })
        proyeccionCache = { data: response.data, timestamp: Date.now() }
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
  resumenCache = {}
  cotizacionCache = null
  proyeccionCache = null
  periodoActualCache = null
}

export const invalidateResumen = () => {
  resumenCache = {}
}

export const invalidateCotizacion = () => {
  cotizacionCache = null
}
