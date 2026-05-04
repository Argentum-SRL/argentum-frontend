import React, { useState, useRef, useEffect } from 'react'
import { X, Search, ChevronDown, Filter, Calendar } from 'lucide-react'
import styles from './FilterBar.module.css'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const catRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  useClickOutside(catRef, () => setCatPopoverOpen(false))
  useClickOutside(dateRef, () => setDatePopoverOpen(false))

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    onFilterChange({ ...filters, tipo })
  }

  const handleBilleteraRemove = () => {
    onFilterChange({ ...filters, billetera_id: undefined })
  }

  const handleCategoriaSelect = (catId?: string) => {
    onFilterChange({ ...filters, categoria_id: catId })
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
    onFilterChange({ ...filters, busqueda: e.target.value })
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
        <label className={styles.popoverTitle} style={{ display: 'block', fontSize: 10 }}>Desde</label>
        <input type="date" name="desde" defaultValue={filters.fecha_desde} className={styles.dateInput} style={{ width: '100%' }} />
      </div>
      <div>
        <label className={styles.popoverTitle} style={{ display: 'block', fontSize: 10 }}>Hasta</label>
        <input type="date" name="hasta" defaultValue={filters.fecha_hasta} className={styles.dateInput} style={{ width: '100%' }} />
      </div>
      <button type="submit" className={styles.typePillActive} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: 4 }}>
        Aplicar
      </button>
    </form>
  )

  return (
    <>
      <div className={styles.filterBar}>
        {/* Mobile Filter Btn */}
        <button className={styles.mobileFilterBtn} onClick={() => setMobileDrawerOpen(true)}>
          <Filter size={14} />
          Filtrar
        </button>

        <div className={styles.pillGroup}>
          <button
            className={`${styles.typePill} ${!filters.tipo ? styles.typePillActive : ''}`}
            onClick={() => handleTipoChange(undefined)}
          >
            Todos
          </button>
          <div className={styles.separator} />
          <button
            className={`${styles.typePill} ${filters.tipo === 'egreso' ? styles.typePillActive : ''}`}
            onClick={() => handleTipoChange('egreso')}
          >
            Egresos
          </button>
          <div className={styles.separator} />
          <button
            className={`${styles.typePill} ${filters.tipo === 'ingreso' ? styles.typePillActive : ''}`}
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

        <div className={styles.pill} style={{ position: 'relative' }} ref={catRef}>
          <div className={styles.pillIcon} onClick={() => setCatPopoverOpen(!catPopoverOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            {activeCategoria ? activeCategoria.nombre : 'Categoría'}
            <ChevronDown size={14} />
          </div>
          {catPopoverOpen && (
            <div className={styles.popover} style={{ display: window.innerWidth >= 768 ? 'block' : 'none' }}>
              <div className={styles.popoverTitle}>Categoría</div>
              {renderCategoriasList()}
            </div>
          )}
        </div>

        <div className={styles.pill} style={{ position: 'relative' }} ref={dateRef}>
          <div className={styles.pillIcon} onClick={() => setDatePopoverOpen(!datePopoverOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <Calendar size={14} />
            Período
            <ChevronDown size={14} />
          </div>
          {datePopoverOpen && (
            <div className={styles.popover} style={{ display: window.innerWidth >= 768 ? 'block' : 'none' }}>
              <div className={styles.popoverTitle}>Rango de fechas</div>
              {renderDateForm()}
            </div>
          )}
        </div>

        <div className={styles.searchPill}>
          <Search size={16} color="#8E9198" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            value={filters.busqueda || ''}
            onChange={handleSearchChange}
          />
        </div>

        {hasActiveFilters && (
          <button className={styles.clearBtn} onClick={onClear}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      <Drawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} title="Filtros">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px 20px' }}>
          <div>
            <div className={styles.popoverTitle}>Categoría</div>
            {renderCategoriasList()}
          </div>
          <div>
            <div className={styles.popoverTitle}>Período</div>
            {renderDateForm()}
          </div>
          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={() => { onClear(); setMobileDrawerOpen(false) }} style={{ width: '100%', textAlign: 'center', background: '#FEE2E2', color: '#DC2626', borderRadius: 12, padding: 12, textDecoration: 'none' }}>
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </Drawer>
    </>
  )
}
