import React, { memo } from 'react'
import styles from './Skeleton.module.css'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular'
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  aspectRatio?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Skeleton Primitive
 * Animación shimmer unificada con tokens oficiales (--surface, --surface-alt)
 */
export const Skeleton = memo(function Skeleton({
  variant = 'rounded',
  width,
  height,
  borderRadius,
  aspectRatio,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(borderRadius !== undefined ? { borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius } : {}),
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
  }

  const variantClass = styles[variant] || styles.rounded

  return (
    <div
      aria-hidden="true"
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()}
      style={inlineStyle}
      {...props}
    />
  )
})
Skeleton.displayName = 'Skeleton'

/**
 * Grid de Tarjetas (Billeteras y Listados Grid)
 */
export const CardsGridSkeleton = memo(function CardsGridSkeleton({
  count = 3,
  overlap = false,
  className = '',
}: {
  count?: number
  overlap?: boolean
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando tarjetas..."
      className={`${styles.cardsGrid} ${overlap ? styles.cardsGridOverlap : styles.cardsGridNormal} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando tarjetas...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.cardSkeleton} aria-hidden="true" />
      ))}
    </div>
  )
})
CardsGridSkeleton.displayName = 'CardsGridSkeleton'

/**
 * Template de Lista de Transacciones (Día + Filas con avatar, descripción y monto)
 */
export const TransactionsListSkeleton = memo(function TransactionsListSkeleton({
  groupsCount = 2,
  rowsPerGroup = 3,
  className = '',
}: {
  groupsCount?: number
  rowsPerGroup?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando transacciones..."
      className={`${styles.txListWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando transacciones...</span>
      {Array.from({ length: groupsCount }).map((_, gIdx) => (
        <div key={gIdx} className={styles.dayGroupSkeleton}>
          {/* Header del día */}
          <div className={styles.dayHeaderSkeleton}>
            <Skeleton variant="rounded" width={16} height={16} borderRadius={4} />
            <Skeleton variant="text" width={gIdx === 0 ? '25%' : '45%'} height={14} />
            {gIdx === 0 && <Skeleton variant="text" width="30%" height={12} />}
          </div>

          {/* Tarjeta contenedora de filas */}
          <div className={styles.txContainerCard}>
            {Array.from({ length: rowsPerGroup }).map((_, rIdx) => (
              <div key={rIdx} className={styles.txRowSkeleton}>
                {/* Avatar de categoría */}
                <Skeleton variant="rounded" width={40} height={40} borderRadius={12} />

                {/* Info (Título y categoría/billetera) */}
                <div className={styles.txInfoSkeleton}>
                  <Skeleton variant="text" width={rIdx % 2 === 0 ? '60%' : '45%'} height={15} />
                  <Skeleton variant="text" width={rIdx % 2 === 0 ? '35%' : '25%'} height={12} />
                </div>

                {/* Monto y método */}
                <div className={styles.txAmountSkeleton}>
                  <Skeleton variant="text" width="65px" height={16} />
                  <Skeleton variant="text" width="45px" height={11} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})
TransactionsListSkeleton.displayName = 'TransactionsListSkeleton'

/**
 * Template de Compras en Cuotas (Métricas + Tarjetas de cuotas con barra de progreso)
 */
export const GruposCuotasSkeleton = memo(function GruposCuotasSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando compras en cuotas..."
      className={`${styles.cuotasWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando compras en cuotas...</span>

      {/* Barra de métricas superior */}
      <div className={styles.cuotasMetricsBar}>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="60%" height={12} />
          <Skeleton variant="text" width="40%" height={20} />
        </div>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="70%" height={12} />
          <Skeleton variant="text" width="50%" height={20} />
        </div>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="65%" height={12} />
          <Skeleton variant="text" width="45%" height={20} />
        </div>
      </div>

      {/* Listado de tarjetas de cuotas */}
      <div className={styles.cuotasList}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.cuotasCard}>
            <div className={styles.cuotasCardTop}>
              <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
              <div className={styles.txInfoSkeleton}>
                <Skeleton variant="text" width={i === 0 ? '55%' : '40%'} height={15} />
                <Skeleton variant="text" width="30%" height={12} />
              </div>
              <div className={styles.txAmountSkeleton}>
                <Skeleton variant="text" width="65px" height={16} />
                <Skeleton variant="text" width="45px" height={11} />
              </div>
            </div>
            {/* Barra de progreso de cuotas */}
            <Skeleton variant="rounded" height={6} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  )
})
GruposCuotasSkeleton.displayName = 'GruposCuotasSkeleton'

/**
 * Template de Transferencias (Filas de transferencias)
 */
export const TransferenciasListSkeleton = memo(function TransferenciasListSkeleton({
  count = 4,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando transferencias..."
      className={`${styles.transferenciasWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando transferencias...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.transferRowSkeleton}>
          <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
          <div className={styles.txInfoSkeleton}>
            <Skeleton variant="text" width="45%" height={15} />
            <Skeleton variant="text" width="30%" height={12} />
          </div>
          <div className={styles.txAmountSkeleton}>
            <Skeleton variant="text" width="65px" height={16} />
            <Skeleton variant="text" width="45px" height={11} />
          </div>
        </div>
      ))}
    </div>
  )
})
TransferenciasListSkeleton.displayName = 'TransferenciasListSkeleton'

/**
 * Template de Detalle de Billetera (Hero Card + Movimientos)
 */
export const BilleteraDetalleSkeleton = memo(function BilleteraDetalleSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando billetera..."
      className={`${styles.billeteraDetalleWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando billetera...</span>
      {/* Hero Card grande de la cuenta bancaria */}
      <div className={styles.billeteraHeroCard} />

      {/* Tabs placeholder */}
      <div style={{ display: 'flex', gap: '8px', padding: '4px 0', width: '100%' }}>
        <Skeleton variant="rounded" width="50%" height={36} borderRadius={10} style={{ maxWidth: 110 }} />
        <Skeleton variant="rounded" width="40%" height={36} borderRadius={10} style={{ maxWidth: 90 }} />
      </div>

      {/* Filas de movimientos */}
      <div className={styles.txContainerCard}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.txRowSkeleton}>
            <Skeleton variant="rounded" width={40} height={40} borderRadius={12} />
            <div className={styles.txInfoSkeleton}>
              <Skeleton variant="text" width="50%" height={15} />
              <Skeleton variant="text" width="25%" height={12} />
            </div>
            <div className={styles.txAmountSkeleton}>
              <Skeleton variant="text" width="60px" height={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
BilleteraDetalleSkeleton.displayName = 'BilleteraDetalleSkeleton'

/**
 * Template de Importación de Resumen
 */
export const ImportacionResumenSkeleton = memo(function ImportacionResumenSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Preparando asistente de importación..."
      className={`${styles.importWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Preparando asistente de importación...</span>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
        <Skeleton variant="circular" width={8} height={8} />
        <Skeleton variant="circular" width={8} height={8} />
        <Skeleton variant="circular" width={8} height={8} />
      </div>

      {/* Header */}
      <div className={styles.importHeader}>
        <Skeleton variant="text" width="60%" height={22} />
        <Skeleton variant="rounded" width="25%" height={24} borderRadius={12} />
      </div>

      {/* Dropzone container */}
      <div className={styles.importDropzone}>
        <Skeleton variant="rounded" width={48} height={48} borderRadius={14} />
        <Skeleton variant="text" width="65%" height={16} />
        <Skeleton variant="text" width="45%" height={13} />
      </div>

      {/* Footer buttons */}
      <div className={styles.importFooter}>
        <Skeleton variant="rounded" width="30%" height={40} borderRadius={10} />
      </div>
    </div>
  )
})
ImportacionResumenSkeleton.displayName = 'ImportacionResumenSkeleton'

/**
 * Template de Suscripciones (PageSummaryBar + Tarjetas)
 */
export const SuscripcionesSkeleton = memo(function SuscripcionesSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando suscripciones..."
      className={`${styles.suscripcionesWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando suscripciones...</span>

      {/* Resumen */}
      <div className={styles.summaryBarSkeleton}>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="60%" height={12} />
          <Skeleton variant="text" width="45%" height={20} />
        </div>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="70%" height={12} />
          <Skeleton variant="text" width="40%" height={20} />
        </div>
        <div className={styles.cuotasMetricItem}>
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="text" width="25%" height={20} />
        </div>
      </div>

      {/* Sección Activas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton variant="text" width="25%" height={20} />
        <div className={styles.suscripcionesGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.suscripcionCardSkeleton} />
          ))}
        </div>
      </div>
    </div>
  )
})
SuscripcionesSkeleton.displayName = 'SuscripcionesSkeleton'

/**
 * Template de Tabla (Admin / Preview)
 */
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  cols = 4,
  className = '',
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando datos de la tabla..."
      className={`${styles.tableContainerSkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando datos de la tabla...</span>
      {/* Header */}
      <div className={styles.tableHeaderSkeleton}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} variant="text" width={`${Math.floor(80 / cols)}%`} height={14} />
        ))}
      </div>
      {/* Filas */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRowSkeleton}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" width={`${Math.floor(75 / cols) + (c % 2 === 0 ? 5 : -5)}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  )
})
TableSkeleton.displayName = 'TableSkeleton'

/**
 * Template de Metas de Ahorro (Gráfico móvil + Grid de tarjetas de metas)
 */
export const GoalsSkeleton = memo(function GoalsSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando metas de ahorro..."
      className={`${styles.goalsWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando metas de ahorro...</span>

      {/* Gráfico comparativo placeholder en mobile */}
      <div className={styles.goalsMobileChartSkeleton}>
        <Skeleton variant="text" width="40%" height={14} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px', marginTop: '12px' }}>
          <Skeleton variant="rounded" width="30%" height="45%" borderRadius={8} />
          <Skeleton variant="rounded" width="30%" height="80%" borderRadius={8} />
          <Skeleton variant="rounded" width="30%" height="60%" borderRadius={8} />
        </div>
      </div>

      {/* Grid de tarjetas de metas */}
      <div className={styles.goalsGrid}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.goalCardSkeleton}>
            <div className={styles.goalCardHeader}>
              <Skeleton variant="circular" width={42} height={42} />
              <div className={styles.txInfoSkeleton}>
                <Skeleton variant="text" width={i === 0 ? '60%' : '50%'} height={16} />
                <Skeleton variant="text" width="35%" height={12} />
              </div>
            </div>

            <div className={styles.goalAmountsRow}>
              <Skeleton variant="text" width="45%" height={20} />
              <Skeleton variant="text" width="30%" height={14} />
            </div>

            <Skeleton variant="rounded" height={8} borderRadius={4} />

            <div className={styles.goalActionsRow}>
              <Skeleton variant="rounded" width="45%" height={32} borderRadius={8} />
              <Skeleton variant="rounded" width="45%" height={32} borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
GoalsSkeleton.displayName = 'GoalsSkeleton'

/**
 * Template de Presupuestos (Grid de tarjetas con categoría, límites y progreso)
 */
export const PresupuestosSkeleton = memo(function PresupuestosSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando presupuestos..."
      className={`${styles.presupuestosWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando presupuestos...</span>
      {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.presupuestoCardSkeleton}>
            <div className={styles.presupuestoHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
                <div className={styles.txInfoSkeleton}>
                  <Skeleton variant="text" width="55%" height={15} />
                  <Skeleton variant="text" width="35%" height={12} />
                </div>
              </div>
              <Skeleton variant="rounded" width="20%" height={22} borderRadius={11} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
              <Skeleton variant="text" width="45%" height={22} />
              <Skeleton variant="text" width="30%" height={14} />
            </div>

            <Skeleton variant="rounded" height={8} borderRadius={4} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton variant="text" width="40%" height={12} />
              <Skeleton variant="text" width="25%" height={12} />
            </div>
          </div>
      ))}
    </div>
  )
})
PresupuestosSkeleton.displayName = 'PresupuestosSkeleton'

