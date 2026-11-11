import styles from './ChartLoadingState.module.css'

interface ChartLoadingStateProps {
  label?: string
  sublabel?: string
  /** Si es true, se superpone con un velo translúcido sobre el gráfico existente */
  overlay?: boolean
}

export default function ChartLoadingState({
  label = 'Actualizando gráfico',
  overlay = false,
}: ChartLoadingStateProps) {
  return (
    <div
      className={overlay ? styles.overlayRoot : styles.standaloneRoot}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={styles.barsLoader} aria-hidden="true">
        <span className={`${styles.barItem} ${styles.bar1}`} />
        <span className={`${styles.barItem} ${styles.bar2}`} />
        <span className={`${styles.barItem} ${styles.bar3}`} />
        <span className={`${styles.barItem} ${styles.bar4}`} />
      </div>
    </div>
  )
}
