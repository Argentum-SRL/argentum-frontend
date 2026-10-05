import { useState, useMemo, useEffect, useReducer, useRef } from 'react'
import { X, ChevronLeft, Search, Check, Pencil, TrendingUp, Star, Landmark, AlertTriangle } from '@/components/ui/icons'
import { BANKS, BANK_SECTIONS, CUSTOM_COLORS } from '@/lib/constants/banks'
import type { BankDefinition } from '@/lib/constants/banks'
import type { Billetera, EntidadTasa, EstimacionRendimiento } from '@/types'
import { getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import styles from './BankPickerModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import Modal from '@/components/ui/Modal/Modal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import billeteraService from '@/services/billetera.service'
import { formatMonto } from '@/utils/format'

export interface CreatePayload {
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_inicial: number
  es_principal: boolean
  es_inversion?: boolean
  bank_id: string | null
  tna?: number | null
}

function formatDiaMes(fechaStr?: string | null): string {
  if (!fechaStr) return ''
  const clean = fechaStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return clean
}

// ── Tipos internos ────────────────────────────────────────────────────────────

type ModalStep = 'picker' | 'form'

interface BankPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onCrear: (payload: CreatePayload) => Promise<void>
  billeterasActuales: Billetera[]
  monedaPrincipalUsuario: 'ARS' | 'USD'
}

// ── Logo en el picker ─────────────────────────────────────────────────────────

