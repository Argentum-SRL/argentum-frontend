import React, { memo } from 'react'
import {
  CreditCard,
  RefreshCw,
  BadgePercent,
  Undo2,
  ArrowLeftRight,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react'
import { iconosConNombre } from '@/utils/movimientoIconos'
import styles from './MovimientoIconos.module.css'

interface MovimientoIconosProps {
  iconos?: string[]
}

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  credito: CreditCard,
  suscripcion: RefreshCw,
  reintegro: BadgePercent,
  devolucion: Undo2,
  paso_por_mi_cuenta: ArrowLeftRight,
  inversion: PiggyBank,
}

export const MovimientoIconos: React.FC<MovimientoIconosProps> = memo(({ iconos = [] }) => {
  const lista = iconosConNombre(iconos)
  if (lista.length === 0) return null

  return (
    <span className={styles.iconosWrapper}>
      {lista.map(({ codigo, nombre }) => {
        const IconComponent = ICON_COMPONENTS[codigo]
        if (!IconComponent) return null

        const isReintegro = codigo === 'reintegro'

        return (
          <span
            key={codigo}
            className={`${styles.iconoItem} ${isReintegro ? styles.iconoReintegro : ''}`}
            title={nombre}
            aria-label={nombre}
          >
            <IconComponent size={13.5} aria-hidden={true} />
          </span>
        )
      })}
    </span>
  )
})

MovimientoIconos.displayName = 'MovimientoIconos'
export default MovimientoIconos
