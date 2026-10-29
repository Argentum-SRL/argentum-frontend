import { useState, useCallback } from 'react'
import { esPunteroFino } from '@/utils/foco'
import { AlertTriangle, Info } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { LunarLoader } from '@/components/ui/LunarLoader'
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
  size?: 'sm' | 'md' | 'lg'
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
  requireTyping,
  size = 'sm'
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = useCallback(() => {
    if (isLoading || isSubmitting) return
    setInputValue('')
    onClose()
  }, [isLoading, isSubmitting, onClose])

  const handleConfirm = useCallback(async () => {
    if (requireTyping && inputValue !== requireTyping) return
    if (isLoading || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onConfirm()
      setInputValue('')
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [requireTyping, inputValue, isLoading, isSubmitting, onConfirm, onClose])


  const isTypingCorrect = requireTyping ? inputValue === requireTyping : true
  const canConfirm = isTypingCorrect && !isLoading && !isSubmitting

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showHeader={false}
      size={size}
      autoHeight
    >
      <form 
        className={styles.modalContent}
        onSubmit={(e) => {
          e.preventDefault()
          if (canConfirm) handleConfirm()
        }}
        data-modal-frame
      >
        <div className={styles.modalHeader}>
          <div className={[styles.iconWrap, iconClassMap[variant]].join(' ')}>
            {iconMap[variant]}
          </div>
          
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={styles.modalBody} data-modal-stack>
          <p className={styles.description}>{description}</p>

          {requireTyping && (
            <div data-modal-block>
            <div className={styles.requireWrap} data-modal-field>
              <p className={styles.requireLabel}>Escribí <strong>{requireTyping}</strong> para confirmar</p>
              <input
                type="text"
                className={styles.requireInput}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="..."
                disabled={isLoading}
                autoFocus={esPunteroFino()}
              />
            </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className={[styles.confirmBtn, confirmBtnClassMap[variant]].join(' ')}
            disabled={!canConfirm}
            autoFocus={!requireTyping}
            data-modal-delete={variant === 'danger' ? '' : undefined}
          >
            {isLoading && <LunarLoader size={16} />}
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
