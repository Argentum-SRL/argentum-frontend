import { memo, useState } from 'react'
import { getSubcategoriaVisual, getCategoriaVisual } from '@/lib/utils/categoria.utils'

interface SubcategoriaIconProps {
  nombre?: string | null
  parentCategory?: string | null
  size?: number
  className?: string
  onError?: () => void
}

export const SubcategoriaIcon = memo(({ nombre, parentCategory, size = 24, className, onError }: SubcategoriaIconProps) => {
  const [imgFailed, setImgFailed] = useState(false)
  const visual = getSubcategoriaVisual(nombre, parentCategory)
  const parentVisual = parentCategory ? getCategoriaVisual(parentCategory) : null

  let iconSrc = !imgFailed && visual?.iconSrc ? visual.iconSrc : parentVisual?.iconSrc
  if (!iconSrc) {
    iconSrc = getCategoriaVisual('default').iconSrc
  }

  const handleError = () => {
    if (!imgFailed && parentVisual?.iconSrc && visual?.iconSrc !== parentVisual.iconSrc) {
      setImgFailed(true)
    }
    onError?.()
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
      onError={handleError}
    />
  )
})

SubcategoriaIcon.displayName = 'SubcategoriaIcon'
