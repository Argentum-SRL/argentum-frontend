import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, Landmark, Clock, Check, AlertCircle, ChevronDown } from '@/components/ui/icons'
import { LunarLoader, Modal } from '@/components/ui'
import { getPreviewFechaCobro } from '@/services/onboarding.service'
import { REGLAS_CICLO } from '@/lib/utils/ciclo'
import SegmentedControl from '@/components/ui/SegmentedControl'
import styles from './CicloFinancieroSelector.module.css'

export interface CicloValue {
  tipo: 'dia_fijo' | 'regla'
  valor: string
  direccion: 'anterior' | 'posterior' | null
}

interface Props {
  value: CicloValue
  onChange: (val: CicloValue) => void
  disabled?: boolean
}

// Opciones de regla bancaria
// Opción 1: 1° día hábil del mes, Opción 2: Último día hábil del mes.
// Opción 3: Desplegable con el resto de opciones.
const OTHER_BUSINESS_DAYS = REGLAS_CICLO.filter(
  (opt) => opt.id !== 'primer_dia_habil' && opt.id !== 'ultimo_dia_habil'
)

const OTHER_BUSINESS_OPTIONS = OTHER_BUSINESS_DAYS.map((o) => ({
  value: o.id,
  label: o.title,
}))

// 31 días del mes para el tambor giratorio iOS
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const ITEM_HEIGHT = 44 // px, Apple standard tap target

interface AppleWheelPickerProps {
  value: number
  onChange: (val: number) => void
  disabled?: boolean
}

/**
 * Selector de Tambor Giratorio estilo Apple (iOS UIPickerView)
 * Cero inputs de texto, cero cuadrículas de botones.
 * Soporta scroll con inercia, arrastre directo, wheel y teclado.
 */
