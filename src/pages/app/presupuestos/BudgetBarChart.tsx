import { useState, useRef } from 'react'
import { 
  History, 
  Edit, 
  PauseCircle, 
  PlayCircle, 
  Trash2,
  X,
  ChevronRight
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Presupuesto } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import styles from './BudgetBarChart.module.css'

interface BudgetBarChartProps {
  presupuestos: Presupuesto[]
  onEdit: (p: Presupuesto) => void
  onPause: (p: Presupuesto) => void
  onResume: (id: string) => void
  onDelete: (p: Presupuesto) => void
  onHistory: (p: Presupuesto) => void
}

/**
 * Curated soft pastel palette matching the TikTok viral comparative bar chart reference.
 */
const PASTEL_PALETTE = [
  { bg: '#FED7AA', border: 'rgba(249, 115, 22, 0.45)', accent: '#EA580C', text: '#431407', darkBg: '#7C2D12', darkText: '#FFEDD5' }, // Peach / Orange
  { bg: '#FBCFE8', border: 'rgba(236, 72, 153, 0.45)', accent: '#DB2777', text: '#500724', darkBg: '#831843', darkText: '#FCE7F3' }, // Pink
  { bg: '#FDA4AF', border: 'rgba(244, 63, 94, 0.45)',  accent: '#E11D48', text: '#4C0519', darkBg: '#881337', darkText: '#FFE4E6' }, // Coral / Salmon
  { bg: '#BAE6FD', border: 'rgba(14, 165, 233, 0.45)', accent: '#0284C7', text: '#082F49', darkBg: '#0C4A6E', darkText: '#E0F2FE' }, // Sky Blue
  { bg: '#A7F3D0', border: 'rgba(16, 185, 129, 0.45)', accent: '#059669', text: '#022C22', darkBg: '#064E3B', darkText: '#D1FAE5' }, // Mint / Green
  { bg: '#DDD6FE', border: 'rgba(139, 92, 246, 0.45)', accent: '#7C3AED', text: '#2E1065', darkBg: '#4C1D95', darkText: '#EDE9FE' }, // Lavender / Violet
  { bg: '#FEF08A', border: 'rgba(234, 179, 8, 0.45)',  accent: '#CA8A04', text: '#422006', darkBg: '#713F12', darkText: '#FEF9C3' }, // Butter / Yellow
]

/**
 * Compact number formatting matching reference (e.g. 766k, 1.2M, $450)
 */
function formatCompact(monto: number, moneda: 'ARS' | 'USD'): string {
  const prefix = moneda === 'USD' ? 'US$' : '$'
  if (monto >= 1_000_000) {
    const val = monto / 1_000_000
    return `${prefix}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`
  }
  if (monto >= 1_000) {
    const val = monto / 1_000
    return `${prefix}${Math.round(val)}k`
  }
  return `${prefix}${Math.round(monto)}`
}

/**
 * BudgetBarChart - Exact replica of the reference TikTok comparative bar chart.
 * Tap on any column opens an action sheet modal with all options.
 */
