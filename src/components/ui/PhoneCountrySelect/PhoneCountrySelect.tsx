import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import styles from './PhoneCountrySelect.module.css'

export interface Country {
  codigo: string
  bandera: string
  nombre?: string
}

interface PhoneCountrySelectProps {
  value: string
  onChange: (value: string) => void
  countries: Country[]
  disabled?: boolean
}

export const PhoneCountrySelect: React.FC<PhoneCountrySelectProps> = ({
  value,
  onChange,
  countries,
  disabled,
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
      const panelHeight = Math.min(countries.length * 44 + 8, 280)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const top = spaceBelow >= panelHeight || spaceBelow >= spaceAbove
        ? rect.bottom + 4
        : rect.top - panelHeight - 4
      let left = rect.left
      const panelWidth = 200
      if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8
      if (left < 8) left = 8

      node.style.top = `${top}px`
      node.style.left = `${left}px`
      node.style.width = `${panelWidth}px`
    }
  }, [isMobile, countries.length])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        panelElRef.current && !panelElRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = countries.find(c => c.codigo === value)

  const optionsList = (
    <div className={styles.optionsList}>
      {countries.map(c => (
        <button
          key={c.codigo}
          type="button"
          className={[styles.option, c.codigo === value ? styles.optionSelected : ''].filter(Boolean).join(' ')}
          onClick={() => { onChange(c.codigo); setOpen(false) }}
        >
          <span className={styles.optionFlag}>{c.bandera}</span>
          <span className={styles.optionCode}>{c.codigo}</span>
          {c.nombre && <span className={styles.optionName}>{c.nombre}</span>}
          {c.codigo === value && <Check size={13} className={styles.optionCheck} />}
        </button>
      ))}
    </div>
  )

  const panel = open ? (
    isMobile ? (
      <div className={styles.mobileOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
        <div className={styles.mobilePanelWrap} ref={panelRef}>
          <div className={styles.mobilePanelTitle}>Código de país</div>
          {optionsList}
        </div>
      </div>
    ) : (
      <div ref={panelRef} className={styles.panel}>
        {optionsList}
      </div>
    )
  ) : null

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={[styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
      >
        <span className={styles.flag}>{selected?.bandera}</span>
        <span className={styles.code}>{selected?.codigo}</span>
        <ChevronDown size={13} className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')} />
      </button>
      {panel}
    </div>
  )
}

export default PhoneCountrySelect
