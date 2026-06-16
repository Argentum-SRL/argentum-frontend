import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './DateInput.module.css'

// Formato interno (lo que se almacena y comunica al padre)
const INTERNAL_FORMAT = 'yyyy-MM-dd'
// Formato de display (lo que ve el usuario)
const DISPLAY_FORMAT = 'dd/MM/yyyy'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string | null
  disabled?: boolean
  className?: string
  min?: string
  max?: string
  id?: string
  name?: string
  required?: boolean
  placeholder?: string
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  label,
  error,
  disabled,
  className,
  min,
  max,
  id,
  name,
  required,
  placeholder = 'dd/mm/aaaa',
}) => {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Detectar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Calcular posición del popover (solo desktop)
  const calcPosition = useCallback(() => {
    if (isMobile || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const popoverHeight = 340 // altura estimada del calendario
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const top = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove
      ? rect.bottom + 6
      : rect.top - popoverHeight - 6
    
    // Calcular left y asegurar que no se salga de la pantalla
    let left = rect.left
    const popoverWidth = 280
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8
    }
    if (left < 8) left = 8

    setPopoverStyle({ top, left })
  }, [isMobile])

  useEffect(() => {
    if (open) calcPosition()
  }, [open, calcPosition])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Parsear value (YYYY-MM-DD) a Date
  const selectedDate = value
    ? parse(value, INTERNAL_FORMAT, new Date())
    : undefined
  const validSelected = selectedDate && isValid(selectedDate) ? selectedDate : undefined

  // Parsear min/max
  const fromDate = min ? parse(min, INTERNAL_FORMAT, new Date()) : undefined
  const toDate = max ? parse(max, INTERNAL_FORMAT, new Date()) : undefined

  const displayValue = validSelected
    ? format(validSelected, DISPLAY_FORMAT)
    : ''

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, INTERNAL_FORMAT))
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  const disabledMatchers = [];
  if (fromDate) disabledMatchers.push({ before: fromDate });
  if (toDate) disabledMatchers.push({ after: toDate });

  const dayPickerElement = (
    <DayPicker
      mode="single"
      selected={validSelected}
      onSelect={handleSelect}
      locale={es}
      disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
      startMonth={fromDate}
      endMonth={toDate}
      defaultMonth={validSelected}
      classNames={{
        root: styles.rdpRoot,
        months: styles.rdpMonths,
        month: styles.rdpMonth,
        month_caption: styles.rdpCaption,
        caption_label: styles.rdpCaptionLabel,
        nav: styles.rdpNav,
        button_previous: styles.rdpNavButton,
        button_next: styles.rdpNavButton,
        month_grid: styles.rdpTable,
        weekdays: styles.rdpHeadRow,
        weekday: styles.rdpHeadCell,
        week: styles.rdpRow,
        day: styles.rdpCell,
        day_button: styles.rdpDay,
        selected: styles.rdpDaySelected,
        today: styles.rdpDayToday,
        outside: styles.rdpDayOutside,
        disabled: styles.rdpDayDisabled,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft size={16} />
          }
          if (props.orientation === 'right') {
            return <ChevronRight size={16} />
          }
          return <></>
        }
      }}
    />
  )

  const popover = open ? (
    isMobile ? (
      // Mobile: overlay centrado
      <div className={styles.mobileOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
        <div className={styles.mobileCalendarWrap} ref={popoverRef}>
          {dayPickerElement}
          <div className={styles.calendarFooter}>
            {validSelected && (
              <button className={styles.clearBtn} onClick={handleClear} type="button">
                Borrar
              </button>
            )}
            <button className={styles.todayBtn} onClick={() => handleSelect(new Date())} type="button">
              Hoy
            </button>
          </div>
        </div>
      </div>
    ) : (
      // Desktop: popover fixed posicionado
      <div
        ref={popoverRef}
        className={styles.popover}
        style={popoverStyle}
      >
        {dayPickerElement}
        <div className={styles.calendarFooter}>
          {validSelected && (
            <button className={styles.clearBtn} onClick={handleClear} type="button">
              Borrar
            </button>
          )}
          <button className={styles.todayBtn} onClick={() => handleSelect(new Date())} type="button">
            Hoy
          </button>
        </div>
      </div>
    )
  ) : null

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.inputWrap}>
        <input
          id={id}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onClick={() => !disabled && setOpen(prev => !prev)}
          className={[
            styles.input,
            error ? styles.inputError : '',
            disabled ? styles.inputDisabled : '',
          ].filter(Boolean).join(' ')}
        />
        {name && <input type="hidden" name={name} value={value} required={required} />}
        <span className={[styles.icon, error ? styles.iconError : ''].filter(Boolean).join(' ')}>
          <Calendar size={16} />
        </span>
      </div>
      {error && (
        <span className={styles.errorMsg}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
      {popover}
    </div>
  )
}

export default DateInput
