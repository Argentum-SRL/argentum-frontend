import api from './api'
import type { TransferenciaInterna } from '@/types'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'

const transferenciaService = {
  getTransferencias: async () => {
    const response = await api.get<TransferenciaInterna[]>('/transferencias')
    return response.data
  },

  getTransferencia: async (id: string) => {
    const response = await api.get<TransferenciaInterna>(`/transferencias/${id}`)
    return response.data
  },

  createTransferencia: async (data: Omit<TransferenciaInterna, 'id' | 'fecha_creacion'>) => {
    const response = await api.post<TransferenciaInterna>('/transferencias', data)
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
