import React, { useEffect } from 'react'
import { X } from '@/components/ui/icons'
import styles from './Modal.module.css'

export interface ModalStepDots {
  total: number
  current: number
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showHeader?: boolean
  noPadding?: boolean
  className?: string
  autoHeight?: boolean
  ariaLabel?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  stepDots?: ModalStepDots
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  showHeader = true,
  noPadding = false,
  className = '',
  autoHeight = false,
  ariaLabel,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  stepDots,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnEscape) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  return (
    <div 
      className={styles.overlay} 
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        className={`
          ${styles.container} 
          ${styles[size]} 
          ${noPadding ? styles.noPadding : ''} 
          ${autoHeight ? styles.modalAuto : ''}
          ${className}
        `} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {/* Indicador de pasos superior opcional (solo se muestra si total > 1) */}
        {stepDots && stepDots.total > 1 && (
          <div
            className={styles.stepDots}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={stepDots.total}
            aria-valuenow={stepDots.current + 1}
            aria-label={`Paso ${stepDots.current + 1} de ${stepDots.total}`}
          >
            {Array.from({ length: stepDots.total }, (_, idx) => (
              <span
                key={idx}
                className={`${styles.stepDot} ${
                  idx === stepDots.current ? styles.stepDotActive : styles.stepDotInactive
                }`}
              />
            ))}
          </div>
        )}
        {showHeader && (
          <div className={styles.header}>
            <div className={styles.title}>{title}</div>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
