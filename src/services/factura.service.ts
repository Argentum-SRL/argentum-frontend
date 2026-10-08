import api from './api'
import type { Factura } from '@/types'

const facturaService = {
  listar: async (signal?: AbortSignal): Promise<Factura[]> => {
    const { data } = await api.get<Factura[]>('/facturas', { signal })
    return data
  },

  descartar: async (id: string, signal?: AbortSignal): Promise<Factura> => {
    const { data } = await api.post<Factura>(`/facturas/${id}/descartar`, {}, { signal })
    return data
  },

  desmarcar: async (id: string, signal?: AbortSignal): Promise<Factura> => {
    const { data } = await api.post<Factura>(`/facturas/${id}/desmarcar`, {}, { signal })
    return data
  },
}

export default facturaService
