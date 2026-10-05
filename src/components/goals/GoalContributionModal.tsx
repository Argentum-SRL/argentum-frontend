import { useMemo, useEffect, useReducer, useRef, useState, useCallback } from 'react'
import {
  X,
  Plus,
  Minus,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  Target
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import type { Goal } from '@/types/goals'
import { TipoMovimientoMeta } from '@/types/goals'
import type { Billetera } from '@/types'
import goalsService from '@/services/goals.service'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import { formatMonto } from '@/utils/format'
import styles from './GoalContributionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { sileo } from 'sileo'
import { DateInput } from '@/components/ui'
import { getErrorMessage } from '@/utils/errorMessages'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'

interface GoalContributionModalProps {
  open: boolean
  onClose: () => void
  goal: Goal
  billeteras: Billetera[]
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2
  slideDirection: 'forward' | 'back'
  tipo: 'aporte' | 'retiro'
  monto: number | null
  moneda: 'ARS' | 'USD'
  billetera_id: string
  fecha: string
  cotizacion_usada: number
  isSubmitting: boolean
  localError: string | null
}

type FormAction =
  | { type: 'RESET'; goal: Goal; billeteras: Billetera[] }
  | { type: 'SET_STEP'; step: 1 | 2; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }

const getTodayString = () => new Date().toLocaleDateString('en-CA')

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  tipo: 'aporte',
  monto: null,
  moneda: 'ARS',
  billetera_id: '',
  fecha: getTodayString(),
  cotizacion_usada: 1,
  isSubmitting: false,
  localError: null
}

function getSortedWalletsForCurrency(billeteras: Billetera[], moneda: string, currentId?: string): Billetera[] {
  return [...billeteras]
    .filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === currentId))
    .sort((a, b) => {
      // 1. Billetera Principal siempre primera a la izquierda
      if (a.es_principal && !b.es_principal) return -1
      if (!a.es_principal && b.es_principal) return 1

      // 2. De mayor a menor saldo
      const saldoA = Number(a.saldo_actual) || 0
      const saldoB = Number(b.saldo_actual) || 0
      return saldoB - saldoA
    })
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET': {
      const defaultMoneda = (action.goal.moneda as 'ARS' | 'USD') || 'ARS'
      const sortedForGoal = getSortedWalletsForCurrency(action.billeteras, defaultMoneda)
      const bestWallet = sortedForGoal[0] || action.billeteras.find(b => b.es_principal) || action.billeteras[0]
      const defaultTipo = action.goal.estado === 'completada' ? 'retiro' : 'aporte'
      return {
        ...initialState,
        tipo: defaultTipo,
        moneda: (bestWallet?.moneda as 'ARS' | 'USD') || defaultMoneda,
        billetera_id: bestWallet?.id || '',
        fecha: getTodayString()
      }
    }
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

