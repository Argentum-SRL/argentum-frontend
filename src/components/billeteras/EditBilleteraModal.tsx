import { useEffect, useReducer } from 'react'
import { X, Check } from 'lucide-react'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import type { BankDefinition } from '@/lib/constants/banks'
import styles from './BankPickerModal.module.css'
import Modal from '@/components/ui/Modal/Modal'

export interface EditPayload {
  nombre: string
  es_principal: boolean
  es_inversion?: boolean
  tna?: number | null
}

interface EditBilleteraModalProps {
  isOpen: boolean
  onClose: () => void
  onEditar: (id: string, payload: EditPayload) => Promise<void>
  billetera: Billetera | null
  billeteraPrincipalActual: Billetera | undefined
}

function EditLogo({ bank, customNombre }: { bank?: BankDefinition, customNombre?: string }) {
  const url = bank ? getBankLogoUrl(bank.logoPath) : ''
  const id = bank ? bank.id : 'custom'

  if (bank && url) {
    return (
      <div 
        className={`${styles.pickerLogoCircle} ${styles.size36}`} 
        data-bank={id}
      >
        <img 
          src={url} 
          alt={bank.nombre} 
          width={22} 
          height={22} 
          className={styles.pickerLogoImg} 
        />
      </div>
    )
  }

  const init = getInitials(bank ? bank.nombre : (customNombre || 'Mi'))
  return (
    <div 
      className={`${styles.pickerLogoCircle} ${styles.size36}`} 
      data-bank={id}
    >
      <span className={`${styles.bankPreviewIconInitials} ${styles.initials36}`}>{init}</span>
    </div>
  )
}

interface EditState {
  nombre: string
  esPrincipal: boolean
  esInversion: boolean
  tna: string
  tnaTouched: boolean
  isSubmitting: boolean
}

type EditAction = 
  | { type: 'INITIALIZE'; billetera: Billetera }
  | { [K in keyof EditState]: { type: 'SET_FIELD'; field: K; value: EditState[K] } }[keyof EditState]

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        nombre: action.billetera.nombre,
        esPrincipal: action.billetera.es_principal,
        esInversion: Boolean(action.billetera.es_inversion),
        tna: action.billetera.tna != null ? String(action.billetera.tna) : '',
        tnaTouched: false,
        isSubmitting: false
      }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

export default function EditBilleteraModal({
  isOpen,
  onClose,
  onEditar,
  billetera,
  billeteraPrincipalActual,
}: EditBilleteraModalProps) {
  const [state, dispatch] = useReducer(editReducer, {
    nombre: '',
    esPrincipal: false,
    esInversion: false,
    tna: '',
    tnaTouched: false,
    isSubmitting: false
  })

  const { nombre, esPrincipal, esInversion, tna, tnaTouched, isSubmitting } = state

  useEffect(() => {
    if (isOpen && billetera) {
      dispatch({ type: 'INITIALIZE', billetera })
    }
  }, [isOpen, billetera])


  if (!isOpen || !billetera) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || isSubmitting) return
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload: EditPayload = {
        nombre: nombre.trim(),
        es_principal: esPrincipal,
        es_inversion: esInversion,
      }
      if (!billetera.es_efectivo && tnaTouched) {
        const trimmed = tna.trim()
        if (trimmed !== '') {
          const parsed = parseFloat(trimmed)
          if (!isNaN(parsed) && parsed >= 0) {
            payload.tna = parsed
          }
        } else {
          if (billetera.tna != null) {
            payload.tna = null
          }
        }
      }
      await onEditar(billetera.id, payload)
      onClose()
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const bank = billetera.bank_id
    ? getBankById(billetera.bank_id)
    : !billetera.es_efectivo
      ? findBankByNombre(billetera.nombre)
      : undefined

  const muestraAdvertencia = esPrincipal && !billetera.es_principal && billeteraPrincipalActual

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel="Editar billetera"
    >
      <form onSubmit={handleSubmit} className={`${styles.formContainer} ${styles.formContainerFlex}`}>
        
        <div className={styles.formHeader}>
          <div className={`${styles.bankPreview} ${styles.bankPreviewNoMargin}`}>
            <EditLogo bank={bank} customNombre={billetera.nombre} />
            <div className={styles.bankPreviewInfo}>
              <p className={styles.bankPreviewNombre}>Editar Billetera</p>
              <p className={styles.bankPreviewTipo}>{billetera.nombre}</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.formBody}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="edit-nombre">
              Nombre
            </label>
            <input
              id="edit-nombre"
              type="text"
              className={styles.fieldInput}
              value={nombre}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombre', value: e.target.value })}
              placeholder="Nombre de tu billetera"
              required
              autoFocus
            />
          </div>

          {!billetera.es_efectivo && (
            <div className={styles.formField}>
              <label className={styles.fieldLabel} htmlFor="edit-tna">
                Tasa (TNA %) <span className={styles.fieldOptional}>(opcional)</span>
              </label>
              <input
                id="edit-tna"
                type="number"
                step="0.01"
                min="0"
                className={styles.fieldInput}
                value={tna}
                onChange={(e) => {
                  dispatch({ type: 'SET_FIELD', field: 'tna', value: e.target.value })
                  dispatch({ type: 'SET_FIELD', field: 'tnaTouched', value: true })
                }}
                placeholder="Ej: 36.50"
              />
            </div>
          )}


          <button
            type="button"
            className={styles.principalRow}
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'esPrincipal', value: !esPrincipal })}
            aria-label={esPrincipal ? 'Desmarcar como principal' : 'Marcar como principal'}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                dispatch({ type: 'SET_FIELD', field: 'esPrincipal', value: !esPrincipal })
              }
            }}
          >
            <div className={`${styles.checkbox} ${esPrincipal ? styles.checkboxActive : ''}`}>
              {esPrincipal && <Check size={11} strokeWidth={3} color="white" />}
            </div>
            <div className={styles.principalInfo}>
              <span className={styles.principalLabel}>Marcar como principal</span>
              <span className={styles.principalSub}>
                Se usa por defecto al registrar transacciones
              </span>
            </div>
          </button>

          {muestraAdvertencia && (
            <div className={styles.warningBox}>
              <span className={styles.warningIcon}>⚠️</span>
              <p className={styles.warningText}>
                Esto va a quitar el estado principal de{' '}
                <strong>{billeteraPrincipalActual?.nombre}</strong>.
              </p>
            </div>
          )}

          <button
            type="button"
            className={styles.principalRow}
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'esInversion', value: !esInversion })}
            aria-label={esInversion ? 'Desmarcar como billetera de inversión' : 'Marcar como billetera de inversión'}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                dispatch({ type: 'SET_FIELD', field: 'esInversion', value: !esInversion })
              }
            }}
          >
            <div className={`${styles.checkbox} ${esInversion ? styles.checkboxActive : ''}`}>
              {esInversion && <Check size={11} strokeWidth={3} color="white" />}
            </div>
            <div className={styles.principalInfo}>
              <span className={styles.principalLabel}>Billetera de inversión</span>
              <span className={styles.principalSub}>
                Inversión o ahorro a largo plazo
              </span>
            </div>
          </button>
        </div>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.crearBtn}
            disabled={!nombre.trim() || isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
