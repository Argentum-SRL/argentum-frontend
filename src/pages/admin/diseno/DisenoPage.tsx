import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTheme } from '@/hooks/useTheme'
import disenoService, { ConcurrencyConflictError } from '@/services/disenoService'
import type {
  DesignAuditData,
  DesignVariant,
  DesignDecision,
  DesignSpecification,
  DecisionState,
} from '@/types/diseno'
import DisenoHeader from './components/DisenoHeader'
import DisenoMetricsBar from './components/DisenoMetricsBar'
import DisenoCategoryNav from './components/DisenoCategoryNav'
import { CATEGORIES_CONFIG } from './constants'
import DisenoCatalogView from './components/DisenoCatalogView'
import DisenoComparisonMatrix from './components/DisenoComparisonMatrix'
import DisenoSpecificationView from './components/DisenoSpecificationView'
import DisenoAuditFindings from './components/DisenoAuditFindings'
import styles from './DisenoPage.module.css'

export default function DisenoPage() {
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Datos base del inventario estático
  const inventoryData: DesignAuditData = useMemo(() => disenoService.getInventory(), [])

  // Estado de persistencia y sincronización con el backend
  const [decisiones, setDecisiones] = useState<Record<string, DesignDecision>>({})
  const [especificaciones, setEspecificaciones] = useState<Record<string, DesignSpecification>>({})
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'conflict' | 'offline_local'>('synced')
  const [syncSource, setSyncSource] = useState<'backend' | 'local'>('backend')
  const [isSavingDecision, setIsSavingDecision] = useState(false)
  const [isSavingSpec, setIsSavingSpec] = useState(false)
  const [isReauditing, setIsReauditing] = useState(false)

  // Navegación y filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('selectores_segmentados')
  const [activeView, setActiveView] = useState<'catalogo' | 'comparador' | 'especificaciones' | 'auditoria'>('catalogo')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterReuse, setFilterReuse] = useState<'todos' | 'compartidos' | 'locales'>('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendiente' | 'revisada' | 'aprobada'>('todos')

  // Carga inicial desde backend/local
  useEffect(() => {
    let active = true

    disenoService
      .getDecisiones()
      .then((decRes) => {
        if (!active) return
        setDecisiones(decRes.data)
        setSyncSource(decRes.source)
        setSyncStatus(decRes.source === 'backend' ? 'synced' : 'offline_local')
      })
      .catch(() => {
        if (active) setSyncStatus('offline_local')
      })

    disenoService
      .getEspecificaciones()
      .then((specRes) => {
        if (!active) return
        setEspecificaciones(specRes.data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  // Recarga manual ante resolución de conflictos
  const handleReload = useCallback(async () => {
    try {
      const decRes = await disenoService.getDecisiones()
      setDecisiones(decRes.data)
      setSyncSource(decRes.source)
      setSyncStatus(decRes.source === 'backend' ? 'synced' : 'offline_local')

      const specRes = await disenoService.getEspecificaciones()
      setEspecificaciones(specRes.data)
    } catch {
      setSyncStatus('offline_local')
    }
  }, [])

  // Guardar decisión de diseño con control de concurrencia optimista
  const handleSaveDecision = useCallback(async (decision: DesignDecision) => {
    setIsSavingDecision(true)
    setSyncStatus('saving')
    try {
      const saved = await disenoService.saveDecision(decision)
      setDecisiones((prev) => ({ ...prev, [decision.categoryId]: saved }))
      setSyncStatus('synced')
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        setSyncStatus('conflict')
      } else {
        setSyncStatus('offline_local')
      }
      throw err
    } finally {
      setIsSavingDecision(false)
    }
  }, [])

  // Guardar especificación oficial
  const handleSaveSpec = useCallback(async (spec: DesignSpecification) => {
    setIsSavingSpec(true)
    setSyncStatus('saving')
    try {
      const saved = await disenoService.saveEspecificacion(spec)
      setEspecificaciones((prev) => ({ ...prev, [spec.familyId]: saved }))
      setSyncStatus('synced')
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        setSyncStatus('conflict')
      } else {
        setSyncStatus('offline_local')
      }
      throw err
    } finally {
      setIsSavingSpec(false)
    }
  }, [])

  // Re-auditar
  const handleReaudit = useCallback(() => {
    setIsReauditing(true)
    setTimeout(() => {
      setIsReauditing(false)
    }, 1200)
  }, [])

  // Exportar especificación
  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      decisiones,
      especificaciones,
      metrics: inventoryData.metrics,
      coverageMatrix: inventoryData.coverageMatrix,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `argentum-especificacion-diseno-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [decisiones, especificaciones, inventoryData.metrics, inventoryData.coverageMatrix])

  // Obtener la lista cruda de variantes de la categoría seleccionada
  const rawVariants: DesignVariant[] = useMemo(() => {
    return inventoryData.categories[selectedCategory] || []
  }, [inventoryData, selectedCategory])

  // Obtener los patrones canónicos deduplicados de la categoría seleccionada
  const canonicalPatterns = useMemo(() => {
    return inventoryData.canonicalPatterns?.[selectedCategory] || []
  }, [inventoryData, selectedCategory])

  // Filtrado de variantes crudas
  const filteredVariants = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    const dec = decisiones[selectedCategory]

    return rawVariants.filter((variant) => {
      // 1. Filtro por búsqueda
      if (query) {
        const matchesName = variant.name.toLowerCase().includes(query)
        const matchesTag = variant.componentName.toLowerCase().includes(query)
        const matchesFile = variant.filePath.toLowerCase().includes(query)
        const matchesClass = (variant.className || '').toLowerCase().includes(query)
        if (!matchesName && !matchesTag && !matchesFile && !matchesClass) return false
      }

      // 2. Filtro por nivel de reutilización
      if (filterReuse === 'compartidos' && !variant.isShared) return false
      if (filterReuse === 'locales' && variant.isShared) return false

      // 3. Filtro por estado
      const itemStatus: DecisionState = dec?.decisionState || 'pendiente'
      if (filterStatus !== 'todos' && itemStatus !== filterStatus) return false

      return true
    })
  }, [rawVariants, searchTerm, filterReuse, filterStatus, decisiones, selectedCategory])

  // Conteos por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES_CONFIG) {
      counts[cat.id] = (inventoryData.categories[cat.id] || []).length
    }
    return counts
  }, [inventoryData])

  // Estadísticas globales de decisiones
  const decisionStats = useMemo(() => {
    let aprobadas = 0
    let revisadas = 0
    let pendientes = 0
    const total = CATEGORIES_CONFIG.length

    for (const cat of CATEGORIES_CONFIG) {
      const d = decisiones[cat.id]
      if (d?.decisionState === 'aprobada') aprobadas++
      else if (d?.decisionState === 'revisada') revisadas++
      else pendientes++
    }

    return { aprobadas, revisadas, pendientes, total }
  }, [decisiones])

  const selectedCategoryMeta = useMemo(() => {
    return CATEGORIES_CONFIG.find((c) => c.id === selectedCategory) || CATEGORIES_CONFIG[0]
  }, [selectedCategory])

  return (
    <div className={styles.pageContainer}>
      <DisenoHeader
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onReaudit={handleReaudit}
        isReauditing={isReauditing}
        onExport={handleExport}
        syncStatus={syncStatus}
        syncSource={syncSource}
      />

      <DisenoMetricsBar
        metrics={inventoryData.metrics}
        coverageMatrix={inventoryData.coverageMatrix}
        decisionStats={decisionStats}
      />

      <div className={styles.mainLayout}>
        <div className={styles.sidebar}>
          <DisenoCategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            activeView={activeView}
            onSelectView={setActiveView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterReuse={filterReuse}
            onFilterReuseChange={setFilterReuse}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            categoryCounts={categoryCounts}
            decisiones={decisiones}
          />
        </div>

        <main className={styles.contentArea}>
          {activeView === 'catalogo' && (
            <DisenoCatalogView
              key={selectedCategory}
              categoryId={selectedCategory}
              categoryName={selectedCategoryMeta.name}
              categoryDescription={selectedCategoryMeta.description}
              variants={filteredVariants}
              canonicalPatterns={canonicalPatterns}
              decisions={decisiones}
              onSaveDecision={handleSaveDecision}
              isSaving={isSavingDecision}
              onReload={handleReload}
            />
          )}

          {activeView === 'comparador' && (
            <DisenoComparisonMatrix
              key={selectedCategory}
              categoryId={selectedCategory}
              categoryName={selectedCategoryMeta.name}
              variants={rawVariants}
              decisions={decisiones}
              onSaveDecision={handleSaveDecision}
            />
          )}

          {activeView === 'especificaciones' && (
            <DisenoSpecificationView
              key={selectedCategory}
              categoryId={selectedCategory}
              categoryName={selectedCategoryMeta.name}
              specifications={especificaciones}
              onSaveSpec={handleSaveSpec}
              isSaving={isSavingSpec}
              onReload={handleReload}
            />
          )}

          {activeView === 'auditoria' && (
            <DisenoAuditFindings
              metrics={inventoryData.metrics}
              coverageMatrix={inventoryData.coverageMatrix}
            />
          )}
        </main>
      </div>
    </div>
  )
}