function PickerLogo({
  bank,
  size = 44,
}: {
  bank: BankDefinition
  size?: 44 | 36
}) {
  const [hasError, setHasError] = useState(false)
  const url = getBankLogoUrl(bank.logoPath)

  const sizeClass = size === 44 ? styles.size44 : styles.size36
  const fontClass = size === 44 ? styles.initials44 : styles.initials36

  if (!url || hasError) {
    return (
      <div 
        className={`${styles.pickerLogoCircle} ${sizeClass}`} 
        data-bank={bank.id}
      >
        <span className={`${styles.pickerLogoInitials} ${fontClass}`}>
          {getInitials(bank.nombre)}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={`${styles.pickerLogoCircle} ${sizeClass}`} 
      data-bank={bank.id}
    >
      <img
        src={url}
        alt={bank.nombre}
        className={styles.pickerLogoImg}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

// ── Bank Picker Item ──────────────────────────────────────────────────────────

function BankPickerItem({
  bank,
  onSelect,
}: {
  bank: BankDefinition
  onSelect: (bank: BankDefinition) => void
}) {
  return (
    <button
      type="button"
      className={styles.pickerItem}
      data-bank={bank.id}
      onClick={() => onSelect(bank)}
      title={bank.nombre}
    >
      <PickerLogo bank={bank} size={44} />
      <span className={styles.pickerItemNombre}>{bank.nombre}</span>
    </button>
  )
}

// ── Banco personalizado (placeholder) ────────────────────────────────────────

const BANK_CUSTOM: BankDefinition = {
  id: 'custom',
  nombre: 'Otra',
  tipo: 'billetera_virtual',
  colorPrimario: '#8A95A8',
  colorTexto: 'white',
  logoPath: '',
}

// ── State Reducer ─────────────────────────────────────────────────────────────

interface ModalState {
  step: ModalStep
  bankSeleccionado: BankDefinition | null
  slideDirection: 'forward' | 'back'
  searchQuery: string
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo: number | null
  esPrincipal: boolean
  esInversion: boolean
  colorCustom: string
  isSubmitting: boolean
  isEditingName: boolean
}

type ModalAction = 
  | { type: 'RESET'; monedaPrincipal: 'ARS' | 'USD' }
  | { type: 'SET_STEP'; step: ModalStep; direction?: 'forward' | 'back' }
  | { type: 'SELECT_BANK'; bank: BankDefinition }
  | { type: 'SET_SEARCH'; query: string }
  | { [K in keyof ModalState]: { type: 'SET_FIELD'; field: K; value: ModalState[K] } }[keyof ModalState]

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'RESET':
      return {
        step: 'picker',
        bankSeleccionado: null,
        slideDirection: 'forward',
        searchQuery: '',
        nombre: '',
        moneda: action.monedaPrincipal,
        saldo: null,
        esPrincipal: false,
        esInversion: false,
        colorCustom: CUSTOM_COLORS[0],
        isSubmitting: false,
        isEditingName: false,
      }
    case 'SET_STEP':
      return { 
        ...state, 
        step: action.step, 
        slideDirection: action.direction || state.slideDirection 
      }
    case 'SELECT_BANK':
      return {
        ...state,
        bankSeleccionado: action.bank,
        nombre: action.bank.id === 'custom' ? '' : action.bank.nombre,
        slideDirection: 'forward',
        step: 'form',
        isEditingName: action.bank.id === 'custom',
      }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function BankPickerModal({
  isOpen,
  onClose,
  onCrear,
  billeterasActuales,
  monedaPrincipalUsuario,
}: BankPickerModalProps) {
  const [state, dispatch] = useReducer(modalReducer, {
    step: 'picker',
    bankSeleccionado: null,
    slideDirection: 'forward',
    searchQuery: '',
    nombre: '',
    moneda: monedaPrincipalUsuario,
    saldo: null,
    esPrincipal: false,
    esInversion: false,
    colorCustom: CUSTOM_COLORS[0],
    isSubmitting: false,
    isEditingName: false,
  })

  const [entidades, setEntidades] = useState<EntidadTasa[]>([])
  const [estimacion, setEstimacion] = useState<EstimacionRendimiento | null>(null)

  const {
    step,
    bankSeleccionado,
    slideDirection,
    searchQuery,
    nombre,
    moneda,
    saldo,
    esPrincipal,
    esInversion,
    colorCustom,
    isSubmitting,
    isEditingName,
  } = state

  const nameInputRef = useRef<HTMLInputElement>(null)
  const isCustom = bankSeleccionado?.id === 'custom'

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      dispatch({ type: 'RESET', monedaPrincipal: monedaPrincipalUsuario })
      setEstimacion(null)
    }
  }

  const {
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight: dynamicFormHeight,
  } = useAdaptiveModalHeight({
    enabled: step === 'form',
    deps: [step, esPrincipal, isCustom, bankSeleccionado, estimacion],
    extraPadding: 4,
  })

  // Cargar entidades una sola vez al abrir
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

  // Entidad info según catálogo
  const entidadInfo = useMemo(() => {
    if (!bankSeleccionado || bankSeleccionado.id === 'custom') return null
    return entidades.find((e) => e.id === bankSeleccionado.id) || null
  }, [entidades, bankSeleccionado])

  const estimacionValida = useMemo(() => {
    if (step !== 'form' || !bankSeleccionado || bankSeleccionado.id === 'custom' || !entidadInfo?.tipo_fuente) {
      return null
    }
    return estimacion
  }, [step, bankSeleccionado, entidadInfo, estimacion])

  // Estimación de rendimiento con debounce de 400ms al cambiar saldo o cambio de entidad
  useEffect(() => {
    if (step !== 'form' || !bankSeleccionado || bankSeleccionado.id === 'custom' || !entidadInfo?.tipo_fuente) {
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      try {
        const res = await billeteraService.estimarRendimiento({
          saldo: saldo || 0,
          entidad_id: bankSeleccionado.id,
        })
        if (active) {
          setEstimacion(res)
        }
      } catch (err) {
        console.error('Error al estimar rendimiento', err)
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [step, bankSeleccionado, entidadInfo, saldo])

  // Filtrado de bancos
  const bancosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return BANKS
    const q = searchQuery.toLowerCase()
    return BANKS.filter((b) => b.nombre.toLowerCase().includes(q))
  }, [searchQuery])

  const sinResultados = bancosFiltrados.length === 0

  // Billetera principal actual
  const billeteraPrincipalActual = billeterasActuales.find((b) => b.es_principal)

  // Seleccionar banco y pasar al form
  const handleSelectBank = (bank: BankDefinition) => {
    dispatch({ type: 'SELECT_BANK', bank })
  }

  const handleBack = () => {
    dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
    dispatch({ type: 'SET_STEP', step: 'picker', direction: 'back' })
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalNombre = nombre.trim() || (!isCustom ? (bankSeleccionado?.nombre || '') : '')
    if (!bankSeleccionado || !finalNombre || isSubmitting) {
      if (!finalNombre) {
        dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: true })
      }
      return
    }
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await onCrear({
        nombre: nombre.trim(),
        moneda,
        saldo_inicial: saldo || 0,
        es_principal: esPrincipal,
        es_inversion: esInversion,
        bank_id: bankSeleccionado.id === 'custom' ? null : bankSeleccionado.id,
      })
      onClose()
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const mostrarTarjetaRendimiento = Boolean(
    bankSeleccionado && bankSeleccionado.id !== 'custom' && bankSeleccionado.tipo !== 'efectivo' && entidadInfo?.tipo_fuente
  )


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel="Agregar billetera"
    >
      <div className={styles.modalRoot}>
        {/* Indicador de pasos */}
        <div className={styles.stepIndicator} aria-hidden="true">
          <div className={`${styles.dot} ${step === 'picker' ? styles.dotActive : styles.dotInactive}`} />
          <div className={`${styles.dot} ${step === 'form' ? styles.dotActive : styles.dotInactive}`} />
        </div>

        {/* Contenedor con transición de slides y altura adaptativa */}
        <div
          className={`${styles.slidesContainer} ${
            step === 'picker'
              ? styles.pickerStep
              : isCustom
              ? styles.formStepCustom
              : styles.formStep
          }`}
          style={
            step === 'form' && dynamicFormHeight
              ? { height: `${dynamicFormHeight}px` }
              : undefined
          }
        >
        {/* ── PASO 1: PICKER ── */}
        <div
          className={`${styles.slide} ${
            step === 'picker'
              ? styles.slideVisible
              : slideDirection === 'forward'
              ? styles.slideExitLeft
              : styles.slideExitRight
          }`}
        >
          {/* Cuerpo scrolleable que incluye el header */}
          <div className={styles.pickerBody}>
            {/* Header del picker */}
            <div className={styles.pickerHeader}>
              <div className={styles.headerTopRow}>
                <div>
                  <h2 className={styles.pickerTitle}>¿Dónde tenés tu plata?</h2>
                  <p className={styles.pickerSubtitle}>Elegí el banco o billetera para comenzar</p>
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
              {/* Search */}
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} strokeWidth={1.75} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar banco o billetera..."
                  value={searchQuery}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
            {sinResultados ? (
              <div className={styles.noResults}>
                <p className={styles.noResultsText}>
                  No encontramos ese banco.
                </p>
                <p className={styles.noResultsSub}>
                  Podés agregarlo como billetera personalizada.
                </p>
                <button
                  type="button"
                  className={styles.customBtn}
                  onClick={() => handleSelectBank(BANK_CUSTOM)}
                >
                  Agregar billetera personalizada
                </button>
              </div>
            ) : (
              <>
                {BANK_SECTIONS.map((section) => {
                  const bancosDeSeccion = bancosFiltrados.filter(
                    (b) => b.tipo === section.tipo,
                  )
                  if (bancosDeSeccion.length === 0) return null
                  return (
                    <div key={section.tipo} className={styles.section}>
                      <p className={styles.sectionLabel}>{section.titulo}</p>
                      <div className={styles.pickerGrid}>
                        {bancosDeSeccion.map((bank) => (
                          <BankPickerItem
                            key={bank.id}
                            bank={bank}
                            onSelect={handleSelectBank}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Opción "Otra" */}
                <div className={styles.section}>
                  <button
                    type="button"
                    className={styles.otraBtn}
                    onClick={() => handleSelectBank(BANK_CUSTOM)}
                  >
                    + Otra billetera
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── PASO 2: FORMULARIO ── */}
        <div
          className={`${styles.slide} ${
            step === 'form'
              ? styles.slideVisible
              : slideDirection === 'forward'
              ? styles.slideEnterRight
              : styles.slideEnterLeft
          }`}
        >
          {bankSeleccionado && (
            <form onSubmit={handleSubmit} className={styles.formContainer}>
              {/* Cuerpo scrolleable que incluye el header */}
              <div
                ref={formBodyRef}
                className={`${styles.formBody} ${styles.formBodyWithHeader}`}
              >
                {/* Header del form */}
                <div className={styles.formHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={handleBack}
                  aria-label="Volver al picker"
                >
                  <ChevronLeft size={20} strokeWidth={1.75} />
                </button>

                {/* Preview del banco */}
                <div className={styles.bankPreview}>
                  {isCustom ? (
                    <div
                      className={styles.bankPreviewIcon}
                      data-color-hex={colorCustom}
                    >
                      <span className={styles.bankPreviewIconInitials}>
                        {getInitials(nombre || 'Mi')}
                      </span>
                    </div>
                  ) : (
                    <PickerLogo bank={bankSeleccionado} size={36} />
                  )}
                  <div className={styles.bankPreviewInfo}>
                    <div className={styles.bankPreviewNombreRow}>
                      {isEditingName ? (
                        <div className={styles.inlineNameWrap}>
                          <input
                            ref={nameInputRef}
                            type="text"
                            className={styles.inlineNameInput}
                            value={nombre}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombre', value: e.target.value })}
                            onBlur={() => {
                              if (!nombre.trim() && !isCustom && bankSeleccionado) {
                                dispatch({ type: 'SET_FIELD', field: 'nombre', value: bankSeleccionado.nombre })
                              }
                              dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (!nombre.trim() && !isCustom && bankSeleccionado) {
                                  dispatch({ type: 'SET_FIELD', field: 'nombre', value: bankSeleccionado.nombre })
                                }
                                dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                              } else if (e.key === 'Escape') {
                                if (!isCustom && bankSeleccionado) {
                                  dispatch({ type: 'SET_FIELD', field: 'nombre', value: bankSeleccionado.nombre })
                                }
                                dispatch({ type: 'SET_FIELD', field: 'isEditingName', value: false })
                              }
                            }}
                            placeholder={isCustom ? 'Nombre de tu billetera' : bankSeleccionado.nombre}
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
                            {nombre.trim() || (isCustom ? 'Billetera personalizada' : bankSeleccionado.nombre)}
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

              {/* Campos del form */}
              <div className={styles.formFields}>
                {/* Saldo inicial (Hero MontoInput full size) */}
                <div className={styles.montoHeroField}>
                  <MontoInput
                    value={saldo}
                    onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'saldo', value: v })}
                    moneda={moneda}
                    onMonedaChange={(m) => dispatch({ type: 'SET_FIELD', field: 'moneda', value: m })}
                    placeholder="0"
                    allowDecimals
                    autoFocus
                  />
                </div>

                {/* Panel de configuración inteligente & interactivo */}
                <div className={styles.settingsCardsList}>
                  {/* Card 1: Rendimiento (TNA) automático */}
                  {mostrarTarjetaRendimiento && (
                    <div className={styles.settingCard}>
                      <div className={`${styles.settingIconBox} ${styles.iconBoxPrimary}`}>
                        <TrendingUp size={18} strokeWidth={2} />
                      </div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabelRow}>
                          <span className={styles.settingLabel}>
                            Rendimiento (TNA)
                          </span>
                          {estimacionValida?.tna != null && !estimacionValida.vieja && (
                            <span className={styles.badgePillGold}>
                              {estimacionValida.tna}% TNA
                            </span>
                          )}
                        </div>
                        {estimacionValida?.vieja ? (
                          <span className={styles.settingSub}>
                            No tenemos la tasa actualizada de {entidadInfo?.nombre || bankSeleccionado.nombre}.
                          </span>
                        ) : entidadInfo?.clave_base === null && (!estimacionValida || estimacionValida.tna == null) ? (
                          <span className={styles.tasaDatoSmall}>
                            Si cumplís la condición ({entidadInfo.opciones[0]?.condiciones || ''}), elegí tu tasa después en Editar &gt; Opciones avanzadas.
                          </span>
                        ) : (
                          <>
                            {(saldo || 0) > 0 && estimacionValida?.por_dia != null && (
                              <span className={`${styles.settingSub} ${styles.settingSubHighlight}`}>
                                +{formatMonto(estimacionValida.por_dia, moneda)} por día
                              </span>
                            )}
                            {estimacionValida?.fecha_dato && (
                              <span className={styles.tasaDatoSmall}>
                                Tasa de hoy de {entidadInfo?.nombre || bankSeleccionado.nombre}, dato del {formatDiaMes(estimacionValida.fecha_dato)}.{estimacionValida.tope ? ` Rinde hasta ${formatMonto(estimacionValida.tope, moneda)}.` : ''}
                              </span>
                            )}
                          </>
                        )}
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

                {/* Color — solo para billetera personalizada */}
                {isCustom && (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Color</label>
                    <div className={styles.colorPicker}>
                      {CUSTOM_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={styles.colorSwatch}
                          data-color-hex={color}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'colorCustom', value: color })}
                          aria-label={`Color ${color}`}
                        >
                          {colorCustom === color && (
                            <Check size={12} strokeWidth={2.5} color="white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencia si ya hay una principal */}
                {esPrincipal && billeteraPrincipalActual && (
                  <div className={styles.warningBox}>
                    <span className={styles.warningIcon} aria-hidden="true">
                      <AlertTriangle size={15} strokeWidth={2} />
                    </span>
                    <p className={styles.warningText}>
                      Esto va a quitar el estado principal de{' '}
                      <strong>{billeteraPrincipalActual.nombre}</strong>.
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
                  disabled={(!nombre.trim() && isCustom) || isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear billetera'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </Modal>
  )
}
