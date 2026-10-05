import { useEffect, useReducer, useRef, useState, useMemo } from 'react'
import { X, Pencil, Star, Landmark, ChevronRight, SlidersHorizontal, AlertTriangle } from '@/components/ui/icons'
import type { Billetera, EntidadTasa } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import type { BankDefinition } from '@/lib/constants/banks'
import styles from './EditBilleteraModal.module.css'
import Modal from '@/components/ui/Modal/Modal'
import { Field, SelectInput, type SelectOption } from '@/components/ui'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import billeteraService from '@/services/billetera.service'

export interface EditPayload {
  nombre: string
  es_principal: boolean
  es_inversion?: boolean
  tna?: number | null
  bank_id?: string | null
  nivel_tasa?: string | null
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
        className={styles.bankPreviewLogo} 
        data-bank={id}
      >
        <img 
          src={url} 
          alt={bank?.nombre || customNombre || 'Billetera'} 
          className={styles.bankPreviewLogoImg} 
          onError={() => setHasError(true)}
        />
      </div>
    )
  }

  const init = getInitials(bank ? bank.nombre : (customNombre || 'Mi'))
  return (
    <div 
      className={styles.bankPreviewLogo} 
      data-bank={id}
    >
      <span className={styles.bankPreviewLogoInitials}>{init}</span>
    </div>
  )
}

interface EditState {
  nombre: string
  esPrincipal: boolean
  esInversion: boolean
  tna: string
  tnaTouched: boolean
  bankId: string | null
  nivelTasa: string | null
  nivelTasaTouched: boolean
  opcionesAvanzadasOpen: boolean
  isSubmitting: boolean
  isEditingName: boolean
}

