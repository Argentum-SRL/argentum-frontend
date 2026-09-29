import React from 'react'
import { RefreshCw } from '@/components/ui/icons'
import styles from './DebitoAutomaticoBadge.module.css'

interface DebitoAutomaticoBadgeProps {
  className?: string
}

export const DebitoAutomaticoBadge: React.FC<DebitoAutomaticoBadgeProps> = ({ className }) => {
  return (
    <span
      className={`${styles.badge} ${styles.badgeRecurrente} ${className || ''}`}
      title="La app lo anotó sola porque es una suscripción"
    >
      <RefreshCw size={10} strokeWidth={2.5} />
      <span className={styles.badgeText}>Débito automático</span>
    </span>
  )
}

export default DebitoAutomaticoBadge
