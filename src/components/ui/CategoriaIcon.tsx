import { memo } from 'react'
import { getCategoriaVisual } from '@/lib/utils/categoria.utils'
import styles from './CategoriaIcon.module.css'

interface CategoriaIconProps {
  nombre?: string | null
  size?: number     // default 28
  className?: string
}

export const CategoriaIcon = memo(({ nombre, size = 28, className }: CategoriaIconProps) => {
  const visual = getCategoriaVisual(nombre)
  const sizeClass =
    size === 16 ? styles.size16 :
    size === 32 ? styles.size32 :
    size === 40 ? styles.size40 :
    styles.size28

  if (visual.iconSrc) {
    return (
      <img
        src={visual.iconSrc}
        alt={visual.label}
        width={size}
        height={size}
        loading="lazy"
        className={[styles.iconImage, className].filter(Boolean).join(' ')}
      />
    )
  }

  return (
    <div
      className={[styles.fallback, sizeClass, className].filter(Boolean).join(' ')}
    >
      <span className={styles.fallbackText}>
        {nombre?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
})

CategoriaIcon.displayName = 'CategoriaIcon'
