import { createContext } from 'react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
