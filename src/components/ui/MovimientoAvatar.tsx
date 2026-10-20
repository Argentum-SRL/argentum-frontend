import React, { useState, useEffect, memo } from 'react'
import { Target, ArrowLeftRight, CreditCard } from '@/components/ui/icons'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import {
  resolverVisualMovimiento,
  getCachedSuscripciones,
  getCachedSuscripcionesSync,
  onSuscripcionesCacheChange,
  type VisualMovimientoEntrada,
} from '@/lib/utils/movimientoVisual.utils'
import type { Suscripcion } from '@/types'

export interface MovimientoAvatarProps {
  movimiento: VisualMovimientoEntrada
  suscripciones?: Suscripcion[]
  size?: number
  className?: string
  style?: React.CSSProperties
  fallbackIconSize?: number
  fallbackClassName?: string
  fallbackStyle?: React.CSSProperties
}

export const MovimientoAvatar = memo(({
  movimiento,
  suscripciones: suscripcionesProp,
  size = 24,
  className,
  style,
  fallbackIconSize,
  fallbackClassName,
  fallbackStyle,
}: MovimientoAvatarProps) => {
  const [imgError, setImgError] = useState(false)
  const [asyncSubs, setAsyncSubs] = useState<Suscripcion[] | null>(() => getCachedSuscripcionesSync())

  useEffect(() => {
    if (suscripcionesProp) return

    let active = true
    const unsubscribe = onSuscripcionesCacheChange(() => {
      if (active) {
        setAsyncSubs(getCachedSuscripcionesSync())
      }
    })

    if (!getCachedSuscripcionesSync()) {
      getCachedSuscripciones().then((subs) => {
        if (active) setAsyncSubs(subs)
      })
    }

    return () => {
      active = false
      unsubscribe()
    }
  }, [suscripcionesProp])

  const suscripciones = suscripcionesProp ?? asyncSubs ?? undefined
  const visual = resolverVisualMovimiento(movimiento, { suscripciones })

  // 1. Logo de suscripción con marca
  if (visual.tipo === 'suscripcion_logo' && visual.logoUrl && !imgError) {
    return (
      <img
        src={visual.logoUrl}
        alt={visual.alt || 'Suscripción'}
        width={size}
        height={size}
        loading="lazy"
        className={className}
        style={{
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          ...style,
        }}
        onError={() => setImgError(true)}
      />
    )
  }

  // 2. Aporte o retiro de meta
  if (visual.tipo === 'meta') {
    return (
      <Target
        size={size}
        className={className}
        style={style}
      />
    )
  }

  // 3. Transferencia entre cuentas
  if (visual.tipo === 'transferencia') {
    return (
      <ArrowLeftRight
        size={size}
        className={className}
        style={style}
      />
    )
  }

  // 4. Subcategoría específica (o fallback de suscripción genérica)
  if (visual.tipo === 'subcategoria' || (visual.tipo === 'suscripcion_logo' && imgError)) {
    return (
      <SubcategoriaIcon
        nombre={visual.subcategoriaNombre}
        parentCategory={visual.categoriaNombre}
        size={size}
        className={className}
      />
    )
  }

  // 5. Categoría padre
  if (visual.tipo === 'categoria' && visual.categoriaNombre) {
    return (
      <CategoriaIcon
        nombre={visual.categoriaNombre}
        size={size}
        className={className}
      />
    )
  }

  // 6. Default / Fallback final
  if (fallbackClassName || fallbackStyle || fallbackIconSize) {
    return (
      <CreditCard
        size={fallbackIconSize ?? size}
        className={fallbackClassName}
        style={fallbackStyle}
      />
    )
  }

  return (
    <CategoriaIcon
      nombre="default"
      size={size}
      className={className}
    />
  )
})

MovimientoAvatar.displayName = 'MovimientoAvatar'
export default MovimientoAvatar