export default function BudgetBarChart({
  presupuestos,
  onEdit,
  onPause,
  onResume,
  onDelete,
  onHistory
}: BudgetBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activePresupuesto, setActivePresupuesto] = useState<Presupuesto | null>(null)

  const validPresupuestos = presupuestos.filter(p => p.periodo_actual !== null)

  if (validPresupuestos.length === 0) {
    return null
  }

  const maxLimite = Math.max(
    ...validPresupuestos.map(p => Number(p.periodo_actual?.monto_limite || p.monto || 1)),
    1
  )

  const MIN_FRAME_HEIGHT = 130
  const MAX_FRAME_HEIGHT = 240

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Presupuestos del ciclo</span>
        <span className={styles.chartSubtitle}>
          {validPresupuestos.length} {validPresupuestos.length === 1 ? 'activo' : 'activos'}
        </span>
      </div>

      <div className={styles.scrollContainer} ref={containerRef}>
        {validPresupuestos.map((p, idx) => {
          const periodo = p.periodo_actual!
          const limite = Number(periodo.monto_limite || p.monto || 0)
          const gastado = Number(periodo.monto_usado || 0)
          const porcentaje = periodo.porcentaje_usado || (limite > 0 ? (gastado / limite) * 100 : 0)

          // Relative scaling of dashed frame height against max limit
          const ratio = maxLimite > 0 ? Math.max(limite / maxLimite, 0.1) : 1
          const frameHeight = MIN_FRAME_HEIGHT + ratio * (MAX_FRAME_HEIGHT - MIN_FRAME_HEIGHT)

          // Fill height relative to frame height
          const isOverLimit = porcentaje > 100
          const fillRatio = porcentaje / 100
          const rawFillHeight = fillRatio * frameHeight

          // Cap visual overflow height to max +35% above frame height to keep layout stable
          const MAX_OVERFLOW_MULT = 1.35
          const maxAllowedFillHeight = frameHeight * MAX_OVERFLOW_MULT
          const visualFillHeight = Math.min(rawFillHeight, maxAllowedFillHeight)
          const isCappedOverflow = rawFillHeight > maxAllowedFillHeight

          // Assign pastel palette by index
          const palette = PASTEL_PALETTE[idx % PASTEL_PALETTE.length]
          const firstCat = p.categorias[0]

          return (
            <div 
              key={p.id} 
              className={styles.columnWrapper}
              onClick={() => setActivePresupuesto(p)}
            >
              {/* Main Bar Column Area */}
              <div 
                className={styles.barArea} 
                style={{ height: `${MAX_FRAME_HEIGHT * 1.35}px` }}
                title={`${p.nombre}: Gastado ${formatMonto(gastado, p.moneda)} de ${formatMonto(limite, p.moneda)} (${porcentaje.toFixed(0)}%)`}
              >
                {/* 1. Dashed Frame (Limit Indicator Outline) */}
                <div 
                  className={`${styles.dashedFrame} ${isOverLimit ? styles.dashedFrameUnder : ''}`}
                  style={{ 
                    height: `${frameHeight}px`,
                    borderColor: palette.border
                  }}
                />

                {/* 2. Solid Pastel Fill Bar (wrapped in fillTrack for capsule clipping) */}
                <div
                  className={styles.fillTrack}
                  style={{
                    height: `${isOverLimit ? visualFillHeight : frameHeight}px`,
                  }}
                >
                  <div
                    className={`${styles.solidFill} ${isOverLimit ? styles.solidFillOverflow : ''}`}
                    style={{
                      height: `${visualFillHeight}px`,
                      backgroundColor: palette.bg,
                      opacity: porcentaje <= 0 ? 0 : 1
                    }}
                  />
                </div>

                {/* 3. Stacked Content Inside Bottom of the Column: Icon, Amount, % */}
                <div className={styles.barContent}>
                  <div className={styles.iconWrapper}>
                    <SubcategoriaIcon
                      nombre={firstCat?.es_subcategoria ? firstCat.nombre : null}
                      parentCategory={firstCat?.es_subcategoria ? null : firstCat?.nombre}
                      size={28}
                    />
                  </div>
                  <span className={styles.spentAmount}>
                    {formatCompact(gastado, p.moneda)}
                  </span>
                  <span className={styles.percentText}>
                    {porcentaje.toFixed(0)}%{isCappedOverflow ? ' ▲' : ''}
                  </span>
                </div>
              </div>

              {/* Bottom Label: Budget Name */}
              <span className={styles.budgetName} title={p.nombre}>
                {p.nombre}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Action Bottom Sheet Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!activePresupuesto}
        onClose={() => setActivePresupuesto(null)}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel={activePresupuesto ? `Opciones de ${activePresupuesto.nombre}` : 'Opciones'}
      >
        {activePresupuesto && (
          <div className={styles.sheetContent}>
            {/* Sheet Header */}
            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitleGroup}>
                <div className={styles.sheetIcon}>
                  <SubcategoriaIcon
                    nombre={activePresupuesto.categorias[0]?.es_subcategoria ? activePresupuesto.categorias[0].nombre : null}
                    parentCategory={activePresupuesto.categorias[0]?.es_subcategoria ? null : activePresupuesto.categorias[0]?.nombre}
                    size={32}
                  />
                </div>
                <div>
                  <h3 className={styles.sheetTitle}>{activePresupuesto.nombre}</h3>
                  <span className={styles.sheetBadge}>{activePresupuesto.periodo}</span>
                </div>
              </div>
              <button 
                className={styles.sheetCloseBtn} 
                onClick={() => setActivePresupuesto(null)}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Summary Card */}
            {activePresupuesto.periodo_actual && (
              <div className={styles.sheetSummaryCard}>
                <div className={styles.sheetSummaryRow}>
                  <span className={styles.sheetSummaryLabel}>Gastado este ciclo</span>
                  <span className={styles.sheetSummaryValue}>
                    {formatMonto(activePresupuesto.periodo_actual.monto_usado, activePresupuesto.moneda)}
                    <span className={styles.sheetSummaryLimit}>
                      {' '}de {formatMonto(activePresupuesto.periodo_actual.monto_limite, activePresupuesto.moneda)}
                    </span>
                  </span>
                </div>
                <div className={styles.sheetProgressBar}>
                  <div 
                    className={styles.sheetProgressFill}
                    style={{
                      width: `${Math.min(activePresupuesto.periodo_actual.porcentaje_usado, 100)}%`,
                      backgroundColor: activePresupuesto.periodo_actual.porcentaje_usado >= 100 
                        ? 'var(--error, #EF4444)' 
                        : activePresupuesto.periodo_actual.porcentaje_usado >= 80 
                        ? '#F59E0B' 
                        : 'var(--success, #22C55E)'
                    }}
                  />
                </div>
                <div className={styles.sheetSummaryMeta}>
                  <span>{activePresupuesto.periodo_actual.porcentaje_usado.toFixed(1)}% utilizado</span>
                  <span>Vence el {formatFecha(activePresupuesto.periodo_actual.fecha_fin)}</span>
                </div>
              </div>
            )}

            {/* Action Items List */}
            <div className={styles.sheetActionsList}>
              <button 
                className={styles.sheetActionItem}
                onClick={() => {
                  const p = activePresupuesto
                  setActivePresupuesto(null)
                  onHistory(p)
                }}
              >
                <div className={styles.sheetActionIcon}>
                  <History size={18} />
                </div>
                <div className={styles.sheetActionText}>
                  <span className={styles.sheetActionTitle}>Ver historial de periodos</span>
                  <span className={styles.sheetActionSubtitle}>Consultá cierres y gastos anteriores</span>
                </div>
                <ChevronRight size={16} className={styles.sheetChevron} />
              </button>

              <button 
                className={styles.sheetActionItem}
                onClick={() => {
                  const p = activePresupuesto
                  setActivePresupuesto(null)
                  onEdit(p)
                }}
              >
                <div className={styles.sheetActionIcon}>
                  <Edit size={18} />
                </div>
                <div className={styles.sheetActionText}>
                  <span className={styles.sheetActionTitle}>Editar presupuesto</span>
                  <span className={styles.sheetActionSubtitle}>Modificá el límite, categorías o ciclo</span>
                </div>
                <ChevronRight size={16} className={styles.sheetChevron} />
              </button>

              {activePresupuesto.estado === 'activo' ? (
                <button 
                  className={styles.sheetActionItem}
                  onClick={() => {
                    const p = activePresupuesto
                    setActivePresupuesto(null)
                    onPause(p)
                  }}
                >
                  <div className={`${styles.sheetActionIcon} ${styles.actionIconWarning}`}>
                    <PauseCircle size={18} />
                  </div>
                  <div className={styles.sheetActionText}>
                    <span className={styles.sheetActionTitle}>Pausar presupuesto</span>
                    <span className={styles.sheetActionSubtitle}>Dejá de recibir alertas temporales</span>
                  </div>
                  <ChevronRight size={16} className={styles.sheetChevron} />
                </button>
              ) : activePresupuesto.estado === 'pausado' ? (
                <button 
                  className={styles.sheetActionItem}
                  onClick={() => {
                    const id = activePresupuesto.id
                    setActivePresupuesto(null)
                    onResume(id)
                  }}
                >
                  <div className={`${styles.sheetActionIcon} ${styles.actionIconSuccess}`}>
                    <PlayCircle size={18} />
                  </div>
                  <div className={styles.sheetActionText}>
                    <span className={styles.sheetActionTitle}>Reanudar presupuesto</span>
                    <span className={styles.sheetActionSubtitle}>Reactivá el control y alertas</span>
                  </div>
                  <ChevronRight size={16} className={styles.sheetChevron} />
                </button>
              ) : null}

              <button 
                className={`${styles.sheetActionItem} ${styles.sheetActionDanger}`}
                onClick={() => {
                  const p = activePresupuesto
                  setActivePresupuesto(null)
                  onDelete(p)
                }}
              >
                <div className={`${styles.sheetActionIcon} ${styles.actionIconDanger}`}>
                  <Trash2 size={18} />
                </div>
                <div className={styles.sheetActionText}>
                  <span className={styles.sheetActionTitle}>Eliminar presupuesto</span>
                  <span className={styles.sheetActionSubtitle}>Borrar este presupuesto definitivamente</span>
                </div>
                <ChevronRight size={16} className={styles.sheetChevron} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
