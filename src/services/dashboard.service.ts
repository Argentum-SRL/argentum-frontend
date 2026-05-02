import api from './api'
import type { DashboardResumen, CotizacionDolar } from '../types'

export const dashboardService = {
  getResumen: async (): Promise<DashboardResumen> => {
    const response = await api.get<DashboardResumen>('/dashboard/resumen')
    return response.data
  },

  getCotizacion: async (): Promise<CotizacionDolar> => {
    const response = await api.get<CotizacionDolar>('/dashboard/cotizacion')
    return response.data
  },
}
