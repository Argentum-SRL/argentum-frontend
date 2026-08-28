import React, { useState, useRef, useEffect } from 'react'
import { X, Search, ChevronDown, Filter, Calendar, Wallet, Banknote } from 'lucide-react'
import styles from './FilterBar.module.css'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { useModal } from '@/hooks/useModal'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import { getBankById, findBankByNombre, getBankLogoUrl } from '@/lib/utils/billeteras.utils'
import { DateInput } from '@/components/ui'

interface FilterBarProps {
  filters: TransaccionFilters
  onFilterChange: (newFilters: TransaccionFilters) => void
  onClear: () => void
  billeteras: Billetera[]
  categorias: Categoria[]
  hasActiveFilters: boolean
}

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  ignoreSelector?: string
) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      if (ignoreSelector && (e.target as HTMLElement).closest(ignoreSelector)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, ignoreSelector])
}

export default function FilterBar({
  filters,
  onFilterChange,
  onClear,
  billeteras,
  categorias,
  hasActiveFilters
}: FilterBarProps) {
  const { periodo: periodoActual } = usePeriodoActual()

  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false)
  const [catPopoverOpen, setCatPopoverOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.busqueda || '')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(Boolean(filters.busqueda))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { open } = useModal()

  const [localDesde, setLocalDesde] = useState(filters.fecha_desde || '')
  const [localHasta, setLocalHasta] = useState(filters.fecha_hasta || '')

  const [prevDesde, setPrevDesde] = useState(filters.fecha_desde || '')
  if ((filters.fecha_desde || '') !== prevDesde) {
    setPrevDesde(filters.fecha_desde || '')
    setLocalDesde(filters.fecha_desde || '')
  }

  const [prevHasta, setPrevHasta] = useState(filters.fecha_hasta || '')
  if ((filters.fecha_hasta || '') !== prevHasta) {
    setPrevHasta(filters.fecha_hasta || '')
    setLocalHasta(filters.fecha_hasta || '')
  }

  const walletRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  useClickOutside(walletRef, () => setWalletPopoverOpen(false))
  useClickOutside(catRef, () => setCatPopoverOpen(false))
  useClickOutside(dateRef, () => setDatePopoverOpen(false), '[data-portal="date-picker"]')

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
    if (filters.busqueda) {
      setMobileSearchOpen(true)
    }
  }

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    onFilterChange({ ...filters, tipo })
  }

  const handleBilleteraSelect = (billeteraId?: string) => {
    onFilterChange({ ...filters, billetera_id: billeteraId })
    setWalletPopoverOpen(false)
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

  const handleApplyPreset = (preset: 'ciclo' | 'este_mes' | 'mes_pasado' | 'ultimos_30d') => {
    const today = new Date()
    let desde: string
    let hasta: string

    if (preset === 'ciclo') {
      if (periodoActual) {
        desde = periodoActual.fecha_inicio
        hasta = periodoActual.fecha_fin
      } else {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        desde = firstDay.toISOString().split('T')[0]
        hasta = lastDay.toISOString().split('T')[0]
      }
    } else if (preset === 'este_mes') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      desde = firstDay.toISOString().split('T')[0]
      hasta = lastDay.toISOString().split('T')[0]
    } else if (preset === 'mes_pasado') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      desde = firstDay.toISOString().split('T')[0]
      hasta = lastDay.toISOString().split('T')[0]
    } else {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      desde = past.toISOString().split('T')[0]
      hasta = today.toISOString().split('T')[0]
    }

    setLocalDesde(desde)
    setLocalHasta(hasta)
    onFilterChange({ ...filters, fecha_desde: desde, fecha_hasta: hasta })
    setDatePopoverOpen(false)
  }

  const handleDateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onFilterChange({ ...filters, fecha_desde: localDesde || undefined, fecha_hasta: localHasta || undefined })
    setDatePopoverOpen(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
  }

  const handleOpenMobileSearch = () => {
    setMobileSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  const handleCloseMobileSearch = () => {
    setMobileSearchOpen(false)
    setLocalSearch('')
    onFilterChange({ ...filters, busqueda: undefined })
  }

  const activeBilletera = billeteras.find(b => b.id === filters.billetera_id)
  const activeCategoria = categorias.find(c => c.id === filters.categoria_id)

  const renderBilleterasList = () => (
    <div className={styles.popoverList}>
      <button
        type="button"
        className={`${styles.popoverItem} ${!filters.billetera_id ? styles.popoverItemActive : ''}`}
        onClick={() => handleBilleteraSelect(undefined)}
      >
        Todas las billeteras
      </button>
      {billeteras.map(bill => {
        const bank = bill.bank_id ? getBankById(bill.bank_id) : findBankByNombre(bill.nombre)
        const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''
        return (
          <button
            key={bill.id}
            type="button"
            className={`${styles.popoverItem} ${filters.billetera_id === bill.id ? styles.popoverItemActive : ''}`}
            onClick={() => handleBilleteraSelect(bill.id)}
          >
            {bill.es_efectivo ? (
              <Banknote size={15} />
            ) : logoUrl ? (
              <img src={logoUrl} alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
            ) : (
              <Wallet size={15} />
            )}
            {bill.nombre}
          </button>
        )
      })}
    </div>
  )

  const renderCategoriasList = () => (
    <div className={styles.popoverList}>
      <button
        type="button"
        className={`${styles.popoverItem} ${!filters.categoria_id && (!filters.categoria_ids || filters.categoria_ids.length === 0) ? styles.popoverItemActive : ''}`}
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
    <div className={styles.datePopoverContainer}>
      <div className={styles.desktopPresetsRow}>
        <button type="button" className={styles.desktopPresetBtn} onClick={() => handleApplyPreset('ciclo')}>
          Este ciclo
        </button>
        <button type="button" className={styles.desktopPresetBtn} onClick={() => handleApplyPreset('este_mes')}>
          Este mes
        </button>
        <button type="button" className={styles.desktopPresetBtn} onClick={() => handleApplyPreset('mes_pasado')}>
          Mes pasado
        </button>
        <button type="button" className={styles.desktopPresetBtn} onClick={() => handleApplyPreset('ultimos_30d')}>
          30 días
        </button>
      </div>

      <form onSubmit={handleDateSubmit} className={styles.dateGroup}>
        <DateInput
          id="filter-desde"
          label="Desde"
          name="desde"
          value={localDesde}
          onChange={(val) => setLocalDesde(val)}
        />
        <DateInput
          id="filter-hasta"
          label="Hasta"
          name="hasta"
          value={localHasta}
          onChange={(val) => setLocalHasta(val)}
        />
        <button type="submit" className={`${styles.typePillActive} ${styles.dateSubmitBtn}`}>
          Aplicar
        </button>
      </form>
    </div>
  )

  return (
    <>
      <div className={styles.filterBar}>
        {/* Mobile Filter Controls Bar (Visible only on mobile when search is NOT expanded) */}
        <div className={`${styles.mobileControlsBar} ${mobileSearchOpen ? styles.mobileControlsHidden : ''}`}>
          <div className={styles.mobileLeftActions}>
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
              aria-label="Abrir filtros"
            >
              <Filter size={16} />
              <span>Filtros</span>
            </button>

            {hasActiveFilters && (
              <button className={styles.clearBtnMobileInline} onClick={onClear}>
                Limpiar
              </button>
            )}
          </div>

          <button
            className={styles.mobileSearchTriggerBtn}
            onClick={handleOpenMobileSearch}
            aria-label="Buscar"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Mobile Expanded Search Bar */}
        <div className={`${styles.mobileExpandedSearch} ${mobileSearchOpen ? styles.mobileExpandedSearchActive : ''}`}>
          <Search size={16} className={styles.mobileExpandedSearchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.mobileExpandedSearchInput}
            placeholder="Buscar por descripción, banco..."
            value={localSearch}
            onChange={handleSearchChange}
          />
          <button 
            type="button" 
            className={styles.mobileExpandedSearchClose} 
            onClick={handleCloseMobileSearch}
            aria-label="Cerrar búsqueda"
          >
            <X size={16} />
          </button>
        </div>

        {/* Desktop-only filters group */}
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

          {/* Billetera Popover */}
          <div className={`${styles.pill} ${styles.pillRelative}`} ref={walletRef}>
            <div 
              className={styles.pillIconFlex} 
              onClick={() => setWalletPopoverOpen(!walletPopoverOpen)}
            >
              <Wallet size={14} />
              {activeBilletera ? activeBilletera.nombre : 'Billetera'}
              <ChevronDown size={14} />
            </div>
            {activeBilletera && (
              <button 
                className={styles.pillRemove} 
                onClick={(e) => { e.stopPropagation(); handleBilleteraRemove(); }} 
                aria-label="Remover filtro de billetera"
              >
                <X size={13} />
              </button>
            )}
            {walletPopoverOpen && (
              <div className={`${styles.popover} ${styles.popoverDesktopOnly}`}>
                <div className={styles.popoverTitle}>Billetera / Cuenta</div>
                {renderBilleterasList()}
              </div>
            )}
          </div>

          {/* Categoría Popover */}
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

          {/* Período Popover */}
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

          {filters.estado_verificacion === 'pendiente' && (
            <div className={`${styles.pill} ${styles.pillActive}`}>
              Pendientes IA
              <button className={styles.pillRemove} onClick={() => onFilterChange({ ...filters, estado_verificacion: undefined })} aria-label="Remover filtro">
                <X size={14} />
              </button>
            </div>
          )}

          {hasActiveFilters && (
            <button className={`${styles.clearBtn} ${styles.desktopOnlyBtn}`} onClick={onClear}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Search input (Desktop only) */}
        <div className={styles.searchContainerDesktop}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por descripción, categoría, banco..."
            title="Buscar transacción"
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>
      </div>
    </>
  )
}
