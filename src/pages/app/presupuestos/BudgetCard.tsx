import { useEffect, useRef } from 'react'
import { 
  History, 
  Edit, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  RefreshCw, 
  Clock,
  Target
} from 'lucide-react'
import type { Presupuesto } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import styles from './BudgetCard.module.css'

interface BudgetCardProps {
  presupuesto: Presupuesto
  onEdit: () => void
  onPause: () => void
  onResume: () => void
  onDelete: () => void
  onHistory: () => void
}

export default function BudgetCard({ 
  presupuesto, onEdit, onPause, onResume, onDelete, onHistory 
}: BudgetCardProps) {
  const p = presupuesto.periodo_actual
  const porcentaje = p ? p.porcentaje_usado : 0
  const barRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  
  const getProgressColor = (pct: number) => {
    if (pct < 80) return '#22C55E' // success
    if (pct < 100) return '#F59E0B' // warning/info
    return '#EF4444' // error
  }

  const progressColor = getProgressColor(porcentaje)

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(porcentaje, 100)}%`
      barRef.current.style.backgroundColor = progressColor
    }
    if (percentRef.current) {
      percentRef.current.style.color = progressColor
    }
  }, [porcentaje, progressColor])

  const isSuperado = porcentaje >= 100
  const isAlerta = porcentaje >= 80 && porcentaje < 100

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTop}>
          <div className={styles.titleInfo}>
            <h3 className={styles.cardTitle}>{presupuesto.nombre}</h3>
            <span className={styles.periodBadge}>{presupuesto.periodo}</span>
          </div>
          <div className={styles.categoryChips}>
            {presupuesto.categorias.slice(0, 2).map((c, i) => (
              <span key={i} className={styles.chip}>
                <SubcategoriaIcon nombre={c.subcategoria_nombre} parentCategory={c.nombre} size={14} />
                {c.subcategoria_nombre || c.nombre}
              </span>
            ))}
            {presupuesto.categorias.length > 2 && (
              <span className={styles.chip}>+{presupuesto.categorias.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
           <div className={styles.statusBadges}>
            {isSuperado && <span className={`${styles.statusBadge} ${styles.badgeError}`}>Superado</span>}
            {isAlerta && <span className={`${styles.statusBadge} ${styles.badgeAlert}`}>En alerta</span>}
            {presupuesto.estado === 'pausado' && <span className={`${styles.statusBadge} ${styles.badgePause}`}>Pausado</span>}
          </div>
          <span ref={percentRef} className={styles.percentValue}>{porcentaje.toFixed(1)}%</span>
        </div>
        
        <div className={styles.progressContainer}>
          <div 
            ref={barRef}
            className={`${styles.progressBar} ${isSuperado ? styles.progressOverflow : ''}`}
          />
        </div>
        
        <div className={styles.progressLabels}>
          <div className={styles.labelGroup}>
            <span className={styles.label}>Gastado</span>
            <span className={styles.value}>{formatMonto(p?.monto_usado || 0, presupuesto.moneda)}</span>
          </div>
          <div className={styles.labelGroup}>
            <span className={styles.label}>Límite</span>
            <span className={styles.value}>{formatMonto(p?.monto_limite || presupuesto.monto, presupuesto.moneda)}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.infoRow}>
          <Clock size={14} />
          <span>Vence el {p ? formatFecha(p.fecha_fin) : '-'}</span>
        </div>
        <div className={styles.infoRow}>
          {presupuesto.renovacion === 'automatica' ? <RefreshCw size={14} /> : <Target size={14} />}
          <span>Renovación {presupuesto.renovacion}</span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button className={styles.btnAction} onClick={onHistory} title="Historial"><History size={16} /></button>
        <button className={styles.btnAction} onClick={onEdit} title="Editar"><Edit size={16} /></button>
        {presupuesto.estado === 'activo' ? (
          <button className={styles.btnAction} onClick={onPause} title="Pausar"><PauseCircle size={16} /></button>
        ) : presupuesto.estado === 'pausado' ? (
          <button className={`${styles.btnAction} ${styles.btnSuccess}`} onClick={onResume} title="Reanudar"><PlayCircle size={16} /></button>
        ) : null}
        <button className={`${styles.btnAction} ${styles.btnDanger}`} onClick={onDelete} title="Finalizar"><Trash2 size={16} /></button>
      </div>
    </div>
  )
}

