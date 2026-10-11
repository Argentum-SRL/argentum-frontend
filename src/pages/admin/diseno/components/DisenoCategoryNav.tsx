import { Search } from '@/components/ui/icons'
import type { DesignDecision } from '@/types/diseno'
import { CATEGORIES_CONFIG } from '../constants'
import styles from './DisenoCategoryNav.module.css'

interface Props {
  selectedCategory: string
  onSelectCategory: (id: string) => void
  activeView: 'catalogo' | 'comparador' | 'especificaciones' | 'auditoria'
  onSelectView: (view: 'catalogo' | 'comparador' | 'especificaciones' | 'auditoria') => void
  searchTerm: string
  onSearchChange: (val: string) => void
  filterReuse: 'todos' | 'compartidos' | 'locales'
  onFilterReuseChange: (val: 'todos' | 'compartidos' | 'locales') => void
  filterStatus: 'todos' | 'pendiente' | 'revisada' | 'aprobada'
  onFilterStatusChange: (val: 'todos' | 'pendiente' | 'revisada' | 'aprobada') => void
  categoryCounts: Record<string, number>
  decisiones?: Record<string, DesignDecision>
}

export default function DisenoCategoryNav(props: Props) {
  const {
    selectedCategory,
    onSelectCategory,
    activeView,
    onSelectView,
    searchTerm,
    onSearchChange,
    filterStatus,
    onFilterStatusChange,
    decisiones = {},
  } = props
  return (
    <aside className={styles.navContainer}>
      {/* Selector de Vista Principal */}
      <div className={styles.viewModeTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'catalogo'}
          className={`${styles.viewModeBtn} ${activeView === 'catalogo' ? styles.viewModeBtnActive : ''}`}
          onClick={() => onSelectView('catalogo')}
          title="Ver opciones y elegir el diseño oficial"
        >
          🎨 Explorar y Elegir
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'comparador'}
          className={`${styles.viewModeBtn} ${activeView === 'comparador' ? styles.viewModeBtnActive : ''}`}
          onClick={() => onSelectView('comparador')}
          title="Comparar dos variantes frente a frente"
        >
          ⚖️ Comparar Lado a Lado
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className={styles.searchAndFilters}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar elemento o pantalla..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.filterSelectors}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as typeof filterStatus)}
            aria-label="Filtrar por estado de avance"
            style={{ width: '100%' }}
          >
            <option value="todos">Todas las familias (12)</option>
            <option value="pendiente">Solo Pendientes de elegir</option>
            <option value="aprobada">Solo Diseños elegidos</option>
            <option value="revisada">En revisión</option>
          </select>
        </div>
      </div>

      {/* Lista de Categorías */}
      <div className={styles.categoriesList}>
        <span className={styles.listSectionTitle}>Familias de la App ({CATEGORIES_CONFIG.length})</span>
        {CATEGORIES_CONFIG.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          const dec = decisiones[cat.id]
          const status = dec?.decisionState || 'pendiente'
          const dotClass =
            status === 'aprobada'
              ? styles.dotAprobada
              : status === 'revisada'
              ? styles.dotRevisada
              : styles.dotPendiente
          const statusTitle =
            status === 'aprobada'
              ? 'Diseño oficial elegido'
              : status === 'revisada'
              ? 'En revisión'
              : 'Pendiente de elegir'
          return (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryItem} ${isSelected ? styles.categoryItemActive : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div className={styles.categoryItemLeft}>
                <div className={`${styles.categoryIconWrap} ${isSelected ? styles.categoryIconWrapActive : ''}`}>
                  <Icon size={16} />
                </div>
                <div className={styles.categoryItemText}>
                  <span className={styles.categoryName}>{cat.name}</span>
                </div>
              </div>
              <div className={styles.categoryItemRight}>
                <span className={`${styles.statusIndicatorDot} ${dotClass}`} title={statusTitle} />
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
