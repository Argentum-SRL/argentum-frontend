import api from './api'
import type { DashboardResumen, CotizacionDolar, Billetera, SubcategoriaGasto, ProyeccionesResponse } from '../types'

// Cache storage
let cotizacionCache: { data: CotizacionDolar; timestamp: number } | null = null
let cotizacionPromise: Promise<CotizacionDolar> | null = null

let resumenCache: Record<string, { data: DashboardResumen; timestamp: number }> = {}
const resumenPromises: Record<string, Promise<DashboardResumen> | undefined> = {}

let proyeccionCache: { data: ProyeccionesResponse; timestamp: number } | null = null
let proyeccionPromise: Promise<ProyeccionesResponse> | null = null

const DEFAULT_TTL = 60 * 1000 // 60 seconds

export const dashboardService = {
  getResumen: async (desde?: string, hasta?: string, billeteraIds?: string[], signal?: AbortSignal): Promise<DashboardResumen> => {
    const key = `${desde || 'all'}-${hasta || 'all'}-${billeteraIds?.join(',') || 'all'}`
    
    const pending = resumenPromises[key]
    if (pending) return pending

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
        delete resumenPromises[key]
      }
    })()

    resumenPromises[key] = promise
    return promise
  },

  getCotizacion: async (signal?: AbortSignal): Promise<CotizacionDolar> => {
    if (cotizacionPromise) return cotizacionPromise

    if (cotizacionCache && Date.now() - cotizacionCache.timestamp < DEFAULT_TTL) {
      return cotizacionCache.data
    }

    cotizacionPromise = (async () => {
      try {
        const response = await api.get<CotizacionDolar>('/dashboard/cotizacion', { signal })
        cotizacionCache = { data: response.data, timestamp: Date.now() }
        return response.data
      } finally {
        cotizacionPromise = null
      }
    })()

    return cotizacionPromise
  },

  getProyeccion: async (signal?: AbortSignal): Promise<ProyeccionesResponse> => {
    if (proyeccionPromise) return proyeccionPromise

    if (proyeccionCache && Date.now() - proyeccionCache.timestamp < DEFAULT_TTL) {
      return proyeccionCache.data
    }

    proyeccionPromise = (async () => {
      try {
        const response = await api.get<ProyeccionesResponse>('/dashboard/proyeccion', { signal })
        proyeccionCache = { data: response.data, timestamp: Date.now() }
        return response.data
      } finally {
        proyeccionPromise = null
      }
    })()

    return proyeccionPromise
  },

  getResumenCompleto: async (desde?: string, hasta?: string, billeteraIds?: string[], signal?: AbortSignal): Promise<{
    billeteras: Billetera[];
    resumen: DashboardResumen;
    cotizacion: CotizacionDolar;
  }> => {
    // Esta llamada no usa cache por ahora para asegurar datos frescos al consolidar
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
}

export const invalidateResumen = () => {
  resumenCache = {}
}

export const invalidateCotizacion = () => {
  cotizacionCache = null
}
