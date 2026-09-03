import api from './api'
import type { TarjetaCredito, TarjetaCreditoCreate, ResumenTarjeta, PresionFuturaData, PagarTarjetaPayload, SimularPesificacionResponse } from '@/types'

const tarjetaService = {
  getTarjetas: async (signal?: AbortSignal): Promise<TarjetaCredito[]> => {
    const { data } = await api.get<TarjetaCredito[]>('/tarjetas', { signal })
    return data
  },

  getTarjetasPorBilletera: async (billeteraId: string, signal?: AbortSignal): Promise<TarjetaCredito[]> => {
    const { data } = await api.get<TarjetaCredito[]>(`/tarjetas/billetera/${billeteraId}`, { signal })
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
  },

  getResumenTarjeta: async (id: string, signal?: AbortSignal): Promise<ResumenTarjeta> => {
    const { data } = await api.get<ResumenTarjeta>(`/tarjetas/${id}/resumen`, { signal })
    return data
  },
  pagarResumenTarjeta: async (
    id: string,
    payloadOrFechaPago?: PagarTarjetaPayload | string,
    fechaResumen?: string,
    monto?: number
  ): Promise<unknown> => {
    const body: PagarTarjetaPayload =
      typeof payloadOrFechaPago === 'string' || payloadOrFechaPago === undefined
        ? { fecha_pago: payloadOrFechaPago, fecha_resumen: fechaResumen, monto }
        : payloadOrFechaPago

    const { data } = await api.post(`/tarjetas/${id}/pagar`, body)
    return data
  },
  simularPesificacion: async (
    id: string,
    fechaResumen?: string,
    montoUsd?: number,
    signal?: AbortSignal
  ): Promise<SimularPesificacionResponse> => {
    const { data } = await api.get<SimularPesificacionResponse>(`/tarjetas/${id}/simular-pesificacion`, {
      params: { fecha_resumen: fechaResumen, monto_usd: montoUsd },
      signal
    })
    return data
  },
  getPresionFutura: async (meses = 6, signal?: AbortSignal): Promise<PresionFuturaData> => {
    const { data } = await api.get<{ success: boolean; data: PresionFuturaData }>('/tarjetas/presion-futura', { params: { meses }, signal })
    return data.data
  }
}

export default tarjetaService