/**
 * Template de Resumen de Tarjeta (TarjetaSummary)
 */
export const TarjetaSummarySkeleton = memo(function TarjetaSummarySkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando resumen de tarjeta..."
      className={`${styles.tarjetaSummarySkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando resumen de tarjeta...</span>

      {/* Navegador de mes */}
      <div className={styles.tarjetaSummaryNav}>
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="text" width="50%" height={16} />
        <Skeleton variant="circular" width={28} height={28} />
      </div>

      {/* Total a pagar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', padding: '12px 0' }}>
        <Skeleton variant="text" width="35%" height={12} />
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>

      {/* Fechas de cierre y vencimiento */}
      <div className={styles.tarjetaSummaryDates}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
          <Skeleton variant="text" width="50%" height={11} />
          <Skeleton variant="text" width="75%" height={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px' }}>
          <Skeleton variant="text" width="50%" height={11} />
          <Skeleton variant="text" width="75%" height={14} />
        </div>
      </div>

      {/* Botones de acción */}
      <div className={styles.tarjetaSummaryActions}>
        <Skeleton variant="rounded" width="100%" height={40} borderRadius={10} />
      </div>
    </div>
  )
})
TarjetaSummarySkeleton.displayName = 'TarjetaSummarySkeleton'

/**
 * Template de Panel de Factura (FacturaPanel)
 */
export const FacturaPanelSkeleton = memo(function FacturaPanelSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando datos de la factura..."
      className={`${styles.facturaPanelSkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando datos de la factura...</span>
      <Skeleton variant="text" width="50%" height={32} />
      <Skeleton variant="rounded" width="35%" height={24} borderRadius={12} />

      <div className={styles.facturaDetailsList}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="40%" height={14} />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="35%" height={14} />
          <Skeleton variant="text" width="45%" height={14} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="45%" height={14} />
          <Skeleton variant="text" width="35%" height={14} />
        </div>
      </div>

      <Skeleton variant="rounded" width="100%" height={44} borderRadius={12} />
    </div>
  )
})
FacturaPanelSkeleton.displayName = 'FacturaPanelSkeleton'

