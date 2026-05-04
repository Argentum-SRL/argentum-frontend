// ─── BankPickerModal — modal de dos pasos para crear billetera ────────────────

import { useState, useMemo, useEffect, useReducer } from 'react'
import { X, ChevronLeft, Search, Check } from 'lucide-react'
import { BANKS, BANK_SECTIONS, CUSTOM_COLORS } from '@/lib/constants/banks'
import type { BankDefinition } from '@/lib/constants/banks'
import type { Billetera } from '@/types'
import { getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import styles from './BankPickerModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import Modal from '@/components/ui/Modal/Modal'

export interface CreatePayload {
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_inicial: number
  es_principal: boolean
  bank_id: string | null
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
  colorCustom: string
  isSubmitting: boolean
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
        colorCustom: CUSTOM_COLORS[0],
        isSubmitting: false,
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
        step: 'form'
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
    colorCustom: CUSTOM_COLORS[0],
    isSubmitting: false,
  })

  const {
    step,
    bankSeleccionado,
    slideDirection,
    searchQuery,
    nombre,
    moneda,
    saldo,
    esPrincipal,
    colorCustom,
    isSubmitting
  } = state

  // Reset cuando se abre
  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'RESET', monedaPrincipal: monedaPrincipalUsuario })
    }
  }, [isOpen, monedaPrincipalUsuario])

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
    dispatch({ type: 'SET_STEP', step: 'picker', direction: 'back' })
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankSeleccionado || !nombre.trim() || isSubmitting) return
    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await onCrear({
        nombre: nombre.trim(),
        moneda,
        saldo_inicial: saldo || 0,
        es_principal: esPrincipal,
        bank_id: bankSeleccionado.id === 'custom' ? null : bankSeleccionado.id,
      })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const isCustom = bankSeleccionado?.id === 'custom'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      ariaLabel="Agregar billetera"
    >
      {/* Indicador de pasos */}
      <div className={styles.stepIndicator} aria-hidden="true">
        <div className={`${styles.dot} ${step === 'picker' ? styles.dotActive : styles.dotInactive}`} />
        <div className={`${styles.dot} ${step === 'form' ? styles.dotActive : styles.dotInactive}`} />
      </div>

      {/* Contenedor con transición de slides */}
      <div className={styles.slidesContainer}>
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
          {/* Header fijo */}
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

          {/* Cuerpo scrolleable */}
          <div className={styles.pickerBody}>
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
                    <p className={styles.bankPreviewNombre}>
                      {isCustom ? (nombre || 'Billetera personalizada') : bankSeleccionado.nombre}
                    </p>
                    <p className={styles.bankPreviewTipo}>
                      {bankSeleccionado.tipo === 'billetera_virtual' ? 'Billetera virtual'
                        : bankSeleccionado.tipo === 'banco_digital' ? 'Banco digital'
                        : isCustom ? 'Personalizada'
                        : 'Banco tradicional'}
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

              {/* Cuerpo del form */}
              <div className={styles.formBody}>
                {/* Nombre */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="bk-nombre">
                    Nombre
                  </label>
                  <input
                    id="bk-nombre"
                    type="text"
                    className={styles.fieldInput}
                    value={nombre}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombre', value: e.target.value })}
                    placeholder="Nombre de tu billetera"
                    required
                    autoFocus
                  />
                </div>

                {/* Moneda */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Moneda</label>
                  <div className={styles.currencyPills}>
                    <button
                      type="button"
                      className={`${styles.currencyPill} ${moneda === 'ARS' ? styles.pillActive : ''}`}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'moneda', value: 'ARS' })}
                    >
                      🇦🇷 ARS
                    </button>
                    <button
                      type="button"
                      className={`${styles.currencyPill} ${moneda === 'USD' ? styles.pillActive : ''}`}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'moneda', value: 'USD' })}
                    >
                      🇺🇸 USD
                    </button>
                  </div>
                </div>

                {/* Saldo inicial */}
                <div className={styles.formField}>
                  <MontoInput
                    value={saldo}
                    onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'saldo', value: v })}
                    moneda={moneda}
                    label="Saldo inicial"
                    placeholder="0"
                    allowDecimals
                    optional
                  />
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

                {/* Marcar como principal */}
                <button
                  type="button"
                  className={styles.principalRow}
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'esPrincipal', value: !esPrincipal })}
                  role="checkbox"
                  aria-checked={esPrincipal}
                  aria-label="Marcar como principal"
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

                {/* Advertencia si ya hay una principal */}
                {esPrincipal && billeteraPrincipalActual && (
                  <div className={styles.warningBox}>
                    <span className={styles.warningIcon}>⚠️</span>
                    <p className={styles.warningText}>
                      Esto va a quitar el estado principal de{' '}
                      <strong>{billeteraPrincipalActual.nombre}</strong>.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer fijo */}
              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.crearBtn}
                  disabled={!nombre.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear billetera'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}
