import api from './api'
import type { DashboardResumen, CotizacionDolar } from '../types'

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
}
