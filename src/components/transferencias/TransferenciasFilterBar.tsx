import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Filter, Calendar, ChevronDown } from '@/components/ui/icons'
import type { Billetera } from '@/types'
import { TransferenciasFilterMobileModal } from './TransferenciasFilterMobileModal'
import SegmentedControl from '@/components/ui/SegmentedControl'
import styles from './TransferenciasFilterBar.module.css'

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

export type TipoOperacionFilter = 'todas' | 'cuentas' | 'fx'
export type PeriodoPresetFilter = 'ciclo' | 'ciclo_anterior' | 'ultimos_30d' | 'todos'

export interface TransferenciasFilterBarProps {
  busqueda: string
  onBusquedaChange: (val: string) => void
  tipoOperacion: TipoOperacionFilter
  onTipoOperacionChange: (val: TipoOperacionFilter) => void
  billeteraId?: string | undefined
  onBilleteraChange?: (id: string | undefined) => void
  periodoPreset?: PeriodoPresetFilter
  onPeriodoPresetChange?: (preset: PeriodoPresetFilter) => void
  billeteras?: Billetera[]
  counts?: { total: number; cuentas: number; fx: number }
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  totalARS?: number
  totalUSD?: number
  hasCicloConfigurado?: boolean
}

export const TransferenciasFilterBar: React.FC<TransferenciasFilterBarProps> = ({
  busqueda,
  onBusquedaChange,
  tipoOperacion,
  onTipoOperacionChange,
  billeteraId,
  onBilleteraChange,
  periodoPreset = 'ciclo',
  onPeriodoPresetChange,
  billeteras = [],
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  useClickOutside(dateRef, () => setDatePopoverOpen(false))

  const getPeriodoLabel = (preset: PeriodoPresetFilter) => {
    switch (preset) {
      case 'ciclo':
        return 'Este ciclo'
      case 'ciclo_anterior':
        return 'Ciclo anterior'
      case 'ultimos_30d':
        return 'Últimos 30 días'
      case 'todos':
        return 'Todos'
      default:
        return 'Período'
    }
  }

  const handleOpenMobileSearch = () => {
    setMobileSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  const handleCloseMobileSearch = () => {
    setMobileSearchOpen(false)
    onBusquedaChange('')
  }

  return (
    <>
      <div className={styles.filterBar}>
        {/* Mobile Filter Controls Bar (Visible only on mobile when search is NOT expanded) */}
        <div className={`${styles.mobileControlsBar} ${mobileSearchOpen ? styles.mobileControlsHidden : ''}`}>
          <div className={styles.mobileLeftActions}>
            <button
              type="button"
              className={`${styles.mobileFilterBtn} ${hasActiveFilters ? styles.mobileFilterBtnActive : ''}`}
              onClick={() => setIsFilterModalOpen(true)}
              aria-label="Abrir filtros"
            >
              <Filter size={16} />
              <span>Filtros</span>
              {hasActiveFilters && <span className={styles.filterBadgeDot} />}
            </button>

            {hasActiveFilters && onClearFilters && (
              <button
                type="button"
                className={styles.clearBtnMobileInline}
                onClick={onClearFilters}
              >
                Limpiar
              </button>
            )}
          </div>

          <button
            type="button"
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
            placeholder="Buscar..."
            title="Buscar"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
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

        {/* Desktop Filter Group (matching transacciones style) */}
        <div className={styles.desktopFilterGroup}>
          <SegmentedControl<TipoOperacionFilter>
            options={[
              { value: 'todas', label: 'Todas' },
              { value: 'cuentas', label: 'Entre mis cuentas' },
              { value: 'fx', label: 'Compra/Venta Dólares' },
            ]}
            value={tipoOperacion}
            onChange={onTipoOperacionChange}
            ariaLabel="Filtrar por tipo de operación"
          />

          {/* Período Dropdown Pill (matching Transacciones) */}
          {onPeriodoPresetChange && (
            <div
              className={`${styles.pill} ${styles.pillRelative} ${periodoPreset !== 'ciclo' ? styles.pillActive : ''}`}
              ref={dateRef}
            >
              <div
                className={styles.pillIconFlex}
                onClick={() => setDatePopoverOpen(!datePopoverOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setDatePopoverOpen(!datePopoverOpen)
                  }
                }}
                aria-haspopup="true"
                aria-expanded={datePopoverOpen}
              >
                <Calendar size={14} className={styles.pillIcon} />
                <span className={styles.pillText}>{getPeriodoLabel(periodoPreset)}</span>
                <ChevronDown size={14} className={styles.pillChevron} />
              </div>

              {periodoPreset !== 'ciclo' && (
                <button
                  type="button"
                  className={styles.pillRemove}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPeriodoPresetChange('ciclo')
                  }}
                  aria-label="Restablecer período al ciclo actual"
                >
                  <X size={13} />
                </button>
              )}

              {datePopoverOpen && (
                <div className={`${styles.popover} ${styles.popoverDesktopOnly} ${styles.popoverDate}`}>
                  <div className={styles.popoverTitle}>Período</div>
                  <div className={styles.desktopPresetsRow}>
                    <button
                      type="button"
                      className={`${styles.desktopPresetBtn} ${periodoPreset === 'ciclo' ? styles.desktopPresetBtnActive : ''}`}
                      onClick={() => {
                        onPeriodoPresetChange('ciclo')
                        setDatePopoverOpen(false)
                      }}
                    >
                      Este ciclo
                    </button>
                    <button
                      type="button"
                      className={`${styles.desktopPresetBtn} ${periodoPreset === 'ciclo_anterior' ? styles.desktopPresetBtnActive : ''}`}
                      onClick={() => {
                        onPeriodoPresetChange('ciclo_anterior')
                        setDatePopoverOpen(false)
                      }}
                    >
                      Ciclo anterior
                    </button>
                    <button
                      type="button"
                      className={`${styles.desktopPresetBtn} ${periodoPreset === 'ultimos_30d' ? styles.desktopPresetBtnActive : ''}`}
                      onClick={() => {
                        onPeriodoPresetChange('ultimos_30d')
                        setDatePopoverOpen(false)
                      }}
                    >
                      Últimos 30 días
                    </button>
                    <button
                      type="button"
                      className={`${styles.desktopPresetBtn} ${periodoPreset === 'todos' ? styles.desktopPresetBtnActive : ''}`}
                      onClick={() => {
                        onPeriodoPresetChange('todos')
                        setDatePopoverOpen(false)
                      }}
                    >
                      Todos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Input (Desktop) */}
        <div className={styles.searchContainerDesktop} data-has-value={!!busqueda}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar..."
            title="Buscar"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
          {busqueda && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onBusquedaChange('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <TransferenciasFilterMobileModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        tipoOperacion={tipoOperacion}
        onTipoOperacionChange={onTipoOperacionChange}
        billeteraId={billeteraId}
        onBilleteraChange={onBilleteraChange || (() => {})}
        periodoPreset={periodoPreset}
        onPeriodoPresetChange={onPeriodoPresetChange}
        billeteras={billeteras}
        hasActiveFilters={hasActiveFilters}
        onClear={onClearFilters || (() => {})}
      />
    </>
  )
}

export default TransferenciasFilterBar