const AppleWheelPicker: React.FC<AppleWheelPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startScrollRef = useRef(0)
  const [activeDay, setActiveDay] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincronizar estado cuando la prop value cambia externamente
  if (value !== prevValue) {
    setPrevValue(value)
    setActiveDay(value)
  }

  // Sincronizar posición de scroll con el valor actual
  const scrollToDay = useCallback((day: number, smooth = true) => {
    if (!trackRef.current) return
    const targetScroll = (day - 1) * ITEM_HEIGHT
    if (smooth) {
      trackRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' })
    } else {
      trackRef.current.scrollTop = targetScroll
    }
  }, [])

  // Posicionar scroll al montar o al cambiar el valor externamente
  useEffect(() => {
    scrollToDay(value, false)
  }, [value, scrollToDay])

  // Listener de scroll para feedback visual 60fps y debounce de guardado
  const handleScroll = () => {
    if (!trackRef.current) return
    const scrollTop = trackRef.current.scrollTop
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT)
    const current = Math.max(1, Math.min(31, rawIndex + 1))
    
    if (current !== activeDay) {
      setActiveDay(current)
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (current !== value) {
        onChange(current)
      }
    }, 120)
  }

  // Clic directo sobre un número del tambor
  const handleItemClick = (day: number) => {
    if (disabled) return
    setActiveDay(day)
    onChange(day)
    scrollToDay(day, true)
  }

  // Soporte de arrastre directo con mouse (Desktop)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return
    isDraggingRef.current = true
    startYRef.current = e.clientY
    startScrollRef.current = trackRef.current?.scrollTop || 0
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_err) {
      void _err
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return
    const deltaY = e.clientY - startYRef.current
    trackRef.current.scrollTop = startScrollRef.current - deltaY
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_err) {
      void _err
    }
    scrollToDay(activeDay, true)
  }

  // Navegación por teclado accesible (a11y)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    let next: number
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      next = Math.max(1, activeDay - 1)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      next = Math.min(31, activeDay + 1)
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      next = Math.max(1, activeDay - 5)
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      next = Math.min(31, activeDay + 5)
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 1
    } else if (e.key === 'End') {
      e.preventDefault()
      next = 31
    } else {
      return
    }
    setActiveDay(next)
    onChange(next)
    scrollToDay(next, true)
  }

  return (
    <div
      className={styles.wheelViewport}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Selector de día"
    >
      {/* Lente central de selección (Apple Frosted Glass) */}
      <div className={styles.wheelCenterLens} aria-hidden="true" />

      {/* Pista de desplazamiento con inercia física */}
      <div
        ref={trackRef}
        className={styles.wheelTrack}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="listbox"
        aria-label="Días del mes del 1 al 31"
      >
        {DAYS.map((d) => {
          const distance = Math.abs(d - activeDay)
          const isSelected = d === activeDay
          const isNear = distance === 1

          let itemClass = styles.wheelItem
          if (isSelected) {
            itemClass = `${styles.wheelItem} ${styles.wheelItemActive}`
          } else if (isNear) {
            itemClass = `${styles.wheelItem} ${styles.wheelItemNear}`
          }

          return (
            <div
              key={d}
              onClick={() => handleItemClick(d)}
              className={itemClass}
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
            >
              <span className={styles.wheelItemText}>Día {d}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const CicloFinancieroSelector: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { tipo, valor, direccion } = value

  // Preview state
  const [preview, setPreview] = useState<{
    proxima_fecha_cobro: string
    fue_ajustada: boolean
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const num = tipo === 'dia_fijo' ? parseInt(valor, 10) : 0
  const isValid = tipo === 'dia_fijo' ? !isNaN(num) && num >= 1 && num <= 31 : Boolean(valor)

  // Live preview effect with debouncing
  useEffect(() => {
    if (!isValid) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoadingPreview(true)
      try {
        const data = await getPreviewFechaCobro(
          {
            tipo,
            valor,
            direccion: tipo === 'regla' ? null : direccion,
          },
          controller.signal
        )
        setPreview(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        setPreview(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false)
        }
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isValid, tipo, valor, direccion])

  // Handlers de cambio de modalidad
  const handleModeChange = (newTipo: 'dia_fijo' | 'regla') => {
    if (disabled || newTipo === tipo) return
    if (newTipo === 'regla') {
      const isExistingRule = Boolean(valor && REGLAS_CICLO.some((r) => r.id === valor))
      onChange({
        tipo: 'regla',
        valor: isExistingRule ? valor : 'primer_dia_habil',
        direccion: null,
      })
    } else {
      onChange({
        tipo: 'dia_fijo',
        valor: valor && !isNaN(parseInt(valor, 10)) ? valor : '1',
        direccion: direccion || 'anterior',
      })
    }
  }

  const handleDaySelect = (dayNum: number) => {
    if (disabled) return
    const clamped = Math.max(1, Math.min(31, dayNum))
    onChange({
      ...value,
      tipo: 'dia_fijo',
      valor: String(clamped),
    })
  }

  const handleContingencyChange = (newDir: 'anterior' | 'posterior' | 'mismo') => {
    if (disabled) return
    onChange({
      ...value,
      direccion: newDir === 'mismo' ? null : newDir,
    })
  }

  const handleBusinessDaySelect = (ruleId: string) => {
    if (disabled) return
    onChange({
      tipo: 'regla',
      valor: ruleId,
      direccion: null,
    })
  }

  // Formato legible de fecha
  const getFormattedDate = (isoDate: string) => {
    try {
      const dt = new Date(isoDate + 'T12:00:00')
      return dt.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    } catch {
      return isoDate
    }
  }

  const isOtherSelected =
    tipo === 'regla' && valor !== 'primer_dia_habil' && valor !== 'ultimo_dia_habil'

  const lastOtherValueRef = useRef<string>(isOtherSelected ? valor : 'dia_habil_4')
  const otherRowRef = useRef<HTMLButtonElement | null>(null)
  const panelElRef = useRef<HTMLDivElement | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isOtherSelected) {
      lastOtherValueRef.current = valor
    }
  }, [isOtherSelected, valor])

  const selectedOtherOption = OTHER_BUSINESS_OPTIONS.find((o) => o.value === valor)

  const updatePanelPosition = useCallback(() => {
    if (isMobile || !otherRowRef.current || !panelElRef.current) return
    const rect = otherRowRef.current.getBoundingClientRect()
    const panelHeight = Math.min(OTHER_BUSINESS_OPTIONS.length * 42 + 16, 260)
    const spaceBelow = window.innerHeight - rect.bottom
    const top =
      spaceBelow >= panelHeight || spaceBelow >= rect.top
        ? rect.bottom + 4
        : Math.max(8, rect.top - panelHeight - 4)

    let left = rect.left
    const panelWidth = Math.max(rect.width, 240)
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8
    }
    if (left < 8) left = 8

    panelElRef.current.style.top = `${top}px`
    panelElRef.current.style.left = `${left}px`
    panelElRef.current.style.width = `${rect.width}px`
  }, [isMobile])

  const panelRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      panelElRef.current = node
      if (node) {
        updatePanelPosition()
      }
    },
    [updatePanelPosition]
  )

  useEffect(() => {
    if (!isPickerOpen) return
    const handleScrollOrResize = () => {
      updatePanelPosition()
    }
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isPickerOpen, updatePanelPosition])

  useEffect(() => {
    if (!isPickerOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        otherRowRef.current &&
        !otherRowRef.current.contains(e.target as Node) &&
        panelElRef.current &&
        !panelElRef.current.contains(e.target as Node)
      ) {
        setIsPickerOpen(false)
      }
    }
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPickerOpen])

  const numValor = Math.max(1, Math.min(31, parseInt(valor, 10) || 1))

  return (
    <div className={styles.container}>
      {/* ── 1. Selector de Modalidad (Día hábil a la izquierda y por defecto) ── */}
      <div className={styles.modeTrack}>
        <SegmentedControl
          options={[
            {
              value: 'regla',
              label: 'Día hábil bancario',
              icon: <Landmark size={15} />,
            },
            {
              value: 'dia_fijo',
              label: 'Día del mes',
              icon: <Calendar size={15} />,
            },
          ]}
          value={tipo}
          onChange={(val) => handleModeChange(val as 'dia_fijo' | 'regla')}
          ariaLabel="Modalidad de ciclo de cobro"
          fullWidth
        />
      </div>

      {/* ── 2. Opciones de Cobro ── */}
      <div className={styles.configCard}>
        {tipo === 'regla' ? (
          <>
            {/* Opción 1: 1° día hábil del mes */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleBusinessDaySelect('primer_dia_habil')}
              className={styles.businessOptionRow}
              aria-checked={valor === 'primer_dia_habil'}
              role="radio"
            >
              <div className={styles.businessLeft}>
                <div className={styles.checkCircle}>
                  {valor === 'primer_dia_habil' && <Check size={14} />}
                </div>
                <span className={styles.rowTitle}>1° día hábil del mes</span>
              </div>
            </button>

            {/* Opción 2: Último día hábil del mes */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleBusinessDaySelect('ultimo_dia_habil')}
              className={styles.businessOptionRow}
              aria-checked={valor === 'ultimo_dia_habil'}
              role="radio"
            >
              <div className={styles.businessLeft}>
                <div className={styles.checkCircle}>
                  {valor === 'ultimo_dia_habil' && <Check size={14} />}
                </div>
                <span className={styles.rowTitle}>Último día hábil del mes</span>
              </div>
            </button>

            {/* Opción 3: Otro día hábil (Fila limpia idéntica a opciones 1 y 2, sin cajas anidadas) */}
            <button
              type="button"
              id="select-otro-dia-habil"
              ref={otherRowRef}
              disabled={disabled}
              onClick={() => {
                if (!isOtherSelected) {
                  handleBusinessDaySelect(lastOtherValueRef.current || 'dia_habil_4')
                }
                setIsPickerOpen((prev) => !prev)
              }}
              className={styles.businessOptionRow}
              aria-checked={isOtherSelected}
              role="radio"
              aria-haspopup="listbox"
              aria-expanded={isPickerOpen}
            >
              <div className={styles.businessLeft}>
                <div className={styles.checkCircle}>
                  {isOtherSelected && <Check size={14} />}
                </div>
                <span className={styles.rowTitle}>
                  {isOtherSelected ? (selectedOtherOption?.label ?? 'Otro día hábil') : 'Otro día hábil...'}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`${styles.rowChevron} ${isPickerOpen ? styles.rowChevronOpen : ''}`}
              />
            </button>

            {/* Selector de opciones: Bottom Sheet en móvil / Popover flotante en desktop */}
            {isPickerOpen && (
              isMobile ? (
                <Modal
                  isOpen={isPickerOpen}
                  onClose={() => setIsPickerOpen(false)}
                  variant="sheet"
                  title="Elegir día hábil"
                  size="sm"
                >
                  <div className={styles.pickerOptionsList} data-modal-block role="listbox" aria-label="Elegir día hábil">
                    {OTHER_BUSINESS_OPTIONS.map((opt) => {
                      const isSelected = valor === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`${styles.pickerOption} ${isSelected ? styles.pickerOptionSelected : ''}`}
                          onClick={() => {
                            handleBusinessDaySelect(opt.value)
                            setIsPickerOpen(false)
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className={styles.pickerOptionLabel}>{opt.label}</span>
                          {isSelected && (
                            <span className={styles.pickerOptionCheck}>
                              <Check size={16} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </Modal>
              ) : (
                typeof document !== 'undefined' ? createPortal(
                  <div ref={panelRefCallback} className={styles.pickerPanel}>
                    <div className={styles.pickerOptionsList} role="listbox" aria-label="Elegir día hábil">
                      {OTHER_BUSINESS_OPTIONS.map((opt) => {
                        const isSelected = valor === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`${styles.pickerOption} ${isSelected ? styles.pickerOptionSelected : ''}`}
                            onClick={() => {
                              handleBusinessDaySelect(opt.value)
                              setIsPickerOpen(false)
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className={styles.pickerOptionLabel}>{opt.label}</span>
                            {isSelected && (
                              <span className={styles.pickerOptionCheck}>
                                <Check size={14} />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>,
                  document.body
                ) : null
              )
            )}
          </>
        ) : (
          <div className={styles.fixedDaySection}>
            <AppleWheelPicker
              value={numValor}
              onChange={handleDaySelect}
              disabled={disabled}
            />

            <div className={styles.wheelSummary}>
              <span className={styles.wheelSummaryTitle}>Cobro el día {numValor} de cada mes</span>
              <span className={styles.wheelSummaryHint}>
                <span className={styles.hintDesktop}>Si cobrás en un rango (ej: del 1 al 10), seleccioná el día en que preferís que se reinicie tu mes.</span>
                <span className={styles.hintMobile}>Cobro por rango (ej: 1 al 10): elegí el día de corte</span>
              </span>
            </div>

            {/* Ajuste por feriado simplificado (Adaptativo a ancho completo en móvil) */}
            <div className={styles.contingencyRow}>
              <div className={styles.contingencyLabelGroup}>
                <Clock size={16} className={styles.contingencyIcon} />
                <span className={styles.contingencyLabel}>Si cae fin de semana:</span>
              </div>
              <div className={styles.contingencyControlWrap}>
                <SegmentedControl
                  options={[
                    { value: 'anterior', label: 'Antes' },
                    { value: 'mismo', label: 'Mismo día' },
                    { value: 'posterior', label: 'Después' },
                  ]}
                  value={direccion === null ? 'mismo' : direccion}
                  onChange={(v) => handleContingencyChange(v as 'anterior' | 'posterior' | 'mismo')}
                  ariaLabel="Ajuste por feriado"
                  fullWidth
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Indicador de Próximo Reinicio (Limpio y directo) ── */}
      <div className={styles.previewLine}>
        {loadingPreview ? (
          <div className={styles.previewLoading}>
            <LunarLoader size={14} />
            <span>Calculando próximo cobro...</span>
          </div>
        ) : preview?.proxima_fecha_cobro ? (
          <div className={styles.previewContent}>
            <span className={styles.previewPrefix}>Próximo reinicio de mes:</span>
            <span className={styles.previewDate}>
              {getFormattedDate(preview.proxima_fecha_cobro)}
            </span>
            {preview.fue_ajustada && (
              <span className={styles.previewAdjustBadge}>
                <AlertCircle size={11} /> Ajustado por feriado
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CicloFinancieroSelector
