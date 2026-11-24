import { memo } from 'react'
import { Skeleton } from './Skeleton'
import baseStyles from './Skeleton.module.css'
import styles from './SkeletonAdmin.module.css'

export const AdminSummaryBarSkeleton = memo(function AdminSummaryBarSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando resumen de administración..."
      className={styles.summaryBar}
    >
      <span className={baseStyles.srOnly}>Cargando resumen de administración...</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.summaryItem}>
          <Skeleton variant="text" width="48%" height={11} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="55%" height={11} />
        </div>
      ))}
    </div>
  )
})
AdminSummaryBarSkeleton.displayName = 'AdminSummaryBarSkeleton'

export const AdminUsuariosListaSkeleton = memo(function AdminUsuariosListaSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando lista de usuarios..."
      className={styles.card}
    >
      <span className={baseStyles.srOnly}>Cargando lista de usuarios...</span>
      <Skeleton variant="rounded" width="100%" height={44} borderRadius={12} />
      <div className={styles.filtersGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={44} borderRadius={12} />
        ))}
      </div>
      <Skeleton variant="text" width="32%" height={13} />
      <div className={styles.rowsStack}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.userRow}>
            <Skeleton variant="circular" width={36} height={36} />
            <div className={styles.rowText}>
              <Skeleton variant="text" width="45%" height={14} />
              <Skeleton variant="text" width="65%" height={12} />
            </div>
            <Skeleton variant="text" width="18%" height={14} />
          </div>
        ))}
      </div>
    </div>
  )
})
AdminUsuariosListaSkeleton.displayName = 'AdminUsuariosListaSkeleton'

export const AdminUsuarioDetalleSkeleton = memo(function AdminUsuarioDetalleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando detalle de usuario..."
      className={styles.detailStack}
    >
      <span className={baseStyles.srOnly}>Cargando detalle de usuario...</span>
      <div className={styles.card}>
        <div className={styles.detailHeader}>
          <Skeleton variant="circular" width={48} height={48} />
          <div className={styles.rowText}>
            <Skeleton variant="text" width="55%" height={18} />
            <Skeleton variant="text" width="70%" height={13} />
            <Skeleton variant="text" width="85%" height={12} />
          </div>
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.sectionHeader}>
            <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
            <Skeleton variant="text" width="40%" height={15} />
          </div>
          <div className={styles.rowsStack}>
            <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
            <Skeleton variant="rounded" width="100%" height={48} borderRadius={12} />
          </div>
        </div>
      ))}
    </div>
  )
})
AdminUsuarioDetalleSkeleton.displayName = 'AdminUsuarioDetalleSkeleton'

export const AdminMonitorSkeleton = memo(function AdminMonitorSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando métricas de WhatsApp e IA..."
      className={styles.detailStack}
    >
      <span className={baseStyles.srOnly}>Cargando métricas de WhatsApp e IA...</span>
      <div className={styles.monitorGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.sectionHeader}>
              <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
              <Skeleton variant="text" width="50%" height={15} />
            </div>
            <Skeleton variant="text" width="45%" height={26} />
            <div className={styles.rowsStack}>
              <Skeleton variant="text" width="100%" height={13} />
              <Skeleton variant="text" width="85%" height={13} />
              <Skeleton variant="text" width="70%" height={13} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
          <Skeleton variant="text" width="35%" height={15} />
        </div>
        <div className={styles.rowsStack}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width="100%" height={44} borderRadius={12} />
          ))}
        </div>
      </div>
    </div>
  )
})
AdminMonitorSkeleton.displayName = 'AdminMonitorSkeleton'

export const AdminTareasSkeleton = memo(function AdminTareasSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tareas automáticas..."
      className={styles.card}
    >
      <span className={baseStyles.srOnly}>Cargando tareas automáticas...</span>
      <div className={styles.sectionHeader}>
        <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
        <div className={styles.rowText}>
          <Skeleton variant="text" width="35%" height={16} />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
      </div>
      <div className={styles.rowsStack}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={56} borderRadius={12} />
        ))}
      </div>
    </div>
  )
})
AdminTareasSkeleton.displayName = 'AdminTareasSkeleton'

export const AdminRegistroSkeleton = memo(function AdminRegistroSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando registro de acciones..."
      className={styles.card}
    >
      <span className={baseStyles.srOnly}>Cargando registro de acciones...</span>
      <div className={styles.sectionHeader}>
        <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
        <Skeleton variant="text" width="35%" height={16} />
      </div>
      <div className={styles.rowsStack}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={44} borderRadius={12} />
        ))}
      </div>
    </div>
  )
})
AdminRegistroSkeleton.displayName = 'AdminRegistroSkeleton'
