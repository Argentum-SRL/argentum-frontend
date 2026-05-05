import { memo } from 'react'
import { getSubcategoriaVisual } from '@/lib/utils/categoria.utils'
import styles from './CategoriaIcon.module.css' // Reutilizamos estilos de CategoriaIcon por ahora

interface SubcategoriaIconProps {
  nombre?: string | null
  size?: number
  className?: string
}

export const SubcategoriaIcon = memo(({ nombre, size = 24, className }: SubcategoriaIconProps) => {
  const visual = getSubcategoriaVisual(nombre)

  if (visual.iconSrc) {
    return (
      <img
        src={visual.iconSrc}
        alt={visual.label}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        className={className}
      />
    )
  }

  return (
    <div
      style={{ 
        width: size, 
        height: size, 
        background: 'var(--surface-alt)', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: 'var(--text-3)'
      }}
      className={className}
    >
      {nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
})

SubcategoriaIcon.displayName = 'SubcategoriaIcon'
