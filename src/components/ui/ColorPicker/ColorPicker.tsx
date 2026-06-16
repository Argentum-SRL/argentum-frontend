import React, { useState, useRef, useEffect, useCallback } from 'react'
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  useEffect(() => {
    if (open) calcPosition()
  }, [open, calcPosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex)

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (!val.startsWith('#')) val = '#' + val
    setHexInput(val)
    if (isValidHex(val)) onChange(val)
  }

  const handlePresetClick = (c: string) => {
    onChange(c)
    setHexInput(c)
  }

  const panelContent = (
    <>
      <div className={styles.presetGrid}>
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={[
              styles.presetBtn,
              value.toLowerCase() === c.toLowerCase() ? styles.presetBtnActive : ''
            ].filter(Boolean).join(' ')}
            ref={el => { if (el) el.style.backgroundColor = c }}
            onClick={() => handlePresetClick(c)}
            aria-label={c}
          />
        ))}
      </div>
      <div className={styles.separator} />
      <div className={styles.hexRow}>
        <div 
          className={styles.hexPreview} 
          ref={el => { if (el) el.style.backgroundColor = isValidHex(hexInput) ? hexInput : value }} 
        />
        <input
          type="text"
          className={styles.hexInput}
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          spellCheck={false}
          placeholder="#000000"
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

  const panel = open ? (
    isMobile ? (
      <div
        className={styles.mobileOverlay}
        onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        <div className={styles.mobilePanelWrap} ref={panelRef}>
          {label && <div className={styles.mobilePanelTitle}>{label}</div>}
          <div className={styles.panelInner}>{panelContent}</div>
        </div>
      </div>
    ) : (
      <div 
        ref={el => {
          panelRef.current = el
          if (el) {
            if (panelStyle.top !== undefined) el.style.top = `${panelStyle.top}px`
            if (panelStyle.left !== undefined) el.style.left = `${panelStyle.left}px`
            if (panelStyle.width !== undefined) el.style.width = `${panelStyle.width}px`
          }
        }} 
        className={styles.panel}
      >
        {panelContent}
      </div>
    )
  ) : null

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
        aria-label="Elegir color"
      >
        <span 
          className={styles.swatch} 
          ref={el => { if (el) el.style.backgroundColor = value }} 
        />
        <span className={styles.hexDisplay}>{value.toUpperCase()}</span>
      </button>
      {panel}
    </div>
  )
}

export default ColorPicker
