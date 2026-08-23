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
  let iconSrc = visual?.iconSrc

  // 2. Si no hay icono de subcategoría específico, intentamos usar el del padre.
  if (!iconSrc && parentCategory) {
    const parentVisual = getCategoriaVisual(parentCategory)
    iconSrc = parentVisual?.iconSrc
  }

  // 3. Fallback default si tampoco se encontró el del padre
  if (!iconSrc) {
    iconSrc = getCategoriaVisual('default').iconSrc
  }

  return (
    <img
      src={iconSrc}
      alt={nombre || parentCategory || 'Icono'}
      width={size}
      height={size}
      loading="lazy"
      style={{ objectFit: 'contain' }}
      className={className}
    />
  )
})

SubcategoriaIcon.displayName = 'SubcategoriaIcon'
