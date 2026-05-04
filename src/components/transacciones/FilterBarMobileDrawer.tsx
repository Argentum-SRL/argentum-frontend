import { Search } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import styles from './FilterBar.module.css'

interface FilterBarMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: TransaccionFilters
  onFilterChange: (newFilters: TransaccionFilters) => void
  onClear: () => void
  billeteras: Billetera[]
  categorias: Categoria[]
  hasActiveFilters: boolean
}

export default function FilterBarMobileDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClear,
  billeteras,
  categorias,
  hasActiveFilters,
}: FilterBarMobileDrawerProps) {
  const activeBilletera = billeteras.find((b) => b.id === filters.billetera_id)

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    onFilterChange({ ...filters, tipo })
  }

  const handleBilleteraRemove = () => {
    onFilterChange({ ...filters, billetera_id: undefined })
  }

  const handleCategoriaSelect = (catId?: string) => {
    onFilterChange({ ...filters, categoria_id: catId })
  }

  const handleDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const desde = (form.elements.namedItem('desde') as HTMLInputElement).value
    const hasta = (form.elements.namedItem('hasta') as HTMLInputElement).value
    onFilterChange({ ...filters, fecha_desde: desde || undefined, fecha_hasta: hasta || undefined })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros">
      <div className={styles.mobileDrawerContainer}>
        <div className={styles.searchPill}>
          <Search size={16} color="#8E9198" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            title="Buscar transacción"
            value={filters.busqueda || ''}
            onChange={(e) => onFilterChange({ ...filters, busqueda: e.target.value || undefined })}
          />
        </div>

        {activeBilletera && (
          <div className={`${styles.pill} ${styles.pillActive}`}>
            {activeBilletera.nombre}
            <button className={styles.pillRemove} onClick={handleBilleteraRemove} aria-label="Remover filtro">
              ×
            </button>
          </div>
        )}

        {filters.estado_verificacion === 'pendiente' && (
          <div className={`${styles.pill} ${styles.pillActive}`}>
            Pendientes IA
            <button className={styles.pillRemove} onClick={() => onFilterChange({ ...filters, estado_verificacion: undefined })} aria-label="Remover filtro">
              ×
            </button>
          </div>
        )}

        <div>
          <div className={styles.popoverTitle}>Tipo</div>
          <div className={styles.pillGroup}>
            <button className={`${styles.typePill} ${!filters.tipo ? styles.typePillActive : ''}`} onClick={() => handleTipoChange(undefined)}>Todos</button>
            <button className={`${styles.typePill} ${filters.tipo === 'egreso' ? styles.typePillActive : ''}`} onClick={() => handleTipoChange('egreso')}>Egresos</button>
            <button className={`${styles.typePill} ${filters.tipo === 'ingreso' ? styles.typePillActive : ''}`} onClick={() => handleTipoChange('ingreso')}>Ingresos</button>
          </div>
        </div>

        <div>
          <div className={styles.popoverTitle}>Categoría</div>
          <div className={styles.popoverList}>
            <button
              type="button"
              className={`${styles.popoverItem} ${!filters.categoria_id ? styles.popoverItemActive : ''}`}
              onClick={() => handleCategoriaSelect(undefined)}
            >
              Todas las categorías
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.popoverItem} ${filters.categoria_id === cat.id ? styles.popoverItemActive : ''}`}
                onClick={() => handleCategoriaSelect(cat.id)}
              >
                <CategoriaIcon nombre={cat.nombre} size={16} />
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.popoverTitle}>Período</div>
          <form onSubmit={handleDateSubmit} className={styles.dateGroup}>
            <div>
              <label className={styles.dateLabel} htmlFor="mobile-filter-desde">Desde</label>
              <input id="mobile-filter-desde" type="date" name="desde" defaultValue={filters.fecha_desde} className={styles.dateInputFull} />
            </div>
            <div>
              <label className={styles.dateLabel} htmlFor="mobile-filter-hasta">Hasta</label>
              <input id="mobile-filter-hasta" type="date" name="hasta" defaultValue={filters.fecha_hasta} className={styles.dateInputFull} />
            </div>
            <button type="submit" className={`${styles.typePillActive} ${styles.dateSubmitBtn}`}>Aplicar</button>
          </form>
        </div>

        {hasActiveFilters && (
          <button className={styles.clearBtnMobile} onClick={onClear}>
            Limpiar todos los filtros
          </button>
        )}
      </div>
    </Modal>
  )
}