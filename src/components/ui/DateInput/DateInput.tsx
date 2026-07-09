import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, useDayPicker } from 'react-day-picker'
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

// ─── Custom MonthCaption: Arrows + Title all in one flex row ───────────────
function MonthCaptionWithNav({
  calendarMonth,
  view,
  onToggleView,
}: {
  calendarMonth: { date: Date }
  view: 'days' | 'years'
  onToggleView: () => void
}) {
  const { goToMonth, nextMonth, previousMonth } = useDayPicker()
  const monthName = format(calendarMonth.date, 'MMMM', { locale: es })
  const year = calendarMonth.date.getFullYear()
  const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`

  return (
    <div className={styles.calendarHeader}>
      <button
        type="button"
        className={styles.rdpNavButton}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        className={styles.captionBtn}
        onClick={onToggleView}
        aria-label="Seleccionar año"
      >
        {label}
        <span className={[styles.captionChevron, view === 'years' ? styles.captionChevronOpen : ''].filter(Boolean).join(' ')}>
          ▾
        </span>
      </button>

      <button
        type="button"
        className={styles.rdpNavButton}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
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
  // Parsear min/max
  const fromDate = min ? parse(min, INTERNAL_FORMAT, new Date()) : undefined
  const toDate = max ? parse(max, INTERNAL_FORMAT, new Date()) : undefined

  // Parsear value (YYYY-MM-DD) a Date
  const selectedDate = value
    ? parse(value, INTERNAL_FORMAT, new Date())
    : undefined
  const validSelected = selectedDate && isValid(selectedDate) ? selectedDate : undefined

  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [inputText, setInputText] = useState(validSelected ? format(validSelected, DISPLAY_FORMAT) : '')
  const [calendarMonth, setCalendarMonth] = useState<Date>(validSelected || new Date())
  const [view, setView] = useState<'days' | 'years'>('days')
  const [prevValue, setPrevValue] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const yearGridRef = useRef<HTMLDivElement>(null)

  // Ajustar estado cuando cambia el value externo (durante render)
  if (value !== prevValue) {
    setPrevValue(value)
    if (value) {
      const parsed = parse(value, INTERNAL_FORMAT, new Date())
      if (isValid(parsed)) {
        setInputText(format(parsed, DISPLAY_FORMAT))
        setCalendarMonth(parsed)
      }
    } else {
      setInputText('')
    }
  }

  // Detectar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Calcular posición del popover (solo desktop)
  const calcPosition = useCallback(() => {
    if (isMobile || !wrapperRef.current || !popoverRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const popoverHeight = 360
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const top = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove
      ? rect.bottom + 6
      : rect.top - popoverHeight - 6
    
    let left = rect.left
    const popoverWidth = 290
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8
    }
    if (left < 8) left = 8

    popoverRef.current.style.top = `${top}px`
    popoverRef.current.style.left = `${left}px`
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
        setView('days')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll automático al año seleccionado
  useEffect(() => {
    if (view === 'years' && yearGridRef.current) {
      const selected = yearGridRef.current.querySelector(`.${styles.yearBtnSelected}`)
      if (selected) {
        selected.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
    }
  }, [view])

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
        if (fromDate && parsed < fromDate) return
        if (toDate && parsed > toDate) return
        onChange(format(parsed, INTERNAL_FORMAT))
      }
    } else if (formatted.length === 0) {
      onChange('')
    }
  }

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, INTERNAL_FORMAT))
      setInputText(format(date, DISPLAY_FORMAT))
      setCalendarMonth(date)
    }
    setOpen(false)
    setView('days')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setInputText('')
    setOpen(false)
    setView('days')
  }

  // Calcular rango de años disponibles
  const currentYear = new Date().getFullYear()
  const minYear = fromDate ? fromDate.getFullYear() : currentYear - 100
  const maxYear = toDate ? toDate.getFullYear() : currentYear + 10
  const yearList = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  )

  const selectedYear = calendarMonth.getFullYear()

  const yearGridElement = (
    <div className={styles.yearGrid} ref={yearGridRef}>
      {yearList.map(y => (
        <button
          key={y}
          type="button"
          className={[
            styles.yearBtn,
            y === selectedYear ? styles.yearBtnSelected : '',
            y === currentYear ? styles.yearBtnToday : '',
          ].filter(Boolean).join(' ')}
          onClick={() => {
            const newMonth = new Date(calendarMonth)
            newMonth.setFullYear(y)
            setCalendarMonth(newMonth)
            setView('days')
          }}
        >
          {y}
        </button>
      ))}
    </div>
  )

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
      month={calendarMonth}
      onMonthChange={setCalendarMonth}
      classNames={{
        root: styles.rdpRoot,
        months: styles.rdpMonths,
        month: styles.rdpMonth,
        month_caption: styles.rdpCaptionHidden, // Ocultamos el caption nativo — usamos el custom
        caption_label: styles.rdpCaptionLabel,
        nav: styles.rdpNavHidden,              // Ocultamos el nav nativo — está dentro del caption custom
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
        MonthCaption: ({ calendarMonth: cm }) => (
          <MonthCaptionWithNav
            calendarMonth={cm}
            view={view}
            onToggleView={() => setView(v => v === 'years' ? 'days' : 'years')}
          />
        ),
      }}
    />
  )

  const calendarContent = (
    <>
      {view === 'years' ? (
        <>
          {/* Header de años — mismo diseño que el de días */}
          <div className={styles.calendarHeader}>
            <div style={{ width: 32 }} />
            <button
              type="button"
              className={styles.captionBtn}
              onClick={() => setView('days')}
              aria-label="Volver al calendario"
            >
              {calendarMonth.getFullYear()}
              <span className={[styles.captionChevron, styles.captionChevronOpen].join(' ')}>▾</span>
            </button>
            <div style={{ width: 32 }} />
          </div>
          {yearGridElement}
        </>
      ) : (
        dayPickerElement
      )}
    </>
  )

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} ref={wrapperRef}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={styles.inputWrap}>
        <input
          id={id}
          type="text"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onChange={handleTextInput}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setView('days') }
            if (e.key === 'Tab') { setOpen(false); setView('days') }
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
              if (e.target === e.currentTarget) { setOpen(false); setView('days') }
            }}
          >
            <div className={styles.bottomSheet} ref={popoverRef}>
              <div className={styles.bottomSheetHandle} />
              <div className={styles.bottomSheetContent}>
                {calendarContent}
              </div>
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
          <div ref={popoverRef} className={styles.popover} data-portal="date-picker">
            {calendarContent}
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
        ),
        document.body
      )}
    </div>
  )
}

export default DateInput
