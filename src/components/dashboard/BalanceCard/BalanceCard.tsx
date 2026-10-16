import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
  Check,
} from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import type { Billetera } from '@/types'
import { separarBilleterasEnCero } from './billeterasEnCero'
import styles from './BalanceCard.module.css'

export interface CompromisoItem {
  id: string
  nombre: string
  monto: number
  tipo?: 'suscripcion' | 'cuota' | 'resumen_tarjeta' | 'factura' | 'dolares_con_pesos'
  monto_usd?: number | string
  cotizacion?: number | string
  percepcion?: number | string
}

export interface BalanceCardProps {
  moneda: 'ARS' | 'USD'
  onToggleMoneda: (m: 'ARS' | 'USD') => void
  tieneBilleterasUsd: boolean
  billeterasActivas: Billetera[]
  billeterasSeleccionadas: string[]
  onToggleBilletera: (id: string | null) => void
  saldoTotal: number
  saldoDisponible: number
  cuotasPendientes: number
  suscripcionesPendientes: number
  showBalance: boolean
  onTogglePrivacy: () => void
  ingresos: number
  egresos: number
  className?: string
  isAccountsOpen?: boolean
  onToggleAccounts?: () => void
  isCompromisosOpen?: boolean
  onToggleCompromisos?: () => void
  onCloseDropdowns?: () => void
  compromisos?: CompromisoItem[]
}

const fmt = (n: number, moneda: 'ARS' | 'USD' = 'ARS') => {
  return formatMonto(n, moneda)
}

const formatCompromisoNombre = (item: CompromisoItem): string => {
  if (item.tipo === 'dolares_con_pesos') {
    let name = item.nombre
      .replace(/^Parte en d[oó]lares de\s+/i, '')
      .replace(/\s+que se paga con pesos$/i, '')
      .trim()
    if (!/\(usd\)$/i.test(name)) {
      name = `${name} (USD)`
    }
    return name
  }
  return item.nombre
}

const formatCompromisoDetalle = (item: CompromisoItem): string | null => {
  if (item.monto_usd == null) return null
  const montoUsd = Number(item.monto_usd).toLocaleString('es-AR')
  const cotiz = item.cotizacion != null ? `$${Number(item.cotizacion).toLocaleString('es-AR')}` : ''
  const perc = item.percepcion != null ? ` (+${item.percepcion}%)` : ''

  if (cotiz) {
    return `US$ ${montoUsd} a ${cotiz}${perc}`
  }
  return `US$ ${montoUsd}${perc}`
}


