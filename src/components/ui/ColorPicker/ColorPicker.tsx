import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from '@/components/ui/icons'
import styles from './ColorPicker.module.css'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#DC2626', '#EA580C', '#CA8A04', '#16A34A',
  '#0F766E', '#2563EB', '#7C3AED', '#DB2777',
]

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
  id?: string
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  className,
  id,
}) => {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const [prevValue, setPrevValue] = useState(value)
  const [hexInput, setHexInput] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  if (value !== prevValue) {
    setPrevValue(value)
    setHexInput(value)
  }

  // Detect mobile screen size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Lock body scroll on mobile bottom sheet open
  useEffect(() => {
    if (open && isMobile) {
      const origOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = origOverflow
      }
    }
  }, [open, isMobile])

  // Calculate desktop popover position
  const calcPosition = useCallback(() => {
    if (isMobile || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const panelHeight = 220
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const top = spaceBelow >= panelHeight || spaceBelow >= spaceAbove
      ? rect.bottom + 4
      : rect.top - panelHeight - 4
    let left = rect.left
    const panelWidth = 240
    if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8
    if (left < 8) left = 8
    setPanelStyle({ top, left, width: panelWidth })
  }, [isMobile])

  useLayoutEffect(() => {
    if (open && !isMobile) calcPosition()
  }, [open, isMobile, calcPosition])

  useEffect(() => {
    if (!open || isMobile) return
    const handleScrollOrResize = () => calcPosition()
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open, isMobile, calcPosition])

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Desktop click outside
  useEffect(() => {
    if (!open || isMobile) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, isMobile])

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex)

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim()
    if (!val.startsWith('#')) val = '#' + val
    setHexInput(val)
    if (isValidHex(val)) onChange(val)
  }

  const handlePresetClick = (c: string) => {
    onChange(c)
    setHexInput(c)
  }

  const renderContent = (size: 'mobile' | 'desktop') => (
    <>
      <div className={styles.presetGrid}>
        {PRESET_COLORS.map(c => {
          const isSelected = value.toLowerCase() === c.toLowerCase()
          return (
            <button
              key={c}
              type="button"
              className={[
                styles.presetBtn,
                isSelected ? styles.presetBtnActive : '',
              ].filter(Boolean).join(' ')}
              style={{ backgroundColor: c }}
              onClick={() => handlePresetClick(c)}
              aria-label={`Color ${c}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <Check
                  size={size === 'mobile' ? 14 : 12}
                  strokeWidth={3}
                  className={styles.checkIcon}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.separator} />

      <div className={styles.hexRow}>
        <div 
          className={styles.hexPreview} 
          style={{ backgroundColor: isValidHex(hexInput) ? hexInput : value }} 
        />
        <input
          type="text"
          className={styles.hexInput}
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          spellCheck={false}
          placeholder="#000000"
          aria-label="Código hexadecimal"
        />
      </div>

      <button
        type="button"
        className={styles.doneBtn}
        onClick={() => setOpen(false)}
      >
        Listo
      </button>
    </>
  )

  return (
    <div
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      ref={wrapperRef}
    >
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      
      <button
        id={id}
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(prev => !prev)}
        aria-label={label ? `Elegir ${label}` : 'Elegir color'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span 
          className={styles.swatch} 
          style={{ backgroundColor: value }} 
        />
        <span className={styles.hexDisplay}>{value.toUpperCase()}</span>
      </button>

      {/* Desktop Popover */}
      {open && !isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div 
            ref={panelRef} 
            className={styles.panel}
            style={{
              top: panelStyle.top !== undefined ? `${panelStyle.top}px` : undefined,
              left: panelStyle.left !== undefined ? `${panelStyle.left}px` : undefined,
              width: panelStyle.width !== undefined ? `${panelStyle.width}px` : 240,
            }}
            role="dialog"
            aria-modal="false"
          >
            <div className={styles.panelInner}>
              {renderContent('desktop')}
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Bottom Sheet */}
      {open && isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.bottomSheetOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
            role="presentation"
          >
            <div
              className={styles.bottomSheet}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={label || 'Seleccionar color'}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.dragHandle} aria-hidden="true" />
              
              <div className={styles.bottomSheetHeader}>
                <span className={styles.bottomSheetTitle}>{label || 'Color distintivo'}</span>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar selector de color"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.contentWrap}>
                {renderContent('mobile')}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default ColorPicker