/**
 * Template de Onboarding (OnboardingPage)
 */
export const OnboardingSkeleton = memo(function OnboardingSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando asistente de bienvenida..."
      className={`${styles.onboardingWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando asistente de bienvenida...</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width="35%" height={20} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton variant="rounded" width={24} height={6} borderRadius={3} />
        <Skeleton variant="rounded" width={24} height={6} borderRadius={3} />
        <Skeleton variant="rounded" width={24} height={6} borderRadius={3} />
        <Skeleton variant="rounded" width={24} height={6} borderRadius={3} />
      </div>

      <div className={styles.onboardingCardSkeleton}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="85%" height={14} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <Skeleton variant="rounded" height={44} borderRadius={12} />
          <Skeleton variant="rounded" height={44} borderRadius={12} />
        </div>

        <Skeleton variant="rounded" height={48} borderRadius={12} style={{ marginTop: '8px' }} />
      </div>
    </div>
  )
})
OnboardingSkeleton.displayName = 'OnboardingSkeleton'

/**
 * Template de Tarjeta de Balance del Dashboard (BalanceCard)
 */
export const BalanceCardSkeleton = memo(function BalanceCardSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando balance..."
      className={`${styles.balanceCardSkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando balance...</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="circular" width={28} height={28} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0 6px' }}>
        <Skeleton variant="text" width="65%" height={36} />
        <Skeleton variant="text" width="35%" height={13} />
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
        <Skeleton variant="rounded" width="45%" height={26} borderRadius={8} />
        <Skeleton variant="rounded" width="45%" height={26} borderRadius={8} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '45%' }}>
          <Skeleton variant="rounded" width={20} height={20} borderRadius={6} />
          <Skeleton variant="text" width="70%" height={14} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '45%', justifyContent: 'flex-end' }}>
          <Skeleton variant="rounded" width={20} height={20} borderRadius={6} />
          <Skeleton variant="text" width="70%" height={14} />
        </div>
      </div>
    </div>
  )
})
BalanceCardSkeleton.displayName = 'BalanceCardSkeleton'

