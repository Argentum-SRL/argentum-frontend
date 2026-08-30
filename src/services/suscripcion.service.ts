import api from './api'
import type { Suscripcion, SuscripcionCreate, SuscripcionUpdate, TotalMensualSuscripciones, HistorialSuscripcion } from '../types'

const suscripcionService = {
  getSuscripciones: async (estado?: string, signal?: AbortSignal): Promise<Suscripcion[]> => {
    const params = estado ? { estado } : {}
    const { data } = await api.get<Suscripcion[]>('/suscripciones', { params, signal })
    return data
  },

  getTotalMensual: async (signal?: AbortSignal): Promise<TotalMensualSuscripciones> => {
    const { data } = await api.get<TotalMensualSuscripciones>('/suscripciones/total-mensual', { signal })
    return data
  },

  getSuscripcion: async (id: string, signal?: AbortSignal): Promise<Suscripcion> => {
    const { data } = await api.get<Suscripcion>(`/suscripciones/${id}`, { signal })
    return data
  },

  createSuscripcion: async (data: SuscripcionCreate): Promise<Suscripcion> => {
    const { data: res } = await api.post<Suscripcion>('/suscripciones', data)
    return res
  },

  updateSuscripcion: async (id: string, data: SuscripcionUpdate): Promise<Suscripcion> => {
    const { data: res } = await api.put<Suscripcion>(`/suscripciones/${id}`, data)
    return res
  },

  actualizarPrecio: async (id: string, data: { monto: number; moneda: string; vigente_desde: string }): Promise<HistorialSuscripcion> => {
    const { data: res } = await api.post<HistorialSuscripcion>(`/suscripciones/${id}/precio`, data)
    return res
  },

  pausarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/pausar`)
    return data
  },

  reactivarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/reactivar`)
    return data
  },

  cancelarSuscripcion: async (id: string): Promise<Suscripcion> => {
    const { data } = await api.post<Suscripcion>(`/suscripciones/${id}/cancelar`)
    return data
  },

  deleteSuscripcion: async (id: string): Promise<void> => {
    await api.delete(`/suscripciones/${id}`)
  }
}

export default suscripcionService
