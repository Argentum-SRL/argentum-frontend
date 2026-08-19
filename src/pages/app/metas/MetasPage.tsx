import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Target
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './MetasPage.module.css'
import goalsService from '@/services/goals.service'
import billeteraService from '@/services/billetera.service'
import type { Goal } from '@/types/goals'
import { EstadoMeta } from '@/types/goals'
import type { Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import GoalCard from '@/components/goals/GoalCard'
import GoalsBarChart from './GoalsBarChart'
import { EmptyState, PageSummaryBar } from '@/components/ui'

export default function MetasPage() {
  const { showToast } = useToast()
  const { open, confirm } = useModal()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'activa' | 'completada' | 'pausada'>('activa')
  const [goals, setGoals] = useState<Goal[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [loading, setLoading] = useState(true)

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
      showToast(getErrorMessage(err, 'No pudimos cargar las metas. Intentá de nuevo.'), 'error')
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
    return goals.filter(g => g.estado === activeTab)
  }, [goals, activeTab])

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

  const handleToggleStatus = useCallback(async (g: Goal) => {
    const nuevoEstado = g.estado === EstadoMeta.ACTIVA ? EstadoMeta.PAUSADA : EstadoMeta.ACTIVA
    try {
      await goalsService.updateGoal(g.id, { estado: nuevoEstado })
      showToast(`Meta ${nuevoEstado === EstadoMeta.PAUSADA ? 'pausada' : 'reanudada'}`, 'success')
      void fetchAll()
    } catch {
      showToast('Error al cambiar el estado', 'error')
    }
  }, [fetchAll, showToast])

  const handleDelete = useCallback((g: Goal) => {
    confirm({
      title: '¿Eliminás esta meta?',
      description: 'Se borrará el seguimiento y el historial de aportes de esta meta.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await goalsService.deleteGoal(g.id)
          showToast('Meta eliminada', 'success')
          void fetchAll()
        } catch {
          showToast('Error al eliminar la meta', 'error')
        }
      }
    })
  }, [confirm, fetchAll, showToast])

  const totalAhorrado = totals.totalAhorrado
  const totalObjetivo = totals.totalObjetivo
  const metasCompletadas = totals.completadas
  const formatCurrency = (monto: number) => formatMonto(monto, 'ARS')

  return (
    <div className={styles.page}>
      
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Metas</h1>
          <p className={styles.subtitle}>Planificá tu futuro y ahorrá con propósito</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.nuevaBtn} onClick={handleCreate}>
            <Plus size={16} strokeWidth={2.5} />
            Nueva<span className={styles.btnSuffix}> meta</span>
          </button>
        </div>
      </div>

      {/* ── Barra de resumen (Desktop) ────────────────────────────────────── */}
      <PageSummaryBar
        className={styles.desktopSummaryBar}
        items={[
          {
            label: "Ahorro acumulado",
            value: formatCurrency(totalAhorrado),
            highlight: true,
          },
          {
            label: "Objetivo global",
            value: formatCurrency(totalObjetivo),
          },
          {
            label: "Completadas",
            value: `${metasCompletadas} meta${metasCompletadas !== 1 ? 's' : ''}`,
          },
        ]}
      />

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className={styles.tabsContainer}>
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
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title={activeTab === 'activa' ? 'Todavía no tenés ninguna meta guardada.' : `Sin metas ${activeTab}s`}
            description={
              activeTab === 'activa' 
                ? '¿Tenés algún objetivo en mente? Creá una meta para empezar a ahorrar.' 
                : `No tenés metas en estado ${activeTab}.`
            }
            actionLabel={activeTab === 'activa' ? 'Crear mi primera meta' : undefined}
            onActionClick={handleCreate}
          />
        ) : (
          <>
            {/* Mobile Comparative Bar Chart (< 768px) */}
            <div className={styles.mobileChartContainer}>
              <GoalsBarChart 
                goals={filteredGoals}
                onEdit={handleEdit}
                onContribute={handleContribute}
                onDetails={handleDetails}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            </div>

            {/* Desktop Grid (>= 768px) */}
            <div className={styles.desktopGrid}>
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
          </>
        )}
      </div>
    </div>
  )
}
