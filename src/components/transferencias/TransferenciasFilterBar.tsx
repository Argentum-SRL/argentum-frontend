import React, { useState, useRef } from 'react'
import { Search, X, Filter } from '@/components/ui/icons'
import type { Billetera } from '@/types'
import { TransferenciasFilterMobileModal } from './TransferenciasFilterMobileModal'
import styles from './TransferenciasFilterBar.module.css'

export type TipoOperacionFilter = 'todas' | 'cuentas' | 'fx'
export type PeriodoPresetFilter = 'todos' | 'ciclo' | 'este_mes' | 'mes_pasado'

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
  billeteras = [],
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
          <div className={styles.tabs} role="tablist" aria-label="Filtrar por tipo de operación">
            <button
              type="button"
              className={`${styles.tab} ${tipoOperacion === 'todas' ? styles.tabActive : ''}`}
              onClick={() => onTipoOperacionChange('todas')}
              role="tab"
              aria-selected={tipoOperacion === 'todas'}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tipoOperacion === 'cuentas' ? styles.tabActive : ''}`}
              onClick={() => onTipoOperacionChange('cuentas')}
              role="tab"
              aria-selected={tipoOperacion === 'cuentas'}
            >
              Entre mis cuentas
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tipoOperacion === 'fx' ? styles.tabActive : ''}`}
              onClick={() => onTipoOperacionChange('fx')}
              role="tab"
              aria-selected={tipoOperacion === 'fx'}
            >
              Compra/Venta Dólares
            </button>
          </div>
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
        billeteras={billeteras}
        hasActiveFilters={hasActiveFilters}
        onClear={onClearFilters || (() => {})}
      />
    </>
  )
}

export default TransferenciasFilterBar
