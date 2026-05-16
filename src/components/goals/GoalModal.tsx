import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import {
  Target,
  Calendar,
  X,
  ChevronLeft,
  Palette,
  StickyNote,
  Check,
  AlertCircle
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import goalsService from '@/services/goals.service'
import styles from './GoalModal.module.css'
import { useToast } from '@/hooks/useToast'

interface GoalModalProps {
  open: boolean
  onClose: () => void
  goal?: Goal | null
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2
  slideDirection: 'forward' | 'back'
  nombre: string
  monto_objetivo: number | null
  moneda: 'ARS' | 'USD'
  fecha_limite: string
  color: string
  nota: string
  estado: EstadoMeta
  localError: string | null
  isSubmitting: boolean
}

type FormAction =
  | { type: 'RESET'; goal: Goal | null }
  | { type: 'SET_STEP'; step: 1 | 2; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  nombre: '',
  monto_objetivo: null,
  moneda: 'ARS',
  fecha_limite: '',
  color: '#3B82F6',
  nota: '',
  estado: 'activa',
  localError: null,
  isSubmitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      if (action.goal) {
        return {
          ...initialState,
          nombre: action.goal.nombre,
          monto_objetivo: action.goal.monto_objetivo,
          moneda: action.goal.moneda as 'ARS' | 'USD',
          fecha_limite: action.goal.fecha_limite ? action.goal.fecha_limite.split('T')[0] : '',
          color: action.goal.color || '#3B82F6',
          nota: action.goal.nota || '',
          estado: action.goal.estado
        }
      }
      return initialState
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

function formatParaMostrar(str: string): string {
  const num = str.replace(/\./g, '')
  const partes = num.split(',')
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return partes.join(',')
}

function MontoHero({
  value, onChange, moneda, onMonedaChange, disabled,
}: {
  value: number | null
  onChange: (v: number | null) => void
  moneda: 'ARS' | 'USD'
  onMonedaChange: (m: 'ARS' | 'USD') => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(() =>
    value !== null ? value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  )
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (value === null) { setInputValue('') }
    else {
      const cleaned = inputValue.replace(/\./g, '').replace(',', '.')
      if (parseFloat(cleaned) !== value) {
        setInputValue(value.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
      }
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    if (!raw) { setInputValue(''); onChange(null); return }
    if (raw.endsWith('.') && !raw.includes(',')) raw = raw.slice(0, -1) + ','
    let cleaned = raw.replace(/[^0-9.,]/g, '')
    const parts = cleaned.split(',')
    if (parts.length > 2) cleaned = parts[0] + ',' + parts.slice(1).join('')
    const formatted = formatParaMostrar(cleaned)
    const start = e.target.selectionStart || 0
    const oldLen = e.target.value.length
    setInputValue(formatted)
    const numStr = formatted.replace(/\./g, '').replace(',', '.')
    if (numStr.endsWith('.')) { onChange(parseFloat(numStr.slice(0, -1)) || null) }
    else { const n = parseFloat(numStr); onChange(isNaN(n) ? null : n) }
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = Math.max(0, start + (inputRef.current.value.length - oldLen))
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    })
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const navKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End']
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) return
    if (e.key === ',' || e.key === '.') { if (inputValue.includes(',')) e.preventDefault(); return }
    if (!/[0-9]/.test(e.key)) e.preventDefault()
  }, [inputValue])

  return (
    <div className={styles.montoHero}>
      <button
        type="button"
        className={styles.monedaToggleChip}
        onClick={() => !disabled && onMonedaChange(moneda === 'ARS' ? 'USD' : 'ARS')}
        disabled={disabled}
      >
        <span className={styles.monedaChipFlag}>{moneda === 'ARS' ? '🇦🇷' : '🇺🇸'}</span>
        <span className={styles.monedaChipLabel}>{moneda}</span>
      </button>
      <div className={styles.montoDivider} />
      <div className={styles.montoHeroInput}>
        <span className={styles.montoHeroPrefix}>$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={styles.montoHeroField}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="0"
          disabled={disabled}
          autoComplete="off"
        />
      </div>
    </div>
  )
}

