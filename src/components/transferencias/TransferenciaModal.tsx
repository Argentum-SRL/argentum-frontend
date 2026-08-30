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
  Wallet
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera } from '@/types'
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
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMinDateLocal(): string {
  const d = new Date()
  // Restar 2 años
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
}) => {
  const { showToast } = useToast()

  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [monto, setMonto] = useState<number | null>(null)
  const [fecha, setFecha] = useState(todayLocal())
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [pickerMode, setPickerMode] = useState<'origen' | 'destino' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Billeteras activas de la moneda seleccionada
  const activeWallets = useMemo(() => {
    return billeteras.filter(b => b.estado === 'activa' && b.moneda === moneda)
  }, [billeteras, moneda])

  // Selección inicial automática
  const [billeteraOrigenId, setBilleteraOrigenId] = useState<string>(() => {
    const active = billeteras.filter(b => b.estado === 'activa' && b.moneda === 'ARS')
    if (active.length > 0) {
      const best = active.find(b => b.es_principal && b.saldo_actual > 0) ||
        active.find(b => b.saldo_actual > 0) ||
        active.find(b => b.es_principal) ||
        active[0]
      return best.id
    }
    return ''
  })

  const [billeteraDestinoId, setBilleteraDestinoId] = useState<string>(() => {
    const active = billeteras.filter(b => b.estado === 'activa' && b.moneda === 'ARS')
    if (active.length > 1) {
      const bestOrigen = active.find(b => b.es_principal && b.saldo_actual > 0) ||
        active.find(b => b.saldo_actual > 0) ||
        active.find(b => b.es_principal) ||
        active[0]
      const destCandidates = active.filter(b => b.id !== bestOrigen.id)
      return destCandidates[0]?.id || ''
    }
    return ''
  })

  // Obtener las entidades seleccionadas
  const billeteraOrigen = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraOrigenId)
  }, [activeWallets, billeteraOrigenId])

  const billeteraDestino = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraDestinoId)
  }, [activeWallets, billeteraDestinoId])

  // Cambio de moneda
  const handleMonedaChange = useCallback((newMoneda: 'ARS' | 'USD') => {
    setMoneda(newMoneda)
    const valid = billeteras.filter(b => b.estado === 'activa' && b.moneda === newMoneda)
    if (valid.length > 0) {
      const best = valid.find(b => b.es_principal && b.saldo_actual > 0) ||
        valid.find(b => b.saldo_actual > 0) ||
        valid[0]
      setBilleteraOrigenId(best.id)

      const dest = valid.filter(b => b.id !== best.id)
      setBilleteraDestinoId(dest[0]?.id || '')
    } else {
      setBilleteraOrigenId('')
      setBilleteraDestinoId('')
    }
  }, [billeteras])

  // Invertir origen y destino (Swap)
  const handleSwap = useCallback(() => {
    if (!billeteraOrigenId || !billeteraDestinoId) return
    setIsSwapping(true)
    setTimeout(() => {
      setBilleteraOrigenId(billeteraDestinoId)
      setBilleteraDestinoId(billeteraOrigenId)
      setIsSwapping(false)
    }, 180)
  }, [billeteraOrigenId, billeteraDestinoId])

  // Cálculos en vivo de impacto en saldo
  const montoNum = monto || 0
  const saldoOrigenActual = billeteraOrigen?.saldo_actual ?? 0
  const saldoDestinoActual = billeteraDestino?.saldo_actual ?? 0
  const saldoOrigenProyectado = saldoOrigenActual - montoNum
  const saldoDestinoProyectado = saldoDestinoActual + montoNum
  const isOverdraft = montoNum > saldoOrigenActual

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
    if (isOverdraft) {
      showToast(`Saldo insuficiente. Disponible: ${formatSaldo(saldoOrigenActual, moneda)}, Solicitado: ${formatSaldo(montoNum, moneda)}`, 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await transferenciaService.createTransferencia({
        billetera_origen_id: billeteraOrigenId,
        billetera_destino_id: billeteraDestinoId,
        monto: Number(monto),
        moneda,
        fecha,
        notas: notas.trim() || null,
      })

      showToast('Transferencia realizada con éxito', 'success')
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
        (b.bank_id && b.bank_id.toLowerCase().includes(q))
      )
    })
    // Ordenar: primero la seleccionada, luego con saldo, luego el resto
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
        {/* ── Vista Picker de Cuentas (Overlay fluído) ── */}
        {pickerMode !== null ? (
          <div className={styles.pickerView}>
            <div className={styles.pickerHeader}>
              <div className={styles.pickerTitleGroup}>
                <h3 className={styles.pickerTitle}>
                  {pickerMode === 'origen' ? 'Seleccionar cuenta de origen' : 'Seleccionar cuenta de destino'}
                </h3>
                <p className={styles.pickerSubtitle}>
                  Mostrando cuentas en {moneda}
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

            {/* Buscador rápido si hay más de 3 cuentas */}
            {activeWallets.length > 3 && (
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar cuenta o banco..."
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
                  <p>No se encontraron cuentas en {moneda}</p>
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
                  <h2 className={styles.headerTitle}>Pasar plata entre cuentas</h2>
                  <p className={styles.headerSubtitle}>Traspaso inmediato entre tus billeteras</p>
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
              {/* ── SECCIÓN 1: Hero Monto & Moneda ── */}
              <div className={styles.montoSection}>
                <MontoInput
                  value={monto}
                  onChange={setMonto}
                  moneda={moneda}
                  onMonedaChange={handleMonedaChange}
                  autoFocus
                  allowDecimals
                  max={999999999.99}
                  placeholder="0"
                />

                {/* Alerta de saldo insuficiente si aplica */}
                {isOverdraft && (
                  <div className={styles.warningBanner}>
                    <AlertCircle size={14} className={styles.warningIcon} />
                    <span>
                      El monto supera el saldo disponible en {billeteraOrigen?.nombre} ({formatSaldo(saldoOrigenActual, moneda)})
                    </span>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 2: Dual Account Selector (Desde ➔ ⇄ ➔ Hacia) ── */}
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
                        <span className={styles.accountName}>{billeteraOrigen.nombre}</span>
                        <div className={styles.accountBalances}>
                          <span className={styles.currentBalance}>
                            Saldo: {formatSaldo(saldoOrigenActual, moneda)}
                          </span>
                          {montoNum > 0 && (
                            <span className={styles.projectedDown}>
                              <TrendingDown size={12} />
                              {formatSaldo(saldoOrigenProyectado, moneda)}
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
                        <span className={styles.accountName}>{billeteraDestino.nombre}</span>
                        <div className={styles.accountBalances}>
                          <span className={styles.currentBalance}>
                            Saldo: {formatSaldo(saldoDestinoActual, moneda)}
                          </span>
                          {montoNum > 0 && (
                            <span className={styles.projectedUp}>
                              <TrendingUp size={12} />
                              +{formatSaldo(saldoDestinoProyectado, moneda)}
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

              {/* Advertencia si no hay suficientes cuentas en la moneda */}
              {activeWallets.length < 2 && (
                <div className={styles.insufficientAccountsWarning}>
                  <AlertCircle size={16} />
                  <span>
                    Necesitás al menos 2 cuentas activas en {moneda} para realizar transferencias internas.
                  </span>
                </div>
              )}

              {/* ── SECCIÓN 3: Detalles de la Operación (Fecha y Notas) ── */}
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
                    placeholder="Ej: Traspaso de fondos, ahorro..."
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
                    Transferís <strong>{formatSaldo(montoNum, moneda)}</strong> de <strong>{billeteraOrigen.nombre}</strong> a <strong>{billeteraDestino.nombre}</strong>
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
                  isOverdraft ||
                  activeWallets.length < 2
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
