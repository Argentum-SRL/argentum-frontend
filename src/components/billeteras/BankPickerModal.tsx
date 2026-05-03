// ─── BankPickerModal — modal de dos pasos para crear billetera ────────────────

import { useState, useMemo, useEffect, useCallback } from 'react'
import { X, ChevronLeft, Search, Check } from 'lucide-react'
import { BANKS, BANK_SECTIONS, CUSTOM_COLORS } from '@/lib/constants/banks'
import type { BankDefinition } from '@/lib/constants/banks'
import type { Billetera } from '@/types'
import { getBankLogoUrl, getInitials, formatSaldoInput, parseSaldoInput } from '@/lib/utils/billeteras.utils'

export interface CreatePayload {
  nombre: string
  moneda: 'ARS' | 'USD'
  saldo_inicial: number
  es_principal: boolean
  bank_id: string | null
}
import styles from './BankPickerModal.module.css'

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
  size?: number
}) {
  const [hasError, setHasError] = useState(false)
  const url = getBankLogoUrl(bank.logoPath)

  const circleStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: `${bank.colorPrimario}22`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  }

  if (!url || hasError) {
    return (
      <div style={circleStyle}>
        <span style={{ fontWeight: 800, fontSize: size * 0.32, color: bank.colorPrimario }}>
          {getInitials(bank.nombre)}
        </span>
      </div>
    )
  }

  return (
    <div style={circleStyle}>
      <img
        src={url}
        alt={bank.nombre}
        width={size * 0.62}
        height={size * 0.62}
        style={{ objectFit: 'contain' }}
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
  const cardStyle: React.CSSProperties = {
    background: `${bank.colorPrimario}10`,
    borderColor: `${bank.colorPrimario}30`,
  }

  return (
    <button
      type="button"
      className={styles.pickerItem}
      style={cardStyle}
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

// ── Modal principal ───────────────────────────────────────────────────────────

export default function BankPickerModal({
  isOpen,
  onClose,
  onCrear,
  billeterasActuales,
  monedaPrincipalUsuario,
}: BankPickerModalProps) {
  const [step, setStep] = useState<ModalStep>('picker')
  const [bankSeleccionado, setBankSeleccionado] = useState<BankDefinition | null>(null)
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [nombre, setNombre] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>(monedaPrincipalUsuario)
  const [saldoRaw, setSaldoRaw] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [colorCustom, setColorCustom] = useState(CUSTOM_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setStep('picker')
      setBankSeleccionado(null)
      setSearchQuery('')
      setNombre('')
      setMoneda(monedaPrincipalUsuario)
      setSaldoRaw('')
      setEsPrincipal(false)
      setSlideDirection('forward')
    }
  }, [isOpen, monedaPrincipalUsuario])

  // Escape key
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
    setBankSeleccionado(bank)
    setNombre(bank.id === 'custom' ? '' : bank.nombre)
    setSlideDirection('forward')
    setStep('form')
  }

  const handleBack = () => {
    setSlideDirection('back')
    setStep('picker')
  }

  // Formatear saldo mientras escribe
  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.,]/g, '')
    setSaldoRaw(raw)
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankSeleccionado || !nombre.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onCrear({
        nombre: nombre.trim(),
        moneda,
        saldo_inicial: parseSaldoInput(saldoRaw),
        es_principal: esPrincipal,
        bank_id: bankSeleccionado.id === 'custom' ? null : bankSeleccionado.id,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isCustom = bankSeleccionado?.id === 'custom'

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Agregar billetera"
    >
      <div className={styles.modal}>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => setSearchQuery('')}
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
                        style={{ background: `${colorCustom}22` }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: colorCustom,
                          }}
                        >
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
                      onChange={(e) => setNombre(e.target.value)}
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
                        onClick={() => setMoneda('ARS')}
                      >
                        🇦🇷 ARS
                      </button>
                      <button
                        type="button"
                        className={`${styles.currencyPill} ${moneda === 'USD' ? styles.pillActive : ''}`}
                        onClick={() => setMoneda('USD')}
                      >
                        🇺🇸 USD
                      </button>
                    </div>
                  </div>

                  {/* Saldo inicial */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="bk-saldo">
                      Saldo inicial <span className={styles.fieldOptional}>(opcional)</span>
                    </label>
                    <div className={styles.saldoWrap}>
                      <span className={styles.saldoPrefix}>
                        {moneda === 'ARS' ? '$' : 'USD'}
                      </span>
                      <input
                        id="bk-saldo"
                        type="text"
                        inputMode="decimal"
                        className={styles.saldoInput}
                        value={saldoRaw}
                        onChange={handleSaldoChange}
                        placeholder="0"
                      />
                    </div>
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
                            style={{ background: color }}
                            onClick={() => setColorCustom(color)}
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
                    onClick={() => setEsPrincipal((p) => !p)}
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
      </div>
    </div>
  )
}
