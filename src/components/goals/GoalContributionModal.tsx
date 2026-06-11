import { useMemo, useEffect, useReducer, useRef } from 'react'
import {
  X,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Goal } from '@/types/goals'
import { TipoMovimientoMeta } from '@/types/goals'
import type { Billetera } from '@/types'
import goalsService from '@/services/goals.service'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import { formatMonto } from '@/utils/format'
import styles from './GoalContributionModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { useToast } from '@/hooks/useToast'

interface GoalContributionModalProps {
  open: boolean
  onClose: () => void
  goal: Goal
  billeteras: Billetera[]
  onSuccess: () => void
}

interface FormState {
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
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }

const initialState: FormState = {
  tipo: 'aporte',
  monto: null,
  moneda: 'ARS',
  billetera_id: '',
  fecha: new Date().toISOString().split('T')[0],
  cotizacion_usada: 1,
  isSubmitting: false,
  localError: null
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET': {
      const bestWallet = action.billeteras.find(b => b.moneda === action.goal.moneda && b.estado === 'activa') 
                      || action.billeteras.find(b => b.estado === 'activa')
                      || action.billeteras[0]
      return {
        ...initialState,
        moneda: (bestWallet?.moneda as 'ARS' | 'USD') || (action.goal.moneda as 'ARS' | 'USD'),
        billetera_id: bestWallet?.id || '',
        fecha: new Date().toISOString().split('T')[0]
      }
    }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}



export default function GoalContributionModal({
  open, onClose, goal, billeteras, onSuccess
}: GoalContributionModalProps) {
  const { showToast } = useToast()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const {
    tipo, monto, moneda, billetera_id, fecha, cotizacion_usada, isSubmitting, localError
  } = state

  const selectedBilletera = useMemo(() => billeteras.find(b => b.id === billetera_id), [billeteras, billetera_id])
  const needsExchangeRate = moneda !== goal.moneda

  useEffect(() => {
    if (open) dispatch({ type: 'RESET', goal, billeteras })
  }, [open, goal, billeteras])

  // Scroll to active card
  useEffect(() => {
    if (!open || !billetera_id) return
    const timer = setTimeout(() => {
      const card = cardRefs.current.get(billetera_id)
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, 100)
    return () => clearTimeout(timer)
  }, [billetera_id, open])

  const handleSubmit = async () => {
    if (!monto || monto <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto válido' })
      return
    }
    if (!billetera_id) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Seleccioná una billetera' })
      return
    }
    if (tipo === 'aporte' && selectedBilletera && monto > selectedBilletera.saldo_actual) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: `Saldo insuficiente en ${selectedBilletera.nombre}` })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await goalsService.addMovement(goal.id, {
        tipo: tipo === 'aporte' ? TipoMovimientoMeta.APORTE : TipoMovimientoMeta.RETIRO,
        monto,
        billetera_id,
        fecha,
        moneda_movimiento: moneda,
        cotizacion_usada: needsExchangeRate ? cotizacion_usada : 1
      })
      showToast(tipo === 'aporte' ? 'Aporte registrado' : 'Retiro registrado', 'success')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ detail: unknown }>
      const detail = error.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || 'Error de validación'
          : 'Error al procesar el movimiento'
      dispatch({ type: 'SET_FIELD', field: 'localError', value: msg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const resultInGoalCurrency = useMemo(() => {
    if (!monto) return 0
    if (!needsExchangeRate) return monto
    if (moneda === 'USD' && goal.moneda === 'ARS') return monto * cotizacion_usada
    if (moneda === 'ARS' && goal.moneda === 'USD') return monto / cotizacion_usada
    return monto
  }, [monto, needsExchangeRate, cotizacion_usada, moneda, goal.moneda])

  const filteredBilleteras = useMemo(() => {
    return billeteras.filter(b => b.moneda === moneda && (b.estado === 'activa' || b.id === billetera_id))
  }, [billeteras, moneda, billetera_id])

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding ariaLabel="Aportar a meta">
      <div className={styles.slidesContainer}>
        <form 
          className={styles.formContainer}
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div className={styles.formHeader}>
            <h2 className={styles.headerTitle}>
              {tipo === 'aporte' ? 'Aportar a' : 'Retirar de'} {goal.nombre}
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar modal"><X size={16} /></button>
          </div>

          <div className={styles.formBody}>
            {localError && (
              <div className={styles.localErrorAlert}>
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            {/* Tipo de Operación */}
            <div className={styles.radioPills}>
              <button
                type="button"
                className={`${styles.radioPill} ${tipo === 'aporte' ? styles.pillActiveAporte : ''}`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'aporte' })}
              >
                <Plus size={16} /> Aportar
              </button>
              <button
                type="button"
                className={`${styles.radioPill} ${tipo === 'retiro' ? styles.pillActiveRetiro : ''}`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'retiro' })}
              >
                <Trash2 size={16} /> Retirar
              </button>
            </div>

            {/* Monto Hero */}
            <MontoInput
              value={monto}
              onChange={(v) => {
                dispatch({ type: 'SET_FIELD', field: 'monto', value: v })
                dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
              }}
              moneda={moneda}
              onMonedaChange={(m) => {
                dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })
                // Seleccionar automáticamente la primera billetera de esa moneda
                const first = billeteras.find(b => b.moneda === m && b.estado === 'activa')
                if (first) dispatch({ type: 'SET_FIELD', field: 'billetera_id', value: first.id })
              }}
            />

            {/* Billetera Selector */}
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
                      <span>No tenés billeteras en {moneda}</span>
                    </div>
                  ) : filteredBilleteras.map(b => (
                    <div
                      key={b.id}
                      className={styles.billeteraSelectWrap}
                      data-active={billetera_id === b.id}
                      ref={el => { if (el) cardRefs.current.set(b.id, el) }}
                    >
                      <BilleteraCard billetera={b} className={styles.fullHeightCard} />
                      <button
                        type="button"
                        className={styles.billeteraOverlay}
                        onClick={() => {
                          dispatch({ type: 'SET_FIELD', field: 'billetera_id', value: b.id })
                          dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
                        }}
                        title={`Seleccionar billetera ${b.nombre}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Exchange Rate UI */}
            {needsExchangeRate && (
              <div className={styles.exchangeBox}>
                <div className={styles.exchangeHeader}>
                  <TrendingUp size={16} />
                  <span>Conversión de moneda</span>
                </div>
                <div className={styles.exchangeGrid}>
                  <div className={styles.rateInputWrap}>
                    <span className={styles.rateUnitLabel}>1 {moneda} =</span>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.rateInput}
                      value={cotizacion_usada || ''}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cotizacion_usada', value: parseFloat(e.target.value) || 0 })}
                      title="Cotización de la moneda"
                    />
                    <span className={styles.rateUnitLabel}>{goal.moneda}</span>
                  </div>
                  <ArrowRight size={16} color="var(--primary)" />
                  <div className={styles.resultInfo}>
                    Impacto en meta: <br />
                    <span className={styles.bold}>{formatMonto(resultInGoalCurrency, goal.moneda as 'ARS' | 'USD')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fecha */}
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Fecha</label>
              <div className={styles.inputWrapper}>
                <Calendar size={18} />
                <input
                  type="date"
                  className={styles.fieldInput}
                  value={fecha}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'fecha', value: e.target.value })}
                  title="Seleccionar fecha"
                />
              </div>
            </div>
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : tipo === 'aporte' ? 'Confirmar Aporte' : 'Confirmar Retiro'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
