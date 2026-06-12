import { type ReactNode, type ComponentType } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  title: string
  description?: ReactNode
  actionLabel?: string
  onActionClick?: () => void
  secondaryActionLabel?: string
  onSecondaryActionClick?: () => void
  variant?: 'card' | 'compact'
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  variant = 'card',
  className = ''
}: EmptyStateProps) {
  const containerClass = [
    styles.emptyState,
    styles[variant],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {Icon && (
        <div className={styles.iconWrapper}>
          <Icon size={variant === 'card' ? 64 : 40} className={styles.icon} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <div className={styles.description}>{description}</div>}
      
      {(actionLabel || secondaryActionLabel) && (
        <div className={styles.actions}>
          {secondaryActionLabel && onSecondaryActionClick && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onSecondaryActionClick}
            >
              {secondaryActionLabel}
            </button>
          )}
          {actionLabel && onActionClick && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onActionClick}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
