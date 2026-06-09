import api from './api'
import type { DashboardResumen, CotizacionDolar, Proyeccion, Billetera } from '../types'

// Cache storage
let cotizacionCache: { data: CotizacionDolar; timestamp: number } | null = null
let cotizacionPromise: Promise<CotizacionDolar> | null = null

let resumenCache: Record<string, { data: DashboardResumen; timestamp: number }> = {}
const resumenPromises: Record<string, Promise<DashboardResumen> | undefined> = {}

let proyeccionCache: { data: Proyeccion; timestamp: number } | null = null
let proyeccionPromise: Promise<Proyeccion> | null = null

const DEFAULT_TTL = 60 * 1000 // 60 seconds

export const dashboardService = {
  getResumen: async (desde?: string, hasta?: string, signal?: AbortSignal): Promise<DashboardResumen> => {
    const key = `${desde || 'all'}-${hasta || 'all'}`
    
    const pending = resumenPromises[key]
    if (pending) return pending

    const cached = resumenCache[key]
    if (cached && Date.now() - cached.timestamp < DEFAULT_TTL) {
      return cached.data
    }

    const promise = (async () => {
      try {
        const response = await api.get<DashboardResumen>('/dashboard/resumen', {
          params: { desde, hasta },
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

  getProyeccion: async (signal?: AbortSignal): Promise<Proyeccion> => {
    if (proyeccionPromise) return proyeccionPromise

    if (proyeccionCache && Date.now() - proyeccionCache.timestamp < DEFAULT_TTL) {
      return proyeccionCache.data
    }

    proyeccionPromise = (async () => {
      try {
        const response = await api.get<Proyeccion>('/dashboard/proyeccion', { signal })
        proyeccionCache = { data: response.data, timestamp: Date.now() }
        return response.data
      } finally {
        proyeccionPromise = null
      }
    })()

    return proyeccionPromise
  },

  getResumenCompleto: async (desde?: string, hasta?: string, signal?: AbortSignal): Promise<{
    billeteras: Billetera[];
    resumen: DashboardResumen;
    cotizacion: CotizacionDolar;
  }> => {
    // Esta llamada no usa cache por ahora para asegurar datos frescos al consolidar
    const response = await api.get('/dashboard/resumen-completo', {
      params: { desde, hasta },
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
