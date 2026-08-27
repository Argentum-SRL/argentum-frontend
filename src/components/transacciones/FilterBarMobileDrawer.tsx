import { useState, useMemo } from 'react'
import { Check, X, Wallet, Banknote } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import type { TransaccionFilters } from '@/services/transaccion.service'
import type { Billetera, Categoria } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { calcularPeriodoActual } from '@/lib/utils/ciclo'
import { getBankById, findBankByNombre, getBankLogoUrl } from '@/lib/utils/billeteras.utils'
import styles from './FilterBar.module.css'
import { DateInput } from '@/components/ui'

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
  const { usuario } = useAuth()
  const periodoActual = useMemo(() => calcularPeriodoActual(usuario), [usuario])

  const [localFilters, setLocalFilters] = useState<TransaccionFilters>({ ...filters })

  const handleTipoChange = (tipo: 'ingreso' | 'egreso' | undefined) => {
    setLocalFilters((prev) => ({ ...prev, tipo }))
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
      desde = periodoActual.inicio.toISOString().split('T')[0]
      hasta = periodoActual.fin.toISOString().split('T')[0]
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
    } else { // ultimos_30d
      const past = new Date()
      past.setDate(today.getDate() - 30)
      desde = past.toISOString().split('T')[0]
      hasta = today.toISOString().split('T')[0]
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
    onClear()
    onClose()
  }

  const isAllCategoriesSelected = !localFilters.categoria_ids || localFilters.categoria_ids.length === 0

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
              Egresos
            </button>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localFilters.tipo === 'ingreso' ? styles.typePillActiveIngresoMobile : ''}`}
              onClick={() => handleTipoChange('ingreso')}
            >
              Ingresos
            </button>
          </div>
        </div>

        {/* Billetera Selector */}
        <div>
          <div className={styles.popoverTitle}>Billetera / Cuenta</div>
          <div className={styles.categoriaListMobile}>
            <button
              type="button"
              className={`${styles.categoriaRowMobile} ${!localFilters.billetera_id ? styles.categoriaRowActiveMobile : ''}`}
              onClick={() => handleBilleteraSelect(undefined)}
            >
              <div className={styles.categoriaRowLeftMobile}>
                <Wallet size={16} />
                <span>Todas las billeteras</span>
              </div>
              <div className={`${styles.checkboxMobile} ${!localFilters.billetera_id ? styles.checkboxCheckedMobile : ''}`}>
                {!localFilters.billetera_id && <Check size={14} strokeWidth={3} />}
              </div>
            </button>

            {billeteras.map((bill) => {
              const isSelected = localFilters.billetera_id === bill.id
              const bank = bill.bank_id ? getBankById(bill.bank_id) : findBankByNombre(bill.nombre)
              const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''

              return (
                <button
                  key={bill.id}
                  type="button"
                  className={`${styles.categoriaRowMobile} ${isSelected ? styles.categoriaRowActiveMobile : ''}`}
                  onClick={() => handleBilleteraSelect(bill.id)}
                >
                  <div className={styles.categoriaRowLeftMobile}>
                    {bill.es_efectivo ? (
                      <Banknote size={16} />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <Wallet size={16} />
                    )}
                    <span>{bill.nombre}</span>
                  </div>
                  <div className={`${styles.checkboxMobile} ${isSelected ? styles.checkboxCheckedMobile : ''}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Categoría Selector (Multi-selection checklist) */}
        <div>
          <div className={styles.popoverTitle}>Categorías</div>
          <div className={styles.categoriaListMobile}>
            <button
              type="button"
              className={`${styles.categoriaRowMobile} ${isAllCategoriesSelected ? styles.categoriaRowActiveMobile : ''}`}
              onClick={handleClearCategories}
            >
              <div className={styles.categoriaRowLeftMobile}>
                <div className={styles.allCatsIconMobile}>🌟</div>
                <span>Todas las categorías</span>
              </div>
              <div className={`${styles.checkboxMobile} ${isAllCategoriesSelected ? styles.checkboxCheckedMobile : ''}`}>
                {isAllCategoriesSelected && <Check size={14} strokeWidth={3} />}
              </div>
            </button>

            {categorias.map((cat) => {
              const isSelected = localFilters.categoria_ids?.includes(cat.id) || localFilters.categoria_id === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoriaRowMobile} ${isSelected ? styles.categoriaRowActiveMobile : ''}`}
                  onClick={() => handleToggleCategory(cat.id)}
                >
                  <div className={styles.categoriaRowLeftMobile}>
                    <CategoriaIcon nombre={cat.nombre} size={16} />
                    <span>{cat.nombre}</span>
                  </div>
                  <div className={`${styles.checkboxMobile} ${isSelected ? styles.checkboxCheckedMobile : ''}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </button>
              )
            })}
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
            className={`${styles.clearBtnMobileNew} ${!hasActiveFilters ? styles.clearBtnDisabled : ''}`}
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
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