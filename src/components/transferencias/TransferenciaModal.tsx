import React, { useState, useMemo, useCallback } from 'react'
import {
  X,
  ArrowRightLeft,
  ArrowDownUp,
  Calendar,
  FileText,
  Check,
  Search,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  Percent,
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera, CotizacionDolar } from '@/types'
import transferenciaService from '@/services/transferencia.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { getBankById, findBankByNombre, getBankLogoUrl, formatSaldo, getInitials } from '@/lib/utils/billeteras.utils'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { DateInput } from '@/components/ui'
import styles from './TransferenciaModal.module.css'

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  billeteras: Billetera[]
  cotizacionOficial?: CotizacionDolar | null
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMinDateLocal(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getBankVisuals(billetera: Billetera) {
  if (billetera.es_efectivo) {
    return {
      nombre: `Efectivo ${billetera.moneda}`,
      bg: billetera.moneda === 'ARS' ? '#1A3D28' : '#0C3D48',
      colorTexto: 'white' as const,
      logoUrl: '',
      initials: 'EF',
      tipoLabel: 'Efectivo',
    }
  }

  const bank = billetera.bank_id
    ? getBankById(billetera.bank_id)
    : findBankByNombre(billetera.nombre)

  const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''
  const bg = bank?.colorPrimario || '#0D2045'
  const colorTexto = bank?.colorTexto || 'white'
  const initials = getInitials(bank?.nombre || billetera.nombre)
  
  let tipoLabel = 'Cuenta'
  if (bank?.tipo === 'billetera_virtual') tipoLabel = 'Billetera virtual'
  else if (bank?.tipo === 'banco_digital') tipoLabel = 'Banco digital'
  else if (bank?.tipo === 'banco_tradicional') tipoLabel = 'Banco tradicional'

  return {
    nombre: bank?.nombre || billetera.nombre,
    bg,
    colorTexto,
    logoUrl,
    initials,
    tipoLabel,
  }
}

export const TransferenciaModal: React.FC<TransferenciaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  billeteras,
  cotizacionOficial,
}) => {
  const { showToast } = useToast()

  // Todas las billeteras activas disponibles
  const activeWallets = useMemo(() => {
    return billeteras.filter(b => b.estado === 'activa')
  }, [billeteras])

  // Selección de billetera origen
  const [billeteraOrigenId, setBilleteraOrigenId] = useState<string>(() => {
    const activeARS = activeWallets.filter(b => b.moneda === 'ARS')
    if (activeARS.length > 0) {
      const best = activeARS.find(b => b.es_principal && b.saldo_actual > 0) ||
        activeARS.find(b => b.saldo_actual > 0) ||
        activeARS.find(b => b.es_principal) ||
        activeARS[0]
      return best.id
    }
    return activeWallets[0]?.id || ''
  })

  // Selección de billetera destino
  const [billeteraDestinoId, setBilleteraDestinoId] = useState<string>(() => {
    const origen = activeWallets.find(b => b.id === billeteraOrigenId)
    // Sugerir primero una billetera de la otra moneda si existe, para facilitar cambio de moneda
    const opposite = activeWallets.find(b => b.id !== billeteraOrigenId && b.moneda !== origen?.moneda)
    if (opposite) return opposite.id

    const other = activeWallets.find(b => b.id !== billeteraOrigenId)
    return other?.id || ''
  })

  // Entidades seleccionadas
  const billeteraOrigen = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraOrigenId)
  }, [activeWallets, billeteraOrigenId])

  const billeteraDestino = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraDestinoId)
  }, [activeWallets, billeteraDestinoId])

  const monedaOrigen = billeteraOrigen?.moneda || 'ARS'
  const monedaDestino = billeteraDestino?.moneda || 'ARS'
  const esMismaMoneda = monedaOrigen === monedaDestino

  // Montos
  const [monto, setMonto] = useState<number | null>(null)
  const [montoDestino, setMontoDestino] = useState<number | null>(null)

  // Comisión opcional
  const [mostrarComision, setMostrarComision] = useState(false)
  const [montoComision, setMontoComision] = useState<number | null>(null)
  const [monedaComisionCustom, setMonedaComisionCustom] = useState<'ARS' | 'USD' | null>(null)

  // Derivar moneda de comisión sin efectos secundarios
  const monedaComision = (monedaComisionCustom === monedaOrigen || monedaComisionCustom === monedaDestino)
    ? (monedaComisionCustom ?? monedaOrigen)
    : monedaOrigen

  const [fecha, setFecha] = useState(todayLocal())
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [pickerMode, setPickerMode] = useState<'origen' | 'destino' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Invertir origen y destino (Swap)
  const handleSwap = useCallback(() => {
    if (!billeteraOrigenId || !billeteraDestinoId) return
    setIsSwapping(true)
    setTimeout(() => {
      setBilleteraOrigenId(billeteraDestinoId)
      setBilleteraDestinoId(billeteraOrigenId)
      // Si se invierten, invertimos también los montos si difieren
      if (!esMismaMoneda) {
        setMonto(montoDestino)
        setMontoDestino(monto)
      }
      setIsSwapping(false)
    }, 180)
  }, [billeteraOrigenId, billeteraDestinoId, esMismaMoneda, monto, montoDestino])

  // Cálculos en vivo de cotización implícita
  const cotizacionImplicita = useMemo(() => {
    if (esMismaMoneda || !monto || monto <= 0 || !montoDestino || montoDestino <= 0) {
      return null
    }
    // Convención: siempre ARS / USD (pesos por cada dólar)
    if (monedaOrigen === 'ARS' && monedaDestino === 'USD') {
      return monto / montoDestino
    } else if (monedaOrigen === 'USD' && monedaDestino === 'ARS') {
      return montoDestino / monto
    }
    return monto / montoDestino
  }, [esMismaMoneda, monto, montoDestino, monedaOrigen, monedaDestino])

  // Cotización oficial de referencia
  const cotizacionOficialRef = useMemo(() => {
    if (esMismaMoneda || !cotizacionOficial) return null
    if (monedaOrigen === 'ARS' && monedaDestino === 'USD') {
      return cotizacionOficial.venta || cotizacionOficial.promedio || null
    }
    if (monedaOrigen === 'USD' && monedaDestino === 'ARS') {
      return cotizacionOficial.compra || cotizacionOficial.promedio || null
    }
    return null
  }, [esMismaMoneda, cotizacionOficial, monedaOrigen, monedaDestino])

  // Cálculos en vivo de impacto en saldo
  const montoNum = monto || 0
  const montoDestinoNum = esMismaMoneda ? montoNum : (montoDestino || 0)
  const comisionNum = mostrarComision && montoComision ? montoComision : 0

  const comisionEnOrigen = monedaComision === monedaOrigen ? comisionNum : 0
  const comisionEnDestino = monedaComision === monedaDestino ? comisionNum : 0

  const saldoOrigenActual = billeteraOrigen?.saldo_actual ?? 0
  const saldoDestinoActual = billeteraDestino?.saldo_actual ?? 0

  const debitoTotalOrigen = montoNum + comisionEnOrigen
  const saldoOrigenProyectado = saldoOrigenActual - debitoTotalOrigen
  const saldoDestinoProyectado = saldoDestinoActual + montoDestinoNum - comisionEnDestino

  const isOverdraft = debitoTotalOrigen > saldoOrigenActual
  const isDestinoOverdraft = comisionEnDestino > (saldoDestinoActual + montoDestinoNum)

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!billeteraOrigenId) {
      showToast('Seleccioná la cuenta de origen', 'error')
      return
    }
    if (!billeteraDestinoId) {
      showToast('Seleccioná la cuenta de destino', 'error')
      return
    }
    if (billeteraOrigenId === billeteraDestinoId) {
      showToast('La cuenta de origen y destino no pueden ser la misma', 'error')
      return
    }
    if (!monto || monto <= 0) {
      showToast('Ingresá un monto válido mayor a 0', 'error')
      return
    }
    if (!esMismaMoneda && (!montoDestino || montoDestino <= 0)) {
      showToast('Ingresá el monto a recibir en la cuenta de destino', 'error')
      return
    }
    if (isOverdraft) {
      showToast(
        `Saldo insuficiente en ${billeteraOrigen?.nombre}. Disponible: ${formatSaldo(saldoOrigenActual, monedaOrigen)}, Solicitado: ${formatSaldo(debitoTotalOrigen, monedaOrigen)}`,
        'error'
      )
      return
    }
    if (isDestinoOverdraft) {
      showToast(
        `Saldo insuficiente en ${billeteraDestino?.nombre} para cubrir la comisión de ${formatSaldo(comisionNum, monedaComision)}`,
        'error'
      )
      return
    }

    setIsSubmitting(true)
    try {
      await transferenciaService.createTransferencia({
        billetera_origen_id: billeteraOrigenId,
        billetera_destino_id: billeteraDestinoId,
        monto: Number(monto),
        moneda: monedaOrigen,
        monto_origen: Number(monto),
        monto_destino: esMismaMoneda ? Number(monto) : Number(montoDestino),
        moneda_origen: monedaOrigen,
        moneda_destino: monedaDestino,
        monto_comision: comisionNum > 0 ? Number(comisionNum) : null,
        moneda_comision: comisionNum > 0 ? monedaComision : null,
        fecha,
        notas: notas.trim() || null,
      })

      showToast(
        esMismaMoneda
          ? 'Transferencia realizada con éxito'
          : monedaOrigen === 'ARS'
            ? 'Compra de dólares registrada con éxito'
            : 'Venta de dólares registrada con éxito',
        'success'
      )
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      showToast(getErrorMessage(err, 'Error al procesar la transferencia.'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cuentas filtradas para el picker modal
  const filteredPickerWallets = useMemo(() => {
    const list = activeWallets.filter(b => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        b.nombre.toLowerCase().includes(q) ||
        b.moneda.toLowerCase().includes(q) ||
        (b.bank_id && b.bank_id.toLowerCase().includes(q))
      )
    })
    return list.sort((a, b) => {
      if (pickerMode === 'origen') {
        if (a.id === billeteraOrigenId) return -1
        if (b.id === billeteraOrigenId) return 1
      } else {
        if (a.id === billeteraDestinoId) return -1
        if (b.id === billeteraDestinoId) return 1
      }
      return b.saldo_actual - a.saldo_actual
    })
  }, [activeWallets, searchQuery, pickerMode, billeteraOrigenId, billeteraDestinoId])

  const handleSelectPickerWallet = (id: string) => {
    if (pickerMode === 'origen') {
      setBilleteraOrigenId(id)
      if (id === billeteraDestinoId) {
        const next = activeWallets.find(b => b.id !== id)
        setBilleteraDestinoId(next?.id || '')
      }
    } else if (pickerMode === 'destino') {
      setBilleteraDestinoId(id)
      if (id === billeteraOrigenId) {
        const next = activeWallets.find(b => b.id !== id)
        setBilleteraOrigenId(next?.id || '')
      }
    }
    setPickerMode(null)
    setSearchQuery('')
  }

  const visualsOrigen = billeteraOrigen ? getBankVisuals(billeteraOrigen) : null
  const visualsDestino = billeteraDestino ? getBankVisuals(billeteraDestino) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Pasar plata entre cuentas">
      <div className={styles.modalRoot}>
        {/* ── Vista Picker de Cuentas (Overlay fluido) ── */}
        {pickerMode !== null ? (
          <div className={styles.pickerView}>
            <div className={styles.pickerHeader}>
              <div className={styles.pickerTitleGroup}>
                <h3 className={styles.pickerTitle}>
                  {pickerMode === 'origen' ? 'Seleccionar cuenta de origen' : 'Seleccionar cuenta de destino'}
                </h3>
                <p className={styles.pickerSubtitle}>
                  Seleccioná cualquiera de tus cuentas activas en ARS o USD
                </p>
              </div>
              <button
                type="button"
                className={styles.iconCircleBtn}
                onClick={() => { setPickerMode(null); setSearchQuery('') }}
                aria-label="Volver"
              >
                <X size={18} />
              </button>
            </div>

            {/* Buscador rápido */}
            {activeWallets.length > 3 && (
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar por cuenta, banco o moneda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
              </div>
            )}

            {/* Lista de billeteras */}
            <div className={styles.pickerList}>
              {filteredPickerWallets.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <Wallet size={28} className={styles.pickerEmptyIcon} />
                  <p>No se encontraron cuentas disponibles</p>
                </div>
              ) : (
                filteredPickerWallets.map((b) => {
                  const vis = getBankVisuals(b)
                  const isCurrent = pickerMode === 'origen' ? b.id === billeteraOrigenId : b.id === billeteraDestinoId
                  const isOpposite = pickerMode === 'origen' ? b.id === billeteraDestinoId : b.id === billeteraOrigenId

                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`${styles.pickerItem} ${isCurrent ? styles.pickerItemActive : ''} ${isOpposite ? styles.pickerItemOpposite : ''}`}
                      onClick={() => handleSelectPickerWallet(b.id)}
                    >
                      <div
                        className={styles.bankAvatar}
                        style={{ background: vis.bg }}
                      >
                        {vis.logoUrl ? (
                          <img src={vis.logoUrl} alt={vis.nombre} className={styles.bankAvatarImg} />
                        ) : (
                          <span className={styles.bankAvatarText}>{vis.initials}</span>
                        )}
                      </div>

                      <div className={styles.pickerItemInfo}>
                        <div className={styles.pickerItemNameRow}>
                          <span className={styles.pickerItemName}>{b.nombre}</span>
                          <span className={styles.currencyBadgePicker}>{b.moneda}</span>
                          {b.es_principal && (
                            <span className={styles.badgePrincipal}>Principal</span>
                          )}
                          {isOpposite && (
                            <span className={styles.badgeOpposite}>
                              {pickerMode === 'origen' ? 'Destino actual' : 'Origen actual'}
                            </span>
                          )}
                        </div>
                        <span className={styles.pickerItemType}>{vis.tipoLabel}</span>
                      </div>

                      <div className={styles.pickerItemBalance}>
                        <span className={styles.pickerItemAmount}>{formatSaldo(b.saldo_actual, b.moneda)}</span>
                        {isCurrent && <Check size={16} className={styles.checkIcon} />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          /* ── Vista Principal del Formulario de Transferencia ── */
          <form className={styles.mainForm} onSubmit={handleSubmit}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTitleWrap}>
                <div className={styles.headerIconPill}>
                  <ArrowRightLeft size={16} />
                </div>
                <div>
                  <h2 className={styles.headerTitle}>
                    {esMismaMoneda ? 'Pasar plata entre cuentas' : 'Compra y venta de dólares'}
                  </h2>
                  <p className={styles.headerSubtitle}>
                    {esMismaMoneda
                      ? 'Traspaso inmediato entre tus billeteras'
                      : 'Transferencia bimonetaria entre tus billeteras propias'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.iconCircleBtn}
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.scrollableBody}>
              {/* ── SECCIÓN 1: Dual Account Selector (Desde ➔ ⇄ ➔ Hacia) ── */}
              <div className={styles.transferFlowContainer}>
                {/* Origen Card */}
                <div
                  className={`${styles.accountCard} ${!billeteraOrigenId ? styles.accountCardEmpty : ''}`}
                  onClick={() => setPickerMode('origen')}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.accountCardTop}>
                    <span className={styles.accountCardTag}>Desde (Origen)</span>
                    <span className={styles.changeAction}>
                      Cambiar <ChevronRight size={14} />
                    </span>
                  </div>

                  {billeteraOrigen && visualsOrigen ? (
                    <div className={styles.accountCardContent}>
                      <div
                        className={styles.bankAvatar}
                        style={{ background: visualsOrigen.bg }}
                      >
                        {visualsOrigen.logoUrl ? (
                          <img src={visualsOrigen.logoUrl} alt={visualsOrigen.nombre} className={styles.bankAvatarImg} />
                        ) : (
                          <span className={styles.bankAvatarText}>{visualsOrigen.initials}</span>
                        )}
                      </div>

                      <div className={styles.accountCardMeta}>
                        <div className={styles.pickerItemNameRow}>
                          <span className={styles.accountName}>{billeteraOrigen.nombre}</span>
                          <span className={styles.currencyTag}>{billeteraOrigen.moneda}</span>
                        </div>
                        <div className={styles.accountBalances}>
                          <span className={styles.currentBalance}>
                            Saldo: {formatSaldo(saldoOrigenActual, monedaOrigen)}
                          </span>
                          {debitoTotalOrigen > 0 && (
                            <span className={styles.projectedDown}>
                              <TrendingDown size={12} />
                              {formatSaldo(saldoOrigenProyectado, monedaOrigen)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyCardContent}>
                      <span>Elegir cuenta de origen</span>
                    </div>
                  )}
                </div>

                {/* Botón Swap Interactivo */}
                <div className={styles.swapWrap}>
                  <div className={styles.swapDividerLine} />
                  <button
                    type="button"
                    className={`${styles.swapButton} ${isSwapping ? styles.swapButtonActive : ''}`}
                    onClick={handleSwap}
                    disabled={!billeteraOrigenId || !billeteraDestinoId}
                    title="Invertir cuentas (Origen ⇄ Destino)"
                    aria-label="Invertir cuentas"
                  >
                    <ArrowDownUp size={16} />
                  </button>
                  <div className={styles.swapDividerLine} />
                </div>

                {/* Destino Card */}
                <div
                  className={`${styles.accountCard} ${!billeteraDestinoId ? styles.accountCardEmpty : ''}`}
                  onClick={() => setPickerMode('destino')}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.accountCardTop}>
                    <span className={styles.accountCardTag}>Hacia (Destino)</span>
                    <span className={styles.changeAction}>
                      Cambiar <ChevronRight size={14} />
                    </span>
                  </div>

                  {billeteraDestino && visualsDestino ? (
                    <div className={styles.accountCardContent}>
                      <div
                        className={styles.bankAvatar}
                        style={{ background: visualsDestino.bg }}
                      >
                        {visualsDestino.logoUrl ? (
                          <img src={visualsDestino.logoUrl} alt={visualsDestino.nombre} className={styles.bankAvatarImg} />
                        ) : (
                          <span className={styles.bankAvatarText}>{visualsDestino.initials}</span>
                        )}
                      </div>

                      <div className={styles.accountCardMeta}>
                        <div className={styles.pickerItemNameRow}>
                          <span className={styles.accountName}>{billeteraDestino.nombre}</span>
                          <span className={styles.currencyTag}>{billeteraDestino.moneda}</span>
                        </div>
                        <div className={styles.accountBalances}>
                          <span className={styles.currentBalance}>
                            Saldo: {formatSaldo(saldoDestinoActual, monedaDestino)}
                          </span>
                          {montoDestinoNum > 0 && (
                            <span className={styles.projectedUp}>
                              <TrendingUp size={12} />
                              +{formatSaldo(saldoDestinoProyectado, monedaDestino)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyCardContent}>
                      <span>Elegir cuenta de destino</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECCIÓN 2: Montos & Cotización ── */}
              {esMismaMoneda ? (
                /* Monto único para misma moneda */
                <div className={styles.montoSection}>
                  <MontoInput
                    value={monto}
                    onChange={setMonto}
                    moneda={monedaOrigen}
                    autoFocus
                    allowDecimals
                    max={999999999.99}
                    placeholder="0"
                  />

                  {isOverdraft && (
                    <div className={styles.warningBanner}>
                      <AlertCircle size={14} className={styles.warningIcon} />
                      <span>
                        El monto supera el saldo disponible en {billeteraOrigen?.nombre} ({formatSaldo(saldoOrigenActual, monedaOrigen)})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Dos montos para distinta moneda */
                <div className={styles.montoSection}>
                  <div className={styles.dualMontoContainer}>
                    {/* Monto que sale */}
                    <div className={styles.montoFieldCard}>
                      <div className={styles.montoFieldLabel}>
                        <span>Monto que sale ({monedaOrigen})</span>
                        <span className={styles.currencyTag}>{monedaOrigen}</span>
                      </div>
                      <div className={styles.montoInputRow}>
                        <span className={styles.currencySymbolPrefix}>
                          {monedaOrigen === 'ARS' ? '$' : 'US$'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={monto !== null ? monto : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value)
                            setMonto(val)
                          }}
                          className={styles.montoCustomInput}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Monto que entra */}
                    <div className={styles.montoFieldCard}>
                      <div className={styles.montoFieldLabel}>
                        <span>Monto que entra ({monedaDestino})</span>
                        <span className={styles.currencyTag}>{monedaDestino}</span>
                      </div>
                      <div className={styles.montoInputRow}>
                        <span className={styles.currencySymbolPrefix}>
                          {monedaDestino === 'ARS' ? '$' : 'US$'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={montoDestino !== null ? montoDestino : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value)
                            setMontoDestino(val)
                          }}
                          className={styles.montoCustomInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner de cotización implícita en vivo */}
                  {cotizacionImplicita !== null && (
                    <div className={styles.cotizacionBanner}>
                      <div className={styles.cotizacionText}>
                        {monedaOrigen === 'ARS' ? (
                          <span>Estás comprando dólares a {formatSaldo(cotizacionImplicita, 'ARS')} pesos</span>
                        ) : (
                          <span>Estás vendiendo dólares a {formatSaldo(cotizacionImplicita, 'ARS')} pesos</span>
                        )}
                      </div>
                      {cotizacionOficialRef !== null && (
                        <div className={styles.cotizacionRef}>
                          Referencia oficial: {formatSaldo(cotizacionOficialRef, 'ARS')}
                        </div>
                      )}
                    </div>
                  )}

                  {isOverdraft && (
                    <div className={styles.warningBanner}>
                      <AlertCircle size={14} className={styles.warningIcon} />
                      <span>
                        El monto total ({formatSaldo(debitoTotalOrigen, monedaOrigen)}) supera el saldo disponible en {billeteraOrigen?.nombre} ({formatSaldo(saldoOrigenActual, monedaOrigen)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECCIÓN 3: Comisión Opcional ── */}
              <div className={styles.comisionSection}>
                {!mostrarComision ? (
                  <button
                    type="button"
                    className={styles.comisionToggleBtn}
                    onClick={() => setMostrarComision(true)}
                  >
                    <Percent size={13} />
                    + Agregar comisión de la operación
                  </button>
                ) : (
                  <div className={styles.comisionCard}>
                    <div className={styles.comisionHeader}>
                      <span className={styles.comisionTitle}>Comisión u honorarios bancarios (opcional)</span>
                      <button
                        type="button"
                        className={styles.iconCircleBtn}
                        onClick={() => {
                          setMostrarComision(false)
                          setMontoComision(null)
                          setMonedaComisionCustom(null)
                        }}
                        aria-label="Quitar comisión"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className={styles.comisionRow}>
                      <div className={styles.comisionInputWrap}>
                        <span className={styles.currencySymbolPrefix}>
                          {monedaComision === 'ARS' ? '$' : 'US$'}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={montoComision !== null ? montoComision : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value)
                            setMontoComision(val)
                          }}
                          className={styles.comisionInput}
                        />
                      </div>

                      <select
                        value={monedaComision}
                        onChange={(e) => setMonedaComisionCustom(e.target.value as 'ARS' | 'USD')}
                        className={styles.comisionCurrencySelect}
                      >
                        <option value={monedaOrigen}>{monedaOrigen}</option>
                        {monedaDestino !== monedaOrigen && (
                          <option value={monedaDestino}>{monedaDestino}</option>
                        )}
                      </select>
                    </div>

                    <p className={styles.comisionHelpText}>
                      Se registrará como un gasto real en Banco → Comisiones y gastos bancarios.
                    </p>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 4: Detalles de la Operación (Fecha y Notas) ── */}
              <div className={styles.detailsGrid}>
                {/* Fecha */}
                <div className={styles.detailField}>
                  <label className={styles.fieldLabel} htmlFor="transf-fecha">
                    <Calendar size={13} className={styles.fieldIcon} />
                    Fecha
                  </label>
                  <DateInput
                    id="transf-fecha"
                    value={fecha}
                    onChange={setFecha}
                    required
                    min={getMinDateLocal()}
                    max={todayLocal()}
                    className={styles.dateInputCustom}
                  />
                </div>

                {/* Nota / Concepto */}
                <div className={styles.detailField}>
                  <label className={styles.fieldLabel} htmlFor="transf-notas">
                    <FileText size={13} className={styles.fieldIcon} />
                    Nota o motivo <span className={styles.fieldOptional}>(opcional)</span>
                  </label>
                  <input
                    id="transf-notas"
                    type="text"
                    placeholder="Ej: Ahorro en dólares, compra MEP..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className={styles.textInputCustom}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* ── Resumen de Impacto en Vivo ── */}
              {montoNum > 0 && billeteraOrigen && billeteraDestino && (
                <div className={styles.impactSummaryPill}>
                  <div className={styles.impactSummaryText}>
                    {esMismaMoneda ? (
                      <>
                        Transferís <strong>{formatSaldo(montoNum, monedaOrigen)}</strong> de <strong>{billeteraOrigen.nombre}</strong> a <strong>{billeteraDestino.nombre}</strong>
                      </>
                    ) : (
                      <>
                        Transferís <strong>{formatSaldo(montoNum, monedaOrigen)}</strong> de <strong>{billeteraOrigen.nombre}</strong> y recibís <strong>{formatSaldo(montoDestinoNum, monedaDestino)}</strong> en <strong>{billeteraDestino.nombre}</strong>
                      </>
                    )}
                    {comisionNum > 0 && (
                      <span> · Comisión: {formatSaldo(comisionNum, monedaComision)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer / CTA ── */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  isSubmitting ||
                  !billeteraOrigenId ||
                  !billeteraDestinoId ||
                  billeteraOrigenId === billeteraDestinoId ||
                  !monto ||
                  monto <= 0 ||
                  (!esMismaMoneda && (!montoDestino || montoDestino <= 0)) ||
                  isOverdraft ||
                  isDestinoOverdraft
                }
              >
                {isSubmitting ? (
                  <>Procesando...</>
                ) : (
                  <>
                    <ArrowRightLeft size={16} strokeWidth={2.5} />
                    Confirmar transferencia
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default TransferenciaModal
