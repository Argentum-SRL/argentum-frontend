import { memo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  AlertTriangle,
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
  const singleWallet = billeterasActivas.length === 1 ? billeterasActivas[0] : null
  const totalCompromisos = (cuotasPendientes || 0) + (suscripcionesPendientes || 0)
  const hasCompromisos = totalCompromisos > 0
  const isDeficit = saldoDisponible < 0

  // Cálculo del porcentaje libre para la barra de asignación (0% a 100%)
  const ratioDisponible = saldoTotal > 0 ? Math.max(0, Math.min(100, Math.round((saldoDisponible / saldoTotal) * 100))) : 0

  return (
    <div className={styles.balanceCard}>
      {/* ── Header: Título y acciones (Selector de Moneda + Privacidad) ── */}
      <div className={styles.balanceCardHeader}>
        <span className={styles.balanceHeaderLabel}>Balance general</span>

        <div className={styles.balanceHeaderActions}>
          {tieneBilleterasUsd && (
            <div className={styles.currencySegmented} role="tablist" aria-label="Seleccionar moneda">
              <button
                type="button"
                role="tab"
                aria-selected={moneda === 'ARS'}
                className={`${styles.currencySegmentBtn} ${moneda === 'ARS' ? styles.currencySegmentBtnActive : ''}`}
                onClick={() => onToggleMoneda('ARS')}
              >
                Pesos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={moneda === 'USD'}
                className={`${styles.currencySegmentBtn} ${moneda === 'USD' ? styles.currencySegmentBtnActive : ''}`}
                onClick={() => onToggleMoneda('USD')}
              >
                Dólares
              </button>
            </div>
          )}

          <button
            type="button"
            className={styles.balanceHeaderIconBtn}
            onClick={onTogglePrivacy}
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
            aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {showBalance ? <Eye size={17} strokeWidth={1.85} /> : <EyeOff size={17} strokeWidth={1.85} />}
          </button>
        </div>
      </div>

      {/* ── Balance Hero Body ─────────────────────────────────────────── */}
      <div className={styles.balanceBody}>
        <h2 className={`${styles.saldoAmount} ${saldoTotal < 0 ? styles.saldoAmountNegative : ''}`}>
          {showBalance ? fmt(saldoTotal, moneda) : '••••••••'}
        </h2>

        {/* Subtítulo: 1 sola billetera o selección */}
        {singleWallet ? (
          <div className={styles.singleWalletSubtitle}>
            <span className={styles.singleWalletDot} />
            <span className={styles.singleWalletName}>{singleWallet.nombre}</span>
            {singleWallet.es_principal && (
              <Star size={11} fill="currentColor" className={styles.singleWalletStar} />
            )}
          </div>
        ) : (
          <div className={styles.disponibleSub}>
            {billeterasActivas.length === 0
              ? `Sin billeteras en ${moneda === 'ARS' ? 'pesos' : 'dólares'}`
              : billeterasSeleccionadas.length === 0
                ? `Total en ${billeterasActivas.length} billeteras`
                : billeterasSeleccionadas.length === 1
                  ? `Saldo en ${billeterasActivas.find(b => b.id === billeterasSeleccionadas[0])?.nombre ?? 'billetera'}`
                  : `${billeterasSeleccionadas.length} billeteras seleccionadas`}
          </div>
        )}

        {/* ── Financial Freedom / Compromisos Insight (Rediseño Zen) ──── */}
        {!hasCompromisos ? (
          // Caso A: 100% Libre sin compromisos -> No duplicamos el número, damos paz mental con un pill sutil
          <div className={styles.freeBadge}>
            <CheckCircle2 size={13} className={styles.freeBadgeIcon} />
            <span>100% disponible · Sin compromisos este mes</span>
          </div>
        ) : isDeficit ? (
          // Caso B: Compromisos superan saldo -> Alerta clara y accionable
          <div className={styles.deficitBox}>
            <div className={styles.deficitTop}>
              <AlertTriangle size={14} className={styles.deficitIcon} />
              <span className={styles.deficitTitle}>Compromisos exceden tu saldo</span>
            </div>
            <div className={styles.deficitMetrics}>
              <span>Comprometido: {showBalance ? fmt(totalCompromisos, moneda) : '••••'}</span>
              <span className={styles.deficitDiff}>Déficit: {showBalance ? fmt(Math.abs(saldoDisponible), moneda) : '••••'}</span>
            </div>
          </div>
        ) : (
          // Caso C: Hay compromisos pendientes -> Visual Allocation Strip 100% fluido y responsivo
          <div className={styles.allocationCard}>
            <div className={styles.allocationRow}>
              <div className={styles.allocationCol}>
                <span className={styles.allocationLabel}>Disponible libre</span>
                <span className={styles.allocationValDisponible}>
                  {showBalance ? fmt(saldoDisponible, moneda) : '••••••••'}
                </span>
              </div>
              <div className={`${styles.allocationCol} ${styles.allocationColRight}`}>
                <span className={styles.allocationLabel}>Comprometido</span>
                <span className={styles.allocationValCompromiso}>
                  {showBalance ? `- ${fmt(totalCompromisos, moneda)}` : '••••'}
                </span>
              </div>
            </div>

            {/* Barra visual proporcional */}
            <div className={styles.allocationTrack} title={`${ratioDisponible}% libre para gastar`}>
              <div
                className={styles.allocationFillFree}
                style={{ width: `${ratioDisponible}%` }}
              />
            </div>

            {/* Micro-desglose claro de dónde viene el compromiso */}
            <div className={styles.allocationTags}>
              {cuotasPendientes > 0 && (
                <span className={styles.allocationTag}>
                  Cuotas: <strong>{showBalance ? fmt(cuotasPendientes, moneda) : '••••'}</strong>
                </span>
              )}
              {suscripcionesPendientes > 0 && (
                <span className={styles.allocationTag}>
                  Suscripciones: <strong>{showBalance ? fmt(suscripcionesPendientes, moneda) : '••••'}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Wallet Filter Pills Track (Solo si hay más de 1 billetera) ─── */}
      {billeterasActivas.length > 1 && (
        <div className={styles.walletPillsContainer}>
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
        </div>
      )}

      {/* ── Balance Trends (Ingresos y Egresos) ─────────────────────────── */}
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
