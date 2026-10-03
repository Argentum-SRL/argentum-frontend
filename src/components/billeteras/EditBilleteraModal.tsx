import { useEffect, useReducer, useRef, useState } from 'react'
import { X, Pencil, TrendingUp, Star, Landmark } from '@/components/ui/icons'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import type { BankDefinition } from '@/lib/constants/banks'
import styles from './BankPickerModal.module.css'
import Modal from '@/components/ui/Modal/Modal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'

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

function EditLogo({
  bank,
  customNombre,
  esEfectivo,
}: {
  bank?: BankDefinition
  customNombre?: string
  esEfectivo?: boolean
}) {
  const [hasError, setHasError] = useState(false)
  const url = bank ? getBankLogoUrl(bank.logoPath) : ''
  const id = bank ? bank.id : esEfectivo ? 'efectivo' : 'custom'

  if (url && !hasError) {
    return (
      <div 
        className={`${styles.pickerLogoCircle} ${styles.size36}`} 
        data-bank={id}
      >
        <img 
          src={url} 
          alt={bank?.nombre || customNombre || 'Billetera'} 
          width={22} 
          height={22} 
          className={styles.pickerLogoImg} 
          onError={() => setHasError(true)}
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
      <span className={`${styles.pickerLogoInitials} ${styles.initials36}`}>{init}</span>
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
  isEditingName: boolean
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
        isSubmitting: false,
        isEditingName: false,
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
    isSubmitting: false,
    isEditingName: false,
  })

  const { nombre, esPrincipal, esInversion, tna, tnaTouched, isSubmitting, isEditingName } = state
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && billetera) {
      dispatch({ type: 'INITIALIZE', billetera })
    }
  }, [isOpen, billetera])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      const len = nameInputRef.current.value.length
      nameInputRef.current.setSelectionRange(len, len)
    }
  }, [isEditingName])

  const bank = billetera?.bank_id
    ? getBankById(billetera.bank_id)
    : !billetera?.es_efectivo && billetera?.nombre
      ? findBankByNombre(billetera.nombre)
      : undefined

  const tipoLabel = billetera?.es_efectivo
    ? 'Efectivo'
    : bank?.tipo === 'billetera_virtual'
    ? 'Billetera virtual'
    : bank?.tipo === 'banco_digital'
    ? 'Banco digital'
    : bank?.tipo === 'plataforma_inversion'
    ? 'Plataforma de inversión'
    : bank
    ? 'Banco tradicional'
    : 'Personalizada'

  // Estimación de rendimiento diario inteligente según saldo actual
  const tnaNum = parseFloat(tna) || 0
  const saldoNum = billetera?.saldo_actual || 0
  let yieldText = ''
  if (tnaNum > 0) {
    const dailyRate = tnaNum / 365
    if (saldoNum > 0) {
      const dailyIncome = (saldoNum * (tnaNum / 100)) / 365
      const formattedIncome = dailyIncome.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      yieldText = `+${billetera?.moneda === 'USD' ? 'US$' : '$'} ${formattedIncome}/día (~${dailyRate.toFixed(2)}%)`
    } else {
      yieldText = `~${dailyRate.toFixed(2)}% diario estimado`
    }
  }

  const muestraAdvertencia = esPrincipal && !billetera?.es_principal && billeteraPrincipalActual

  const {
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    containerStyle,
  } = useAdaptiveModalHeight({
    enabled: isOpen && !!billetera,
    deps: [nombre, esPrincipal, esInversion, tna, muestraAdvertencia, isEditingName, yieldText],
    extraPadding: 4,
  })

  if (!isOpen || !billetera) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedNombre = nombre.trim() || billetera.nombre
    if (!trimmedNombre || isSubmitting) return
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload: EditPayload = {
        nombre: trimmedNombre,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel="Editar billetera"
    >
      <form
        onSubmit={handleSubmit}
        className={styles.formContainer}
        style={containerStyle}
      >
        {/* Cuerpo scrolleable que incluye el header (arquitectura idéntica a BankPickerModal) */}
        <div
          ref={formBodyRef}
          className={`${styles.formBody} ${styles.formBodyWithHeader}`}
        >
          {/* Header del form */}
          <div className={styles.formHeader}>
            <div className={styles.bankPreview}>
              <EditLogo
                bank={bank}
                customNombre={billetera.nombre}
                esEfectivo={billetera.es_efectivo}
              />
              <div className={styles.bankPreviewInfo}>
                <div className={styles.bankPreviewNombreRow}>
                  {isEditingName ? (
                    <div className={styles.bankPreviewInputWrapper}>
                      <input
                        ref={nameInputRef}
                        type="text"
                        className={styles.bankPreviewNombreInput}
                        value={nombre}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombre', value: e.target.value })}
                        onBlur={() => {
                          if (!nombre.trim()) {
                            dispatch({ type: 'SET_FIELD', field: 'nombre', value: billetera.nombre })
                          }
                          dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (!nombre.trim()) {
                              dispatch({ type: 'SET_FIELD', field: 'nombre', value: billetera.nombre })
                            }
                            dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                          } else if (e.key === 'Escape') {
                            dispatch({ type: 'SET_FIELD', field: 'nombre', value: billetera.nombre })
                            dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                          }
                        }}
                        placeholder={billetera.nombre}
                        maxLength={40}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.bankPreviewNombreBtn}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: true })}
                      title="Editar nombre"
                    >
                      <span className={styles.bankPreviewNombreText}>
                        {nombre.trim() || billetera.nombre}
                      </span>
                      <span className={styles.pencilIconWrapper} aria-hidden="true">
                        <Pencil size={13} strokeWidth={2} />
                      </span>
                    </button>
                  )}
                </div>
                <p className={styles.bankPreviewTipo}>
                  {tipoLabel}
                </p>
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

          {/* Campos del form agrupados en formFields con padding dedicado */}
          <div className={styles.formFields}>
            <div className={styles.settingsCardsList}>
              {/* Card 1: Rendimiento (TNA) — solo si no es efectivo */}
              {!billetera.es_efectivo && (
                <div className={styles.settingCard}>
                  <div className={`${styles.settingIconBox} ${styles.iconBoxPrimary}`}>
                    <TrendingUp size={18} strokeWidth={2} />
                  </div>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabelRow}>
                      <label htmlFor="edit-tna" className={styles.settingLabel}>
                        Rendimiento (TNA)
                      </label>
                    </div>
                    <span className={`${styles.settingSub} ${yieldText ? styles.settingSubHighlight : ''}`}>
                      {yieldText || 'Rendimiento anual estimado'}
                    </span>
                  </div>
                  <div className={styles.tnaInputBadge}>
                    <input
                      id="edit-tna"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      className={styles.tnaInput}
                      value={tna}
                      onChange={(e) => {
                        dispatch({ type: 'SET_FIELD', field: 'tna', value: e.target.value })
                        dispatch({ type: 'SET_FIELD', field: 'tnaTouched', value: true })
                      }}
                      placeholder="0.0"
                    />
                    <span className={styles.tnaSuffix} aria-hidden="true">%</span>
                  </div>
                </div>
              )}

              {/* Card 2: Marcar como principal */}
              <button
                type="button"
                className={`${styles.settingCard} ${styles.settingCardClickable} ${
                  esPrincipal ? styles.settingCardActiveGold : ''
                }`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'esPrincipal', value: !esPrincipal })}
                role="switch"
                aria-checked={esPrincipal}
                aria-label="Marcar como billetera principal"
              >
                <div
                  className={`${styles.settingIconBox} ${
                    esPrincipal ? styles.iconBoxGold : styles.iconBoxDefault
                  }`}
                >
                  <Star size={18} strokeWidth={2} className={esPrincipal ? styles.starFilled : ''} />
                </div>
                <div className={styles.settingInfo}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabel}>Marcar como principal</span>
                    {esPrincipal && <span className={styles.badgePillGold}>Principal</span>}
                  </div>
                  <span className={styles.settingSub}>
                    Usar por defecto en transacciones
                  </span>
                </div>
                <div
                  className={`${styles.customSwitch} ${esPrincipal ? styles.switchActiveGold : ''}`}
                  aria-hidden="true"
                >
                  <div
                    className={`${styles.customSwitchThumb} ${
                      esPrincipal ? styles.switchThumbActive : ''
                    }`}
                  />
                </div>
              </button>

              {/* Card 3: Cuenta de inversión */}
              <button
                type="button"
                className={`${styles.settingCard} ${styles.settingCardClickable} ${
                  esInversion ? styles.settingCardActiveGreen : ''
                }`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'esInversion', value: !esInversion })}
                role="switch"
                aria-checked={esInversion}
                aria-label="Marcar como cuenta de inversión"
              >
                <div
                  className={`${styles.settingIconBox} ${
                    esInversion ? styles.iconBoxGreen : styles.iconBoxDefault
                  }`}
                >
                  <Landmark size={18} strokeWidth={2} />
                </div>
                <div className={styles.settingInfo}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabel}>Cuenta de inversión</span>
                    {esInversion && <span className={styles.badgePillGreen}>Inversión</span>}
                  </div>
                  <span className={styles.settingSub}>
                    Para rendimientos o ahorro a largo plazo
                  </span>
                </div>
                <div
                  className={`${styles.customSwitch} ${esInversion ? styles.switchActiveGreen : ''}`}
                  aria-hidden="true"
                >
                  <div
                    className={`${styles.customSwitchThumb} ${
                      esInversion ? styles.switchThumbActive : ''
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Advertencia si ya hay una principal */}
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
        </div>

        {/* Footer fijo */}
        <div ref={formFooterRef} className={styles.formFooter}>
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
