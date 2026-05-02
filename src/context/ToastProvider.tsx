import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastItem } from './ToastContext'
import { Toast } from '@/components/ui/Toast/Toast'
import styles from './ToastProvider.module.css'

/**
 * PROVEEDOR CANÓNICO DE ARGENTUM PARA NOTIFICACIONES (TOASTS).
 * Ningún módulo futuro debe implementar su propio sistema de notificaciones local.
 */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }].slice(-3)) // Max 3 toasts
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.itemWrap}>
            <Toast
              message={toast.message}
              type={toast.type === 'info' ? 'success' : toast.type}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
