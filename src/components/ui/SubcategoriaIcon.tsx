import { memo } from 'react'
import { getSubcategoriaVisual, getCategoriaVisual } from '@/lib/utils/categoria.utils'

interface SubcategoriaIconProps {
  nombre?: string | null
  parentCategory?: string | null
  size?: number
  className?: string
}

export const SubcategoriaIcon = memo(({ nombre, parentCategory, size = 24, className }: SubcategoriaIconProps) => {
  // 1. Intentamos buscar el visual de la subcategoría
  const visual = getSubcategoriaVisual(nombre)
  let iconSrc = visual.iconSrc

  // 2. Si no hay icono de subcategoría O el nombre es 'general', usamos el del padre.
  // Si tampoco hay padre, usamos el icono default.
  if (!iconSrc || nombre?.toLowerCase() === 'general') {
    if (parentCategory) {
      const parentVisual = getCategoriaVisual(parentCategory)
      iconSrc = parentVisual.iconSrc
    } else {
      const defaultVisual = getCategoriaVisual('default')
      iconSrc = defaultVisual.iconSrc
    }
  }

  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={nombre || 'Icono'}
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
