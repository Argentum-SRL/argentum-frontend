import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { getErrorMessage } from '@/utils/errorMessages'
import BudgetCard from './BudgetCard'
import BudgetHistoryModal from './BudgetHistoryModal'
import { EmptyState, PageSummaryBar } from '@/components/ui'

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
      showToast(getErrorMessage(err, 'No pudimos cargar los presupuestos. Intentá de nuevo.'), 'error')
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
      title: '¿Pausás este presupuesto?',
      description: 'No vas a recibir alertas de este presupuesto mientras esté pausado.',
      variant: 'warning',
      confirmLabel: 'Pausar',
      onConfirm: async () => {
        try {
          await presupuestoService.pausarPresupuesto(p.id)
          showToast('Presupuesto pausado', 'success')
          fetchPresupuestos()
        } catch (err: unknown) {
          showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const handleResume = (id: string) => {
    confirm({
      title: '¿Reactivás este presupuesto?',
      description: 'Vas a volver a recibir alertas cuando te acerques al límite.',
      variant: 'default',
      confirmLabel: 'Reactivar',
      onConfirm: async () => {
        try {
          await presupuestoService.reanudarPresupuesto(id)
          showToast('Presupuesto reanudado', 'success')
          fetchPresupuestos()
        } catch (err: unknown) {
          showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const handleDelete = (p: Presupuesto) => {
    confirm({
      title: '¿Eliminás este presupuesto?',
      description: 'Se va a borrar para siempre.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(p.id)
          showToast('Presupuesto eliminado', 'success')
          fetchPresupuestos()
        } catch (err: unknown) {
          showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
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
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No pudimos cargar el historial. Intentá de nuevo.'), 'error')
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

  const totalGastado = totals.totalGastado
  const totalLimite = totals.totalLimite
  const formatCurrency = (monto: number) => formatMonto(monto, 'ARS')

  const porcentajeGlobal = totalLimite > 0 ? (totalGastado / totalLimite) * 100 : 0
  const activeOnes = presupuestos.filter(p => p.estado === 'activo' && p.periodo_actual)
  const presupuestosEnRiesgo = activeOnes.filter(p => {
    const limite = Number(p.periodo_actual?.monto_limite || 0)
    if (limite <= 0) return false
    const gastado = Number(p.periodo_actual?.monto_usado || 0)
    return (gastado / limite) >= 0.8
  }).length

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
            Nuevo<span className={styles.btnSuffix}> presupuesto</span>
          </button>
        </div>
      </div>

      {/* ── Hero Resumen ────────────────────────────────────────────────────── */}
      {activeTab === 'activo' && (
        <PageSummaryBar
          className={styles.summaryBar}
          items={[
            {
              label: "Gastado este ciclo",
              value: formatCurrency(totalGastado),
            },
            {
              label: "Del límite total",
              value: `${porcentajeGlobal.toFixed(1)}%`,
              valueColor: porcentajeGlobal >= 80 ? '#FF8A65'
                        : porcentajeGlobal >= 60 ? '#F5A623'
                        : '#4CAF7D',
            },
            {
              label: "En riesgo",
              value: `${presupuestosEnRiesgo} ${presupuestosEnRiesgo === 1 ? 'presupuesto' : 'presupuestos'}`,
              valueColor: presupuestosEnRiesgo > 0 ? '#FF8A65' : '#4CAF7D',
            },
          ]}
        />
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
            title={activeTab === 'activo' ? 'Todavía no configuraste ningún presupuesto.' : `Sin presupuestos ${activeTab}s`}
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
