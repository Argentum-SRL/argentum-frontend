import { useState, useMemo, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { MovimientoItem, Categoria, Billetera } from '@/types'
import DayGroup from './DayGroup'
import styles from './ProximosBloque.module.css'

interface ProximosBloqueProps {
  proximos: MovimientoItem[]
  total: number
  categorias: Categoria[]
  billeteras: Billetera[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onOpenCuotasGroup?: (grupoId: string) => void
  hideWallet?: boolean
  modo?: 'general' | 'billetera'
}

export const ProximosBloque = memo(({
  proximos,
  total,
  categorias,
  billeteras,
  onEdit,
  onDelete,
  onOpenCuotasGroup,
  hideWallet = false,
  modo = 'general',
}: ProximosBloqueProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const gruposAsc = useMemo(() => {
    if (!proximos || proximos.length === 0) return []
    const gruposObj: Record<string, MovimientoItem[]> = {}
    proximos.forEach(mov => {
      const fecha = mov.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(mov)
    })
    // Orden ascendente por fecha
    return Object.entries(gruposObj).sort((a, b) => a[0].localeCompare(b[0]))
  }, [proximos])

  if (!total || total === 0 || proximos.length === 0) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls="proximos-bloque-content"
      >
        <span className={styles.toggleTitle}>
          Próximos ({total})
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id="proximos-bloque-content" className={styles.proximosContent}>
          {gruposAsc.map(([fecha, movs]) => (
            <DayGroup
              key={`proximo-${fecha}`}
              fecha={fecha}
              movimientos={movs}
              categorias={categorias}
              billeteras={billeteras}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenCuotasGroup={onOpenCuotasGroup}
              hideWallet={hideWallet}
              modo={modo}
            />
          ))}

          {total > proximos.length && (
            <div className={styles.limiteAviso}>
              Se muestran los próximos {proximos.length}.
            </div>
          )}
        </div>
      )}
    </div>
  )
})

ProximosBloque.displayName = 'ProximosBloque'
export default ProximosBloque

