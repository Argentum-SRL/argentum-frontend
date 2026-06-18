import api from './api'
import type { PaginatedUsuarios, UsuarioAdmin, FiltrosAdmin, AdminStats } from '../types/admin'

export interface AdminResponseEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

const adminService = {
  getUsuarios: async (params: FiltrosAdmin, signal?: AbortSignal) => {
    const { data } = await api.get<AdminResponseEnvelope<PaginatedUsuarios>>('/v1/admin/usuarios', {
      params,
      signal
    })
    return data
  },

  getUsuario: async (id: string, signal?: AbortSignal) => {
    const { data } = await api.get<AdminResponseEnvelope<UsuarioAdmin>>(`/v1/admin/usuarios/${id}`, { signal })
    return data
  },

  cambiarEstado: async (id: string, isActive: boolean) => {
    const { data } = await api.patch<AdminResponseEnvelope<UsuarioAdmin>>(`/v1/admin/usuarios/${id}/estado`, {
      is_active: isActive
    })
    return data
  },

  resetPassword: async (id: string) => {
    const { data } = await api.post<AdminResponseEnvelope<null>>(`/v1/admin/usuarios/${id}/reset-password`)
    return data
  },

  revocarSesiones: async (id: string) => {
    const { data } = await api.post<AdminResponseEnvelope<null>>(`/v1/admin/usuarios/${id}/revocar-sesiones`)
    return data
  },

  desconectarWpp: async (id: string) => {
    const { data } = await api.post<AdminResponseEnvelope<UsuarioAdmin>>(`/v1/admin/usuarios/${id}/desconectar-wpp`)
    return data
  },

  resetearOnboarding: async (id: string) => {
    const { data } = await api.post<AdminResponseEnvelope<UsuarioAdmin>>(`/v1/admin/usuarios/${id}/resetear-onboarding`, {
      confirmar: true
    })
    return data
  },

  getStats: async () => {
    const { data } = await api.get<AdminResponseEnvelope<AdminStats>>('/v1/admin/stats')
    return data
  }
}

export default adminService
