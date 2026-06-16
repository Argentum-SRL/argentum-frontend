import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
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

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    panelElRef.current = node
    if (node && !isMobile && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      const panelHeight = Math.min(options.length * 44 + 8, 280)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const top = spaceBelow >= panelHeight || spaceBelow >= spaceAbove
        ? rect.bottom + 4
        : rect.top - panelHeight - 4

      let left = rect.left
      const panelWidth = rect.width
      if (left + panelWidth > window.innerWidth - 8) {
        left = window.innerWidth - panelWidth - 8
      }
      if (left < 8) left = 8

      node.style.top = `${top}px`
      node.style.left = `${left}px`
      node.style.width = `${rect.width}px`
    }
  }, [isMobile, options.length])

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
    <div className={styles.optionsList}>
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
      <div
        className={styles.mobileOverlay}
        onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        <div className={styles.mobilePanelWrap} ref={panelRef}>
          {label && <div className={styles.mobilePanelTitle}>{label}</div>}
          {optionsList}
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        className={styles.panel}
      >
        {optionsList}
      </div>
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
