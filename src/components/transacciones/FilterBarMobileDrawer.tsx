import { useState, useMemo } from 'react'
import { Check, X, Wallet, Banknote, ArrowUpRight, ArrowDownLeft, ChevronDown, Star } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import { getBankById, findBankByNombre, getBankLogoUrl, sortBilleteras } from '@/lib/utils/billeteras.utils'
import styles from './FilterBar.module.css'
import { DateInput } from '@/components/ui'
import { toISODateString, formatMonto } from '@/utils/format'

interface FilterBarMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters?: TransaccionFilters
  onFilterChange: (newFilters: TransaccionFilters) => void
  onClear: () => void
  billeteras?: Billetera[]
  categorias?: Categoria[]
  hasActiveFilters?: boolean
  showMonedaFilter?: boolean
}

export default function FilterBarMobileDrawer({
  isOpen,
  onClose,
  filters = {},
  onFilterChange,
  onClear,
  billeteras = [],
  categorias = [],
  hasActiveFilters = false,
  showMonedaFilter = false,
}: FilterBarMobileDrawerProps) {
  const { periodo: periodoActual } = usePeriodoActual()

  const safeBilleteras = useMemo(() => sortBilleteras(Array.isArray(billeteras) ? billeteras : []), [billeteras])
  const safeCategorias = useMemo(() => (Array.isArray(categorias) ? categorias : []), [categorias])

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [localFilters, setLocalFilters] = useState<TransaccionFilters>(() => ({ ...filters }))
  const [isAccountsOpen, setIsAccountsOpen] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  // Sincronizar estado local al abrir el modal (render-phase adjustment)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setLocalFilters({ ...filters })
      setIsAccountsOpen(false)
      setIsCategoriesOpen(false)
    }
  }

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    setLocalFilters((prev) => {
      let nextCatId = prev.categoria_id
      let nextCatIds = prev.categoria_ids

      if (tipo && (nextCatId || (nextCatIds && nextCatIds.length > 0))) {
        const allowedCats = safeCategorias.filter((c) => c && c.tipo === tipo).map((c) => c.id)
        if (nextCatId && !allowedCats.includes(nextCatId)) {
          nextCatId = undefined
        }
        if (nextCatIds) {
          nextCatIds = nextCatIds.filter((id) => allowedCats.includes(id))
          if (nextCatIds.length === 0) nextCatIds = undefined
        }
      }

      return {
        ...prev,
        tipo,
        categoria_id: nextCatId,
        categoria_ids: nextCatIds,
      }
    })
  }

  const handleBilleteraSelect = (billeteraId?: string) => {
    setLocalFilters((prev) => ({ ...prev, billetera_id: billeteraId }))
  }

  const handleToggleCategory = (catId: string) => {
    setLocalFilters((prev) => {
      const current = prev.categoria_ids || (prev.categoria_id ? [prev.categoria_id] : [])
      const next = current.includes(catId)
        ? current.filter((id) => id !== catId)
        : [...current, catId]
      return {
        ...prev,
        categoria_id: next.length === 1 ? next[0] : undefined,
        categoria_ids: next.length > 0 ? next : undefined,
      }
    })
  }

  const handleClearCategories = () => {
    setLocalFilters((prev) => ({
      ...prev,
      categoria_id: undefined,
      categoria_ids: undefined,
    }))
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
    } else { // ultimos_30d
      const past = new Date(today)
      past.setDate(today.getDate() - 30)
      desde = toISODateString(past)
      hasta = toISODateString(today)
    }

    setLocalFilters((prev) => ({
      ...prev,
      fecha_desde: desde,
      fecha_hasta: hasta,
    }))
  }

  const handleApply = () => {
    const catIds = localFilters.categoria_ids || (localFilters.categoria_id ? [localFilters.categoria_id] : [])
    const singleCatId = catIds.length === 1 ? catIds[0] : undefined

    onFilterChange({
      ...localFilters,
      categoria_id: singleCatId,
      categoria_ids: catIds.length > 0 ? catIds : undefined,
    })
    onClose()
  }

  const handleClearAll = () => {
    setLocalFilters({
      tipo: undefined,
      moneda: undefined,
      fecha_desde: periodoActual?.fecha_inicio,
      fecha_hasta: periodoActual?.fecha_fin,
      billetera_id: undefined,
      categoria_id: undefined,
      categoria_ids: undefined,
      estado_verificacion: undefined,
      busqueda: undefined,
    })
    onClear()
    onClose()
  }

  const hasLocalActive = useMemo(() => {
    return Object.entries(localFilters).some(([k, v]) => {
      if (k === 'fecha_desde') return periodoActual?.fecha_inicio ? v !== periodoActual.fecha_inicio : Boolean(v)
      if (k === 'fecha_hasta') return periodoActual?.fecha_fin ? v !== periodoActual.fecha_fin : Boolean(v)
      if (Array.isArray(v)) return v.length > 0
      return v !== undefined && v !== ''
    })
  }, [localFilters, periodoActual])

  const selectedCategoriesCount = (localFilters.categoria_ids && Array.isArray(localFilters.categoria_ids) && localFilters.categoria_ids.length > 0)
    ? localFilters.categoria_ids.length
    : (localFilters.categoria_id ? 1 : 0)

  const isAllCategoriesSelected = selectedCategoriesCount === 0

  const visibleCategorias = useMemo(() => {
    return localFilters.tipo 
      ? safeCategorias.filter((c) => c && c.tipo === localFilters.tipo) 
      : safeCategorias
  }, [localFilters.tipo, safeCategorias])

  const egresoCatsMobile = useMemo(() => visibleCategorias.filter((c) => c && c.tipo === 'egreso'), [visibleCategorias])
  const ingresoCatsMobile = useMemo(() => visibleCategorias.filter((c) => c && c.tipo === 'ingreso'), [visibleCategorias])

  const selectedWallet = useMemo(() => {
    return localFilters.billetera_id
      ? safeBilleteras.find((b) => b && b.id === localFilters.billetera_id)
      : undefined
  }, [localFilters.billetera_id, safeBilleteras])

  const walletTriggerLabel = !selectedWallet
    ? `Todas las billeteras (${safeBilleteras.length})`
    : selectedWallet.es_efectivo
      ? `Efectivo ${selectedWallet.moneda === 'ARS' ? 'Pesos' : 'Dólares'}`
      : selectedWallet.nombre

  const categoryTriggerLabel = isAllCategoriesSelected
    ? `Todas las categorías (${visibleCategorias.length})`
    : selectedCategoriesCount === 1
      ? (() => {
          const catId = localFilters.categoria_ids?.[0] || localFilters.categoria_id
          const c = safeCategorias.find((x) => x && x.id === catId)
          return c ? c.nombre : '1 categoría'
        })()
      : `${selectedCategoriesCount} categorías seleccionadas`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros">
      <div className={styles.mobileDrawerContainer}>
        {/* Active Pill for Pendientes IA */}
        {localFilters.estado_verificacion === 'pendiente' && (
          <div className={styles.activePillsRowMobile}>
            <div className={`${styles.pill} ${styles.pillActive}`}>
              Pendientes IA
              <button 
                className={styles.pillRemove} 
                onClick={() => setLocalFilters((prev) => ({ ...prev, estado_verificacion: undefined }))} 
                aria-label="Remover filtro"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tipo Selector */}
        <div>
          <div className={styles.popoverTitle}>Tipo de movimiento</div>
          <div className={styles.pillGroupMobile}>
            <button
              type="button"
              className={`${styles.typePillMobile} ${!localFilters.tipo ? styles.typePillActiveTodosMobile : ''}`}
              onClick={() => handleTipoChange(undefined)}
            >
              Todos
            </button>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localFilters.tipo === 'egreso' ? styles.typePillActiveEgresoMobile : ''}`}
              onClick={() => handleTipoChange('egreso')}
            >
              <ArrowUpRight size={14} strokeWidth={2.2} />
              <span>Egresos</span>
            </button>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localFilters.tipo === 'ingreso' ? styles.typePillActiveIngresoMobile : ''}`}
              onClick={() => handleTipoChange('ingreso')}
            >
              <ArrowDownLeft size={14} strokeWidth={2.2} />
              <span>Ingresos</span>
            </button>
          </div>
        </div>

        {/* Moneda Selector */}
        {showMonedaFilter && (
          <div>
            <div className={styles.popoverTitle}>Moneda</div>
            <div className={styles.pillGroupMobile}>
              <button
                type="button"
                className={`${styles.typePillMobile} ${!localFilters.moneda ? styles.typePillActiveTodosMobile : ''}`}
                onClick={() => setLocalFilters((prev) => ({ ...prev, moneda: undefined }))}
              >
                Todas
              </button>
              <button
                type="button"
                className={`${styles.typePillMobile} ${localFilters.moneda === 'ARS' ? styles.typePillActiveTodosMobile : ''}`}
                onClick={() => setLocalFilters((prev) => ({ ...prev, moneda: 'ARS' }))}
              >
                Pesos
              </button>
              <button
                type="button"
                className={`${styles.typePillMobile} ${localFilters.moneda === 'USD' ? styles.typePillActiveTodosMobile : ''}`}
                onClick={() => setLocalFilters((prev) => ({ ...prev, moneda: 'USD' }))}
              >
                Dólares
              </button>
            </div>
          </div>
        )}

        {/* Billetera Selector (Collapsible Dashboard Style) */}
        <div>
          <div className={styles.popoverTitle}>Billetera / Cuenta</div>
          <div className={styles.accountsSection}>
            <button
              type="button"
              className={`${styles.accountsTrigger} ${isAccountsOpen ? styles.triggerActive : ''}`}
              onClick={() => setIsAccountsOpen(!isAccountsOpen)}
              aria-expanded={isAccountsOpen}
              title={isAccountsOpen ? 'Contraer cuentas' : 'Filtrar cuentas'}
            >
              <div className={styles.triggerContent}>
                <div className={styles.triggerLeft}>
                  <span className={styles.triggerDot} />
                  <span className={styles.triggerText}>{walletTriggerLabel}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${isAccountsOpen ? styles.chevronOpen : ''}`}
                />
              </div>
            </button>

            {isAccountsOpen && (
              <div className={styles.accountsDropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Filtrar cuentas</span>
                  <button
                    type="button"
                    className={`${styles.resetBtn} ${!localFilters.billetera_id ? styles.resetBtnActive : ''}`}
                    onClick={() => handleBilleteraSelect(undefined)}
                  >
                    Todas ({safeBilleteras.length})
                  </button>
                </div>

                <div className={styles.accountsList} role="listbox">
                  {safeBilleteras.map((bill) => {
                    if (!bill) return null
                    const isSelected = localFilters.billetera_id === bill.id
                    const bank = bill.bank_id ? getBankById(bill.bank_id) : findBankByNombre(bill.nombre)
                    const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''

                    return (
                      <button
                        key={bill.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.accountRow} ${isSelected ? styles.rowSelected : ''}`}
                        onClick={() => handleBilleteraSelect(isSelected ? undefined : bill.id)}
                        title={`Alternar ${bill.nombre}`}
                      >
                        <div className={styles.rowLeft}>
                          <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          {bill.es_efectivo ? (
                            <Banknote size={15} className={styles.bankIconMini} />
                          ) : logoUrl ? (
                            <img src={logoUrl} alt="" className={styles.bankIconMini} />
                          ) : (
                            <Wallet size={15} className={styles.bankIconMini} />
                          )}
                          <span className={styles.accountName}>
                            {bill.es_efectivo ? `Efectivo ${bill.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : bill.nombre}
                          </span>
                          {bill.es_principal && (
                            <Star size={10} fill="currentColor" className={styles.starIcon} />
                          )}
                        </div>
                        {bill.saldo_actual !== undefined && (
                          <span className={styles.accountAmount}>
                            {formatMonto(bill.saldo_actual, bill.moneda)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categoría Selector (Collapsible Dashboard Style with Multi-Selection) */}
        <div>
          <div className={styles.popoverTitle}>
            {localFilters.tipo === 'egreso' ? 'Categorías de gasto' : localFilters.tipo === 'ingreso' ? 'Categorías de ingreso' : 'Categorías'}
          </div>
          <div className={styles.accountsSection}>
            <button
              type="button"
              className={`${styles.accountsTrigger} ${isCategoriesOpen ? styles.triggerActive : ''}`}
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              aria-expanded={isCategoriesOpen}
              title={isCategoriesOpen ? 'Contraer categorías' : 'Filtrar categorías'}
            >
              <div className={styles.triggerContent}>
                <div className={styles.triggerLeft}>
                  <span className={`${styles.triggerDot} ${styles.triggerDotCategory}`} />
                  <span className={styles.triggerText}>{categoryTriggerLabel}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${isCategoriesOpen ? styles.chevronOpen : ''}`}
                />
              </div>
            </button>

            {isCategoriesOpen && (
              <div className={styles.accountsDropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>
                    {localFilters.tipo === 'egreso'
                      ? 'Categorías de gasto'
                      : localFilters.tipo === 'ingreso'
                        ? 'Categorías de ingreso'
                        : 'Filtrar categorías'}
                  </span>
                  <button
                    type="button"
                    className={`${styles.resetBtn} ${isAllCategoriesSelected ? styles.resetBtnActive : ''}`}
                    onClick={handleClearCategories}
                  >
                    Todas ({visibleCategorias.length})
                  </button>
                </div>

                <div className={styles.accountsList} role="listbox">
                  {localFilters.tipo ? (
                    visibleCategorias.map((cat) => {
                      const isSelected = localFilters.categoria_ids?.includes(cat.id) || localFilters.categoria_id === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`${styles.accountRow} ${isSelected ? styles.rowSelected : ''}`}
                          onClick={() => handleToggleCategory(cat.id)}
                          title={`Alternar ${cat.nombre}`}
                        >
                          <div className={styles.rowLeft}>
                            <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                            <CategoriaIcon nombre={cat.nombre} size={16} />
                            <span className={styles.accountName}>{cat.nombre}</span>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <>
                      {egresoCatsMobile.length > 0 && (
                        <div className={styles.catGroupMobile}>
                          <div className={styles.catGroupHeaderMobile}>Gastos ({egresoCatsMobile.length})</div>
                          {egresoCatsMobile.map((cat) => {
                            const isSelected = localFilters.categoria_ids?.includes(cat.id) || localFilters.categoria_id === cat.id
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.accountRow} ${isSelected ? styles.rowSelected : ''}`}
                                onClick={() => handleToggleCategory(cat.id)}
                                title={`Alternar ${cat.nombre}`}
                              >
                                <div className={styles.rowLeft}>
                                  <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <CategoriaIcon nombre={cat.nombre} size={16} />
                                  <span className={styles.accountName}>{cat.nombre}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {ingresoCatsMobile.length > 0 && (
                        <div className={styles.catGroupMobile}>
                          <div className={styles.catGroupHeaderMobile}>Ingresos ({ingresoCatsMobile.length})</div>
                          {ingresoCatsMobile.map((cat) => {
                            const isSelected = localFilters.categoria_ids?.includes(cat.id) || localFilters.categoria_id === cat.id
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.accountRow} ${isSelected ? styles.rowSelected : ''}`}
                                onClick={() => handleToggleCategory(cat.id)}
                                title={`Alternar ${cat.nombre}`}
                              >
                                <div className={styles.rowLeft}>
                                  <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <CategoriaIcon nombre={cat.nombre} size={16} />
                                  <span className={styles.accountName}>{cat.nombre}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Período (Presets + Dates) */}
        <div>
          <div className={styles.popoverTitle}>Período</div>
          
          {/* Quick Presets */}
          <div className={styles.presetsGridMobile}>
            <button
              type="button"
              className={styles.presetBtnMobile}
              onClick={() => handleApplyPreset('ciclo')}
            >
              Este ciclo
            </button>
            <button
              type="button"
              className={styles.presetBtnMobile}
              onClick={() => handleApplyPreset('este_mes')}
            >
              Este mes
            </button>
            <button
              type="button"
              className={styles.presetBtnMobile}
              onClick={() => handleApplyPreset('mes_pasado')}
            >
              Mes pasado
            </button>
            <button
              type="button"
              className={styles.presetBtnMobile}
              onClick={() => handleApplyPreset('ultimos_30d')}
            >
              Últimos 30d
            </button>
          </div>

          <div className={styles.dateInputsRowMobile}>
            <DateInput
              id="mobile-filter-desde"
              label="Desde"
              value={localFilters.fecha_desde || ''}
              onChange={(val) => setLocalFilters((prev) => ({ ...prev, fecha_desde: val || undefined }))}
              className={styles.dateFieldMobile}
            />
            <DateInput
              id="mobile-filter-hasta"
              label="Hasta"
              value={localFilters.fecha_hasta || ''}
              onChange={(val) => setLocalFilters((prev) => ({ ...prev, fecha_hasta: val || undefined }))}
              className={styles.dateFieldMobile}
            />
          </div>
        </div>

        {/* Action Row */}
        <div className={styles.drawerActionsRowMobile}>
          <button
            type="button"
            className={`${styles.clearBtnMobileNew} ${!(hasActiveFilters || hasLocalActive) ? styles.clearBtnDisabled : ''}`}
            onClick={handleClearAll}
            disabled={!(hasActiveFilters || hasLocalActive)}
          >
            Limpiar
          </button>
          <button
            type="button"
            className={styles.applyBtnMobileNew}
            onClick={handleApply}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </Modal>
  )
}