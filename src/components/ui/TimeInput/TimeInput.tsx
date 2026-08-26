import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from '@ncdai/react-wheel-picker'
import '@ncdai/react-wheel-picker/style.css'
import styles from './TimeInput.module.css'

const WHEEL_DRAG_SENSITIVITY = 6
const WHEEL_SCROLL_SENSITIVITY = 10
const VIEWPORT_MARGIN = 12

const triggerHapticFeedback = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12)
    } catch {
      // Ignorar si no está soportado
    }
  }
}

interface TimeInputProps {
  value: string // Formato "HH:mm"
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  ariaLabel?: string
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  disabled,
  className,
  id,
  name,
  ariaLabel = 'Seleccionar horario',
}) => {
  // Parsear valor inicial "HH:mm"
  const [horaNum, minutoNum] = useMemo(() => {
    if (!value || !value.includes(':')) return [9, 0]
    const parts = value.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    return [isNaN(h) ? 9 : Math.max(0, Math.min(23, h)), isNaN(m) ? 0 : Math.max(0, Math.min(59, m))]
  }, [value])

  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024)
  const [selectedHour, setSelectedHour] = useState<number>(horaNum)
  const [selectedMinute, setSelectedMinute] = useState<number>(minutoNum)
  const [prevValue, setPrevValue] = useState(value)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sincronizar estado interno si cambia externamente (patrón recomendado por React sin useEffect)
  if (value !== prevValue) {
    setPrevValue(value)
    setSelectedHour(horaNum)
    setSelectedMinute(minutoNum)
  }

  // Detectar resize mobile vs desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Posicionamiento dinámico del popover en desktop
  const updatePosition = useCallback(() => {
    if (isMobile || !popoverRef.current || !wrapperRef.current) return

    const triggerRect = wrapperRef.current.getBoundingClientRect()
    const popover = popoverRef.current
    const popoverWidth = 240
    const popoverHeight = 270

    let left = triggerRect.left
    if (left + popoverWidth > window.innerWidth - VIEWPORT_MARGIN) {
      left = triggerRect.right - popoverWidth
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN

    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN
    let top: number
    if (spaceBelow >= popoverHeight || spaceBelow >= 200) {
      top = triggerRect.bottom + 6
    } else {
      top = triggerRect.top - popoverHeight - 6
    }

    popover.style.top = `${top}px`
    popover.style.left = `${left}px`
    popover.style.visibility = 'visible'
  }, [isMobile])

  useLayoutEffect(() => {
    if (open && !isMobile) {
      updatePosition()
    }
  }, [open, isMobile, updatePosition])

  // Scroll and resize listeners
  useEffect(() => {
    if (!open || isMobile) return
    const handleScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open, isMobile, updatePosition])

  // Click outside para cerrar
  useEffect(() => {
    if (!open || isMobile) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, isMobile])

  // Generar opciones de horas (00 a 23)
  const hourOptions: WheelPickerOption<number>[] = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: String(i).padStart(2, '0'),
      textValue: String(i).padStart(2, '0'),
    }))
  }, [])

  // Generar opciones de minutos (00 a 59 con intervalos de 5 o 1)
  const minuteOptions: WheelPickerOption<number>[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: i,
      label: String(i).padStart(2, '0'),
      textValue: String(i).padStart(2, '0'),
    }))
  }, [])

  const commitChange = useCallback((h: number, m: number) => {
    setSelectedHour(h)
    setSelectedMinute(m)
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    onChange(formatted)
  }, [onChange])

  const handleHourChange = useCallback((h: number) => {
    triggerHapticFeedback()
    commitChange(h, selectedMinute)
  }, [commitChange, selectedMinute])

  const handleMinuteChange = useCallback((m: number) => {
    triggerHapticFeedback()
    commitChange(selectedHour, m)
  }, [commitChange, selectedHour])

  const handleNow = () => {
    const now = new Date()
    commitChange(now.getHours(), now.getMinutes())
    setOpen(false)
  }

  const displayText = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`

  const pickerContent = (
    <div className={styles.wheelPickerContainer}>
      <div className={styles.wheelHeaderLabels}>
        <span className={styles.wheelHeaderLabel}>Hora</span>
        <span className={styles.wheelHeaderLabel}>Minutos</span>
      </div>

      <WheelPickerWrapper className={styles.wheelWrapper}>
        <WheelPicker
          value={selectedHour}
          onValueChange={handleHourChange}
          options={hourOptions}
          dragSensitivity={WHEEL_DRAG_SENSITIVITY}
          scrollSensitivity={WHEEL_SCROLL_SENSITIVITY}
          optionItemHeight={38}
          visibleCount={15}
          classNames={{
            optionItem: styles.wheelOptionItem,
            highlightWrapper: styles.wheelHighlightWrapper,
            highlightItem: styles.wheelHighlightItem,
          }}
        />
        <WheelPicker
          value={selectedMinute}
          onValueChange={handleMinuteChange}
          options={minuteOptions}
          dragSensitivity={WHEEL_DRAG_SENSITIVITY}
          scrollSensitivity={WHEEL_SCROLL_SENSITIVITY}
          optionItemHeight={38}
          visibleCount={15}
          classNames={{
            optionItem: styles.wheelOptionItem,
            highlightWrapper: styles.wheelHighlightWrapper,
            highlightItem: styles.wheelHighlightItem,
          }}
        />
      </WheelPickerWrapper>

      <div className={styles.pickerFooter}>
        <button type="button" className={styles.nowBtn} onClick={handleNow}>
          Ahora
        </button>
        <button type="button" className={styles.doneBtn} onClick={() => setOpen(false)}>
          Listo
        </button>
      </div>
    </div>
  )

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
      <div className={styles.inputWrap}>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          disabled={disabled}
          className={[styles.input, disabled ? styles.inputDisabled : ''].filter(Boolean).join(' ')}
          onClick={() => !disabled && setOpen((prev) => !prev)}
        >
          {displayText}
        </button>
        <span className={styles.icon}>
          <Clock size={16} />
        </span>
      </div>

      {name && <input type="hidden" name={name} value={displayText} />}

      {/* Popover Desktop */}
      {open && !isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div ref={popoverRef} className={styles.popover}>
            {pickerContent}
          </div>,
          document.body
        )}

      {/* Bottom Sheet Mobile */}
      {open && isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.bottomSheetOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={styles.bottomSheet}>
              <div className={styles.bottomSheetHandle} />
              <div className={styles.bottomSheetContent}>
                {pickerContent}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