export default function GoalContributionModal({
  open, onClose, goal, billeteras, onSuccess
}: GoalContributionModalProps) {
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [animClass, setAnimClass] = useState('')
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const {
    step, tipo, monto, moneda, billetera_id, fecha, cotizacion_usada, isSubmitting, localError
  } = state

  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value } as FormAction)
    if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null } as FormAction)
  }, [localError])

  const selectedBilletera = useMemo(() => billeteras.find(b => b.id === billetera_id), [billeteras, billetera_id])
  const needsExchangeRate = moneda !== goal.moneda

  const resultInGoalCurrency = useMemo(() => {
    if (!monto) return 0
    if (!needsExchangeRate) return monto
    if (cotizacion_usada <= 0) return 0
    if (moneda === 'USD' && goal.moneda === 'ARS') return monto * cotizacion_usada
    if (moneda === 'ARS' && goal.moneda === 'USD') return monto / cotizacion_usada
    return monto
  }, [monto, needsExchangeRate, cotizacion_usada, moneda, goal.moneda])

  const nuevoMontoActual = useMemo(() => {
    const delta = tipo === 'aporte' ? resultInGoalCurrency : -resultInGoalCurrency
    return Math.max(0, (goal.monto_actual || 0) + delta)
  }, [tipo, resultInGoalCurrency, goal.monto_actual])

  const porcentajeProyectado = useMemo(() => {
    if (!goal.monto_objetivo || goal.monto_objetivo <= 0) return 0
    return Math.min(100, Math.round((nuevoMontoActual / goal.monto_objetivo) * 100))
  }, [nuevoMontoActual, goal.monto_objetivo])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET', goal, billeteras })
        setAnimClass('')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, goal, billeteras])

  // Lista de billeteras ordenada: Principal primera, luego de mayor a menor saldo
  const filteredBilleteras = useMemo(() => {
    return getSortedWalletsForCurrency(billeteras, moneda, billetera_id)
  }, [billeteras, moneda, billetera_id])

  // Hook universal de altura adaptativa (Auto-Hugging)
  const {
    headerRef: formHeaderRef,
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: open,
    extraPadding: 28,
    deps: [
      step,
      animClass,
      tipo,
      monto,
      moneda,
      billetera_id,
      fecha,
      cotizacion_usada,
      needsExchangeRate,
      localError,
      filteredBilleteras.length,
    ],
  })

  // Auto-selección inicial y scroll suave a la tarjeta seleccionada
  useEffect(() => {
    if (!open || !billetera_id || step !== 1) return
    const timer = setTimeout(() => {
      const card = cardRefs.current.get(billetera_id)
      if (card) {
        const scroller = card.closest(`.${styles.billeterasCarouselScroller}`) as HTMLElement | null
        if (scroller) {
          const cardRect = card.getBoundingClientRect()
          const scrollerRect = scroller.getBoundingClientRect()
          const currentScroll = scroller.scrollLeft
          const offset = cardRect.left - scrollerRect.left + currentScroll
          const targetScrollLeft = offset - (scroller.clientWidth - cardRect.width) / 2

          scroller.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth',
          })
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [billetera_id, open, step])

  const goNext = () => {
    if (!monto || monto <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto válido mayor a 0' })
      return
    }
    if (monto > 9999999999999.99) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto es demasiado alto' })
      return
    }
    if (!billetera_id) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Seleccioná una billetera' })
      return
    }
    if (tipo === 'aporte' && selectedBilletera && monto > selectedBilletera.saldo_actual) {
      dispatch({ 
        type: 'SET_FIELD', 
        field: 'localError', 
        value: `Saldo insuficiente en ${selectedBilletera.nombre}. Tenés disponible ${formatMonto(selectedBilletera.saldo_actual, selectedBilletera.moneda as 'ARS' | 'USD')}` 
      })
      return
    }
    if (tipo === 'retiro' && resultInGoalCurrency > goal.monto_actual) {
      dispatch({ 
        type: 'SET_FIELD', 
        field: 'localError', 
        value: `El retiro (${formatMonto(resultInGoalCurrency, goal.moneda as 'ARS' | 'USD')}) supera el saldo acumulado en la meta (${formatMonto(goal.monto_actual, goal.moneda as 'ARS' | 'USD')})` 
      })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
    setAnimClass(styles.slideForward)
    dispatch({ type: 'SET_STEP', step: 2, direction: 'forward' })
  }

  const goBack = () => {
    setAnimClass(styles.slideBack)
    dispatch({ type: 'SET_STEP', step: 1, direction: 'back' })
  }

  const handleSubmit = async () => {
    const hoyStr = getTodayString()
    if (fecha > hoyStr) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'La fecha no puede ser futura' })
      return
    }
    if (needsExchangeRate && (!cotizacion_usada || cotizacion_usada <= 0 || cotizacion_usada > 9999999.9999)) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá una cotización válida mayor a 0' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await goalsService.addMovement(goal.id, {
        tipo: tipo === 'aporte' ? TipoMovimientoMeta.APORTE : TipoMovimientoMeta.RETIRO,
        monto: Number(monto),
        billetera_id,
        fecha,
        moneda_movimiento: moneda,
        cotizacion_usada: needsExchangeRate ? cotizacion_usada : null
      })
      sileo.success({ title: tipo === 'aporte' ? 'Aporte registrado con éxito' : 'Retiro registrado con éxito' })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Error al procesar el movimiento')
      dispatch({ type: 'SET_FIELD', field: 'localError', value: msg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      className={styles.modalContribution}
      ariaLabel={`${tipo === 'aporte' ? 'Aportar a' : 'Retirar de'} meta`}
    >
      <div
        className={styles.slidesContainer}
        style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
      >
        {/* Indicador de pasos superior centrado (Pill Dots) */}
        <div className={styles.stepDots} aria-hidden="true">
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ──── PASO 1: Monto, Tipo y Billetera ──── */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <h2 className={styles.headerTitle}>
                    {tipo === 'aporte' ? 'Aportar a' : 'Retirar de'} {goal.nombre}
                  </h2>
                </div>
                <div className={styles.headerRightActions}>
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep1}`}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                {/* Operation Bar (Segmented Pills exacto a TransaccionModal) */}
                <div className={styles.segmentedBar} role="radiogroup" aria-label="Tipo de operación">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipo === 'aporte'}
                    className={`${styles.segmentedPill} ${tipo === 'aporte' ? styles.segmentedPillActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'aporte' })}
                  >
                    <Plus size={14} strokeWidth={2.2} />
                    <span>Aportar</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipo === 'retiro'}
                    className={`${styles.segmentedPill} ${tipo === 'retiro' ? styles.segmentedPillActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'retiro' })}
                  >
                    <Minus size={14} strokeWidth={2.2} />
                    <span>Retirar</span>
                  </button>
                </div>

                {/* Monto Hero */}
                <div className={styles.formField}>
                  <MontoInput
                    value={monto}
                    onChange={v => setField('monto', v)}
                    moneda={moneda}
                    onMonedaChange={m => {
                      setField('moneda', m)
                      const sorted = getSortedWalletsForCurrency(billeteras, m)
                      if (sorted.length > 0) {
                        setField('billetera_id', sorted[0].id)
                      }
                    }}
                    allowDecimals={true}
                    max={9999999999999.99}
                    label="¿Cuánto querés operar?"
                  />
                </div>

                {/* Selector de Billetera */}
                <div className={styles.formField}>
                  <div className={styles.labelWithBalance}>
                    <label className={styles.fieldLabel}>
                      {tipo === 'aporte' ? '¿De dónde sale la plata?' : '¿A dónde va la plata?'}
                    </label>
                    {selectedBilletera && (
                      <span className={styles.balanceInfo}>
                        Disponible: {formatMonto(selectedBilletera.saldo_actual, selectedBilletera.moneda as 'ARS' | 'USD')}
                      </span>
                    )}
                  </div>
                  <div className={styles.billeterasCarouselScroller}>
                    <div className={styles.billeterasCarousel}>
                      {filteredBilleteras.length === 0 ? (
                        <div className={`${styles.localErrorAlert} ${styles.fullWidth}`}>
                          <AlertCircle size={16} />
                          <span>No tenés billeteras activas en {moneda === 'ARS' ? 'pesos' : 'dólares'}</span>
                        </div>
                      ) : filteredBilleteras.map(b => (
                        <div
                          key={b.id}
                          className={styles.billeteraSelectWrap}
                          data-active={billetera_id === b.id}
                          ref={el => { if (el) cardRefs.current.set(b.id, el) }}
                        >
                          <BilleteraCard 
                            billetera={b} 
                            className={styles.fullHeightCard} 
                            disableNavigation={true}
                            hideCurrencyChip={true}
                          />
                          <button
                            type="button"
                            className={styles.billeteraOverlay}
                            onClick={() => setField('billetera_id', b.id)}
                            title={`Seleccionar billetera ${b.nombre}`}
                            aria-label={`Seleccionar billetera ${b.nombre}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ──── PASO 2: Confirmación, Fecha y Conversión ──── */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                  <h2 className={styles.headerTitle}>
                    Confirmar {tipo === 'aporte' ? 'aporte' : 'retiro'}
                  </h2>
                </div>
                <div className={styles.headerRightActions}>
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep2}`}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                {/* Tarjeta Resumen de Impacto en la Meta */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={16} color="var(--primary)" />
                      <span className={styles.summaryGoalTitle}>{goal.nombre}</span>
                    </div>
                    <span className={`${styles.summaryBadge} ${tipo === 'aporte' ? styles.badgeAporte : styles.badgeRetiro}`}>
                      {tipo === 'aporte' ? '+ Aporte' : '- Retiro'}
                    </span>
                  </div>

                  <div className={styles.summaryStatsGrid}>
                    <div className={styles.summaryStatBox}>
                      <span className={styles.summaryStatLabel}>Importe a operar</span>
                      <span className={`${styles.summaryStatValue} ${tipo === 'aporte' ? styles.statGreen : styles.statRed}`}>
                        {tipo === 'aporte' ? '+' : '-'} {formatMonto(monto || 0, moneda)}
                      </span>
                    </div>
                    <div className={styles.summaryStatBox}>
                      <span className={styles.summaryStatLabel}>Nuevo acumulado</span>
                      <span className={styles.summaryStatValue}>
                        {formatMonto(nuevoMontoActual, goal.moneda as 'ARS' | 'USD')}
                      </span>
                    </div>
                  </div>

                  {goal.monto_objetivo > 0 && (
                    <div className={styles.summaryProgressContainer}>
                      <div className={styles.summaryProgressHeader}>
                        <span>Progreso hacia el objetivo</span>
                        <span>{porcentajeProyectado}%</span>
                      </div>
                      <div className={styles.summaryProgressBar}>
                        <div 
                          className={styles.summaryProgressFill} 
                          style={{ width: `${porcentajeProyectado}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversión de Moneda (si la moneda difiere de la de la meta) */}
                {needsExchangeRate && (
                  <div className={styles.exchangeBox}>
                    <div className={styles.exchangeHeader}>
                      <TrendingUp size={15} />
                      <span>Conversión de moneda</span>
                    </div>
                    <div className={styles.exchangeGrid}>
                      <div className={styles.rateInputWrap}>
                        <span className={styles.rateUnitLabel}>1 {moneda === 'ARS' ? 'peso' : 'dólar'} =</span>
                        <input
                          type="number"
                          step="any"
                          min="0.0001"
                          max="9999999"
                          className={styles.rateInput}
                          value={cotizacion_usada || ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0
                            setField('cotizacion_usada', v)
                          }}
                          title="Cotización de la moneda"
                        />
                        <span className={styles.rateUnitLabel}>{goal.moneda === 'ARS' ? 'pesos' : 'dólares'}</span>
                      </div>
                      <ArrowRight size={15} color="var(--primary)" />
                      <div className={styles.resultInfo}>
                        Impacto en meta: <br />
                        <span className={styles.bold}>{formatMonto(resultInGoalCurrency, goal.moneda as 'ARS' | 'USD')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fecha */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Fecha de la operación</label>
                  <DateInput
                    value={fecha}
                    onChange={val => setField('fecha', val)}
                  />
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack} disabled={isSubmitting}>
                  Atrás
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Procesando...' 
                    : tipo === 'aporte' 
                    ? 'Confirmar Aporte' 
                    : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}
