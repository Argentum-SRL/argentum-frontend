import React, { useState, useRef, useEffect, useMemo } from 'react'
import { X, Search, ChevronDown, Filter, Calendar, Wallet, Banknote, DollarSign, Check } from '@/components/ui/icons'
import styles from './FilterBar.module.css'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { useModal } from '@/hooks/useModal'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import { getBankById, findBankByNombre, getBankLogoUrl, sortBilleteras } from '@/lib/utils/billeteras.utils'
import { DateInput } from '@/components/ui'
import { toISODateString } from '@/utils/format'

interface FilterBarProps {
  filters: TransaccionFilters
  onFilterChange: (newFilters: TransaccionFilters) => void
  onClear: () => void
  billeteras: Billetera[]
  categorias: Categoria[]
  hasActiveFilters: boolean
  showMonedaFilter?: boolean
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
  hasActiveFilters,
  showMonedaFilter = false
}: FilterBarProps) {
  const { periodo: periodoActual } = usePeriodoActual()

  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false)
  const [catPopoverOpen, setCatPopoverOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [monedaPopoverOpen, setMonedaPopoverOpen] = useState(false)
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
  const monedaRef = useRef<HTMLDivElement>(null)

  useClickOutside(walletRef, () => setWalletPopoverOpen(false))
  useClickOutside(catRef, () => {
    setCatPopoverOpen(false)
    setCatSearch('')
  })
  useClickOutside(dateRef, () => setDatePopoverOpen(false), '[data-portal="date-picker"]')
  useClickOutside(monedaRef, () => setMonedaPopoverOpen(false))

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

  // Filtrar categorías según tipo activo en filtros y búsqueda rápida
  const filteredCategorias = useMemo(() => {
    let list = categorias
    if (filters.tipo) {
      list = list.filter(c => c.tipo === filters.tipo)
    }
    if (catSearch.trim()) {
      const q = catSearch.trim().toLowerCase()
      list = list.filter(c => c.nombre.toLowerCase().includes(q))
    }
    return list
  }, [categorias, filters.tipo, catSearch])

  const egresoCategorias = useMemo(() => {
    return filteredCategorias.filter(c => c.tipo === 'egreso')
  }, [filteredCategorias])

  const ingresoCategorias = useMemo(() => {
    return filteredCategorias.filter(c => c.tipo === 'ingreso')
  }, [filteredCategorias])

  const sortedBilleteras = useMemo(() => {
    return sortBilleteras(billeteras)
  }, [billeteras])

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    let nextCatId = filters.categoria_id
    let nextCatIds = filters.categoria_ids

    // Limpiar categorías seleccionadas que no pertenezcan al nuevo tipo
    if (tipo && (nextCatId || (nextCatIds && nextCatIds.length > 0))) {
      const allowedCats = categorias.filter(c => c.tipo === tipo).map(c => c.id)
      if (nextCatId && !allowedCats.includes(nextCatId)) {
        nextCatId = undefined
      }
      if (nextCatIds) {
        nextCatIds = nextCatIds.filter(id => allowedCats.includes(id))
        if (nextCatIds.length === 0) nextCatIds = undefined
      }
    }

    onFilterChange({ 
      ...filters, 
      tipo,
      categoria_id: nextCatId,
      categoria_ids: nextCatIds
    })
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
    setCatSearch('')
  }

  const isCustomDate = Boolean(
    (filters.fecha_desde && (filters.fecha_desde !== periodoActual?.fecha_inicio)) ||
    (filters.fecha_hasta && (filters.fecha_hasta !== periodoActual?.fecha_fin))
  )

  const handleResetDate = () => {
    const desde = periodoActual?.fecha_inicio
    const hasta = periodoActual?.fecha_fin
    setLocalDesde(desde || '')
    setLocalHasta(hasta || '')
    onFilterChange({ ...filters, fecha_desde: desde, fecha_hasta: hasta })
  }

  const handleApplyPreset = (preset: 'ciclo' | 'este_mes' | 'mes_pasado' | 'ultimos_30d') => {
    const today = new Date()
    let desde: string
    let hasta: string

    if (preset === 'ciclo') {
      if (periodoActual?.fecha_inicio && periodoActual?.fecha_fin) {
        desde = periodoActual.fecha_inicio
        hasta = periodoActual.fecha_fin
      } else {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        desde = toISODateString(firstDay)
        hasta = toISODateString(lastDay)
      }
    } else if (preset === 'este_mes') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      desde = toISODateString(firstDay)
      hasta = toISODateString(lastDay)
    } else if (preset === 'mes_pasado') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      desde = toISODateString(firstDay)
      hasta = toISODateString(lastDay)
    } else {
      const past = new Date(today)
      past.setDate(today.getDate() - 30)
      desde = toISODateString(past)
      hasta = toISODateString(today)
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
      {sortedBilleteras.map(bill => {
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
            {bill.es_efectivo ? `Efectivo ${bill.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : bill.nombre}
          </button>
        )
      })}
    </div>
  )

  const renderCategoriasList = () => {
    const isAllSelected = !filters.categoria_id && (!filters.categoria_ids || filters.categoria_ids.length === 0)

    return (
      <div className={styles.catPopoverContent}>
        {/* Barra de búsqueda rápida de categorías */}
        <div className={styles.popoverSearchBox}>
          <Search size={13} className={styles.popoverSearchIcon} />
          <input
            type="text"
            className={styles.popoverSearchInput}
            placeholder="Buscar categoría..."
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            autoFocus
          />
          {catSearch && (
            <button 
              type="button" 
              className={styles.popoverSearchClear}
              onClick={() => setCatSearch('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className={styles.popoverList}>
          {!catSearch && (
            <button
              type="button"
              className={`${styles.popoverItem} ${isAllSelected ? styles.popoverItemActive : ''}`}
              onClick={() => handleCategoriaSelect(undefined)}
            >
              <span className={styles.popoverItemText}>Todas las categorías</span>
              {isAllSelected && <Check size={14} className={styles.itemCheck} />}
            </button>
          )}

          {/* Si filters.tipo está definido, renderizar lista directa */}
          {filters.tipo ? (
            filteredCategorias.length === 0 ? (
              <div className={styles.popoverEmpty}>No se encontraron categorías</div>
            ) : (
              filteredCategorias.map(cat => {
                const isSelected = filters.categoria_id === cat.id || filters.categoria_ids?.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.popoverItem} ${isSelected ? styles.popoverItemActive : ''}`}
                    onClick={() => handleCategoriaSelect(cat.id)}
                  >
                    <CategoriaIcon nombre={cat.nombre} size={16} />
                    <span className={styles.popoverItemText}>{cat.nombre}</span>
                    {isSelected && <Check size={14} className={styles.itemCheck} />}
                  </button>
                )
              })
            )
          ) : (
            /* Si no hay tipo seleccionado (Todos), agrupar por Gastos e Ingresos para eliminar ambigüedad */
            <>
              {egresoCategorias.length > 0 && (
                <div className={styles.catGroup}>
                  <div className={styles.catGroupHeader}>
                    <span>Gastos</span>
                    <span className={styles.catGroupCount}>{egresoCategorias.length}</span>
                  </div>
                  {egresoCategorias.map(cat => {
                    const isSelected = filters.categoria_id === cat.id || filters.categoria_ids?.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.popoverItem} ${isSelected ? styles.popoverItemActive : ''}`}
                        onClick={() => handleCategoriaSelect(cat.id)}
                      >
                        <CategoriaIcon nombre={cat.nombre} size={16} />
                        <span className={styles.popoverItemText}>{cat.nombre}</span>
                        {isSelected && <Check size={14} className={styles.itemCheck} />}
                      </button>
                    )
                  })}
                </div>
              )}

              {ingresoCategorias.length > 0 && (
                <div className={styles.catGroup}>
                  <div className={styles.catGroupHeader}>
                    <span>Ingresos</span>
                    <span className={styles.catGroupCount}>{ingresoCategorias.length}</span>
                  </div>
                  {ingresoCategorias.map(cat => {
                    const isSelected = filters.categoria_id === cat.id || filters.categoria_ids?.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`${styles.popoverItem} ${isSelected ? styles.popoverItemActive : ''}`}
                        onClick={() => handleCategoriaSelect(cat.id)}
                      >
                        <CategoriaIcon nombre={cat.nombre} size={16} />
                        <span className={styles.popoverItemText}>{cat.nombre}</span>
                        {isSelected && <Check size={14} className={styles.itemCheck} />}
                      </button>
                    )
                  })}
                </div>
              )}

              {filteredCategorias.length === 0 && (
                <div className={styles.popoverEmpty}>No se encontraron categorías</div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

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
                  showMonedaFilter,
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
            placeholder="Buscar transacciones..."
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
          <div className={`${styles.pill} ${styles.pillRelative} ${activeBilletera ? styles.pillActive : ''}`} ref={walletRef}>
            <div 
              className={styles.pillIconFlex} 
              onClick={() => setWalletPopoverOpen(!walletPopoverOpen)}
            >
              <Wallet size={14} className={styles.pillIcon} />
              <span className={styles.pillText}>
                {activeBilletera 
                  ? (activeBilletera.es_efectivo ? `Efectivo ${activeBilletera.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : activeBilletera.nombre)
                  : 'Billetera'}
              </span>
              <ChevronDown size={14} className={styles.pillChevron} />
            </div>
            {activeBilletera && (
              <button 
                type="button"
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
          <div 
            className={`${styles.pill} ${styles.pillRelative} ${((filters.categoria_ids && filters.categoria_ids.length > 0) || activeCategoria) ? styles.pillActive : ''}`} 
            ref={catRef}
          >
            <div className={styles.pillIconFlex} onClick={() => setCatPopoverOpen(!catPopoverOpen)}>
              <CategoriaIcon 
                nombre={activeCategoria?.nombre} 
                size={14} 
              />
              <span className={styles.pillText}>
                {filters.categoria_ids && filters.categoria_ids.length > 1
                  ? `${filters.categoria_ids.length} cat.`
                  : activeCategoria
                  ? activeCategoria.nombre
                  : 'Categoría'}
              </span>
              <ChevronDown size={14} className={styles.pillChevron} />
            </div>
            {((filters.categoria_ids && filters.categoria_ids.length > 0) || activeCategoria) && (
              <button 
                type="button"
                className={styles.pillRemove} 
                onClick={(e) => { 
                  e.stopPropagation()
                  handleCategoriaSelect(undefined) 
                }} 
                aria-label="Remover filtro de categoría"
              >
                <X size={13} />
              </button>
            )}
            {catPopoverOpen && (
              <div className={`${styles.popover} ${styles.popoverDesktopOnly} ${styles.catPopover}`}>
                <div className={styles.popoverTitleRow}>
                  <div className={styles.popoverTitle}>
                    {filters.tipo === 'egreso' ? 'Categorías de gasto' : filters.tipo === 'ingreso' ? 'Categorías de ingreso' : 'Categorías'}
                  </div>
                  {((filters.categoria_ids && filters.categoria_ids.length > 0) || activeCategoria) && (
                    <button
                      type="button"
                      className={styles.popoverClearBtn}
                      onClick={() => handleCategoriaSelect(undefined)}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                {renderCategoriasList()}
              </div>
            )}
          </div>

          {/* Período Popover */}
          <div className={`${styles.pill} ${styles.pillRelative} ${isCustomDate ? styles.pillActive : ''}`} ref={dateRef}>
            <div className={styles.pillIconFlex} onClick={() => setDatePopoverOpen(!datePopoverOpen)}>
              <Calendar size={14} className={styles.pillIcon} />
              <span className={styles.pillText}>Período</span>
              <ChevronDown size={14} className={styles.pillChevron} />
            </div>
            {isCustomDate && (
              <button 
                type="button"
                className={styles.pillRemove} 
                onClick={(e) => { 
                  e.stopPropagation()
                  handleResetDate() 
                }} 
                aria-label="Restablecer período al ciclo actual"
              >
                <X size={13} />
              </button>
            )}
            {datePopoverOpen && (
              <div className={`${styles.popover} ${styles.popoverDesktopOnly} ${styles.popoverRight}`}>
                <div className={styles.popoverTitle}>Rango de fechas</div>
                {renderDateForm()}
              </div>
            )}
          </div>

          {/* Moneda Popover */}
          {showMonedaFilter && (
            <div className={`${styles.pill} ${styles.pillRelative} ${filters.moneda ? styles.pillActive : ''}`} ref={monedaRef}>
              <div className={styles.pillIconFlex} onClick={() => setMonedaPopoverOpen(!monedaPopoverOpen)}>
                <DollarSign size={14} className={styles.pillIcon} />
                <span className={styles.pillText}>
                  {filters.moneda ? (filters.moneda === 'ARS' ? 'Pesos' : 'Dólares') : 'Moneda'}
                </span>
                <ChevronDown size={14} className={styles.pillChevron} />
              </div>
              {filters.moneda && (
                <button 
                  type="button"
                  className={styles.pillRemove} 
                  onClick={(e) => { e.stopPropagation(); onFilterChange({ ...filters, moneda: undefined }); }} 
                  aria-label="Remover filtro de moneda"
                >
                  <X size={13} />
                </button>
              )}
              {monedaPopoverOpen && (
                <div className={`${styles.popover} ${styles.popoverDesktopOnly} ${styles.popoverRight}`}>
                  <div className={styles.popoverTitle}>Moneda</div>
                  <div className={styles.popoverList}>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${!filters.moneda ? styles.popoverItemActive : ''}`}
                      onClick={() => { onFilterChange({ ...filters, moneda: undefined }); setMonedaPopoverOpen(false); }}
                    >
                      Todas las monedas
                    </button>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${filters.moneda === 'ARS' ? styles.popoverItemActive : ''}`}
                      onClick={() => { onFilterChange({ ...filters, moneda: 'ARS' }); setMonedaPopoverOpen(false); }}
                    >
                      Pesos
                    </button>
                    <button
                      type="button"
                      className={`${styles.popoverItem} ${filters.moneda === 'USD' ? styles.popoverItemActive : ''}`}
                      onClick={() => { onFilterChange({ ...filters, moneda: 'USD' }); setMonedaPopoverOpen(false); }}
                    >
                      Dólares
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {filters.estado_verificacion === 'pendiente' && (
            <div className={`${styles.pill} ${styles.pillActive}`}>
              <span className={styles.pillText}>Pendientes IA</span>
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
        <div className={styles.searchContainerDesktop} data-has-value={Boolean(localSearch)}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            title="Buscar transacción"
            value={localSearch}
            onChange={handleSearchChange}
          />
          {localSearch && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => {
                setLocalSearch('')
                onFilterChange({ ...filters, busqueda: undefined })
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
