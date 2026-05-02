import api from './api'
import type { DashboardResumen, CotizacionDolar, Proyeccion } from '../types'

export const dashboardService = {
  getResumen: async (desde?: string, hasta?: string): Promise<DashboardResumen> => {
    const response = await api.get<DashboardResumen>('/dashboard/resumen', {
      params: { desde, hasta }
    })
    return response.data
  },

  getCotizacion: async (): Promise<CotizacionDolar> => {
    const response = await api.get<CotizacionDolar>('/dashboard/cotizacion')
    return response.data
  },

  getProyeccion: async (): Promise<Proyeccion> => {
    const response = await api.get<Proyeccion>('/dashboard/proyeccion')
    return response.data
  },
}
