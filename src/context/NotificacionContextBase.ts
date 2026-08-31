import { createContext } from 'react'
import type { Notificacion, ConfiguracionNotificacion } from '@/types'

export interface DataUpdateEvent {
  entidad: string
  timestamp: number
}

export interface NotificacionContextValue {
  notificaciones: Notificacion[]
  unreadCount: number
  config: ConfiguracionNotificacion | null
  isLoading: boolean
  lastDataUpdate: DataUpdateEvent | null
  fetchNotifications: (signal?: AbortSignal) => Promise<void>
  fetchUnreadCount: (signal?: AbortSignal) => Promise<void>
  fetchConfig: (signal?: AbortSignal) => Promise<void>
  updateConfig: (payload: Partial<ConfiguracionNotificacion>) => Promise<void>
  marcarLeida: (id: string) => Promise<void>
  marcarNoLeida: (id: string) => Promise<void>
  silenciar: (id: string, horas?: number) => Promise<void>
  eliminar: (id: string) => Promise<void>
  marcarTodasLeidas: () => Promise<void>
}

export const NotificacionContext = createContext<NotificacionContextValue | null>(null)
