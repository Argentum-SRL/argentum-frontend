import React, { forwardRef, type ElementType, type ReactNode } from 'react'
import styles from './SelectableSurface.module.css'

export type ElevationContextType = 'page' | 'modal'

export interface SelectableSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** Whether this surface is currently selected */
  selected?: boolean
  /**
   * Visual context influencing elevation strength.
   * - 'page': standard page canvas elevation (--elevation-selection)
   * - 'modal': dialog surface elevation (--elevation-selection-modal)
   * Defaults to automatic detection via ancestor data-elevation-context or 'page'.
   */
  context?: ElevationContextType
  /** Disables interaction and renders dimmed disabled state */
  disabled?: boolean
  /** Force cursor/hover behavior even if onClick is handled by an internal child button */
  clickable?: boolean
  /**
   * Optional selection confirmation badge.
   * False by default: selection communicates primarily through elevation.
   */
  showIndicator?: boolean
  /** Optional custom indicator element when showIndicator is true */
  indicatorContent?: ReactNode
  /** Polymorphic HTML container element. Defaults to 'div'. */
  as?: ElementType
  /** Child content */
  children: ReactNode
  className?: string
}

/**
 * SelectableSurface
 *
 * Core architectural primitive encapsulating physical micro-elevation, micro-translation,
 * and tactile press feedback for selectable surfaces (wallets, cards, options, tiles).
 *
 * Visual Rules:
 * - Default: opacity 1, scale 1, translateY(0), elevation none
 * - Hover: opacity 1, scale 1, translateY(-1px), elevation-xs
 * - Selected: opacity 1, scale 1, translateY(-2px), contextual elevation
 * - Active: translateY(0), tactile press
 * - Sibling cards are NEVER dimmed or blurred.
 */
export const SelectableSurface = forwardRef<HTMLDivElement, SelectableSurfaceProps>(({
  selected = false,
  context,
  disabled = false,
  clickable = true,
  showIndicator = false,
  indicatorContent,
  as: Component = 'div',
  className = '',
  children,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...rest
}, ref) => {
  const isInteractive = clickable && !disabled

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (onKeyDown) {
      onKeyDown(e)
    }
    if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(e as unknown as React.MouseEvent<HTMLElement>)
    }
  }

  const composedClassName = [
    styles.surface,
    className
  ].filter(Boolean).join(' ')

  return (
    <Component
      ref={ref}
      className={composedClassName}
      data-selected={selected}
      data-context={context}
      data-disabled={disabled}
      data-clickable={isInteractive}
      role={role ?? (onClick ? 'button' : undefined)}
      tabIndex={tabIndex ?? (onClick && !disabled ? 0 : undefined)}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
      {selected && showIndicator && (
        <span className={styles.indicator} aria-hidden="true">
          {indicatorContent}
        </span>
      )}
    </Component>
  )
})

SelectableSurface.displayName = 'SelectableSurface'

export default SelectableSurface
