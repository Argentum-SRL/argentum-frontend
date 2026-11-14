import React from 'react'
import { ChevronDown } from '@/components/ui/icons'
import styles from './CollapseToggle.module.css'

export interface CollapseToggleProps {
  expanded: boolean
  onToggle?: () => void
  labelExpanded?: string
  labelCollapsed?: string
  ariaLabel?: string
  title?: string
  className?: string
  as?: 'button' | 'div'
}

export const CollapseToggle: React.FC<CollapseToggleProps> = ({
  expanded,
  onToggle,
  labelExpanded = 'Ocultar',
  labelCollapsed = 'Modificar',
  ariaLabel,
  title,
  className = '',
  as = 'button',
}) => {
  const label = expanded ? labelExpanded : labelCollapsed
  const resolvedTitle = title ?? label
  const resolvedAriaLabel = ariaLabel ?? `${label} sección`

  if (as === 'div') {
    return (
      <div
        className={`${styles.cicloHeaderActions} ${className}`}
        aria-hidden="true"
      >
        <span className={styles.comerciosBadge}>{label}</span>
        <div
          className={`${styles.chevronIcon} ${
            expanded ? styles.chevronExpanded : ''
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`${styles.cicloHeaderActions} ${className}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={resolvedAriaLabel}
      title={resolvedTitle}
    >
      <span className={styles.comerciosBadge}>{label}</span>
      <div
        className={`${styles.chevronIcon} ${
          expanded ? styles.chevronExpanded : ''
        }`}
      >
        <ChevronDown size={18} />
      </div>
    </button>
  )
}

export default CollapseToggle
