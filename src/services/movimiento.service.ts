import api from './api'
import type { FiltrosMovimientos, MovimientosResponse } from '@/types'

const movimientoService = {
  getMovimientos: async (filters: FiltrosMovimientos = {}, signal?: AbortSignal): Promise<MovimientosResponse> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'categoria_ids' || key === 'billetera_ids') {
        if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(','))
        }
        return
      }
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    const response = await api.get<MovimientosResponse>(`/movimientos?${params.toString()}`, { signal })
    return response.data
  },
}

export default movimientoService
export { movimientoService }
