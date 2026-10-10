import { useMemo } from 'react'
import { 
  Calendar, 
  Plus,
  Trophy,
  Target,
  CheckCircle2
} from '@/components/ui/icons'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import { formatMonto, formatFecha } from '@/utils/format'
import styles from './GoalCard.module.css'

interface GoalCardProps {
  goal: Goal
  onContribute: () => void
  onDetails: () => void
  onEdit?: () => void
  onRefresh?: () => void
}

export default function GoalCard({ goal, onContribute, onDetails }: GoalCardProps) {
  const objetivo = Number(goal.monto_objetivo || 1)
  const actual = Number(goal.monto_actual || 0)
  const porcentaje = objetivo > 0 ? (actual / objetivo) * 100 : 0
  const restante = Math.max(0, objetivo - actual)
  const isCompleted = porcentaje >= 100 || goal.estado === EstadoMeta.COMPLETADA
  const isPaused = goal.estado === EstadoMeta.PAUSADA
  const goalColor = goal.color || 'var(--primary)'

  // Dynamic progress bar styling
  const progressFillStyle = useMemo(() => {
    return {
      width: `${Math.min(porcentaje, 100)}%`,
      backgroundColor: isCompleted ? 'var(--success)' : goalColor,
    }
  }, [porcentaje, isCompleted, goalColor])

  // Avatar tint styling
  const avatarStyle = useMemo(() => {
    if (isCompleted) {
      return {
        backgroundColor: 'rgba(26, 122, 74, 0.12)',
        color: 'var(--success)',
        borderColor: 'rgba(26, 122, 74, 0.25)'
      }
    }
    return {
      backgroundColor: goal.color ? `${goal.color}15` : 'var(--surface-alt)',
      color: goal.color || 'var(--primary)',
      borderColor: goal.color ? `${goal.color}30` : 'var(--border)'
    }
  }, [isCompleted, goal.color])

  return (
    <div 
      className={`${styles.card} ${isPaused ? styles.cardPaused : ''} ${isCompleted ? styles.cardCompleted : ''}`} 
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
          <div className={styles.goalAvatar} style={avatarStyle}>
            {isCompleted ? (
              <Trophy size={18} strokeWidth={2.2} />
            ) : (
              <Target size={18} strokeWidth={2.2} />
            )}
          </div>
          <div className={styles.headerText}>
            <div className={styles.titleRow}>
              <h3 className={styles.goalTitle} title={goal.nombre}>
                {goal.nombre}
              </h3>
              <span className={styles.currencyTag}>
                {goal.moneda === 'USD' ? 'Dólares' : 'Pesos'}
              </span>
            </div>
            {goal.fecha_limite && (
              <div className={styles.metaRow}>
                <Calendar size={12} className={styles.metaIcon} />
                <span>{formatFecha(goal.fecha_limite)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className={styles.headerRight}>
          {isPaused && (
            <span className={styles.statusPillPaused}>Pausada</span>
          )}
          {isCompleted && (
            <span className={styles.statusPillCompleted}>
              <CheckCircle2 size={11} strokeWidth={2.5} />
              Completada
            </span>
          )}
        </div>
      </div>

      {/* ── Financial Hero Metrics ─────────────────────────────── */}
      <div className={styles.metricsSection}>
        <div className={styles.amountsRow}>
          <div className={styles.savedGroup}>
            <span className={styles.metricsLabel}>Ahorrado</span>
            <div className={styles.savedValue}>
              {formatMonto(actual, goal.moneda as 'ARS' | 'USD')}
            </div>
          </div>

          <div className={styles.targetGroup}>
            <span className={styles.metricsLabel}>Objetivo</span>
            <div className={styles.targetValue}>
              {formatMonto(objetivo, goal.moneda as 'ARS' | 'USD')}
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

        {/* Progress Sub-bar (Percentage + Delta) */}
        <div className={styles.progressMeta}>
          <span className={styles.percentBadge}>
            {porcentaje.toFixed(1)}%
          </span>
          <span className={styles.remainingText}>
            {isCompleted ? (
              <span className={styles.completedNote}>¡Objetivo alcanzado!</span>
            ) : (
              <>Faltan <span className={styles.remainingAmount}>{formatMonto(restante, goal.moneda as 'ARS' | 'USD')}</span></>
            )}
          </span>
        </div>
      </div>

      {/* ── Card Footer / CTA ──────────────────────────────────── */}
      <div className={styles.cardFooter}>
        <button 
          type="button"
          className={`${styles.primaryBtn} ${isCompleted ? styles.completedBtn : ''}`}
          onClick={(e) => { e.stopPropagation(); onContribute(); }}
        >
          {isCompleted ? (
            <>
              <Trophy size={14} />
              <span>Gestionar fondos</span>
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={2.5} />
              <span>Aportar dinero</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

