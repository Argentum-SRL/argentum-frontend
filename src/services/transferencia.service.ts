import api, { encabezadoClave } from './api'
import type { TransferenciaInterna, SimularTransferenciaResponse } from '@/types'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'

const transferenciaService = {
  simularTransferencia: async (
    params: {
      monto: number
      cotizacion: number
      moneda_origen: 'ARS' | 'USD'
      moneda_destino: 'ARS' | 'USD'
    },
    signal?: AbortSignal
  ): Promise<SimularTransferenciaResponse> => {
    const response = await api.get<SimularTransferenciaResponse>('/transferencias/simular', {
      params,
      signal,
    })
    return response.data
  },
  getTransferencias: async () => {
    const response = await api.get<TransferenciaInterna[]>('/transferencias')
    return response.data
  },

  getTransferencia: async (id: string) => {
    const response = await api.get<TransferenciaInterna>(`/transferencias/${id}`)
    return response.data
  },

  createTransferencia: async (data: Omit<TransferenciaInterna, 'id' | 'fecha_creacion'>, clave?: string) => {
    const response = await api.post<TransferenciaInterna>('/transferencias', data, encabezadoClave(clave))
    invalidateBilleteras()
    invalidateResumen()
    return response.data
  },

  deleteTransferencia: async (id: string) => {
    await api.delete(`/transferencias/${id}`)
    invalidateBilleteras()
    invalidateResumen()
  }
}

export default transferenciaService
