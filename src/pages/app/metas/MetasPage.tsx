import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Plus, 
  Target,
  Search
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './MetasPage.module.css'
import goalsService from '@/services/goals.service'
import billeteraService from '@/services/billetera.service'
import type { Goal } from '@/types/goals'
import type { Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import GoalCard from '@/components/goals/GoalCard'

export default function MetasPage() {
  const { showToast } = useToast()
  const { open } = useModal()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'activa' | 'completada' | 'pausada'>('activa')
  const [goals, setGoals] = useState<Goal[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchGoals = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await goalsService.getGoals(undefined, signal)
      if (!signal?.aborted) {
        setGoals(data)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      showToast('Error al cargar metas', 'error')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [showToast])

  const fetchBilleteras = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await billeteraService.list(signal)
      if (!signal?.aborted) {
        setBilleteras(data)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
    }
  }, [])

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    await Promise.all([fetchGoals(signal), fetchBilleteras(signal)])
  }, [fetchGoals, fetchBilleteras])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      await Promise.resolve()
      if (!controller.signal.aborted) {
        void fetchAll(controller.signal)
      }
    }

    void load()
    return () => {
      controller.abort()
    }
  }, [fetchAll])

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchesTab = g.estado === activeTab
      const matchesSearch = g.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [goals, activeTab, searchQuery])

  const totals = useMemo(() => {
    const activeOnes = goals.filter(g => g.estado === 'activa')
    const totalObjetivo = activeOnes.reduce((acc, g) => acc + Number(g.monto_objetivo), 0)
    const totalAhorrado = activeOnes.reduce((acc, g) => acc + Number(g.monto_actual), 0)
    
    return {
      totalObjetivo,
      totalAhorrado,
      porcentaje: totalObjetivo > 0 ? (totalAhorrado / totalObjetivo) * 100 : 0,
      completadas: goals.filter(g => g.estado === 'completada').length
    }
  }, [goals])

  const handleCreate = () => {
    open('goal', {
      data: {
        goal: null,
        onSuccess: fetchAll
      }
    })
  }

  const handleEdit = (g: Goal) => {
    open('goal', {
      data: {
        goal: g,
        onSuccess: fetchAll
      }
    })
  }

  const handleContribute = (g: Goal) => {
    open('goalContribution', {
      data: {
        goal: g,
        billeteras,
        onSuccess: fetchAll
      }
    })
  }

  const handleDetails = (id: string) => {
    navigate(`/app/metas/${id}`)
  }

  const heroBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (heroBarRef.current) {
      heroBarRef.current.style.width = `${Math.min(totals.porcentaje, 100)}%`
    }
  }, [totals.porcentaje])

  return (
    <div className={styles.page}>
      
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Metas</h1>
          <p className={styles.subtitle}>Planificá tu futuro y ahorrá con propósito</p>
        </div>
        <div className={styles.actions}>
          <button className={`${styles.btnGhost} ${styles.btnPrimary}`} onClick={handleCreate}>
            <Plus size={16} className={styles.btnIcon} />
            Nueva meta
          </button>
        </div>
      </div>

      {/* ── Hero Summary ────────────────────────────────────────────── */}
      <div className={styles.heroSummary}>
        <div className={styles.heroMain}>
          <span className={styles.heroLabel}>Total ahorrado en metas</span>
          <h2 className={styles.heroBalance}>{formatMonto(totals.totalAhorrado, 'ARS')}</h2>
          <div className={styles.heroProgressContainer}>
            <div ref={heroBarRef} className={styles.heroProgressBar} />
          </div>
          <span className={styles.heroSubLabel}>{totals.porcentaje.toFixed(1)}% del objetivo global</span>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroMetric}>
            <span className={styles.heroLabel}>Objetivo Global</span>
            <span className={styles.heroValue}>{formatMonto(totals.totalObjetivo, 'ARS')}</span>
          </div>
          <div className={styles.heroMetric}>
            <span className={styles.heroLabel}>Completadas</span>
            <span className={styles.heroValue}>{totals.completadas} metas</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'activa' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('activa')}
          >
            Activas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'completada' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('completada')}
          >
            Completadas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'pausada' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pausada')}
          >
            Pausadas
          </button>
        </div>

        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar meta..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={64} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron resultados' : `Sin metas ${activeTab}s`}
            </h3>
            <p className={styles.emptyDesc}>
              {searchQuery 
                ? 'Probá con otro nombre o criterio de búsqueda.' 
                : activeTab === 'activa' 
                  ? '¿Tenés algún objetivo en mente? Creá una meta para empezar a ahorrar.' 
                  : `No tenés metas en estado ${activeTab}.`}
            </p>
            {!searchQuery && activeTab === 'activa' && (
              <button className={`${styles.btnGhost} ${styles.btnPrimary}`} onClick={handleCreate}>
                Crear mi primera meta
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredGoals.map(g => (
              <GoalCard 
                key={g.id} 
                goal={g} 
                onEdit={() => handleEdit(g)}
                onContribute={() => handleContribute(g)}
                onDetails={() => handleDetails(g.id)}
                onRefresh={fetchAll}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
