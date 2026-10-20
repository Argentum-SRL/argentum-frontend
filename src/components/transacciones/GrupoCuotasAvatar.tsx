import { memo } from 'react'
import type { Categoria, Subcategoria, Suscripcion, GrupoCuotasResumen } from '@/types'
import MovimientoAvatar from '@/components/ui/MovimientoAvatar'

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
  const subcat = subcategorias.find(s => s.id === grupo.subcategoria_id)
  const cat = categorias.find(c => c.id === (grupo.categoria_id || subcat?.categoria_id))

  return (
    <MovimientoAvatar
      movimiento={{
        descripcion: grupo.descripcion,
        suscripcion_id: grupo.suscripcion_id,
        subcategoria_nombre: subcat?.nombre,
        categoria_nombre: cat?.nombre,
      }}
      suscripciones={suscripciones}
      size={size}
      fallbackIconSize={fallbackIconSize}
      fallbackClassName={fallbackClassName}
      fallbackStyle={fallbackStyle}
    />
  )
})

GrupoCuotasAvatar.displayName = 'GrupoCuotasAvatar'
export default GrupoCuotasAvatar
