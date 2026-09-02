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
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { getErrorMessage } from '@/utils/errorMessages'
import BudgetCard from './BudgetCard'
import BudgetBarChart from './BudgetBarChart'
import BudgetHistoryModal from './BudgetHistoryModal'
import { EmptyState, PageSummaryBar } from '@/components/ui'

export default function PresupuestosPage() {
  const { showToast } = useToast()
  const { usuario } = useAuth()
  const { open, confirm } = useModal()
  const { lastDataUpdate } = useNotificaciones()

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

  // Auto-refresco en vivo ante eventos SSE de actualización de datos
  useEffect(() => {
    if (lastDataUpdate?.entidad === 'presupuestos' || lastDataUpdate?.entidad === 'transacciones') {
      const controller = new AbortController()
      const timer = setTimeout(() => {
        void fetchPresupuestos(controller.signal)
      }, 0)
      return () => {
        clearTimeout(timer)
        controller.abort()
      }
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchPresupuestos])

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
    const isFinalizado = p.estado === 'finalizado'
    confirm({
      title: isFinalizado ? '¿Eliminás definitivamente este presupuesto?' : '¿Finalizás este presupuesto?',
      description: isFinalizado 
        ? 'Se borrará permanentemente de tu historial.' 
        : 'El presupuesto pasará a la pestaña de finalizados.',
      variant: 'danger',
      confirmLabel: isFinalizado ? 'Eliminar definitivamente' : 'Finalizar',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(p.id)
          showToast(isFinalizado ? 'Presupuesto eliminado definitivamente' : 'Presupuesto finalizado', 'success')
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
    const primaryCurrency = (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'
    
    const totalARS = activeOnes.filter(p => p.moneda === 'ARS').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_usado || 0), 0)
    const limiteARS = activeOnes.filter(p => p.moneda === 'ARS').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_limite || 0), 0)
    const totalUSD = activeOnes.filter(p => p.moneda === 'USD').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_usado || 0), 0)
    const limiteUSD = activeOnes.filter(p => p.moneda === 'USD').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_limite || 0), 0)

    const hasUSD = activeOnes.some(p => p.moneda === 'USD')
    const hasARS = activeOnes.some(p => p.moneda === 'ARS')

    let gastadoLabel: string
    if (hasARS && hasUSD) {
      gastadoLabel = `${formatMonto(totalARS, 'ARS')} + ${formatMonto(totalUSD, 'USD')}`
    } else if (hasUSD) {
      gastadoLabel = formatMonto(totalUSD, 'USD')
    } else if (hasARS) {
      gastadoLabel = formatMonto(totalARS, 'ARS')
    } else {
      gastadoLabel = formatMonto(0, primaryCurrency)
    }

    const totalGastadoNum = primaryCurrency === 'USD' ? totalUSD : totalARS
    const totalLimiteNum = primaryCurrency === 'USD' ? limiteUSD : limiteARS
    const porcentajeGlobal = totalLimiteNum > 0 ? (totalGastadoNum / totalLimiteNum) * 100 : 0
    const superados = activeOnes.filter(p => (p.periodo_actual?.porcentaje_usado || 0) >= 100).length
    
    return {
      gastadoLabel,
      porcentajeGlobal,
      superados
    }
  }, [presupuestos, usuario?.moneda_principal])

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
              value: totals.gastadoLabel,
            },
            {
              label: "Del límite total",
              value: `${totals.porcentajeGlobal.toFixed(1)}%`,
              valueColor: totals.porcentajeGlobal >= 80 ? '#FF8A65'
                        : totals.porcentajeGlobal >= 60 ? '#F5A623'
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

      {/* ── Controls Row (Tabs) ──────────────────────────────── */}
      <div className={styles.controlsRow}>
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
          <>
            {/* Mobile Comparative Bar Chart (< 768px) */}
            <div className={styles.mobileChartContainer}>
              <BudgetBarChart
                presupuestos={presupuestos}
                onEdit={handleEdit}
                onPause={handlePause}
                onResume={handleResume}
                onDelete={handleDelete}
                onHistory={handleViewHistory}
              />
            </div>

            {/* Desktop View (>= 768px) - Siempre Tarjetas */}
            <div className={styles.desktopGrid}>
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
          </>
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
