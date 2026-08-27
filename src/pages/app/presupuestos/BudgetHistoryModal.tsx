import { useMemo, useEffect, useRef } from 'react'
import { 
  X, 
  History, 
  AlertCircle 
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { EmptyState } from '@/components/ui'
import type { Presupuesto, PeriodoPresupuesto } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import styles from './BudgetHistoryModal.module.css'

interface BudgetHistoryModalProps {
  open: boolean
  onClose: () => void
  presupuesto: Presupuesto | null
  historial: PeriodoPresupuesto[]
  loading: boolean
}

export default function BudgetHistoryModal({ 
  open, 
  onClose, 
  presupuesto, 
  historial, 
  loading 
}: BudgetHistoryModalProps) {
  
  const superado3Seguidos = useMemo(() => {
    if (historial.length < 3) return false
    return historial.slice(0, 3).every(h => h.superado)
  }, [historial])

  const gastoPromedio = useMemo(() => {
    if (historial.length === 0) return 0
    const sum = historial.slice(0, 3).reduce((acc, h) => acc + Number(h.monto_usado || 0), 0)
    return sum / Math.min(historial.length, 3)
  }, [historial])

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      showHeader={false} 
      noPadding 
      autoHeight 
      ariaLabel={`Historial de ${presupuesto?.nombre}`}
    >
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Historial</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {superado3Seguidos && (
          <div className={styles.suggestionBanner}>
            <AlertCircle size={24} className={styles.suggestionIcon} />
            <div>
              <p className={styles.suggestionTitle}>Sugerencia de ajuste</p>
              <p className={styles.suggestionDesc}>
                Superaste este presupuesto los últimos 3 periodos. 
                Tu gasto promedio real es de <b>{formatMonto(gastoPromedio, presupuesto?.moneda || 'ARS')}</b>.
                Considerá aumentar el límite para reflejar tu realidad.
              </p>
            </div>
          </div>
        )}

        <div className={styles.historyBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className="spinner" />
              <p>Cargando historial...</p>
            </div>
          ) : historial.length === 0 ? (
            <EmptyState
              variant="compact"
              icon={History}
              title="Sin periodos cerrados"
              description="Aún no hay historial para este presupuesto."
            />
          ) : (
            <div className={styles.historyList}>
              {historial.map(h => (
                <HistoryItem 
                  key={h.id} 
                  h={h} 
                  moneda={presupuesto?.moneda || 'ARS'} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

function HistoryItem({ h, moneda }: { h: PeriodoPresupuesto, moneda: 'ARS' | 'USD' }) {
  const barRef = useRef<HTMLDivElement>(null)
  const isOverLimit = h.porcentaje_usado >= 100
  const color = isOverLimit ? '#EF4444' : '#22C55E'

  useEffect(() => {
    if (barRef.current) {
      // Small delay to ensure the modal is open before animating
      const t = setTimeout(() => {
        if (barRef.current) {
          barRef.current.style.width = `${Math.min(h.porcentaje_usado, 100)}%`
          barRef.current.style.backgroundColor = color
        }
      }, 100)
      return () => clearTimeout(t)
    }
  }, [h.porcentaje_usado, color])

  return (
    <div className={styles.historyItem}>
      <div className={styles.itemHeader}>
        <span className={styles.dates}>
          {formatFecha(h.fecha_inicio)} - {formatFecha(h.fecha_fin)}
        </span>
        <span className={`${styles.statusBadge} ${isOverLimit ? styles.statusError : styles.statusSuccess}`}>
          {isOverLimit ? 'Superado' : 'Cumplido'}
        </span>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBarContainer}>
          <div ref={barRef} className={styles.progressBar} />
        </div>
        
        <div className={styles.stats}>
          <div className={styles.amounts}>
            <span className={styles.usedAmount}>{formatMonto(h.monto_usado, moneda)}</span>
            <span className={styles.limitAmount}>de {formatMonto(h.monto_limite, moneda)}</span>
          </div>
          <span className={styles.percent}>{h.porcentaje_usado.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}
