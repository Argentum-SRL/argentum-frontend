import {
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from '@/components/ui/icons'
import { FileCheck, ShieldAlert, Ban } from 'lucide-react'
import type { DesignAuditMetrics, CoverageMatrix } from '@/types/diseno'
import styles from './DisenoAuditFindings.module.css'

interface Props {
  metrics: DesignAuditMetrics
  coverageMatrix?: CoverageMatrix
}

export default function DisenoAuditFindings({ metrics, coverageMatrix }: Props) {
  return (
    <div className={styles.findingsContainer}>
      <div className={styles.findingsHeader}>
        <div className={styles.headerTitleGroup}>
          <FileCheck size={20} />
          <h2 className={styles.headerTitle}>Auditoría Estática de Código (AST & CSS)</h2>
        </div>
        <p className={styles.headerSubtitle}>
          Análisis automatizado sobre el 100% de los archivos del frontend de Argentum sin depender de suposiciones teóricas.
        </p>
      </div>

      {/* Condición Explícita de Cobertura (Requisito Crítico) */}
      {coverageMatrix && (
        <div className={styles.coverageMatrixCard}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={18} style={{ color: 'var(--gold)' }} />
            <span className={styles.cardTitle}>Condición Explícita de Cobertura de Auditoría</span>
          </div>
          <p className={styles.familyDescription}>
            Para garantizar decisiones fiables, Argentum no asume auditoría completa únicamente por escanear el árbol de archivos.
            Se audita y reporta transparentemente qué elementos fueron identificados, cuáles se renderizaron en vivo, cuáles se agruparon y cuáles quedaron aislados por dependencias de runtime.
          </p>

          <div className={styles.coverageStatsGrid}>
            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue}>
                {coverageMatrix.totalFilesScanned}
              </span>
              <span className={styles.coverageStatLabel}>
                Archivos Auditados ({coverageMatrix.tsxAndTsFiles} TSX + {coverageMatrix.cssFiles} CSS)
              </span>
            </div>

            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue}>
                {coverageMatrix.totalAstOccurrences.toLocaleString()}
              </span>
              <span className={styles.coverageStatLabel}>Ocurrencias AST Identificadas</span>
            </div>

            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue}>
                {coverageMatrix.canonicalPatternsIdentified}
              </span>
              <span className={styles.coverageStatLabel}>Patrones Canónicos Agrupados</span>
            </div>

            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue} style={{ color: '#16a34a' }}>
                {coverageMatrix.renderedInVivoCount + coverageMatrix.renderedWithOriginalCssCount}
              </span>
              <span className={styles.coverageStatLabel}>Renderizados En Vivo / CSS Original</span>
            </div>

            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue} style={{ color: '#d97706' }}>
                {coverageMatrix.unrenderableCount}
              </span>
              <span className={styles.coverageStatLabel}>No Aislados (Con Motivo Documentado)</span>
            </div>

            <div className={styles.coverageStatItem}>
              <span className={styles.coverageStatValue} style={{ color: 'var(--gold)' }}>
                {coverageMatrix.coveragePercentage}%
              </span>
              <span className={styles.coverageStatLabel}>Cobertura Total Auditada</span>
            </div>
          </div>

          {/* Desglose de Componentes No Renderizables en Aislamiento */}
          {coverageMatrix.unrenderableBreakdown.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={15} style={{ color: '#d97706' }} />
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                  Componentes No Renderizables en Aislamiento ({coverageMatrix.unrenderableBreakdown.length})
                </strong>
              </div>
              <div className={styles.unrenderableTableWrap}>
                <table className={styles.unrenderableTable}>
                  <thead>
                    <tr>
                      <th>Componente</th>
                      <th>Archivo Principal</th>
                      <th>Bloqueador Arquitectónico</th>
                      <th>Razón Técnica Documentada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageMatrix.unrenderableBreakdown.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.componentName}</strong>
                        </td>
                        <td>
                          <code>{item.filePath}</code>
                        </td>
                        <td>
                          <span className={styles.reasonBadge}>{item.isolationBlocker}</span>
                        </td>
                        <td>{item.technicalReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Racional de Exclusiones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ban size={14} style={{ color: 'var(--text-3)' }} />
              <strong style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Directorios Excluidos de la Inspección de Código Propietario:
              </strong>
            </div>
            <ul className={styles.exclusionList}>
              {coverageMatrix.uninspectedRationale.map((rat, idx) => (
                <li key={idx}>{rat}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Resumen de Hallazgos Críticos */}
      <div className={styles.criticalFamiliesGrid}>
        <div className={styles.sectionTitleBlock}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <h3 className={styles.sectionTitle}>Familias con Divergencia Visual Crítica</h3>
        </div>

        {metrics.criticalDivergenceFamilies.map((fam, idx) => (
          <div key={idx} className={styles.familyAlertCard}>
            <div className={styles.familyAlertHeader}>
              <span className={styles.familyNameTag}>{fam.family.replace('_', ' ').toUpperCase()}</span>
              <span className={styles.familyDivergenceBadge}>Divergencia Detectada</span>
            </div>
            <p className={styles.familyDescription}>{fam.description}</p>
            <div className={styles.examplesList}>
              <span className={styles.examplesLabel}>Implementaciones identificadas:</span>
              <div className={styles.examplesPills}>
                {fam.examples.map((ex, i) => (
                  <span key={i} className={styles.examplePill}>
                    <code>{ex}</code>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución por Categorías */}
      <div className={styles.distributionCard}>
        <div className={styles.cardHeader}>
          <Layers size={16} />
          <span className={styles.cardTitle}>Distribución de Variantes Detectadas por Categoría</span>
        </div>

        <div className={styles.distributionTableWrap}>
          <table className={styles.distTable}>
            <thead>
              <tr>
                <th>Categoría Semántica</th>
                <th>Variantes Detectadas</th>
                <th>Porcentaje del Total</th>
                <th>Estado del Catálogo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.categoryDistribution).map(([catKey, count]) => {
                const total = metrics.inventorySummary.totalVariantsDetected
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'

                return (
                  <tr key={catKey}>
                    <td>
                      <strong>{catKey.replace(/_/g, ' ')}</strong>
                    </td>
                    <td><code>{count}</code></td>
                    <td>{pct}%</td>
                    <td>
                      <span className={styles.tableBadgeAuditado}>
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Auditado e indexado
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnóstico del Motor de Reglas */}
      <div className={styles.recommendationsCard}>
        <div className={styles.cardHeader}>
          <Sparkles size={16} />
          <span className={styles.cardTitle}>Diagnóstico Arquitectónico para la Fase de Unificación</span>
        </div>

        <div className={styles.recommendationList}>
          <div className={styles.recItem}>
            <strong>1. Centralizar Primitivas de Selección:</strong>
            <p>
              Reemplazar las 5 reimplementaciones de <code>.segmentedBar</code> y <code>.segmentedPill</code> en los modales por el componente compartido <code>SegmentedControl</code> con tokens configurables.
            </p>
          </div>

          <div className={styles.recItem}>
            <strong>2. Armonizar Border-Radius:</strong>
            <p>
              Establecer una escala semántica rígida: <code>8px</code> para botones compactos/pills, <code>12px</code> para controles estándar y tarjetas, <code>14px</code> para modales y contenedores de diálogo.
            </p>
          </div>

          <div className={styles.recItem}>
            <strong>3. Sombra es Jerarquía, no Decoración:</strong>
            <p>
              Preservar la escala estricta de elevación de <code>elevation.css</code> eliminando sombras ad-hoc y garantizando visibilidad en modo oscuro.
            </p>
          </div>

          <div className={styles.recItem}>
            <strong>4. Reutilización sobre Duplicación:</strong>
            <p>
              Prohibir la creación de nuevos selectores locales en componentes funcionales; extender las props de las primitivas de <code>src/components/ui/</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
