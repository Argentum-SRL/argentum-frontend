import { Sparkles } from 'lucide-react'
import type { DesignAuditMetrics, CoverageMatrix } from '@/types/diseno'
import styles from './DisenoMetricsBar.module.css'

interface Props {
  metrics: DesignAuditMetrics
  coverageMatrix?: CoverageMatrix
  decisionStats: {
    aprobadas: number
    revisadas: number
    pendientes: number
    total: number
  }
}

export default function DisenoMetricsBar({ decisionStats }: Props) {
  const percentApproved = decisionStats.total > 0
    ? Math.round((decisionStats.aprobadas / decisionStats.total) * 100)
    : 0

  return (
    <div className={styles.wrapper}>
      {/* Tarjeta Principal de Progreso Visual */}
      <div className={styles.heroProgressCard}>
        <div className={styles.progressMainCol}>
          <div className={styles.progressHeader}>
            <div className={styles.progressTitleGroup}>
              <Sparkles size={18} className={styles.sparkleIcon} />
              <span className={styles.progressTitle}>Tu Progreso de Estandarización</span>
            </div>
            <span className={styles.progressBadge}>
              {decisionStats.aprobadas} de {decisionStats.total} familias listas ({percentApproved}%)
            </span>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percentApproved}%` }}
            />
          </div>

          <div className={styles.progressLegend}>
            <span><strong className={styles.aprobadaText}>{decisionStats.aprobadas}</strong> oficiales elegidas</span>
            <span>•</span>
            <span><strong className={styles.revisadaText}>{decisionStats.revisadas}</strong> en revisión</span>
            <span>•</span>
            <span><strong>{decisionStats.pendientes}</strong> pendientes de elegir</span>
          </div>
        </div>
      </div>
    </div>
  )
}
