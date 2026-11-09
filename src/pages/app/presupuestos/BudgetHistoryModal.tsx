import { useEffect, useRef } from 'react'
import { 
  X, 
  History, 
  AlertCircle 
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { Button, EmptyState, Skeleton } from '@/components/ui'
import type { Presupuesto, PeriodoPresupuesto } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import styles from './BudgetHistoryModal.module.css'

interface BudgetHistoryModalProps {
  open: boolean
  onClose: () => void
  presupuesto: Presupuesto | null
  historial: PeriodoPresupuesto[]
  loading: boolean
  onSubirLimite?: () => void
}

export default function BudgetHistoryModal({ 
  open, 
  onClose, 
  presupuesto, 
  historial, 
  loading,
  onSubirLimite
}: BudgetHistoryModalProps) {

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose} 
      showHeader={false} 
      noPadding 
      autoHeight 
      ariaLabel={`Historial de ${presupuesto?.nombre}`}
    >
      <div className={styles.modalContent} data-modal-frame>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Historial</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {presupuesto?.sugerencia_limite && (
          <div className={styles.suggestionBanner}>
            <AlertCircle size={24} className={styles.suggestionIcon} />
            <div>
              <p className={styles.suggestionTitle}>Sugerencia de ajuste</p>
              <p className={styles.suggestionDesc}>
                {presupuesto.sugerencia_limite.texto}
              </p>
              <Button variant="secondary" onClick={onSubirLimite}>
                {presupuesto.sugerencia_limite.boton}
              </Button>
            </div>
          </div>
        )}

        <div className={styles.historyBody} data-modal-stack>
          {loading ? (
            <div className={styles.historyList}>
              {[1, 2, 3].map(i => (
                <div key={i} className={`${styles.historyItem} ${styles.skeletonItem}`}>
                  <div className={styles.skeletonHeader}>
                    <Skeleton variant="text" width="55%" height={14} />
                    <Skeleton variant="text" width="35%" height={14} />
                  </div>
                  <Skeleton variant="rounded" height={6} borderRadius={4} />
                </div>
              ))}
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
