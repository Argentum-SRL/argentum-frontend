import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format, parse, isValid, getDaysInMonth, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { Calendar, AlertCircle } from 'lucide-react'
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from '@ncdai/react-wheel-picker'
import '@ncdai/react-wheel-picker/style.css'
import styles from './DateInput.module.css'

// Formato interno (lo que se almacena y comunica al padre)
const INTERNAL_FORMAT = 'yyyy-MM-dd'
// Formato de display (lo que ve el usuario)
const DISPLAY_FORMAT = 'dd/MM/yyyy'

// Sensibilidad de interacción para los tres wheels
const WHEEL_DRAG_SENSITIVITY = 6
const WHEEL_SCROLL_SENSITIVITY = 10

// Margen de seguridad contra bordes del viewport
const VIEWPORT_MARGIN = 12

/**
 * Dispara feedback háptico sutil (tick de 12ms) al mover un wheel.
 * NOTA: Safari en iOS y macOS no implementa la Vibration API (navigator.vibrate),
 * por lo que el feedback táctil solo se activará en navegadores compatibles (ej: Chromium/Android).
 */
const triggerHapticFeedback = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12)
    } catch {
      // Silenciar errores en entornos donde la vibración esté bloqueada
    }
  }
}

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  variant?: 'default' | 'compact'
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
  variant = 'default',
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
  // Parsear min/max
  const fromDate = useMemo(() => (min ? parse(min, INTERNAL_FORMAT, new Date()) : undefined), [min])
  const toDate = useMemo(() => (max ? parse(max, INTERNAL_FORMAT, new Date()) : undefined), [max])

  // Parsear value (YYYY-MM-DD) a Date
  const parsedValueDate = useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, INTERNAL_FORMAT, new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 1024)
  const [inputText, setInputText] = useState(parsedValueDate ? format(parsedValueDate, DISPLAY_FORMAT) : '')
  const [prevValue, setPrevValue] = useState(value)

  // Estado interno para las tres columnas del wheel picker
  const today = useMemo(() => new Date(), [])
  const initialDate = parsedValueDate || today
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate())

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sincronizar estado interno cuando cambia el value externo
  if (value !== prevValue) {
    setPrevValue(value)
    if (value) {
      const parsed = parse(value, INTERNAL_FORMAT, new Date())
      if (isValid(parsed)) {
        setInputText(format(parsed, DISPLAY_FORMAT))
        setSelectedYear(parsed.getFullYear())
        setSelectedMonth(parsed.getMonth() + 1)
        setSelectedDay(parsed.getDate())
      }
    } else {
      setInputText('')
    }
  }

  // Cerrar y remover foco explícitamente del input
  const closePicker = useCallback(() => {
    setOpen(false)
    inputRef.current?.blur()
  }, [])

  // Calcular posición del popover dinámicamente con useLayoutEffect
  const calcPosition = useCallback(() => {
    if (isMobile || !wrapperRef.current || !popoverRef.current) return
    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()

    const popoverHeight = popoverRect.height || 290
    const popoverWidth = popoverRect.width || 290

    const spaceBelow = window.innerHeight - wrapperRect.bottom - VIEWPORT_MARGIN
    const spaceAbove = wrapperRect.top - VIEWPORT_MARGIN

    const top = (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove)
      ? wrapperRect.bottom + 6
      : wrapperRect.top - popoverHeight - 6

    let left = wrapperRect.left
    if (left + popoverWidth > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - popoverWidth - VIEWPORT_MARGIN
    }
    if (left < VIEWPORT_MARGIN) {
      left = VIEWPORT_MARGIN
    }

    popoverRef.current.style.top = `${top}px`
    popoverRef.current.style.left = `${left}px`
    popoverRef.current.style.visibility = 'visible'
  }, [isMobile])

  // Recalcular posición y responsive breakpoints en resize / scroll mientras esté abierto
  useLayoutEffect(() => {
    if (!open) return

    const handleWindowChange = () => {
      setIsMobile(window.innerWidth <= 1024)
      calcPosition()
    }

    calcPosition()

    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', calcPosition, { capture: true, passive: true })

    return () => {
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', calcPosition, { capture: true })
    }
  }, [open, calcPosition])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        closePicker()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closePicker])

  // Rango de años calculado según min/max o default -100 / +10
  const currentYearNow = new Date().getFullYear()
  const minYear = fromDate ? fromDate.getFullYear() : currentYearNow - 100
  const maxYear = toDate ? toDate.getFullYear() : currentYearNow + 10

  const yearOptions = useMemo<WheelPickerOption<number>[]>(() => {
    const options: WheelPickerOption<number>[] = []
    for (let y = minYear; y <= maxYear; y++) {
      let isDisabled = false
      if (fromDate && y < fromDate.getFullYear()) {
        isDisabled = true
      }
      if (toDate && y > toDate.getFullYear()) {
        isDisabled = true
      }
      options.push({
        value: y,
        label: String(y),
        textValue: String(y),
        disabled: isDisabled,
      })
    }
    return options
  }, [minYear, maxYear, fromDate, toDate])

  const monthOptions = useMemo<WheelPickerOption<number>[]>(() => {
    const options: WheelPickerOption<number>[] = []
    for (let m = 1; m <= 12; m++) {
      const rawMonthName = format(new Date(selectedYear, m - 1, 1), 'MMM', { locale: es }).replace('.', '')
      const monthLabel = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1)

      let isDisabled = false
      if (fromDate) {
        if (selectedYear < fromDate.getFullYear()) {
          isDisabled = true
        } else if (selectedYear === fromDate.getFullYear() && m < fromDate.getMonth() + 1) {
          isDisabled = true
        }
      }
      if (toDate) {
        if (selectedYear > toDate.getFullYear()) {
          isDisabled = true
        } else if (selectedYear === toDate.getFullYear() && m > toDate.getMonth() + 1) {
          isDisabled = true
        }
      }

      options.push({
        value: m,
        label: monthLabel,
        textValue: monthLabel,
        disabled: isDisabled,
      })
    }
    return options
  }, [selectedYear, fromDate, toDate])

  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth - 1, 1))
  }, [selectedYear, selectedMonth])

  const dayOptions = useMemo<WheelPickerOption<number>[]>(() => {
    const options: WheelPickerOption<number>[] = []
    for (let d = 1; d <= daysInSelectedMonth; d++) {
      const testDate = new Date(selectedYear, selectedMonth - 1, d)
      let isDisabled = false
      if (fromDate && startOfDay(testDate) < startOfDay(fromDate)) {
        isDisabled = true
      }
      if (toDate && startOfDay(testDate) > startOfDay(toDate)) {
        isDisabled = true
      }
      options.push({
        value: d,
        label: String(d).padStart(2, '0'),
        textValue: String(d),
        disabled: isDisabled,
      })
    }
    return options
  }, [daysInSelectedMonth, selectedYear, selectedMonth, fromDate, toDate])

  // Función para aplicar cambios de fecha desde los wheels
  const commitWheelChange = useCallback((newYear: number, newMonth: number, newDay: number) => {
    const maxDays = getDaysInMonth(new Date(newYear, newMonth - 1, 1))
    const validDay = Math.min(newDay, maxDays)

    let finalDate = new Date(newYear, newMonth - 1, validDay)
    if (fromDate && startOfDay(finalDate) < startOfDay(fromDate)) {
      finalDate = fromDate
    }
    if (toDate && startOfDay(finalDate) > startOfDay(toDate)) {
      finalDate = toDate
    }

    const clampedYear = finalDate.getFullYear()
    const clampedMonth = finalDate.getMonth() + 1
    const clampedDay = finalDate.getDate()

    setSelectedYear(clampedYear)
    setSelectedMonth(clampedMonth)
    setSelectedDay(clampedDay)

    const internalStr = format(finalDate, INTERNAL_FORMAT)
    const displayStr = format(finalDate, DISPLAY_FORMAT)

    onChange(internalStr)
    setInputText(displayStr)
  }, [fromDate, toDate, onChange])

  const handleDayChange = useCallback((newDay: number) => {
    triggerHapticFeedback()
    commitWheelChange(selectedYear, selectedMonth, newDay)
  }, [commitWheelChange, selectedYear, selectedMonth])

  const handleMonthChange = useCallback((newMonth: number) => {
    triggerHapticFeedback()
    commitWheelChange(selectedYear, newMonth, selectedDay)
  }, [commitWheelChange, selectedYear, selectedDay])

  const handleYearChange = useCallback((newYear: number) => {
    triggerHapticFeedback()
    commitWheelChange(newYear, selectedMonth, selectedDay)
  }, [commitWheelChange, selectedMonth, selectedDay])

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d/]/g, '')

    if (inputText.length > raw.length + 1) {
      setInputText(raw)
      return
    }

    const digits = raw.replace(/\//g, '')

    let formatted: string
    if (digits.length <= 2) {
      formatted = digits
    } else if (digits.length <= 4) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    } else {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
    }

    setInputText(formatted)

    if (formatted.length === 10) {
      const parsed = parse(formatted, DISPLAY_FORMAT, new Date())
      if (isValid(parsed)) {
        if (fromDate && startOfDay(parsed) < startOfDay(fromDate)) return
        if (toDate && startOfDay(parsed) > startOfDay(toDate)) return
        setSelectedYear(parsed.getFullYear())
        setSelectedMonth(parsed.getMonth() + 1)
        setSelectedDay(parsed.getDate())
        onChange(format(parsed, INTERNAL_FORMAT))
      }
    } else if (formatted.length === 0) {
      onChange('')
    }
  }

  const handleToday = () => {
    const now = new Date()
    commitWheelChange(now.getFullYear(), now.getMonth() + 1, now.getDate())
    closePicker()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setInputText('')
    closePicker()
  }

  // Clampear valor seleccionado para evitar que quede fuera de rango durante el render
  const safeDayValue = useMemo(() => {
    const exists = dayOptions.some(o => o.value === selectedDay)
    if (exists) return selectedDay
    const maxDays = getDaysInMonth(new Date(selectedYear, selectedMonth - 1, 1))
    return Math.min(selectedDay, maxDays)
  }, [dayOptions, selectedDay, selectedYear, selectedMonth])

  const wheelPickerContent = (
    <div className={styles.wheelPickerContainer}>
      <div className={styles.wheelHeaderLabels}>
        <span className={styles.wheelHeaderLabel}>Día</span>
        <span className={styles.wheelHeaderLabel}>Mes</span>
        <span className={styles.wheelHeaderLabel}>Año</span>
      </div>
      <WheelPickerWrapper className={styles.wheelWrapper}>
        <WheelPicker
          value={safeDayValue}
          onValueChange={handleDayChange}
          options={dayOptions}
          dragSensitivity={WHEEL_DRAG_SENSITIVITY}
          scrollSensitivity={WHEEL_SCROLL_SENSITIVITY}
          optionItemHeight={38}
          visibleCount={16}
          classNames={{
            optionItem: styles.wheelOptionItem,
            highlightWrapper: styles.wheelHighlightWrapper,
            highlightItem: styles.wheelHighlightItem,
          }}
        />
        <WheelPicker
          value={selectedMonth}
          onValueChange={handleMonthChange}
          options={monthOptions}
          dragSensitivity={WHEEL_DRAG_SENSITIVITY}
          scrollSensitivity={WHEEL_SCROLL_SENSITIVITY}
          optionItemHeight={38}
          visibleCount={16}
          classNames={{
            optionItem: styles.wheelOptionItem,
            highlightWrapper: styles.wheelHighlightWrapper,
            highlightItem: styles.wheelHighlightItem,
          }}
        />
        <WheelPicker
          value={selectedYear}
          onValueChange={handleYearChange}
          options={yearOptions}
          dragSensitivity={WHEEL_DRAG_SENSITIVITY}
          scrollSensitivity={WHEEL_SCROLL_SENSITIVITY}
          optionItemHeight={38}
          visibleCount={16}
          classNames={{
            optionItem: styles.wheelOptionItem,
            highlightWrapper: styles.wheelHighlightWrapper,
            highlightItem: styles.wheelHighlightItem,
          }}
        />
      </WheelPickerWrapper>
    </div>
  )

  const footerContent = (
    <div className={styles.calendarFooter}>
      {parsedValueDate && (
        <button className={styles.clearBtn} onClick={handleClear} type="button">
          Borrar
        </button>
      )}
      <button className={styles.todayBtn} onClick={handleToday} type="button">
        Hoy
      </button>
    </div>
  )

  if (variant === 'compact') {
    return (
      <div className={[styles.compactWrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
        <div
          id={id}
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={[
            styles.compactRow,
            error ? styles.inputError : '',
            disabled ? styles.compactDisabled : '',
          ].filter(Boolean).join(' ')}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled) setOpen(true)
            }
          }}
        >
          {label && <span className={styles.compactLabel}>{label}</span>}
          <div className={styles.compactValueGroup}>
            <span className={[styles.compactValue, !inputText ? styles.compactPlaceholder : ''].filter(Boolean).join(' ')}>
              {inputText || placeholder}
            </span>
            <span className={styles.compactIcon}>
              <Calendar size={15} />
            </span>
          </div>
        </div>
        {name && <input type="hidden" name={name} value={value} required={required} />}
        {error && (
          <span className={styles.errorMsg}>
            <AlertCircle size={12} />
            {error}
          </span>
        )}
        {open && createPortal(
          isMobile ? (
            <div
              className={styles.bottomSheetOverlay}
              data-portal="date-picker"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closePicker()
              }}
            >
              <div className={styles.bottomSheet} ref={popoverRef}>
                <div className={styles.bottomSheetHandle} />
                <div className={styles.bottomSheetContent}>
                  {wheelPickerContent}
                </div>
                {footerContent}
              </div>
            </div>
          ) : (
            <div ref={popoverRef} className={styles.popover} data-portal="date-picker">
              {wheelPickerContent}
              {footerContent}
            </div>
          ),
          document.body
        )}
      </div>
    )
  }

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={handleTextInput}
          onFocus={() => !disabled && setOpen(true)}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Tab') closePicker()
          }}
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
      {open && createPortal(
        isMobile ? (
          <div
            className={styles.bottomSheetOverlay}
            data-portal="date-picker"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closePicker()
            }}
          >
            <div className={styles.bottomSheet} ref={popoverRef}>
              <div className={styles.bottomSheetHandle} />
              <div className={styles.bottomSheetContent}>
                {wheelPickerContent}
              </div>
              {footerContent}
            </div>
          </div>
        ) : (
          <div ref={popoverRef} className={styles.popover} data-portal="date-picker">
            {wheelPickerContent}
            {footerContent}
          </div>
        ),
        document.body
      )}
    </div>
  )
}

export default DateInput