export const BalanceCard = memo(function BalanceCard({
  moneda,
  onToggleMoneda,
  tieneBilleterasUsd,
  billeterasActivas,
  billeterasSeleccionadas,
  onToggleBilletera,
  saldoTotal,
  saldoDisponible,
  cuotasPendientes,
  suscripcionesPendientes,
  showBalance,
  onTogglePrivacy,
  ingresos,
  egresos,
  className,
  isAccountsOpen: externalAccountsOpen,
  onToggleAccounts,
  isCompromisosOpen: externalCompromisosOpen,
  onToggleCompromisos,
  onCloseDropdowns,
  compromisos,
}: BalanceCardProps) {
  const [internalAccountsOpen, setInternalAccountsOpen] = useState(false)
  const [internalCompromisosOpen, setInternalCompromisosOpen] = useState(false)
  const [mostrarEnCero, setMostrarEnCero] = useState(false)

  const isAccountsOpen = externalAccountsOpen !== undefined ? externalAccountsOpen : internalAccountsOpen
  const isCompromisosOpen = externalCompromisosOpen !== undefined ? externalCompromisosOpen : internalCompromisosOpen

  // Al cerrar el panel de cuentas, las billeteras en $0 vuelven a quedar ocultas
  useEffect(() => {
    if (!isAccountsOpen) {
      setMostrarEnCero(false)
    }
  }, [isAccountsOpen])

  const cardRef = useRef<HTMLDivElement>(null)

  const toggleAccounts = () => {
    if (onToggleAccounts) {
      onToggleAccounts()
    } else {
      setInternalAccountsOpen(prev => {
        const next = !prev
        if (next) setInternalCompromisosOpen(false)
        return next
      })
    }
  }

  const toggleCompromisos = () => {
    if (onToggleCompromisos) {
      onToggleCompromisos()
    } else {
      setInternalCompromisosOpen(prev => {
        const next = !prev
        if (next) setInternalAccountsOpen(false)
        return next
      })
    }
  }

  useEffect(() => {
    if (!isAccountsOpen && !isCompromisosOpen) return

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (onCloseDropdowns) {
          onCloseDropdowns()
        } else {
          setInternalAccountsOpen(false)
          setInternalCompromisosOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handlePointerDownOutside)
    document.addEventListener('touchstart', handlePointerDownOutside)
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside)
      document.removeEventListener('touchstart', handlePointerDownOutside)
    }
  }, [isAccountsOpen, isCompromisosOpen, onCloseDropdowns])

  const totalCompromisos = (cuotasPendientes || 0) + (suscripcionesPendientes || 0)
  const hasCompromisos = totalCompromisos > 0
  const isDeficit = saldoDisponible < 0

  const itemsCompromisos = useMemo(() => {
    if (compromisos && compromisos.length > 0) return compromisos
    const fallback: CompromisoItem[] = []
    if (suscripcionesPendientes > 0) {
      fallback.push({
        id: 'suscripciones',
        nombre: 'Suscripciones mensuales',
        monto: suscripcionesPendientes,
        tipo: 'suscripcion',
      })
    }
    if (cuotasPendientes > 0) {
      fallback.push({
        id: 'cuotas',
        nombre: 'Cuotas pendientes',
        monto: cuotasPendientes,
        tipo: 'cuota',
      })
    }
    return fallback
  }, [compromisos, suscripcionesPendientes, cuotasPendientes])

  const { visibles: billeterasVisibles, enCero: billeterasEnCero } = useMemo(
    () => separarBilleterasEnCero(billeterasActivas, billeterasSeleccionadas),
    [billeterasActivas, billeterasSeleccionadas]
  )

  const renderFilaBilletera = (b: Billetera) => {
    const isExplicitlyFiltered = billeterasSeleccionadas.includes(b.id)

    return (
      <button
        key={b.id}
        type="button"
        role="option"
        aria-selected={isExplicitlyFiltered}
        className={`${styles.accountRow} ${isExplicitlyFiltered ? styles.rowSelected : ''}`}
        onClick={() => onToggleBilletera(b.id)}
        title={`Alternar ${b.nombre}`}
      >
        <div className={styles.rowLeft}>
          <div className={`${styles.checkbox} ${isExplicitlyFiltered ? styles.checkboxChecked : ''}`}>
            {isExplicitlyFiltered && <Check size={10} strokeWidth={3} />}
          </div>
          <span className={styles.accountName}>{b.es_efectivo ? `Efectivo ${b.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : b.nombre}</span>
          {b.es_principal && (
            <Star size={10} fill="currentColor" className={styles.starIcon} />
          )}
        </div>
        <span className={styles.accountAmount}>
          {showBalance ? fmt(b.saldo_actual, b.moneda) : '••••'}
        </span>
      </button>
    )
  }

  return (
    <div ref={cardRef} className={`${styles.card} ${className || ''}`}>
      {/* ── 1. Header: Monedas a la izquierda & Privacidad a la derecha ───── */}
      {tieneBilleterasUsd && (
        <div className={styles.header}>
          <div className={styles.currencyToggle} role="tablist" aria-label="Seleccionar moneda">
            <button
              type="button"
              role="tab"
              aria-selected={moneda === 'ARS'}
              className={`${styles.currencyBtn} ${moneda === 'ARS' ? styles.currencyBtnActive : ''}`}
              onClick={() => onToggleMoneda('ARS')}
            >
              Pesos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={moneda === 'USD'}
              className={`${styles.currencyBtn} ${moneda === 'USD' ? styles.currencyBtnActive : ''}`}
              onClick={() => onToggleMoneda('USD')}
            >
              Dólares
            </button>
          </div>

          <button
            type="button"
            className={styles.privacyBtn}
            onClick={onTogglePrivacy}
            title={showBalance ? 'Ocultar montos' : 'Mostrar montos'}
            aria-label={showBalance ? 'Ocultar montos' : 'Mostrar montos'}
          >
            {showBalance ? <Eye size={16} strokeWidth={1.8} /> : <EyeOff size={16} strokeWidth={1.8} />}
          </button>
        </div>
      )}

      {/* ── 2. Los Dos Saldos (Protagonistas absolutos con presencia) ─── */}
      <div className={styles.saldosHero}>
        {/* Saldo Total */}
        <div className={styles.saldoMain}>
          <div className={styles.saldoHeader}>
            <span className={styles.saldoLabel}>Saldo total</span>
            {!tieneBilleterasUsd && (
              <button
                type="button"
                className={styles.privacyBtn}
                onClick={onTogglePrivacy}
                title={showBalance ? 'Ocultar montos' : 'Mostrar montos'}
                aria-label={showBalance ? 'Ocultar montos' : 'Mostrar montos'}
              >
                {showBalance ? <Eye size={16} strokeWidth={1.8} /> : <EyeOff size={16} strokeWidth={1.8} />}
              </button>
            )}
          </div>
          <h2 className={`${styles.totalAmount} ${saldoTotal < 0 ? styles.amountNegative : ''}`}>
            {showBalance ? fmt(saldoTotal, moneda) : '••••••••'}
          </h2>
        </div>

        {/* Saldo Disponible Real */}
        <div className={styles.saldoSecondary}>
          <span className={styles.saldoLabel}>Disponible libre</span>
          <div className={styles.availableRow}>
            {hasCompromisos && !isDeficit ? (
              <button
                type="button"
                className={`${styles.availableTrigger} ${isCompromisosOpen ? styles.triggerActive : ''}`}
                onClick={toggleCompromisos}
                aria-expanded={isCompromisosOpen}
                title={isCompromisosOpen ? 'Contraer detalle de compromisos' : 'Ver compromisos descontados'}
              >
                <span className={styles.availableAmount}>
                  {showBalance ? fmt(saldoDisponible, moneda) : '••••••••'}
                </span>
                <ChevronDown
                  size={13}
                  className={`${styles.chevron} ${isCompromisosOpen ? styles.chevronOpen : ''}`}
                />
              </button>
            ) : (
              <span className={`${styles.availableAmount} ${isDeficit ? styles.amountNegative : ''}`}>
                {showBalance ? fmt(saldoDisponible, moneda) : '••••••••'}
              </span>
            )}
            {isDeficit && (
              <span className={styles.deficitBadge}>
                Déficit de {showBalance ? fmt(Math.abs(saldoDisponible), moneda) : '••••'}
              </span>
            )}
          </div>

          {/* Panel Colapsable de Compromisos Descontados (Mismo diseño integrado que cuentas) */}
          {isCompromisosOpen && hasCompromisos && !isDeficit && (
            <div className={styles.accountsDropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Compromisos descontados</span>
                <span className={styles.dropdownBadge}>
                  -{showBalance ? fmt(totalCompromisos, moneda) : '••••'}
                </span>
              </div>

              <div className={styles.accountsList} role="list">
                {itemsCompromisos.map((item: CompromisoItem) => {
                  const isDolaresConPesos = item.tipo === 'dolares_con_pesos'
                  const displayName = isDolaresConPesos ? formatCompromisoNombre(item) : item.nombre
                  const detalle = isDolaresConPesos ? formatCompromisoDetalle(item) : null

                  return (
                    <div key={item.id} className={styles.accountRow}>
                      <div className={styles.rowLeft}>
                        <span className={styles.itemDot} />
                        <div className={styles.accountTextCol}>
                          <span className={styles.accountName}>{displayName}</span>
                          {detalle && (
                            <span className={styles.compromisoDetalle}>
                              {detalle}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={styles.compromisoAmount}>
                        -{showBalance ? fmt(item.monto, moneda) : '••••'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Selector de Cuentas (Disimulado e integrado) ──────────── */}
      {billeterasActivas.length > 1 && (
        <div className={styles.accountsSection}>
          <button
            type="button"
            className={`${styles.accountsTrigger} ${isAccountsOpen ? styles.triggerActive : ''}`}
            onClick={toggleAccounts}
            aria-expanded={isAccountsOpen}
            title={isAccountsOpen ? 'Contraer cuentas' : 'Filtrar por cuenta'}
          >
            <div className={styles.triggerContent}>
              <span className={styles.triggerDot} />
              <span className={styles.triggerText}>
                {billeterasSeleccionadas.length === 0
                  ? `Todas las cuentas (${billeterasActivas.length})`
                  : billeterasSeleccionadas.length === 1
                    ? (() => {
                        const b = billeterasActivas.find(x => x.id === billeterasSeleccionadas[0])
                        if (!b) return '1 cuenta'
                        return b.es_efectivo ? `Efectivo ${b.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : b.nombre
                      })()
                    : `${billeterasSeleccionadas.length} cuentas seleccionadas`}
              </span>
              <ChevronDown
                size={13}
                className={`${styles.chevron} ${isAccountsOpen ? styles.chevronOpen : ''}`}
              />
            </div>
          </button>

          {/* Panel Colapsable */}
          {isAccountsOpen && (
            <div className={styles.accountsDropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Filtrar cuentas</span>
                <button
                  type="button"
                  className={`${styles.resetBtn} ${billeterasSeleccionadas.length === 0 ? styles.resetBtnActive : ''}`}
                  onClick={() => onToggleBilletera(null)}
                >
                  Todas ({billeterasActivas.length})
                </button>
              </div>

              <div className={styles.accountsList} role="listbox">
                {billeterasVisibles.map(renderFilaBilletera)}

                {billeterasEnCero.length > 0 && (
                  <button
                    type="button"
                    className={styles.zeroAccountsToggleBtn}
                    onClick={() => setMostrarEnCero(prev => !prev)}
                  >
                    {mostrarEnCero
                      ? 'Ocultar las de $0'
                      : billeterasEnCero.length === 1
                        ? 'Ver 1 en $0'
                        : `Ver ${billeterasEnCero.length} en $0`}
                  </button>
                )}

                {mostrarEnCero && billeterasEnCero.map(renderFilaBilletera)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Resumen de Flujo (Solo flechas, limpio y financiero) ──── */}
      <div className={styles.trendsBar}>
        <div className={styles.trendItem} title="Ingresos">
          <TrendingUp size={15} className={styles.trendUpIcon} />
          <span className={styles.trendAmount}>
            {showBalance ? fmt(ingresos, moneda) : '••••'}
          </span>
        </div>

        <div className={styles.trendItem} title="Egresos">
          <TrendingDown size={15} className={styles.trendDownIcon} />
          <span className={styles.trendAmount}>
            {showBalance ? fmt(egresos, moneda) : '••••'}
          </span>
        </div>
      </div>
    </div>
  )
})

export default BalanceCard
