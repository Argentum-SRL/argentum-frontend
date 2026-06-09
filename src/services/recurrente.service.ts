import api from './api'
import type { TransaccionRecurrente } from '@/types'

const recurrenteService = {
  getRecurrentes: async (signal?: AbortSignal) => {
    const response = await api.get<TransaccionRecurrente[]>('/recurrentes', { signal })
    return response.data
  },

  getRecurrente: async (id: string, signal?: AbortSignal) => {
    const response = await api.get<TransaccionRecurrente>(`/recurrentes/${id}`, { signal })
    return response.data
  },

  createRecurrente: async (data: Omit<TransaccionRecurrente, 'id' | 'estado' | 'fecha_creacion'>) => {
    const response = await api.post<TransaccionRecurrente>('/recurrentes', data)
    return response.data
  },

  updateRecurrente: async (id: string, data: Partial<TransaccionRecurrente>) => {
    const response = await api.patch<TransaccionRecurrente>(`/recurrentes/${id}`, data)
    return response.data
  },

  deleteRecurrente: async (id: string) => {
    await api.delete(`/recurrentes/${id}`)
  },

  pausarRecurrente: async (id: string) => {
    const response = await api.post<TransaccionRecurrente>(`/recurrentes/${id}/pausar`)
    return response.data
  },

  reanudarRecurrente: async (id: string) => {
    const response = await api.post<TransaccionRecurrente>(`/recurrentes/${id}/reanudar`)
    return response.data
  }
}

export default recurrenteService
