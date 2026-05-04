import React, { useEffect } from 'react'
import styles from './Modal.module.css'

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
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
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
        {showHeader && (
          <div className={styles.header}>
            <div className={styles.title}>{title}</div>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              &times;
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
