import { useEffect, useRef } from 'react'
import { 
  History, 
  Edit, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  RefreshCw, 
  Clock,
  Target,
  ArrowLeftRight,
  AlertCircle
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
  const porcentaje = p && Number.isFinite(p.porcentaje_usado) ? p.porcentaje_usado : 0
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
        <div className={styles.cardHeaderTop}>
          <h3 className={styles.cardTitle} title={presupuesto.nombre}>
            {presupuesto.nombre}
          </h3>
          <span className={styles.periodBadge}>{presupuesto.periodo}</span>
        </div>
        {presupuesto.categorias && presupuesto.categorias.length > 0 && (
          <div className={styles.categoryChips}>
            {presupuesto.categorias.slice(0, 3).map((c, i) => (
              <span key={i} className={styles.chip} title={c.nombre}>
                <SubcategoriaIcon 
                  nombre={c.es_subcategoria ? c.nombre : null} 
                  parentCategory={c.es_subcategoria ? null : c.nombre} 
                  size={14} 
                />
                <span className={styles.chipText}>{c.nombre}</span>
              </span>
            ))}
            {presupuesto.categorias.length > 3 && (
              <span className={`${styles.chip} ${styles.chipMore}`}>
                +{presupuesto.categorias.length - 3}
              </span>
            )}
          </div>
        )}
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

        {p && (p.monto_convertido ?? 0) > 0 && (
          <div className={styles.conversionNotice}>
            <ArrowLeftRight size={13} />
            <span>Incluye {formatMonto(p.monto_convertido!, presupuesto.moneda)} convertidos de gastos en otra moneda</span>
          </div>
        )}

        {p && (p.monto_sin_cotizacion ?? 0) > 0 && (
          <div className={styles.uncountedNotice}>
            <AlertCircle size={13} />
            <span>Quedaron {formatMonto(p.monto_sin_cotizacion!, (p.moneda_sin_cotizacion === 'USD' || p.moneda_sin_cotizacion === 'ARS') ? p.moneda_sin_cotizacion : (presupuesto.moneda === 'ARS' ? 'USD' : 'ARS'))} sin contabilizar por falta de cotización en esas fechas</span>
          </div>
        )}
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

