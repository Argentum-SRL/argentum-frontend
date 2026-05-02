import { useContext } from 'react'
import { ToastContext } from '@/context/ToastContext'

/**
 * HOOK CANÓNICO DE ARGENTUM PARA MOSTRAR NOTIFICACIONES.
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