export default function GoalModal({
  open, onClose, goal, onSuccess
}: GoalModalProps) {
  const isEdit = !!goal
  const { showToast } = useToast()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [animClass, setAnimClass] = useState('')

  const {
    step, nombre, monto_objetivo, moneda, fecha_limite, color, nota, estado, localError, isSubmitting
  } = state

  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value } as FormAction)
    if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null } as FormAction)
  }, [localError])

  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET', goal: goal || null })
    }
  }, [open, goal])

  const goNext = () => {
    if (step === 1 && (!nombre || !monto_objetivo)) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Completá el nombre y el monto para continuar' })
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
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload: Partial<Goal> = {
        nombre,
        monto_objetivo: monto_objetivo!,
        moneda,
        fecha_limite: fecha_limite || null,
        color,
        nota,
        estado
      }

      if (isEdit) {
        await goalsService.updateGoal(goal!.id, payload)
        showToast('Meta actualizada', 'success')
      } else {
        await goalsService.createGoal(payload)
        showToast('Meta creada', 'success')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ detail: unknown }>
      const detail = error.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail[0]?.msg || 'Error de validación'
          : 'Error al guardar la meta. Reintentá luego.'
      dispatch({ type: 'SET_FIELD', field: 'localError', value: msg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding autoHeight ariaLabel="Gestionar meta">
      <div className={styles.slidesContainer}>
        {/* Dots */}
        <div className={styles.stepDots}>
          {[1, 2].map(s => (
            <div key={s} className={`${styles.stepDot} ${step === s ? styles.stepDotActive : styles.stepDotInactive}`} />
          ))}
        </div>

        {/* STEP 1: Nombre y Monto */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>{isEdit ? 'Editar meta' : 'Nueva meta'}</h2>
                <button className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Nombre de la meta</label>
                  <div className={styles.inputWrapper}>
                    <Target size={18} />
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={nombre}
                      onChange={e => setField('nombre', e.target.value)}
                      placeholder="Ej: Nueva Notebook, Fondo de Emergencia..."
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>¿Cuánto necesitás?</label>
                  <MontoHero
                    value={monto_objetivo}
                    onChange={v => setField('monto_objetivo', v)}
                    moneda={moneda}
                    onMonedaChange={m => setField('moneda', m)}
                    disabled={isEdit && (goal?.movimientos?.length ?? 0) > 0}
                  />
                  {(isEdit && (goal?.movimientos?.length ?? 0) > 0) ? (
                    <p className={`${styles.fieldHint} ${styles.warning}`}>
                      No podés cambiar la moneda porque ya hay movimientos registrados.
                    </p>
                  ) : (
                    <p className={styles.fieldHint}>Este será el objetivo total a alcanzar.</p>
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                <button className={styles.submitBtn} onClick={goNext}>Continuar</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Detalles */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Detalles finales</h2>
                <button className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.row}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Fecha límite (Opcional)</label>
                    <div className={styles.inputWrapper}>
                      <Calendar size={18} />
                      <input
                        type="date"
                        className={styles.fieldInput}
                        value={fecha_limite}
                        onChange={e => setField('fecha_limite', e.target.value)}
                        title="Fecha límite para cumplir la meta"
                      />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Color distintivo</label>
                    <div className={styles.colorPickerWrap}>
                      <Palette size={18} />
                      <div className={styles.colorPicker}>
                        <input
                          type="color"
                          value={color}
                          onChange={e => setField('color', e.target.value)}
                          title="Elegir un color para la meta"
                        />
                        <span className={styles.colorHex}>{color}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Notas o motivación</label>
                  <div className={styles.textareaWrapper}>
                    <StickyNote size={18} className={styles.textareaIcon} />
                    <textarea
                      className={styles.textarea}
                      value={nota}
                      onChange={e => setField('nota', e.target.value)}
                      placeholder="¿Por qué es importante esta meta? ¿Algún detalle extra?"
                    />
                  </div>
                </div>

                {isEdit && (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Estado de la meta</label>
                    <div className={styles.statusGrid}>
                      {(['activa', 'pausada'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`${styles.statusBtn} ${estado === s ? styles.statusBtnActive : ''}`}
                          onClick={() => setField('estado', s)}
                          disabled={estado === EstadoMeta.COMPLETADA}
                        >
                          {estado === s && <Check size={14} />}
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    {estado === EstadoMeta.COMPLETADA && (
                      <p className={styles.fieldHint}>Esta meta ya fue completada y no puede pausarse.</p>
                    )}
                    <p className={styles.fieldHint}>
                      El estado "Completada" se asigna automáticamente cuando alcances tu objetivo.
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.formFooter}>
                <button className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear meta'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
