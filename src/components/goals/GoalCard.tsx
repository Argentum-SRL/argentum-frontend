import { useEffect, useRef } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  MoreHorizontal, 
  Plus,
  Trophy,
  Target,
  Pause,
  Play
} from 'lucide-react'
import goalsService from '@/services/goals.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import { formatMonto, formatFecha } from '@/utils/format'
import styles from './GoalCard.module.css'

interface GoalCardProps {
  goal: Goal
  onEdit: () => void
  onContribute: () => void
  onDetails: () => void
  onRefresh?: () => void
}

export default function GoalCard({ goal, onEdit, onContribute, onDetails, onRefresh }: GoalCardProps) {
  const { showToast } = useToast()
  const porcentaje = goal.monto_objetivo > 0 ? (goal.monto_actual / goal.monto_objetivo) * 100 : 0
  const barRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)

  const getProgressColor = (pct: number) => {
    if (pct < 30) return '#6366F1' // Indigo
    if (pct < 70) return '#3B82F6' // Blue
    if (pct < 100) return '#10B981' // Emerald
    return '#8B5CF6' // Violet (Completed)
  }

  const progressColor = getProgressColor(porcentaje)

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(porcentaje, 100)}%`
      barRef.current.style.backgroundColor = progressColor
      if (goal.color) {
        barRef.current.style.boxShadow = `0 0 10px ${goal.color}44`
      }
    }
    if (percentRef.current) {
      percentRef.current.style.color = progressColor
    }
  }, [porcentaje, progressColor, goal.color])

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nuevoEstado = goal.estado === EstadoMeta.ACTIVA ? EstadoMeta.PAUSADA : EstadoMeta.ACTIVA
    try {
      await goalsService.updateGoal(goal.id, { estado: nuevoEstado })
      showToast(`Meta ${nuevoEstado === EstadoMeta.PAUSADA ? 'pausada' : 'reanudada'}`, 'success')
      onRefresh?.()
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'Error al cambiar el estado'), 'error')
    }
  }

  return (
    <div className={styles.card} onClick={onDetails}>
      <span className={`${styles.statusBadge} ${styles[`badge${goal.estado.charAt(0).toUpperCase() + goal.estado.slice(1)}`]}`}>
        {goal.estado}
      </span>

      <div className={styles.cardHeader}>
        <div className={styles.titleInfo}>
          <div className={styles.currencyBadge}>{goal.moneda}</div>
          <h3 className={styles.cardTitle}>{goal.nombre}</h3>
        </div>
        <button 
          className={styles.btnMenu} 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Editar meta"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span ref={percentRef} className={styles.percentValue}>{porcentaje.toFixed(1)}%</span>
          {goal.estado === EstadoMeta.COMPLETADA ? (
            <Trophy size={20} className={`${styles.velocity} ${styles.completedIcon}`} />
          ) : (
            <div className={styles.velocity}>
              <TrendingUp size={14} />
              <span>A buen ritmo</span>
            </div>
          )}
        </div>
        
        <div className={styles.progressContainer}>
          <div ref={barRef} className={styles.progressBar} />
        </div>
        
        <div className={styles.progressLabels}>
          <div className={styles.labelGroup}>
            <span className={styles.label}>Ahorrado</span>
            <span className={styles.value}>{formatMonto(goal.monto_actual, goal.moneda as 'ARS' | 'USD')}</span>
          </div>
          <div className={`${styles.labelGroup} ${styles.labelGroupRight}`}>
            <span className={styles.label}>Objetivo</span>
            <span className={styles.value}>{formatMonto(goal.monto_objetivo, goal.moneda as 'ARS' | 'USD')}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.infoRow}>
          <Calendar size={14} />
          <span>{goal.fecha_limite ? formatFecha(goal.fecha_limite) : 'Sin límite'}</span>
        </div>
        <div className={styles.infoRow}>
          <Target size={14} />
          <span>Faltan {formatMonto(Math.max(0, goal.monto_objetivo - goal.monto_actual), goal.moneda as 'ARS' | 'USD')}</span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button 
          className={`${styles.btnAction} ${styles.btnPrimary}`} 
          onClick={(e) => { e.stopPropagation(); onContribute(); }}
        >
          <Plus size={16} className={styles.btnIcon} />
          {goal.estado === EstadoMeta.COMPLETADA ? 'Gestionar' : 'Aportar'}
        </button>

        {goal.estado !== EstadoMeta.COMPLETADA && (
          <button 
            className={styles.btnAction} 
            onClick={handleToggleStatus}
            title={goal.estado === EstadoMeta.ACTIVA ? 'Pausar meta' : 'Reanudar meta'}
          >
            {goal.estado === EstadoMeta.ACTIVA ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}
