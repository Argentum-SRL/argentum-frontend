import { useState, useRef, useEffect, memo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Star,
  HelpCircle,
} from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import type { Billetera } from '@/types'
import styles from './BalanceCard.module.css'

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
}

const fmt = (n: number, moneda: 'ARS' | 'USD' = 'ARS') => {
  return formatMonto(n, moneda)
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
}: BalanceCardProps) {
  const [showDesglose, setShowDesglose] = useState(false)
  const desgloseContainerRef = useRef<HTMLDivElement>(null)

  // Cerrar el popover de desglose al hacer click afuera o presionar Escape
  useEffect(() => {
    if (!showDesglose) return

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        desgloseContainerRef.current &&
        !desgloseContainerRef.current.contains(e.target as Node)
      ) {
        setShowDesglose(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDesglose(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDownOutside)
    document.addEventListener('touchstart', handlePointerDownOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside)
      document.removeEventListener('touchstart', handlePointerDownOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDesglose])

  const singleWallet = billeterasActivas.length === 1 ? billeterasActivas[0] : null

  return (
    <div className={styles.balanceCard}>
      {/* ── Header: Currency Tabs / Badge + Privacy Toggle ──────────────── */}
      <div className={styles.balanceCardHeader}>
        {tieneBilleterasUsd ? (
          <div className={styles.currencyTabs} role="tablist" aria-label="Seleccionar moneda">
            <button
              type="button"
              role="tab"
              aria-selected={moneda === 'ARS'}
              className={`${styles.currencyTab} ${moneda === 'ARS' ? styles.currencyTabActive : ''}`}
              onClick={() => onToggleMoneda('ARS')}
            >
              ARS
            </button>
            <span className={styles.currencyTabSep}>/</span>
            <button
              type="button"
              role="tab"
              aria-selected={moneda === 'USD'}
              className={`${styles.currencyTab} ${moneda === 'USD' ? styles.currencyTabActive : ''}`}
              onClick={() => onToggleMoneda('USD')}
            >
              USD
            </button>
          </div>
        ) : (
          <div className={styles.currencyBadge}>
            <span className={styles.currencyBadgeDot} />
            {moneda}
          </div>
        )}

        <div className={styles.balanceHeaderActions}>
          <button
            type="button"
            className={styles.balanceHeaderIconBtn}
            onClick={onTogglePrivacy}
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>
      </div>

      {/* ── Balance Principal & Subtítulo ──────────────────────────────── */}
      <div className={styles.balanceBody}>
        <h2 className={`${styles.saldoAmount} ${saldoTotal < 0 ? styles.saldoAmountNegative : ''}`}>
          {showBalance ? fmt(saldoTotal, moneda) : '••••••••'}
        </h2>

        {/* Subtítulo dinámico: adaptado según si tiene 1 sola billetera o varias */}
        {singleWallet ? (
          <span className={styles.singleWalletSubtitle}>
            <span className={styles.singleWalletDot} />
            <span>{singleWallet.nombre}</span>
            {singleWallet.es_principal && (
              <Star size={11} fill="currentColor" className={styles.singleWalletStar} />
            )}
          </span>
        ) : (
          <span className={styles.disponibleSub}>
            {billeterasActivas.length === 0
              ? `Sin billeteras en ${moneda}`
              : billeterasSeleccionadas.length === 0
                ? `Total en ${billeterasActivas.length} billeteras`
                : billeterasSeleccionadas.length === 1
                  ? `Saldo en ${billeterasActivas.find(b => b.id === billeterasSeleccionadas[0])?.nombre ?? 'billetera'}`
                  : `${billeterasSeleccionadas.length} billeteras seleccionadas`}
          </span>
        )}

        {/* ── Disponible para gastar con Desglose Popover ─────────────── */}
        <div className={styles.disponibleGastarContainer} ref={desgloseContainerRef}>
          <button
            type="button"
            className={styles.disponibleGastarRow}
            onClick={() => setShowDesglose(prev => !prev)}
            aria-expanded={showDesglose}
            title="Click para ver desglose de compromisos del ciclo"
          >
            <div className={styles.disponibleGastarLabelWrap}>
              <span>Disponible para gastar</span>
              <HelpCircle size={13} className={styles.disponibleGastarInfoIcon} />
            </div>
            <span
              className={`${styles.disponibleGastarValue} ${saldoDisponible < 0 ? styles.disponibleNegative : ''}`}
            >
              {showBalance ? fmt(saldoDisponible, moneda) : '••••••••'}
            </span>
          </button>

          {showDesglose && (
            <div className={styles.desglosePopover} role="tooltip">
              <div className={styles.desgloseItem}>
                <span className={styles.desgloseItemLabel}>Saldo total</span>
                <span className={styles.desgloseItemValue}>
                  {showBalance ? fmt(saldoTotal, moneda) : '••••'}
                </span>
              </div>
              <div className={styles.desgloseItem}>
                <span className={styles.desgloseItemLabel}>Cuotas pendientes</span>
                <span
                  className={`${styles.desgloseItemValue} ${cuotasPendientes > 0 ? styles.desgloseDeduction : ''}`}
                >
                  {showBalance
                    ? cuotasPendientes > 0
                      ? `- ${fmt(cuotasPendientes, moneda)}`
                      : fmt(0, moneda)
                    : '••••'}
                </span>
              </div>
              <div className={styles.desgloseItem}>
                <span className={styles.desgloseItemLabel}>Suscripciones pendientes</span>
                <span
                  className={`${styles.desgloseItemValue} ${suscripcionesPendientes > 0 ? styles.desgloseDeduction : ''}`}
                >
                  {showBalance
                    ? suscripcionesPendientes > 0
                      ? `- ${fmt(suscripcionesPendientes, moneda)}`
                      : fmt(0, moneda)
                    : '••••'}
                </span>
              </div>
              <div className={styles.desgloseDivider} />
              <div className={`${styles.desgloseItem} ${styles.desgloseTotalRow}`}>
                <span className={styles.desgloseTotalLabel}>Disponible para gastar</span>
                <span className={styles.desgloseTotalValue}>
                  {showBalance ? fmt(saldoDisponible, moneda) : '••••'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Wallet Filter Pills Track (Solo si hay MÁS de 1 billetera) ─── */}
      {billeterasActivas.length > 1 && (
        <div className={styles.walletPillsTrack} role="tablist" aria-label="Filtrar por billetera">
          <button
            type="button"
            role="tab"
            aria-selected={billeterasSeleccionadas.length === 0}
            className={`${styles.walletPill} ${billeterasSeleccionadas.length === 0 ? styles.walletPillActive : ''}`}
            onClick={() => onToggleBilletera(null)}
            title="Ver todas las billeteras"
          >
            <span className={styles.walletPillDot} />
            <span className={styles.walletPillName}>Todas</span>
            <span className={styles.walletPillCount}>{billeterasActivas.length}</span>
          </button>

          {billeterasActivas.map(b => {
            const isSelected = billeterasSeleccionadas.includes(b.id)
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.walletPill} ${isSelected ? styles.walletPillActive : ''}`}
                onClick={() => onToggleBilletera(b.id)}
                title={`Filtrar por ${b.nombre}${b.es_principal ? ' (Favorita)' : ''}`}
              >
                <span className={styles.walletPillName}>
                  {b.nombre}
                  {b.es_principal && (
                    <Star size={10} fill="currentColor" className={styles.walletPillStar} />
                  )}
                </span>
                <span className={styles.walletPillAmount}>
                  {showBalance ? fmt(b.saldo_actual, b.moneda) : '••••'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Flechas de Ingreso y Egreso ─────────────────────────────────── */}
      <div className={styles.balanceTrends}>
        <div className={styles.balanceTrendItem} title="Ingresos del ciclo">
          <TrendingUp size={15} className={styles.trendUp} />
          <span className={styles.trendAmount}>
            {showBalance ? fmt(ingresos, moneda) : '••••'}
          </span>
        </div>
        <div className={styles.balanceTrendItem} title="Egresos del ciclo">
          <TrendingDown size={15} className={styles.trendDown} />
          <span className={styles.trendAmount}>
            {showBalance ? fmt(egresos, moneda) : '••••'}
          </span>
        </div>
      </div>
    </div>
  )
})

export default BalanceCard