/**
 * Template de Filas de Dashboard (Categorías / Próximos Pagos / Últimos Movimientos)
 */
export interface DashboardListSkeletonProps {
  count?: number
  variant?: 'categoria' | 'pago' | 'movimiento' | 'default'
  className?: string
}

export const DashboardListSkeleton = memo(function DashboardListSkeleton({
  count = 4,
  variant = 'default',
  className = '',
}: DashboardListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando lista del dashboard..."
      className={`${styles.dashboardListSkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando lista del dashboard...</span>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === 'categoria') {
          return (
            <div key={i} className={styles.dashboardCategoryRow}>
              <Skeleton variant="rounded" width={30} height={30} borderRadius={8} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant="text" width={i % 2 === 0 ? '50%' : '35%'} height={13} />
                  <Skeleton variant="text" width="46px" height={13} />
                </div>
                <Skeleton variant="rounded" width="100%" height={4} borderRadius={999} />
              </div>
            </div>
          )
        }

        if (variant === 'pago') {
          return (
            <div key={i} className={styles.dashboardPagoRow}>
              <Skeleton variant="rounded" width={36} height={36} borderRadius={10} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <Skeleton variant="text" width={i % 2 === 0 ? '55%' : '40%'} height={14} />
                <Skeleton variant="text" width="30%" height={12} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <Skeleton variant="text" width="60px" height={14} />
              </div>
            </div>
          )
        }

        if (variant === 'movimiento') {
          return (
            <div key={i} className={styles.dashboardMovimientoRow}>
              <Skeleton variant="circular" width={32} height={32} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <Skeleton variant="text" width={i % 2 === 0 ? '60%' : '45%'} height={14} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <Skeleton variant="text" width="65px" height={15} />
              </div>
            </div>
          )
        }

        return (
          <div key={i} className={styles.dashboardListRow}>
            <Skeleton variant="rounded" width={36} height={36} borderRadius={10} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <Skeleton variant="text" width={i % 2 === 0 ? '55%' : '40%'} height={14} />
              <Skeleton variant="text" width="30%" height={12} />
            </div>
            <div style={{ flexShrink: 0 }}>
              <Skeleton variant="text" width="60px" height={14} />
            </div>
          </div>
        )
      })}
    </div>
  )
})
DashboardListSkeleton.displayName = 'DashboardListSkeleton'

/**
 * Template de Tarjeta de Proyección (ProyeccionCard)
 */
export const ProyeccionCardSkeleton = memo(function ProyeccionCardSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando proyección..."
      className={`${styles.proyeccionCardSkeleton} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando proyección...</span>
      <div className={styles.proyeccionHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Skeleton variant="rounded" width={18} height={18} borderRadius={4} />
          <Skeleton variant="text" width="45%" height={16} />
          <Skeleton variant="rounded" width="25%" height={18} borderRadius={12} />
        </div>
        <Skeleton variant="rounded" width={24} height={24} borderRadius={6} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Skeleton variant="text" width="30%" height={13} />
          <Skeleton variant="text" width="20%" height={13} />
        </div>
        <Skeleton variant="rounded" width="100%" height={8} borderRadius={4} />
      </div>

      <div className={styles.proyeccionMetricsGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="text" width="70%" height={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Skeleton variant="text" width="50%" height={12} />
          <Skeleton variant="text" width="70%" height={20} />
        </div>
      </div>
    </div>
  )
})
ProyeccionCardSkeleton.displayName = 'ProyeccionCardSkeleton'

/**
 * Template de Wizard de Conveniencia (ToolsPage)
 */
export const ConvenienciaWizardSkeleton = memo(function ConvenienciaWizardSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando asistente de conveniencia..."
      className={`${styles.wizardSkeletonWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando asistente de conveniencia...</span>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
        <Skeleton variant="rounded" width={32} height={8} borderRadius={4} />
        <Skeleton variant="rounded" width={32} height={8} borderRadius={4} />
        <Skeleton variant="rounded" width={32} height={8} borderRadius={4} />
      </div>

      <div className={styles.wizardCardBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton variant="text" width="55%" height={22} />
          <Skeleton variant="text" width="80%" height={14} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton variant="text" width="30%" height={14} />
            <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
          </div>
          <div className={styles.wizardGridCols}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
        </div>
      </div>
    </div>
  )
})
ConvenienciaWizardSkeleton.displayName = 'ConvenienciaWizardSkeleton'

/**
 * Template de Comercios Recordados (Perfil)
 */
export const ComerciosRecordadosSkeleton = memo(function ComerciosRecordadosSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando comercios recordados..."
      className={`${styles.comerciosSkeletonWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando comercios recordados...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.comercioRowSkeleton}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <Skeleton variant="text" width={i % 2 === 0 ? '45%' : '35%'} height={14} />
            <Skeleton variant="text" width={i % 2 === 0 ? '60%' : '50%'} height={12} />
          </div>
          <Skeleton variant="rounded" width={56} height={28} borderRadius={8} />
        </div>
      ))}
    </div>
  )
})
ComerciosRecordadosSkeleton.displayName = 'ComerciosRecordadosSkeleton'

