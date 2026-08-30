import { useEffect, useReducer, useState, useCallback } from 'react'
import {
  Target,
  X,
  ChevronLeft,
  StickyNote,
  Check,
  AlertCircle
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import goalsService from '@/services/goals.service'
import styles from './GoalModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { useToast } from '@/hooks/useToast'
import { DateInput, ColorPicker } from '@/components/ui'
import { getErrorMessage } from '@/utils/errorMessages'

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
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Escribí un nombre para la meta' })
      return
    }
    if (trimmedNombre.length > 100) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El nombre no puede superar los 100 caracteres' })
      return
    }
    if (!monto_objetivo || monto_objetivo <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto objetivo mayor a 0' })
      return
    }
    if (monto_objetivo > 9999999999999.99) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto objetivo es demasiado alto' })
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
    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Escribí un nombre para la meta' })
      return
    }
    if (trimmedNombre.length > 100) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El nombre no puede superar los 100 caracteres' })
      return
    }
    if (!monto_objetivo || monto_objetivo <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto objetivo mayor a 0' })
      return
    }
    if (monto_objetivo > 9999999999999.99) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto objetivo es demasiado alto' })
      return
    }
    const hoyStr = new Date().toLocaleDateString('en-CA')
    if (fecha_limite && fecha_limite < hoyStr) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'La fecha límite no puede ser anterior a hoy' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload: Partial<Goal> = {
        nombre: trimmedNombre,
        monto_objetivo: monto_objetivo,
        moneda,
        fecha_limite: fecha_limite || null,
        color,
        nota: nota.trim() || null,
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
      const msg = getErrorMessage(err, 'Error al guardar la meta. Reintentá luego.')
      dispatch({ type: 'SET_FIELD', field: 'localError', value: msg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding autoHeight ariaLabel="Gestionar meta">
      {/* Indicador de pasos */}
      <div className={styles.stepIndicator} aria-hidden="true">
        {[1, 2].map(s => (
          <div key={s} className={`${styles.dot} ${step === s ? styles.dotActive : styles.dotInactive}`} />
        ))}
      </div>

      <div className={styles.slidesContainer}>
        {/* STEP 1: Nombre y Monto */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>{isEdit ? 'Editar meta' : 'Nueva meta'}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" title="Cerrar"><X size={18} strokeWidth={1.75} /></button>
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
                      maxLength={100}
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <MontoInput
                    value={monto_objetivo}
                    onChange={v => setField('monto_objetivo', v)}
                    moneda={moneda}
                    onMonedaChange={m => setField('moneda', m)}
                    disabled={isEdit && (goal?.movimientos?.length ?? 0) > 0}
                    allowDecimals={true}
                    max={9999999999999.99}
                    label="¿Cuánto necesitás?"
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
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Detalles */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} aria-label="Atrás" title="Atrás"><ChevronLeft size={20} strokeWidth={1.75} /></button>
                <h2 className={styles.headerTitle}>Detalles finales</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar" title="Cerrar"><X size={18} strokeWidth={1.75} /></button>
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
                    <DateInput
                      value={fecha_limite}
                      onChange={val => setField('fecha_limite', val)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <ColorPicker
                      label="Color distintivo"
                      value={color}
                      onChange={val => setField('color', val)}
                    />
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
                      maxLength={1000}
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
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear meta'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}
