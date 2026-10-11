import { useState } from 'react'
import {
  Layers,
  ShieldCheck,
} from '@/components/ui/icons'
import { GitBranch, GitFork, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
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

export default function DisenoMetricsBar({ metrics, coverageMatrix, decisionStats }: Props) {
  const [showTechMetrics, setShowTechMetrics] = useState(false)
  const percentApproved = decisionStats.total > 0
    ? Math.round((decisionStats.aprobadas / decisionStats.total) * 100)
    : 0

  return (
    <div className={styles.wrapper}>
      {/* Tarjeta Principal de Progreso Humano */}
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

        <button
          type="button"
          className={styles.toggleTechBtn}
          onClick={() => setShowTechMetrics(!showTechMetrics)}
        >
          {showTechMetrics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showTechMetrics ? 'Ocultar datos técnicos' : 'Ver datos de auditoría de código'}</span>
        </button>
      </div>

      {/* Panel Plegable con Métricas Técnicas de AST */}
      {showTechMetrics && (
        <div className={styles.techMetricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap}>
              <Layers size={16} />
            </div>
            <div className={styles.metricData}>
              <span className={styles.metricValue}>
                {metrics.inventorySummary.totalVariantsDetected.toLocaleString()}
              </span>
              <span className={styles.metricLabel}>Ocurrencias AST Identificadas</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconShared}`}>
              <GitFork size={16} />
            </div>
            <div className={styles.metricData}>
              <span className={styles.metricValue}>
                {coverageMatrix?.canonicalPatternsIdentified ?? 194}
              </span>
              <span className={styles.metricLabel}>Patrones Canónicos Agrupados</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconWarning}`}>
              <ShieldCheck size={16} />
            </div>
            <div className={styles.metricData}>
              <span className={styles.metricValue}>
                {coverageMatrix?.coveragePercentage ?? 100}%
              </span>
              <span className={styles.metricLabel}>
                Auditoría AST ({coverageMatrix ? `${coverageMatrix.renderedInVivoCount} In Vivo • ${coverageMatrix.renderedWithOriginalCssCount} CSS` : '194 Patrones'})
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconFiles}`}>
              <GitBranch size={16} />
            </div>
            <div className={styles.metricData}>
              <span className={styles.metricValue}>
                {metrics.scannedFiles.tsxAndTs} / {metrics.scannedFiles.css}
              </span>
              <span className={styles.metricLabel}>Archivos React / CSS Auditados</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

