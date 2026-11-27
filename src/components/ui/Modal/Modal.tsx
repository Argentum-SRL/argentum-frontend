import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/components/ui/icons'
import styles from './Modal.module.css'

export interface ModalStepDots {
  total: number
  current: number
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dialog' | 'sheet'
  showHeader?: boolean
  noPadding?: boolean
  className?: string
  autoHeight?: boolean
  ariaLabel?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  stepDots?: ModalStepDots
}

// Estado a nivel de módulo para modales apilados (bloqueo de scroll y Escape jerárquico)
let openModalCount = 0
const modalEscapeStack: Array<() => void> = []

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && modalEscapeStack.length > 0) {
      const topCloseHandler = modalEscapeStack[modalEscapeStack.length - 1]
      topCloseHandler()
      e.stopPropagation()
    }
  })
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  variant = 'dialog',
  showHeader = true,
  noPadding = false,
  className = '',
  autoHeight = false,
  ariaLabel,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  stepDots,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStartYRef = useRef(0)
  const isDraggingSheetRef = useRef(false)
  const sheetDeltaYRef = useRef(0)

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (variant !== 'sheet' || !closeOnOverlayClick || !e.isPrimary) return
    isDraggingSheetRef.current = true
    dragStartYRef.current = e.clientY
    sheetDeltaYRef.current = 0
    if (containerRef.current) {
      containerRef.current.classList.remove(styles.sheetSnapBack)
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheetRef.current || !containerRef.current) return
    const deltaY = Math.max(0, e.clientY - dragStartYRef.current)
    sheetDeltaYRef.current = deltaY
    containerRef.current.style.transform = `translate3d(0, ${deltaY}px, 0)`
  }

  const finishSheetDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (!isDraggingSheetRef.current) return
    isDraggingSheetRef.current = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }
    const el = containerRef.current
    const finalDelta = sheetDeltaYRef.current
    sheetDeltaYRef.current = 0
    if (!el) return

    if (!cancelled && finalDelta > 65) {
      el.style.transform = ''
      onClose()
    } else {
      el.classList.add(styles.sheetSnapBack)
      el.style.transform = ''
    }
  }

  useEffect(() => {
    if (!isOpen) return

    openModalCount++
    if (openModalCount === 1) {
      document.body.style.overflow = 'hidden'
    }

    if (closeOnEscape) {
      modalEscapeStack.push(onClose)
    }

    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.style.overflow = 'unset'
      }

      if (closeOnEscape) {
        const idx = modalEscapeStack.lastIndexOf(onClose)
        if (idx !== -1) {
          modalEscapeStack.splice(idx, 1)
        }
      }
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  const modalNode = (
    <div 
      className={`${styles.overlay} ${variant === 'sheet' ? styles.sheetOverlay : ''}`} 
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        ref={containerRef}
        className={`
          ${styles.container} 
          ${variant === 'sheet' ? styles.sheet : styles[size]} 
          ${noPadding ? styles.noPadding : ''} 
          ${autoHeight ? styles.modalAuto : ''}
          ${className}
        `} 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {/* Handle superior unificado para hojas inferiores (variant="sheet") */}
        {variant === 'sheet' && (
          <div
            className={styles.sheetHandle}
            aria-hidden="true"
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={(e) => finishSheetDrag(e, false)}
            onPointerCancel={(e) => finishSheetDrag(e, true)}
          />
        )}
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

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode
}

export default Modal
