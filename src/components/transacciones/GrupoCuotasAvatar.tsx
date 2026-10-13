import React, { useState, memo } from 'react'
import { CreditCard } from '@/components/ui/icons'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { findServicioCatalogo } from '@/lib/constants/suscripciones'
import type { Categoria, Subcategoria, Suscripcion, GrupoCuotasResumen } from '@/types'

interface GrupoCuotasAvatarProps {
  grupo: Pick<GrupoCuotasResumen, 'descripcion'> & {
    categoria_id?: string | null
    subcategoria_id?: string | null
    suscripcion_id?: string | null
    tarjeta_id?: string | null
  }
  categorias: Categoria[]
  subcategorias?: Subcategoria[]
  suscripciones?: Suscripcion[]
  size?: number
  fallbackIconSize?: number
  fallbackClassName?: string
  fallbackStyle?: React.CSSProperties
}

export const GrupoCuotasAvatar = memo(({
  grupo,
  categorias,
  subcategorias = [],
  suscripciones = [],
  size = 24,
  fallbackIconSize = 18,
  fallbackClassName,
  fallbackStyle,
}: GrupoCuotasAvatarProps) => {
  const [imgError, setImgError] = useState(false)

  // 1. Determinar si proviene del módulo de suscripciones
  const descNorm = (grupo.descripcion || '').trim().toLowerCase()
  const isFromSuscripciones = Boolean(
    grupo.suscripcion_id ||
    (descNorm && suscripciones.some(s => 
      (grupo.suscripcion_id && s.id === grupo.suscripcion_id) ||
      (s.nombre && s.nombre.trim().toLowerCase() === descNorm && (!grupo.tarjeta_id || !s.tarjeta_id || s.tarjeta_id === grupo.tarjeta_id))
    ))
  )

  // Subcategoría y categoría resueltas
  const subcat = subcategorias.find(s => s.id === grupo.subcategoria_id)
  const cat = categorias.find(c => c.id === (grupo.categoria_id || subcat?.categoria_id))

  // 2. Si proviene del módulo de suscripciones
  if (isFromSuscripciones) {
    const catalogo = findServicioCatalogo(grupo.descripcion)
    const hasBrandLogo = Boolean(catalogo?.logoPath && !catalogo?.generico && !imgError)

    if (hasBrandLogo && catalogo?.logoPath) {
      return (
        <img
          src={catalogo.logoPath}
          alt={grupo.descripcion || catalogo.nombre}
          width={size}
          height={size}
          loading="lazy"
          style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
          onError={() => setImgError(true)}
        />
      )
    }

    // Suscripción genérica o sin logo de marca (ej: "Gimnasio") -> ícono de la subcategoría
    const subcatNombre = subcat?.nombre || catalogo?.subcategoria || 'Gimnasio'
    const catNombre = cat?.nombre || catalogo?.categoria || 'Salud'

    return (
      <SubcategoriaIcon
        nombre={subcatNombre}
        parentCategory={catNombre}
        size={size}
      />
    )
  }

  // 3. Si la transacción se registró desde el módulo de transacciones (no suscripciones):
  // Se debe ver el icono de la subcategoría
  if (subcat?.nombre) {
    return (
      <SubcategoriaIcon
        nombre={subcat.nombre}
        parentCategory={cat?.nombre}
        size={size}
      />
    )
  }

  // Fallback a categoría padre si no tiene subcategoría
  if (cat?.nombre) {
    return <CategoriaIcon nombre={cat.nombre} size={size} />
  }

  // Fallback si no tiene categoría ni subcategoría
  return (
    <CreditCard
      size={fallbackIconSize}
      className={fallbackClassName}
      style={fallbackStyle}
    />
  )
})

GrupoCuotasAvatar.displayName = 'GrupoCuotasAvatar'
export default GrupoCuotasAvatar
