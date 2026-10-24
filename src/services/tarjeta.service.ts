import api, { encabezadoClave } from './api'
import type { TarjetaCredito, TarjetaCreditoCreate, ResumenTarjeta, PresionFuturaData, PagarTarjetaPayload, SimularPesificacionResponse, ResultadoPagoTarjeta, ResumenDeCompraResponse } from '@/types'

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

  getResumenDeCompra: async (
    tarjetaId: string,
    fecha: string,
    proximoResumen: boolean = false,
    signal?: AbortSignal
  ): Promise<ResumenDeCompraResponse> => {
    const { data } = await api.get<ResumenDeCompraResponse>(`/tarjetas/${tarjetaId}/resumen-de-compra`, {
      params: { fecha, proximo_resumen: proximoResumen },
      signal,
    })
    return data
  },
  pagarResumenTarjeta: async (
    id: string,
    payloadOrFechaPago?: PagarTarjetaPayload | string,
    fechaResumenOrClave?: string,
    monto?: number,
    claveParam?: string
  ): Promise<ResultadoPagoTarjeta> => {
    let body: PagarTarjetaPayload
    let clave: string | undefined
    if (typeof payloadOrFechaPago === 'object' && payloadOrFechaPago !== null) {
      body = payloadOrFechaPago
      clave = typeof fechaResumenOrClave === 'string' ? fechaResumenOrClave : claveParam
    } else {
      body = { fecha_pago: payloadOrFechaPago, fecha_resumen: fechaResumenOrClave, monto }
      clave = claveParam
    }

    const { data } = await api.post<ResultadoPagoTarjeta>(`/tarjetas/${id}/pagar`, body, encabezadoClave(clave))
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
  },
  actualizarFechasResumen: async (
    id: string,
    fechaCierreOrPayload: string | { fecha_cierre: string; fecha_vencimiento: string },
    fechaVencimiento?: string
  ): Promise<{ ok: boolean; fecha_cierre: string; fecha_vencimiento: string; cuotas_movidas?: number }> => {
    const payload = typeof fechaCierreOrPayload === 'string'
      ? { fecha_cierre: fechaCierreOrPayload, fecha_vencimiento: fechaVencimiento! }
      : fechaCierreOrPayload
    const { data } = await api.post(`/tarjetas/${id}/fechas-resumen`, payload)
    return data
  }
}

export default tarjetaService
