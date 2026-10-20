import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, AlertCircle } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import styles from './SelectInput.module.css'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SelectInputProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  placeholder?: string
  error?: string | null
  disabled?: boolean
  className?: string
  id?: string
}

export const SelectInput: React.FC<SelectInputProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seleccionar...',
  error,
  disabled,
  className,
  id,
}) => {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelElRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const updatePosition = useCallback(() => {
    if (isMobile || !wrapperRef.current || !panelElRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const panelHeight = Math.min(options.length * 44 + 8, 280)
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const top = spaceBelow >= panelHeight || spaceBelow >= spaceAbove
      ? rect.bottom + 4
      : Math.max(8, rect.top - panelHeight - 4)

    let left = rect.left
    const panelWidth = rect.width
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8
    }
    if (left < 8) left = 8

    panelElRef.current.style.top = `${top}px`
    panelElRef.current.style.left = `${left}px`
    panelElRef.current.style.width = `${rect.width}px`
  }, [isMobile, options.length])

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    panelElRef.current = node
    if (node) {
      updatePosition()
    }
  }, [updatePosition])

  useEffect(() => {
    if (!open) return
    const handleScrollOrResize = () => {
      updatePosition()
    }
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        panelElRef.current && !panelElRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedOption = options.find(o => o.value === value)
  const displayValue = selectedOption?.label ?? ''

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    setOpen(false)
  }

  const optionsList = (
    <div className={styles.optionsList} data-modal-block>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={[
            styles.option,
            opt.value === value ? styles.optionSelected : '',
          ].filter(Boolean).join(' ')}
          onClick={() => handleSelect(opt.value)}
        >
          {opt.icon && <span className={styles.optionIcon}>{opt.icon}</span>}
          <span className={styles.optionLabel}>{opt.label}</span>
          {opt.value === value && (
            <span className={styles.optionCheck}>
              <Check size={14} />
            </span>
          )}
        </button>
      ))}
    </div>
  )

  const panel = open ? (
    isMobile ? (
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        variant="sheet"
        title={label || 'Seleccionar opción'}
        size="sm"
      >
        {optionsList}
      </Modal>
    ) : (
      typeof document !== 'undefined' ? createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
        >
          {optionsList}
        </div>,
        document.body
      ) : null
    )
  ) : null

  return (
    <div
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      ref={wrapperRef}
    >
      {label && (
        <label htmlFor={id} className={styles.label}>{label}</label>
      )}
      <div className={styles.triggerWrap}>
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(prev => !prev)}
          className={[
            styles.trigger,
            error ? styles.triggerError : '',
            disabled ? styles.triggerDisabled : '',
            !displayValue ? styles.triggerPlaceholder : '',
          ].filter(Boolean).join(' ')}
        >
          {displayValue || placeholder}
        </button>
        <span className={[
          styles.chevron,
          open ? styles.chevronOpen : '',
          error ? styles.chevronError : '',
        ].filter(Boolean).join(' ')}>
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <span className={styles.errorMsg}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
      {panel}
    </div>
  )
}

export default SelectInput
