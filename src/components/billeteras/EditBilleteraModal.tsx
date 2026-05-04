import { useEffect, useCallback, useReducer } from 'react'
import { X, Check } from 'lucide-react'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import type { BankDefinition } from '@/lib/constants/banks'
import styles from './BankPickerModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

export interface EditPayload {
  nombre: string
  saldo_inicial: number
  es_principal: boolean
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
  saldo: number | null
  esPrincipal: boolean
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
        saldo: action.billetera.saldo_inicial || 0,
        esPrincipal: action.billetera.es_principal,
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
    saldo: null,
    esPrincipal: false,
    isSubmitting: false
  })

  const { nombre, saldo, esPrincipal, isSubmitting } = state

  useEffect(() => {
    if (isOpen && billetera) {
      dispatch({ type: 'INITIALIZE', billetera })
    }
  }, [isOpen, billetera])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !billetera) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || isSubmitting) return
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await onEditar(billetera.id, {
        nombre: nombre.trim(),
        saldo_inicial: saldo || 0,
        es_principal: esPrincipal,
      })
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
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Editar billetera"
    >
      <div className={`${styles.modal} ${styles.modalAuto}`}>
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

            <div className={styles.formField}>
              <MontoInput
                value={saldo}
                onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'saldo', value: v })}
                moneda={billetera.moneda}
                label="Saldo inicial"
                placeholder="0"
                allowDecimals
                optional
              />
            </div>

            <button
              type="button"
              className={styles.principalRow}
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'esPrincipal', value: !esPrincipal })}
              role="checkbox"
              aria-checked={esPrincipal}
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
      </div>
    </div>
  )
}
