import { useContext } from 'react'
import { NotificacionContext, type NotificacionContextValue } from '@/context/NotificacionContextBase'

export function useNotificaciones(): NotificacionContextValue {
  const ctx = useContext(NotificacionContext)
  if (!ctx) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionProvider')
  }
  return ctx
}