type EditAction = 
  | { type: 'INITIALIZE'; billetera: Billetera }
  | { [K in keyof EditState]: { type: 'SET_FIELD'; field: K; value: EditState[K] } }[keyof EditState]

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'INITIALIZE': {
      const initialBankId = action.billetera.bank_id || action.billetera.entidad_efectiva || null
      return {
        nombre: action.billetera.nombre,
        esPrincipal: action.billetera.es_principal,
        esInversion: Boolean(action.billetera.es_inversion),
        tna: action.billetera.tna != null ? String(action.billetera.tna) : '',
        tnaTouched: false,
        bankId: initialBankId,
        nivelTasa: action.billetera.nivel_tasa || null,
        nivelTasaTouched: false,
        opcionesAvanzadasOpen: false,
        isSubmitting: false,
        isEditingName: false,
      }
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
    bankId: null,
    nivelTasa: null,
    nivelTasaTouched: false,
    opcionesAvanzadasOpen: false,
    isSubmitting: false,
    isEditingName: false,
  })

  const [entidades, setEntidades] = useState<EntidadTasa[]>([])

  const {
    nombre,
    esPrincipal,
    esInversion,
    tna,
    tnaTouched,
    bankId,
    nivelTasa,
    nivelTasaTouched,
    opcionesAvanzadasOpen,
    isSubmitting,
    isEditingName,
  } = state

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && billetera) {
      dispatch({ type: 'INITIALIZE', billetera })
    }
  }, [isOpen, billetera])

  useEffect(() => {
    if (isOpen) {
      billeteraService.getEntidades().then(setEntidades).catch(console.error)
    }
  }, [isOpen])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      const len = nameInputRef.current.value.length
      nameInputRef.current.setSelectionRange(len, len)
    }
  }, [isEditingName])

  const bank = bankId
    ? getBankById(bankId)
    : !billetera?.es_efectivo && billetera?.nombre
      ? findBankByNombre(billetera.nombre)
      : undefined

  const entidadSeleccionada = useMemo(() => {
    if (!bankId || bankId === 'custom') return null
    return entidades.find((e) => e.id === bankId) || null
  }, [entidades, bankId])

  const tieneNiveles = Boolean(
    entidadSeleccionada &&
    entidadSeleccionada.opciones.length > 0 &&
    (entidadSeleccionada.opciones.length > 1 || entidadSeleccionada.clave_base === null)
  )

  const nivelOpciones = entidadSeleccionada ? entidadSeleccionada.opciones : []
  const opcionSeleccionada = nivelOpciones.find((o) => o.clave === nivelTasa)

  const selectOptions = useMemo<SelectOption[]>(() => {
    if (!entidadSeleccionada) return []
    const opts: SelectOption[] = []
    opts.push({
      value: '',
      label: entidadSeleccionada.clave_base ? 'Tasa base' : 'Ninguna de estas',
    })
    entidadSeleccionada.opciones
      .filter((opt) => opt.clave !== entidadSeleccionada.clave_base)
      .forEach((opt) => {
        const tnaTexto = opt.tna != null ? `${opt.tna}% TNA` : 'sin dato'
        opts.push({
          value: opt.clave,
          label: `${opt.etiqueta || opt.clave} · ${tnaTexto}`,
        })
      })
    return opts
  }, [entidadSeleccionada])

  const tasaAutoHoy = useMemo(() => {
    if (!entidadSeleccionada) return null
    if (nivelTasa) {
      const opt = entidadSeleccionada.opciones.find((o) => o.clave === nivelTasa)
      return opt?.tna ?? null
    }
    if (entidadSeleccionada.clave_base) {
      const opt = entidadSeleccionada.opciones.find((o) => o.clave === entidadSeleccionada.clave_base)
      return opt?.tna ?? null
    }
    return null
  }, [entidadSeleccionada, nivelTasa])

  const muestraAdvertencia = esPrincipal && !billetera?.es_principal && billeteraPrincipalActual

  const {
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    containerStyle,
  } = useAdaptiveModalHeight({
    enabled: isOpen && !!billetera,
    deps: [nombre, esPrincipal, esInversion, tna, bankId, nivelTasa, opcionesAvanzadasOpen, muestraAdvertencia, isEditingName],
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

      if (!billetera.es_efectivo) {
        const currentNivel = billetera.nivel_tasa || null
        if (nivelTasaTouched && nivelTasa !== currentNivel) {
          payload.nivel_tasa = nivelTasa
        }

        if (tnaTouched) {
          const trimmed = tna.trim()
          if (trimmed !== '') {
            const parsed = parseFloat(trimmed)
            if (!isNaN(parsed) && parsed >= 0) {
              if (parsed !== billetera.tna) {
                payload.tna = parsed
              }
            }
          } else {
            if (billetera.tna != null) {
              payload.tna = null
            }
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
        {/* Cuerpo scrolleable que incluye el header */}
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

          {/* Campos del form agrupados en formFields */}
          <div className={styles.formFields}>
            <div className={styles.settingsCardsList}>
              {/* Card 1: Marcar como principal */}
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

              {/* Card 2: Cuenta de inversión */}
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

              {/* Card 3: Opciones avanzadas — plegable, solo si no es efectivo */}
              {!billetera.es_efectivo && (
                <button
                  type="button"
                  className={`${styles.settingCard} ${styles.settingCardClickable} ${
                    opcionesAvanzadasOpen ? styles.settingCardActiveBlue : ''
                  }`}
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'opcionesAvanzadasOpen', value: !opcionesAvanzadasOpen })}
                  aria-expanded={opcionesAvanzadasOpen}
                  aria-label="Opciones avanzadas"
                >
                  <div
                    className={`${styles.settingIconBox} ${
                      opcionesAvanzadasOpen ? styles.iconBoxBlue : styles.iconBoxDefault
                    }`}
                  >
                    <SlidersHorizontal size={18} strokeWidth={2} />
                  </div>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabelRow}>
                      <span className={styles.settingLabel}>Opciones avanzadas</span>
                    </div>
                    <span className={styles.settingSub}>
                      Tasa de interés y configuración personalizada
                    </span>
                  </div>
                  <div className={`${styles.chevronWrapper} ${opcionesAvanzadasOpen ? styles.chevronOpen : ''}`}>
                    <ChevronRight size={18} strokeWidth={2} />
                  </div>
                </button>
              )}
            </div>

            {/* Contenido desplegable de Opciones avanzadas */}
            {!billetera.es_efectivo && opcionesAvanzadasOpen && (
              <div className={styles.opcionesAvanzadasContent}>
                {/* 1. Selector Nivel de tasa (solo si la entidad tiene niveles) */}
                {tieneNiveles && (
                  <div className={styles.advancedField}>
                    <SelectInput
                      id="edit-nivel"
                      label="Nivel de tasa"
                      value={nivelTasa || ''}
                      onChange={(val) => {
                        dispatch({ type: 'SET_FIELD', field: 'nivelTasa', value: val === '' ? null : val })
                        dispatch({ type: 'SET_FIELD', field: 'nivelTasaTouched', value: true })
                      }}
                      options={selectOptions}
                      placeholder="Seleccionar nivel..."
                    />
                    {opcionSeleccionada?.condiciones && (
                      <div className={styles.condicionesCard}>
                        {opcionSeleccionada.condiciones}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Tasa propia (TNA %) usando Field global */}
                <div className={styles.advancedField}>
                  <Field
                    id="edit-tna-propia"
                    label="Tasa propia (TNA %)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    placeholder="0.0"
                    value={tna}
                    onChange={(val) => {
                      dispatch({ type: 'SET_FIELD', field: 'tna', value: val })
                      dispatch({ type: 'SET_FIELD', field: 'tnaTouched', value: true })
                    }}
                    rightSlot={<span className={styles.tnaSuffix}>%</span>}
                    hint="Si la cargás, reemplaza la tasa automática."
                    className={styles.tnaField}
                  />
                  {tna.trim() !== '' && tasaAutoHoy != null && entidadSeleccionada && (
                    <p className={styles.usarAutomaticaText}>
                      La tasa de hoy de {entidadSeleccionada.nombre} es {tasaAutoHoy}%.
                      <button
                        type="button"
                        className={styles.usarAutomaticaBtn}
                        onClick={() => {
                          dispatch({ type: 'SET_FIELD', field: 'tna', value: '' })
                          dispatch({ type: 'SET_FIELD', field: 'tnaTouched', value: true })
                        }}
                      >
                        Usar la automática
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Advertencia si ya hay una principal */}
            {muestraAdvertencia && (
              <div className={styles.warningBox}>
                <span className={styles.warningIcon} aria-hidden="true">
                  <AlertTriangle size={15} strokeWidth={2} />
                </span>
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