/**
 * Template de Seguridad de Perfil
 */
export const PerfilSeguridadSkeleton = memo(function PerfilSeguridadSkeleton({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Cargando opciones de seguridad..."
      className={`${styles.seguridadSkeletonWrapper} ${className}`.trim()}
    >
      <span className={styles.srOnly}>Cargando opciones de seguridad...</span>

      {/* Grid superior de 2 columnas en desktop / 1 en mobile */}
      <div className={styles.seguridadGridSkeleton}>
        {/* Card 1: Acceso y credenciales */}
        <div className={styles.seguridadCardSkeleton}>
          <div className={styles.seguridadHeaderSkeleton}>
            <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <Skeleton variant="text" width="45%" height={16} />
              <Skeleton variant="text" width="65%" height={12} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {/* Row Email */}
            <div className={styles.seguridadRowSkeleton}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <Skeleton variant="text" width="35%" height={14} />
                <Skeleton variant="text" width="60%" height={12} />
              </div>
              <Skeleton variant="rounded" width={72} height={30} borderRadius={8} />
            </div>
            {/* Row Password */}
            <div className={styles.seguridadRowSkeleton}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="text" width="55%" height={12} />
              </div>
              <Skeleton variant="rounded" width={96} height={30} borderRadius={8} />
            </div>
          </div>
        </div>

        {/* Card 2: Asistente de WhatsApp */}
        <div className={styles.seguridadCardSkeleton}>
          <div className={styles.seguridadHeaderSkeleton}>
            <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <Skeleton variant="text" width="45%" height={16} />
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {/* Row WhatsApp */}
            <div className={styles.seguridadRowSkeleton}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="text" width="50%" height={12} />
              </div>
              <Skeleton variant="rounded" width={96} height={32} borderRadius={8} />
            </div>
            {/* Row Permiso Mensajes Toggle */}
            <div className={styles.seguridadRowSkeleton}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                <Skeleton variant="text" width="50%" height={14} />
                <Skeleton variant="text" width="75%" height={12} />
              </div>
              <Skeleton variant="rounded" width={42} height={24} borderRadius={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Dispositivos y datos (Ancho completo inferior) */}
      <div className={styles.seguridadCardSkeleton}>
        <div className={styles.seguridadHeaderSkeleton}>
          <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <Skeleton variant="text" width="35%" height={16} />
            <Skeleton variant="text" width="55%" height={12} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {/* Row Cerrar Sesiones */}
          <div className={styles.seguridadRowSkeleton}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
            <Skeleton variant="rounded" width={96} height={30} borderRadius={8} />
          </div>
          {/* Row Descargar Datos */}
          <div className={styles.seguridadRowSkeleton}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <Skeleton variant="text" width="45%" height={14} />
              <Skeleton variant="text" width="70%" height={12} />
            </div>
            <Skeleton variant="rounded" width={96} height={30} borderRadius={8} />
          </div>
        </div>
      </div>
    </div>
  )
})
PerfilSeguridadSkeleton.displayName = 'PerfilSeguridadSkeleton'
