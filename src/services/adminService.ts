import api from './api'
import type {
  PaginatedUsuarios,
  UsuarioAdmin,
  FiltrosAdmin,
  AdminStats,
  MonitorWppResumen,
  PaginatedConversacionesMonitor,
} from '../types/admin'

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

  cambiarRolAdmin: async (id: string, isAdmin: boolean) => {
    const { data } = await api.patch<AdminResponseEnvelope<UsuarioAdmin>>(`/v1/admin/usuarios/${id}/admin`, {
      is_admin: isAdmin
    })
    return data
  },

  eliminarCuenta: async (id: string, emailConfirmacion: string) => {
    const { data } = await api.delete<AdminResponseEnvelope<null>>(`/v1/admin/usuarios/${id}`, {
      data: { email_confirmacion: emailConfirmacion }
    })
    return data
  },

  getStats: async () => {
    const { data } = await api.get<AdminResponseEnvelope<AdminStats>>('/v1/admin/stats')
    return data
  },

  refreshFeriados: async (anio?: number) => {
    const { data } = await api.post<AdminResponseEnvelope<{ success: boolean; cantidad: number; error?: string }>>(
      '/v1/admin/feriados/refresh',
      null,
      { params: anio ? { anio } : undefined }
    )
    return data
  },

  getScheduler: async (signal?: AbortSignal) => {
    const { data } = await api.get<SchedulerResponse>('/v1/admin/scheduler', { signal })
    return data
  },

  correrJob: async (jobId: string) => {
    const { data } = await api.post<{ mensaje: string }>(`/v1/admin/scheduler/${jobId}/correr`)
    return data
  },

  getMonitorWppResumen: async (dias: number, signal?: AbortSignal) => {
    const { data } = await api.get<MonitorWppResumen>('/v1/admin/monitor-wpp/resumen', {
      params: { dias },
      signal,
    })
    return data
  },

  getMonitorWppConversaciones: async (
    dias: number,
    categoria?: string,
    pagina?: number,
    signal?: AbortSignal
  ) => {
    const { data } = await api.get<PaginatedConversacionesMonitor>(
      '/v1/admin/monitor-wpp/conversaciones',
      {
        params: {
          dias,
          categoria: categoria || undefined,
          pagina: pagina || 1,
        },
        signal,
      }
    )
    return data
  }
}

export interface UltimaCorridaJob {
  inicio: string
  fin: string
  resultado: 'ok' | 'error' | 'omitido'
  duracion_ms: number
  detalle?: string | null
}

export interface JobSchedulerItem {
  job_id: string
  nombre: string
  que_hace: string
  periodo_esperado_minutos: number
  estado: 'Sin datos' | 'Al día' | 'Atrasado' | 'Falló'
  puede_correr_ahora: boolean
  proxima_corrida?: string | null
  ultima_corrida?: UltimaCorridaJob | null
  errores_24h: number
  omitidas_24h: number
}

export interface SchedulerResponse {
  scheduler_activo: boolean
  jobs: JobSchedulerItem[]
}

export default adminService

