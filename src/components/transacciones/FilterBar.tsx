import React, { useState, useRef, useEffect } from 'react'
import { X, Search, ChevronDown, Filter, Calendar } from 'lucide-react'
import styles from './FilterBar.module.css'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { useModal } from '@/hooks/useModal'

interface FilterBarProps {
  filters: TransaccionFilters
  onFilterChange: (newFilters: TransaccionFilters) => void
  onClear: () => void
  billeteras: Billetera[]
  categorias: Categoria[]
  hasActiveFilters: boolean
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

export default function FilterBar({
  filters,
  onFilterChange,
  onClear,
  billeteras,
  categorias,
  hasActiveFilters
}: FilterBarProps) {
  const [catPopoverOpen, setCatPopoverOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.busqueda || '')
  const { open } = useModal()

  const catRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  useClickOutside(catRef, () => setCatPopoverOpen(false))
  useClickOutside(dateRef, () => setDatePopoverOpen(false))

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.busqueda || '')) {
        onFilterChange({ ...filters, busqueda: localSearch || undefined })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [localSearch, filters, onFilterChange])

  const [prevBusqueda, setPrevBusqueda] = useState(filters.busqueda || '')
  if ((filters.busqueda || '') !== prevBusqueda) {
    setPrevBusqueda(filters.busqueda || '')
    setLocalSearch(filters.busqueda || '')
  }

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    onFilterChange({ ...filters, tipo })
  }

  const handleBilleteraRemove = () => {
    onFilterChange({ ...filters, billetera_id: undefined })
  }

  const handleCategoriaSelect = (catId?: string) => {
    onFilterChange({
      ...filters,
      categoria_id: catId,
      categoria_ids: catId ? [catId] : undefined
    })
    setCatPopoverOpen(false)
  }

  const handleDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const desde = (form.elements.namedItem('desde') as HTMLInputElement).value
    const hasta = (form.elements.namedItem('hasta') as HTMLInputElement).value
    onFilterChange({ ...filters, fecha_desde: desde || undefined, fecha_hasta: hasta || undefined })
    setDatePopoverOpen(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
  }

  const activeBilletera = billeteras.find(b => b.id === filters.billetera_id)
  const activeCategoria = categorias.find(c => c.id === filters.categoria_id)

  const renderCategoriasList = () => (
    <div className={styles.popoverList}>
      <button
        type="button"
        className={`${styles.popoverItem} ${!filters.categoria_id ? styles.popoverItemActive : ''}`}
        onClick={() => handleCategoriaSelect(undefined)}
      >
        Todas las categorías
      </button>
      {categorias.map(cat => (
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
  )

  const renderDateForm = () => (
      <form onSubmit={handleDateSubmit} className={styles.dateGroup}>
      <div>
        <label className={styles.dateLabel} htmlFor="filter-desde">Desde</label>
        <input id="filter-desde" type="date" name="desde" defaultValue={filters.fecha_desde} className={styles.dateInputFull} />
      </div>
      <div>
        <label className={styles.dateLabel} htmlFor="filter-hasta">Hasta</label>
        <input id="filter-hasta" type="date" name="hasta" defaultValue={filters.fecha_hasta} className={styles.dateInputFull} />
      </div>
      <button type="submit" className={`${styles.typePillActive} ${styles.dateSubmitBtn}`}>
        Aplicar
      </button>
    </form>
  )

  return (
    <>
      <div className={styles.filterBar}>
        {/* Mobile Filter Button (only icon on mobile) */}
        <button
          className={styles.mobileFilterBtn}
          onClick={() => open('transaccionFilters', {
            data: {
              filters,
              onFilterChange,
              onClear,
              billeteras,
              categorias,
              hasActiveFilters,
            },
          })}
          aria-label="Filtrar"
        >
          <Filter size={16} />
        </button>

        {/* Desktop-only filters group (Placed FIRST to align to left on desktop) */}
        <div className={styles.desktopFilterGroup}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${!filters.tipo ? styles.tabActive : ''}`}
              onClick={() => handleTipoChange(undefined)}
            >
              Todos
            </button>
            <button
              type="button"
              className={`${styles.tab} ${filters.tipo === 'egreso' ? styles.tabActive : ''}`}
              onClick={() => handleTipoChange('egreso')}
            >
              Egresos
            </button>
            <button
              type="button"
              className={`${styles.tab} ${filters.tipo === 'ingreso' ? styles.tabActive : ''}`}
              onClick={() => handleTipoChange('ingreso')}
            >
              Ingresos
            </button>
          </div>

          {activeBilletera && (
            <div className={`${styles.pill} ${styles.pillActive}`}>
              {activeBilletera.nombre}
              <button className={styles.pillRemove} onClick={handleBilleteraRemove} aria-label="Remover filtro">
                <X size={14} />
              </button>
            </div>
          )}

          {filters.estado_verificacion === 'pendiente' && (
            <div className={`${styles.pill} ${styles.pillActive}`}>
              Pendientes IA
              <button className={styles.pillRemove} onClick={() => onFilterChange({ ...filters, estado_verificacion: undefined })} aria-label="Remover filtro">
                <X size={14} />
              </button>
            </div>
          )}

          <div className={`${styles.pill} ${styles.pillRelative}`} ref={catRef}>
            <div className={styles.pillIconFlex} onClick={() => setCatPopoverOpen(!catPopoverOpen)}>
              {filters.categoria_ids && filters.categoria_ids.length > 1
                ? `${filters.categoria_ids.length} cat.`
                : activeCategoria
                ? activeCategoria.nombre
                : 'Categoría'}
              <ChevronDown size={14} />
            </div>
            {catPopoverOpen && (
              <div className={`${styles.popover} ${styles.popoverDesktopOnly}`}>
                <div className={styles.popoverTitle}>Categoría</div>
                {renderCategoriasList()}
              </div>
            )}
          </div>

          <div className={`${styles.pill} ${styles.pillRelative}`} ref={dateRef}>
            <div className={styles.pillIconFlex} onClick={() => setDatePopoverOpen(!datePopoverOpen)}>
              <Calendar size={14} />
              Período
              <ChevronDown size={14} />
            </div>
            {datePopoverOpen && (
              <div className={`${styles.popover} ${styles.popoverDesktopOnly}`}>
                <div className={styles.popoverTitle}>Rango de fechas</div>
                {renderDateForm()}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button className={`${styles.clearBtn} ${styles.desktopOnlyBtn}`} onClick={onClear}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Search input next to filter button (Placed SECOND to align to right on desktop) */}
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            title="Buscar transacción"
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>

        {/* Mobile Clear Button (visible only on mobile) */}
        {hasActiveFilters && (
          <button className={`${styles.clearBtn} ${styles.mobileOnlyBtn}`} onClick={onClear}>
            Limpiar filtros
          </button>
        )}
      </div>
    </>
  )
}
