import api from './api'
import type { Notificacion, ConfiguracionNotificacion } from '@/types'

const notificacionService = {
  list: async (
    params?: {
      solo_no_leidas?: boolean
      limite?: number
      offset?: number
    },
    signal?: AbortSignal
  ): Promise<Notificacion[]> => {
    const { data } = await api.get<Notificacion[]>('/notificaciones', {
      params,
      signal,
    })
    return data
  },

  getContador: async (signal?: AbortSignal): Promise<number> => {
    const { data } = await api.get<{ contador: number }>('/notificaciones/contador', { signal })
    return data.contador
  },

  marcarLeida: async (id: string): Promise<Notificacion> => {
    const { data } = await api.put<Notificacion>(`/notificaciones/${id}/leer`)
    return data
  },

  marcarNoLeida: async (id: string): Promise<Notificacion> => {
    const { data } = await api.put<Notificacion>(`/notificaciones/${id}/desleer`)
    return data
  },

  silenciar: async (id: string, horas = 24): Promise<Notificacion> => {
    const { data } = await api.put<Notificacion>(`/notificaciones/${id}/silenciar`, null, {
      params: { horas },
    })
    return data
  },

  delete: async (id: string): Promise<boolean> => {
    await api.delete(`/notificaciones/${id}`)
    return true
  },

  marcarTodasLeidas: async (): Promise<boolean> => {
    await api.post('/notificaciones/leer-todas')
    return true
  },

  getConfig: async (signal?: AbortSignal): Promise<ConfiguracionNotificacion> => {
    const { data } = await api.get<ConfiguracionNotificacion>('/notificaciones/configuracion', { signal })
    return data
  },

  updateConfig: async (payload: Partial<ConfiguracionNotificacion>): Promise<ConfiguracionNotificacion> => {
    const { data } = await api.put<ConfiguracionNotificacion>('/notificaciones/configuracion', payload)
    return data
  },
}

export default notificacionService
