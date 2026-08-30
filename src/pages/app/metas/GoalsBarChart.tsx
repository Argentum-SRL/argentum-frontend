import { useState, useRef } from 'react'
import { 
  Trophy, 
  TrendingUp,
  Plus, 
  Edit, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  X, 
  ChevronRight,
  Eye
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import { formatMonto } from '@/utils/format'
import styles from './GoalsBarChart.module.css'

interface GoalsBarChartProps {
  goals: Goal[]
  onEdit: (goal: Goal) => void
  onContribute: (goal: Goal) => void
  onDetails: (id: string) => void
  onToggleStatus: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
}

/**
 * Curated soft pastel palette identical to BudgetBarChart.
 */
const PASTEL_PALETTE = [
  { bg: '#FED7AA', border: 'rgba(249, 115, 22, 0.45)', text: '#431407', darkBg: '#7C2D12', darkText: '#FFEDD5' }, // Peach / Orange
  { bg: '#FBCFE8', border: 'rgba(236, 72, 153, 0.45)', text: '#500724', darkBg: '#831843', darkText: '#FCE7F3' }, // Pink
  { bg: '#FDA4AF', border: 'rgba(244, 63, 94, 0.45)',  text: '#4C0519', darkBg: '#881337', darkText: '#FFE4E6' }, // Coral / Salmon
  { bg: '#BAE6FD', border: 'rgba(14, 165, 233, 0.45)', text: '#082F49', darkBg: '#0C4A6E', darkText: '#E0F2FE' }, // Sky Blue
  { bg: '#A7F3D0', border: 'rgba(16, 185, 129, 0.45)', text: '#022C22', darkBg: '#064E3B', darkText: '#D1FAE5' }, // Mint / Green
  { bg: '#DDD6FE', border: 'rgba(139, 92, 246, 0.45)', text: '#2E1065', darkBg: '#4C1D95', darkText: '#EDE9FE' }, // Lavender / Violet
  { bg: '#FEF08A', border: 'rgba(234, 179, 8, 0.45)',  text: '#422006', darkBg: '#713F12', darkText: '#FEF9C3' }, // Butter / Yellow
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
 * GoalsBarChart - Comparative TikTok-style vertical bar chart for savings goals.
 * Tapping on any column opens a bottom sheet modal with full actions.
 */
export default function GoalsBarChart({
  goals,
  onEdit,
  onContribute,
  onDetails,
  onToggleStatus,
  onDelete
}: GoalsBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)

  if (goals.length === 0) {
    return null
  }

  const maxObjetivo = Math.max(
    ...goals.map(g => Number(g.monto_objetivo || 1)),
    1
  )

  const MIN_FRAME_HEIGHT = 130
  const MAX_FRAME_HEIGHT = 240

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Metas de ahorro</span>
        <span className={styles.chartSubtitle}>
          {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
        </span>
      </div>

      <div className={styles.scrollContainer} ref={containerRef}>
        {goals.map((g, idx) => {
          const objetivo = Number(g.monto_objetivo || 1)
          const actual = Number(g.monto_actual || 0)
          const porcentaje = objetivo > 0 ? (actual / objetivo) * 100 : 0
          const isCompleted = porcentaje >= 100 || g.estado === EstadoMeta.COMPLETADA
          const isPaused = g.estado === EstadoMeta.PAUSADA

          // Relative scaling of dashed frame height against max goal target
          const ratio = maxObjetivo > 0 ? Math.max(objetivo / maxObjetivo, 0.1) : 1
          const frameHeight = MIN_FRAME_HEIGHT + ratio * (MAX_FRAME_HEIGHT - MIN_FRAME_HEIGHT)

          // Fill height relative to frame height (identical logic to BudgetBarChart)
          const isOverLimit = porcentaje > 100
          const fillRatio = porcentaje / 100
          const rawFillHeight = fillRatio * frameHeight

          // Cap visual overflow height to max +35% above frame height to keep layout stable
          const MAX_OVERFLOW_MULT = 1.35
          const maxAllowedFillHeight = frameHeight * MAX_OVERFLOW_MULT
          const visualFillHeight = Math.min(rawFillHeight, maxAllowedFillHeight)
          const isCappedOverflow = rawFillHeight > maxAllowedFillHeight

          // Assign user-chosen color or fallback to pastel palette by index
          const palette = PASTEL_PALETTE[idx % PASTEL_PALETTE.length]
          const barBgColor = g.color || palette.bg
          const barBorderColor = g.color ? `${g.color}70` : palette.border

          return (
            <div 
              key={g.id} 
              className={`${styles.columnWrapper} ${isPaused ? styles.columnPaused : ''}`}
              onClick={() => setActiveGoal(g)}
              role="button"
              tabIndex={0}
              aria-label={`Meta ${g.nombre}: ${porcentaje.toFixed(0)}% ahorrado`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveGoal(g)
                }
              }}
            >
              {/* Main Bar Column Area */}
              <div 
                className={styles.barArea} 
                style={{ height: `${MAX_FRAME_HEIGHT * 1.35}px` }}
                title={`${g.nombre}: Ahorrado ${formatMonto(actual, g.moneda as 'ARS' | 'USD')} de ${formatMonto(objetivo, g.moneda as 'ARS' | 'USD')} (${porcentaje.toFixed(0)}%)`}
              >
                {/* 1. Dashed Frame (Target Limit Indicator Outline) */}
                <div 
                  className={`${styles.dashedFrame} ${isOverLimit ? styles.dashedFrameUnder : ''}`}
                  style={{ 
                    height: `${frameHeight}px`,
                    borderColor: barBorderColor
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
                    className={`${styles.solidFill} ${isOverLimit ? styles.solidFillOverflow : ''} ${isCompleted ? styles.solidFillCompleted : ''}`}
                    style={{
                      height: `${visualFillHeight}px`,
                      backgroundColor: barBgColor,
                      opacity: porcentaje <= 0 ? 0 : 1
                    }}
                  />
                </div>

                {/* 3. Stacked Content Inside Bottom of the Column: Amount, % */}
                <div className={styles.barContent}>
                  {isCompleted && (
                    <div className={styles.iconWrapper}>
                      <Trophy size={24} color="#CA8A04" strokeWidth={2.5} />
                    </div>
                  )}
                  <span className={styles.spentAmount}>
                    {formatCompact(actual, g.moneda as 'ARS' | 'USD')}
                  </span>
                  <span className={styles.percentText}>
                    {porcentaje.toFixed(0)}%{isCappedOverflow ? ' ▲' : ''}
                  </span>
                </div>
              </div>

              {/* Bottom Label: Goal Name */}
              <span className={styles.budgetName} title={g.nombre}>
                {g.nombre}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Action Bottom Sheet Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!activeGoal}
        onClose={() => setActiveGoal(null)}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel={activeGoal ? `Opciones de ${activeGoal.nombre}` : 'Opciones'}
      >
        {activeGoal && (() => {
          const objetivo = Number(activeGoal.monto_objetivo || 1)
          const actual = Number(activeGoal.monto_actual || 0)
          const restante = Math.max(0, objetivo - actual)
          const porcentaje = (actual / objetivo) * 100
          const isCompleted = porcentaje >= 100 || activeGoal.estado === EstadoMeta.COMPLETADA
          const isPaused = activeGoal.estado === EstadoMeta.PAUSADA
          const sheetGoalColor = activeGoal.color || 'var(--primary)'

          return (
            <div className={styles.sheetContent}>
              {/* Sheet Header */}
              <div className={styles.sheetHeader}>
                <div className={styles.sheetTitleGroup}>
                  <div className={styles.sheetIcon}>
                    {isCompleted ? (
                      <Trophy size={22} color="#CA8A04" />
                    ) : (
                      <TrendingUp size={22} color={sheetGoalColor} />
                    )}
                  </div>
                  <div>
                    <h3 className={styles.sheetTitle}>{activeGoal.nombre}</h3>
                    <span className={styles.sheetBadge}>
                      {activeGoal.moneda} · {activeGoal.estado}
                    </span>
                  </div>
                </div>
                <button 
                  className={styles.sheetCloseBtn}
                  onClick={() => setActiveGoal(null)}
                  aria-label="Cerrar opciones"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Stats Card */}
              <div className={styles.sheetSummaryCard}>
                <div className={styles.sheetSummaryRow}>
                  <span className={styles.sheetSummaryLabel}>Ahorrado</span>
                  <div className={styles.sheetSummaryValue}>
                    {formatMonto(actual, activeGoal.moneda as 'ARS' | 'USD')}{' '}
                    <span className={styles.sheetSummaryLimit}>
                      / {formatMonto(objetivo, activeGoal.moneda as 'ARS' | 'USD')}
                    </span>
                  </div>
                </div>

                <div className={styles.sheetProgressBar}>
                  <div 
                    className={styles.sheetProgressFill}
                    style={{ 
                      width: `${Math.min(porcentaje, 100)}%`,
                      backgroundColor: isCompleted ? 'var(--success)' : sheetGoalColor
                    }}
                  />
                </div>

                <div className={styles.sheetSummaryMeta}>
                  <span>{porcentaje.toFixed(1)}% completado</span>
                  <span>
                    {isCompleted 
                      ? '¡Meta alcanzada!' 
                      : `Faltan ${formatMonto(restante, activeGoal.moneda as 'ARS' | 'USD')}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons List */}
              <div className={styles.sheetActionsList}>
                {/* 1. Aportar / Retirar Dinero (Primary Action) */}
                <button
                  className={styles.sheetActionItem}
                  onClick={() => {
                    const g = activeGoal
                    setActiveGoal(null)
                    onContribute(g)
                  }}
                >
                  <div className={`${styles.sheetActionIcon} ${styles.actionIconSuccess}`}>
                    <Plus size={18} />
                  </div>
                  <div className={styles.sheetActionText}>
                    <span className={styles.sheetActionTitle}>
                      {isCompleted ? 'Gestionar fondos' : 'Aportar dinero'}
                    </span>
                    <span className={styles.sheetActionSubtitle}>
                      {isCompleted ? 'Retirar o sumar saldo a la meta' : 'Sumar saldo desde una de tus billeteras'}
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.sheetChevron} />
                </button>

                {/* 2. Ver Detalle y Movimientos */}
                <button
                  className={styles.sheetActionItem}
                  onClick={() => {
                    const id = activeGoal.id
                    setActiveGoal(null)
                    onDetails(id)
                  }}
                >
                  <div className={styles.sheetActionIcon}>
                    <Eye size={18} />
                  </div>
                  <div className={styles.sheetActionText}>
                    <span className={styles.sheetActionTitle}>Ver detalle y movimientos</span>
                    <span className={styles.sheetActionSubtitle}>Historial de aportes, retiros y análisis</span>
                  </div>
                  <ChevronRight size={16} className={styles.sheetChevron} />
                </button>

                {/* 3. Editar */}
                <button
                  className={styles.sheetActionItem}
                  onClick={() => {
                    const g = activeGoal
                    setActiveGoal(null)
                    onEdit(g)
                  }}
                >
                  <div className={styles.sheetActionIcon}>
                    <Edit size={18} />
                  </div>
                  <div className={styles.sheetActionText}>
                    <span className={styles.sheetActionTitle}>Editar meta</span>
                    <span className={styles.sheetActionSubtitle}>Modificar nombre, objetivo o fecha</span>
                  </div>
                  <ChevronRight size={16} className={styles.sheetChevron} />
                </button>

                {/* 4. Pausar / Reanudar */}
                {!isCompleted && (
                  <button
                    className={styles.sheetActionItem}
                    onClick={() => {
                      const g = activeGoal
                      setActiveGoal(null)
                      onToggleStatus(g)
                    }}
                  >
                    <div className={`${styles.sheetActionIcon} ${isPaused ? styles.actionIconSuccess : styles.actionIconWarning}`}>
                      {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                    </div>
                    <div className={styles.sheetActionText}>
                      <span className={styles.sheetActionTitle}>
                        {isPaused ? 'Reanudar meta' : 'Pausar meta'}
                      </span>
                      <span className={styles.sheetActionSubtitle}>
                        {isPaused ? 'Volver a sumar aportes' : 'Pausar el seguimiento de esta meta'}
                      </span>
                    </div>
                    <ChevronRight size={16} className={styles.sheetChevron} />
                  </button>
                )}

                {/* 5. Eliminar (Danger) */}
                {onDelete && (
                  <button
                    className={`${styles.sheetActionItem} ${styles.sheetActionDanger}`}
                    onClick={() => {
                      const g = activeGoal
                      setActiveGoal(null)
                      onDelete(g)
                    }}
                  >
                    <div className={`${styles.sheetActionIcon} ${styles.actionIconDanger}`}>
                      <Trash2 size={18} />
                    </div>
                    <div className={styles.sheetActionText}>
                      <span className={styles.sheetActionTitle}>Eliminar meta</span>
                      <span className={styles.sheetActionSubtitle}>Borrar permanentemente de Argentum</span>
                    </div>
                    <ChevronRight size={16} className={styles.sheetChevron} />
                  </button>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
