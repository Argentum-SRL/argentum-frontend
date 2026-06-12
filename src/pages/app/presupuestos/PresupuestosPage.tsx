import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Plus, 
  PieChart
} from 'lucide-react'
import styles from './PresupuestosPage.module.css'
import presupuestoService from '@/services/presupuesto.service'
import categoriaService from '@/services/categoria.service'
import type { 
  Presupuesto, 
  PeriodoPresupuesto, 
  Categoria
} from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import BudgetCard from './BudgetCard'
import BudgetHistoryModal from './BudgetHistoryModal'
import { EmptyState } from '@/components/ui'

export default function PresupuestosPage() {
  const { showToast } = useToast()
  const { open, confirm } = useModal()

  const [activeTab, setActiveTab] = useState<'activo' | 'pausado' | 'finalizado'>('activo')
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  
  // Data for forms
  const [categorias, setCategorias] = useState<Categoria[]>([])

  // History Drawer States
  const [showHistory, setShowHistory] = useState(false)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)
  const [historial, setHistorial] = useState<PeriodoPresupuesto[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchPresupuestos = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const data = await presupuestoService.getPresupuestos(activeTab, signal)
      if (!signal?.aborted) {
        setPresupuestos(data)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      showToast('Error al cargar presupuestos', 'error')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [activeTab, showToast])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void fetchPresupuestos(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchPresupuestos])

  useEffect(() => {
    const controller = new AbortController()
    const loadData = async () => {
      try {
        const cats = await categoriaService.getCategorias()
        if (!controller.signal.aborted) {
          setCategorias(cats.filter(c => c.tipo === 'egreso'))
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        console.error(err)
      }
    }
    loadData()
    return () => {
      controller.abort()
    }
  }, [])

  const handleOpenNew = useCallback(() => {
    open('presupuesto', {
      data: {
        presupuesto: null,
        categorias,
        onSuccess: fetchPresupuestos
      }
    })
  }, [categorias, open, fetchPresupuestos])

  const handleEdit = useCallback((p: Presupuesto) => {
    open('presupuesto', {
      data: {
        presupuesto: p,
        categorias,
        onSuccess: fetchPresupuestos
      }
    })
  }, [categorias, open, fetchPresupuestos])

  const handlePause = (p: Presupuesto) => {
    confirm({
      title: 'Pausar presupuesto',
      description: `¿Estás seguro de que querés pausar "${p.nombre}"? Dejará de trackear gastos hasta que lo reanudes.`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          await presupuestoService.pausarPresupuesto(p.id)
          showToast('Presupuesto pausado', 'success')
          fetchPresupuestos()
        } catch {
          showToast('Error al pausar', 'error')
        }
      }
    })
  }

  const handleResume = async (id: string) => {
    try {
      await presupuestoService.reanudarPresupuesto(id)
      showToast('Presupuesto reanudado', 'success')
      fetchPresupuestos()
    } catch {
      showToast('Error al reanudar', 'error')
    }
  }

  const handleDelete = (p: Presupuesto) => {
    confirm({
      title: 'Finalizar presupuesto',
      description: `¿Estás seguro de que querés finalizar "${p.nombre}"? No se eliminará tu historial pero el presupuesto dejará de estar activo definitivamente.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(p.id)
          showToast('Presupuesto finalizado', 'success')
          fetchPresupuestos()
        } catch {
          showToast('Error al finalizar', 'error')
        }
      }
    })
  }

  const handleViewHistory = async (p: Presupuesto) => {
    setSelectedPresupuesto(p)
    setShowHistory(true)
    setLoadingHistory(true)
    try {
      const data = await presupuestoService.getHistorial(p.id)
      setHistorial(data)
    } catch {
      showToast('Error al cargar historial', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  const totals = useMemo(() => {
    const activeOnes = presupuestos.filter(p => p.estado === 'activo' && p.periodo_actual)
    const totalLimite = activeOnes.reduce((acc, p) => acc + Number(p.periodo_actual?.monto_limite || 0), 0)
    const totalGastado = activeOnes.reduce((acc, p) => acc + Number(p.periodo_actual?.monto_usado || 0), 0)
    const superados = activeOnes.filter(p => (p.periodo_actual?.porcentaje_usado || 0) >= 100).length
    
    return {
      totalLimite,
      totalGastado,
      porcentaje: totalLimite > 0 ? (totalGastado / totalLimite) * 100 : 0,
      superados
    }
  }, [presupuestos])

  return (
    <div className={styles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Presupuestos</h1>
          <p className={styles.subtitle}>Controlá tus límites de gasto por categoría</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.nuevaBtn} onClick={handleOpenNew}>
            <Plus size={16} strokeWidth={2.5} />
            Nuevo presupuesto
          </button>
        </div>
      </div>

      {/* ── Hero Resumen (Marine Language) ──────────────────────────────────── */}
      {activeTab === 'activo' && (
        <div className={styles.heroResumen}>
          <div className={styles.heroMain}>
            <span className={styles.heroLabel}>Gasto total presupuestado</span>
            <h2 className={styles.heroBalance}>{formatMonto(totals.totalGastado, 'ARS')}</h2>
            <div className={styles.heroProgress}>
               <HeroProgressBar percentage={totals.porcentaje} />
            </div>
            <span className={styles.heroSubLabel}>{totals.porcentaje.toFixed(1)}% del límite global</span>
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.heroMetric}>
              <span className={styles.heroLabel}>Límite Global</span>
              <span className={styles.heroValue}>{formatMonto(totals.totalLimite, 'ARS')}</span>
            </div>
            <div className={styles.heroMetric}>
              <span className={styles.heroLabel}>En Alerta / Superados</span>
              <span className={`${styles.heroValue} ${totals.superados > 0 ? styles.textError : ''}`}>
                {totals.superados} presupuestos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'activo' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('activo')}
          >
            Activos
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'pausado' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pausado')}
          >
            Pausados
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'finalizado' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('finalizado')}
          >
            Finalizados
          </button>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map(i => <div key={i} className={`${styles.card} ${styles.skeletonCard} ${styles.skeleton}`} />)}
          </div>
        ) : presupuestos.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title={`Sin presupuestos ${activeTab}s`}
            description={
              activeTab === 'activo' 
                ? 'Definí un límite de gasto para tus categorías y Argentum te avisará si te pasás.' 
                : `No tenés presupuestos en estado ${activeTab}.`
            }
            actionLabel={activeTab === 'activo' ? 'Crear mi primer presupuesto' : undefined}
            onActionClick={handleOpenNew}
          />
        ) : (
          <div className={styles.grid}>
            {presupuestos.map(p => (
              <BudgetCard 
                key={p.id} 
                presupuesto={p} 
                onEdit={() => handleEdit(p)}
                onPause={() => handlePause(p)}
                onResume={() => handleResume(p.id)}
                onDelete={() => handleDelete(p)}
                onHistory={() => handleViewHistory(p)}
              />
            ))}
          </div>
        )}
      </div>

      <BudgetHistoryModal 
        open={showHistory}
        onClose={() => setShowHistory(false)}
        presupuesto={selectedPresupuesto}
        historial={historial}
        loading={loadingHistory}
      />
    </div>
  )
}


function HeroProgressBar({ percentage }: { percentage: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.min(percentage, 100)}%`
    }
  }, [percentage])
  return <div ref={barRef} className={styles.heroProgressBar} />
}

