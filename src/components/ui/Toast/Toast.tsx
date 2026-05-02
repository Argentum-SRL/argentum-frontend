import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
  duration?: number // ms, default 5000
}

export function Toast({ message, type = 'success', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className={[styles.toast, type === 'error' ? styles.toastError : ''].filter(Boolean).join(' ')}>
      {type === 'success' ? (
        <Check size={16} strokeWidth={2} className={styles.toastIcon} />
      ) : (
        <X size={16} strokeWidth={2} className={styles.toastIconError} />
      )}
      <span>{message}</span>
    </div>
  )
}
