import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import styles from './ConfirmModal.module.css'

/**
 * COMPONENTE CANÓNICO DE ARGENTUM PARA CONFIRMACIONES.
 * Ningún módulo futuro debe implementar su propio modal de confirmación o usar window.confirm().
 */

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
  requireTyping?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  isLoading = false,
  requireTyping
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('')

  const handleClose = useCallback(() => {
    if (isLoading) return
    setInputValue('')
    onClose()
  }, [isLoading, onClose])

  const handleConfirm = useCallback(async () => {
    if (requireTyping && inputValue !== requireTyping) return
    if (isLoading) return
    await onConfirm()
  }, [requireTyping, inputValue, isLoading, onConfirm])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const isTypingCorrect = requireTyping ? inputValue === requireTyping : true
  const canConfirm = isTypingCorrect && !isLoading

  const iconMap = {
    danger: <AlertTriangle size={32} />,
    warning: <AlertTriangle size={32} />,
    default: <Info size={32} />
  }

  const iconClassMap = {
    danger: styles.iconWrapDanger,
    warning: styles.iconWrapWarning,
    default: styles.iconWrapDefault
  }

  const confirmBtnClassMap = {
    danger: styles.confirmBtnDanger,
    warning: styles.confirmBtnWarning,
    default: styles.confirmBtnDefault
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={[styles.iconWrap, iconClassMap[variant]].join(' ')}>
          {iconMap[variant]}
        </div>
        
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        {requireTyping && (
          <div className={styles.requireWrap}>
            <p className={styles.requireLabel}>Escribí <strong>{requireTyping}</strong> para confirmar</p>
            <input
              type="text"
              className={styles.requireInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="..."
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={[styles.confirmBtn, confirmBtnClassMap[variant]].join(' ')}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isLoading && <div className={styles.spinner} />}
            {confirmLabel}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
