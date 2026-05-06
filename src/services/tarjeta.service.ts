import api from './api'
import type { TarjetaCredito, TarjetaCreditoCreate } from '@/types'

const tarjetaService = {
  getTarjetas: async (): Promise<TarjetaCredito[]> => {
    const { data } = await api.get<TarjetaCredito[]>('/tarjetas')
    return data
  },

  getTarjetasPorBilletera: async (billeteraId: string): Promise<TarjetaCredito[]> => {
    const { data } = await api.get<TarjetaCredito[]>(`/tarjetas/billetera/${billeteraId}`)
    return data
  },

  createTarjeta: async (payload: TarjetaCreditoCreate): Promise<TarjetaCredito> => {
    const { data } = await api.post<TarjetaCredito>('/tarjetas', payload)
    return data
  },

  updateTarjeta: async (id: string, payload: Partial<TarjetaCreditoCreate>): Promise<TarjetaCredito> => {
    const { data } = await api.put<TarjetaCredito>(`/tarjetas/${id}`, payload)
    return data
  },

  archivarTarjeta: async (id: string): Promise<TarjetaCredito> => {
    const { data } = await api.post<TarjetaCredito>(`/tarjetas/${id}/archivar`)
    return data
  },

  desarchivarTarjeta: async (id: string): Promise<TarjetaCredito> => {
    const { data } = await api.post<TarjetaCredito>(`/tarjetas/${id}/desarchivar`)
    return data
  },

  deleteTarjeta: async (id: string): Promise<void> => {
    await api.delete(`/tarjetas/${id}`)
  }
}

export default tarjetaService
