import { useMemo } from 'react'
import {
  Calendar,
  PieChart,
  ArrowLeftRight
} from '@/components/ui/icons'
import type { Presupuesto } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import styles from './BudgetCard.module.css'

interface BudgetCardProps {
  presupuesto: Presupuesto
  onDetails: () => void
  onEdit?: () => void
  onPause?: () => void
  onResume?: () => void
  onDelete?: () => void
  onHistory?: () => void
}

export default function BudgetCard({
  presupuesto,
  onDetails
}: BudgetCardProps) {
  const p = presupuesto.periodo_actual
  const limite = Number(p?.monto_limite || presupuesto.monto || 1)
  const gastado = Number(p?.monto_usado || 0)
  const porcentaje = p && Number.isFinite(p.porcentaje_usado) ? p.porcentaje_usado : (limite > 0 ? (gastado / limite) * 100 : 0)
  const disponible = Math.max(0, limite - gastado)
  const isSuperado = porcentaje >= 100
  const isAlerta = porcentaje >= 80 && porcentaje < 100
  const isPaused = presupuesto.estado === 'pausado'
  const moneda = presupuesto.moneda || 'ARS'

  // Dynamic progress fill styling
  const progressFillStyle = useMemo(() => {
    let color = 'var(--success)'
    if (isSuperado) color = 'var(--error)'
    else if (isAlerta) color = 'var(--warning)'

    return {
      width: `${Math.min(porcentaje, 100)}%`,
      backgroundColor: color
    }
  }, [porcentaje, isSuperado, isAlerta])

  // Avatar tint styling
  const avatarStyle = useMemo(() => {
    if (isSuperado) {
      return {
        backgroundColor: 'rgba(192, 57, 43, 0.12)',
        color: 'var(--error)',
        borderColor: 'rgba(192, 57, 43, 0.25)'
      }
    }
    if (isAlerta) {
      return {
        backgroundColor: 'rgba(201, 162, 39, 0.12)',
        color: 'var(--warning)',
        borderColor: 'rgba(201, 162, 39, 0.25)'
      }
    }
    if (isPaused) {
      return {
        backgroundColor: 'var(--surface-alt)',
        color: 'var(--text-3)',
        borderColor: 'var(--border)'
      }
    }
    return {
      backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
      color: 'var(--primary)',
      borderColor: 'rgba(var(--primary-rgb), 0.18)'
    }
  }, [isSuperado, isAlerta, isPaused])

  // Primary category for icon
  const primaryCat = presupuesto.categorias && presupuesto.categorias.length > 0
    ? presupuesto.categorias[0]
    : null

  const percentBadgeColor = useMemo(() => {
    if (isSuperado) return 'var(--error)'
    if (isAlerta) return 'var(--warning)'
    return 'var(--text)'
  }, [isSuperado, isAlerta])

  return (
    <div
      className={`${styles.card} ${isPaused ? styles.cardPaused : ''} ${isSuperado ? styles.cardSuperado : ''}`}
      onClick={onDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDetails()
        }
      }}
    >
      {/* ── Card Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.budgetAvatar} style={avatarStyle}>
            {primaryCat ? (
              <SubcategoriaIcon 
                nombre={primaryCat.es_subcategoria ? primaryCat.nombre : null} 
                parentCategory={primaryCat.es_subcategoria ? null : primaryCat.nombre} 
                size={20} 
              />
            ) : (
              <PieChart size={18} strokeWidth={2.2} />
            )}
          </div>
          <div className={styles.headerText}>
            <div className={styles.titleRow}>
              <h3 className={styles.budgetTitle} title={presupuesto.nombre}>
                {presupuesto.nombre}
              </h3>
              <span className={styles.currencyTag}>{presupuesto.moneda === 'USD' ? 'Dólares' : 'Pesos'}</span>
              <span className={styles.periodTag}>{presupuesto.periodo}</span>
            </div>
            <div className={styles.metaRow}>
              <Calendar size={12} className={styles.metaIcon} />
              <span>{p ? `Vence el ${formatFecha(p.fecha_fin)}` : 'Sin periodo activo'}</span>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className={styles.headerRight}>
          {isPaused ? (
            <span className={styles.statusPillPaused}>Pausado</span>
          ) : isSuperado ? (
            <span className={styles.statusPillSuperado}>Superado</span>
          ) : isAlerta ? (
            <span className={styles.statusPillAlerta}>En alerta</span>
          ) : null}
        </div>
      </div>

      {/* ── Category Micro-chips ──────────────────────────────── */}
      {presupuesto.categorias && presupuesto.categorias.length > 0 && (
        <div className={styles.categoryChips}>
          {presupuesto.categorias.slice(0, 2).map((c, i) => (
            <span key={i} className={styles.chip} title={c.nombre}>
              <SubcategoriaIcon 
                nombre={c.es_subcategoria ? c.nombre : null} 
                parentCategory={c.es_subcategoria ? null : c.nombre} 
                size={12} 
              />
              <span className={styles.chipText}>{c.nombre}</span>
            </span>
          ))}
          {presupuesto.categorias.length > 2 && (
            <span className={styles.chipMore}>
              +{presupuesto.categorias.length - 2}
            </span>
          )}
        </div>
      )}

      {/* ── Financial Hero Metrics ─────────────────────────────── */}
      <div className={styles.metricsSection}>
        <div className={styles.amountsRow}>
          <div className={styles.spentGroup}>
            <span className={styles.metricsLabel}>Gastado</span>
            <div className={styles.spentValue}>
              {formatMonto(gastado, moneda)}
            </div>
          </div>

          <div className={styles.limitGroup}>
            <span className={styles.metricsLabel}>Límite</span>
            <div className={styles.limitValue}>
              {formatMonto(limite, moneda)}
            </div>
          </div>
        </div>

        {/* Progress Track */}
        <div className={styles.progressTrack}>
          <div 
            className={styles.progressFill} 
            style={progressFillStyle}
          />
        </div>

        {/* Progress Meta (Percentage + Delta) */}
        <div className={styles.progressMeta}>
          <span className={styles.percentBadge} style={{ color: percentBadgeColor }}>
            {porcentaje.toFixed(1)}%
          </span>
          <span className={styles.remainingText}>
            {!p ? (
              <span>Sin ciclo vigente</span>
            ) : isSuperado ? (
              <span className={styles.exceededNote}>
                Excedido por <strong className={styles.exceededAmount}>{formatMonto(gastado - limite, moneda)}</strong>
              </span>
            ) : (
              <>
                Te quedan <span className={styles.remainingAmount}>{formatMonto(disponible, moneda)}</span>
              </>
            )}
          </span>
        </div>

        {/* Bimonetary Conversion Notice */}
        {p && (p.monto_convertido ?? 0) > 0 && (
          <div className={styles.conversionNotice}>
            <ArrowLeftRight size={11} />
            <span>Incluye {formatMonto(p.monto_convertido!, moneda)} convertidos de otra moneda</span>
          </div>
        )}
      </div>
    </div>
  )
}
