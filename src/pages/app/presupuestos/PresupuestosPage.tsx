import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, 
  PieChart,
  Download,
  Target,
} from '@/components/ui/icons'
import styles from './PresupuestosPage.module.css'
import presupuestoService from '@/services/presupuesto.service'
import categoriaService from '@/services/categoria.service'
import billeteraService from '@/services/billetera.service'
import type { 
  Presupuesto, 
  PeriodoPresupuesto, 
  Categoria,
  Billetera,
  SugerenciaRubro
} from '@/types'
import { formatMonto } from '@/utils/format'
import { sileo } from 'sileo'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { getErrorMessage } from '@/utils/errorMessages'
import BudgetCard from './BudgetCard'
import BudgetBarChart from './BudgetBarChart'
import BudgetHistoryModal from './BudgetHistoryModal'
import DescargarExcelModal from './DescargarExcelModal'
import SugerenciaRubroCard from './SugerenciaRubroCard'
import { EmptyState, PageSummaryBar, PresupuestosSkeleton } from '@/components/ui'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { enRiesgo as contarEnRiesgo } from './resumenPresupuestos'

export default function PresupuestosPage() {
  const { usuario } = useAuth()
  const { open, confirm } = useModal()
  const { lastDataUpdate } = useNotificaciones()

  const [activeTab, setActiveTab] = useState<'activo' | 'pausado'>('activo')
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [showDescargarExcel, setShowDescargarExcel] = useState(false)
  
  // Data for forms
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])

  // History Drawer States
  const [showHistory, setShowHistory] = useState(false)
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)
  const [historial, setHistorial] = useState<PeriodoPresupuesto[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sugerencia, setSugerencia] = useState<SugerenciaRubro | null>(null)

  const fetchPresupuestos = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const dataPromise = presupuestoService.getPresupuestos(activeTab, signal)
      const sugPromise = activeTab === 'activo'
        ? presupuestoService.getSugerenciaRubro(signal).catch(() => null)
        : Promise.resolve(null)
      const [data, sug] = await Promise.all([dataPromise, sugPromise])
      if (!signal?.aborted) {
        setPresupuestos(data)
        setSugerencia(sug)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
            sileo.error({
        title: getErrorMessage(err, 'No se pudieron cargar los presupuestos. Probá de nuevo.'),
      })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [activeTab])

  const handleSubirLimite = async (p: Presupuesto) => {
    if (!p.sugerencia_limite) return
    try {
      await presupuestoService.subirLimite(p.id, p.sugerencia_limite.monto)
      sileo.success({ title: 'Límite actualizado.' })
      fetchPresupuestos()
    } catch (err: unknown) {
            sileo.error({
        title: getErrorMessage(err, 'No se pudo cambiar el límite. Probá de nuevo.'),
      })
    }
  }

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
        const [cats, bills] = await Promise.all([
          categoriaService.getCategorias(),
          billeteraService.list(controller.signal).catch(() => [])
        ])
        if (!controller.signal.aborted) {
          setCategorias(cats.filter(c => c.tipo === 'egreso'))
          setBilleteras(bills)
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

  const handleDetails = useCallback((p: Presupuesto) => {
    open('presupuestoDetail', {
      data: {
        presupuesto: p,
        categorias,
        billeteras,
        onSuccess: fetchPresupuestos
      }
    })
  }, [open, categorias, billeteras, fetchPresupuestos])

  const handlePause = (p: Presupuesto) => {
    confirm({
      title: '¿Pausás este presupuesto?',
      description: 'No vas a recibir alertas de este presupuesto mientras esté pausado.',
      variant: 'warning',
      confirmLabel: 'Pausar',
      onConfirm: async () => {
        try {
          await presupuestoService.pausarPresupuesto(p.id)
          sileo.success({ title: 'Presupuesto pausado.' })
          fetchPresupuestos()
        } catch (err: unknown) {
          sileo.error({
            title: getErrorMessage(err, 'No se pudo pausar el presupuesto. Probá de nuevo.'),
          })
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
          sileo.success({ title: 'Presupuesto reanudado.' })
          fetchPresupuestos()
        } catch (err: unknown) {
          sileo.error({
            title: getErrorMessage(err, 'No se pudo reactivar el presupuesto. Probá de nuevo.'),
          })
        }
      }
    })
  }

  const handleDelete = (p: Presupuesto) => {
    confirm({
      title: '¿Eliminás este presupuesto?',
      description: 'Se borra con su historial de ciclos. Tus gastos no cambian.',
      variant: 'danger',
      confirmLabel: 'Eliminar presupuesto',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(p.id)
          sileo.success({ title: 'Presupuesto eliminado.' })
          fetchPresupuestos()
        } catch (err: unknown) {
          sileo.error({
            title: getErrorMessage(err, 'No se pudo eliminar el presupuesto. Probá de nuevo.'),
          })
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
            sileo.error({
        title: getErrorMessage(err, 'No se pudo cargar el historial. Probá de nuevo.'),
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const resumen = useMemo(() => {
    const activos = presupuestos.filter(p => p.estado === 'activo' && p.periodo_actual)
    const primaryCurrency = (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'

    const totalARS = activos.filter(p => p.moneda === 'ARS').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_usado || 0), 0)
    const limiteARS = activos.filter(p => p.moneda === 'ARS').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_limite || 0), 0)
    const totalUSD = activos.filter(p => p.moneda === 'USD').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_usado || 0), 0)
    const limiteUSD = activos.filter(p => p.moneda === 'USD').reduce((acc, p) => acc + Number(p.periodo_actual?.monto_limite || 0), 0)

    const hasUSD = activos.some(p => p.moneda === 'USD')
    const hasARS = activos.some(p => p.moneda === 'ARS')

    let gastadoLabel: string
    let limiteLabel: string | null = null
    if (hasARS && hasUSD) {
      gastadoLabel = `${formatMonto(totalARS, 'ARS')} + ${formatMonto(totalUSD, 'USD')}`
      limiteLabel = `${formatMonto(limiteARS, 'ARS')} + ${formatMonto(limiteUSD, 'USD')}`
    } else if (hasUSD) {
      gastadoLabel = formatMonto(totalUSD, 'USD')
      limiteLabel = formatMonto(limiteUSD, 'USD')
    } else if (hasARS) {
      gastadoLabel = formatMonto(totalARS, 'ARS')
      limiteLabel = formatMonto(limiteARS, 'ARS')
    } else {
      gastadoLabel = formatMonto(0, primaryCurrency)
    }

    const totalGastadoNum = primaryCurrency === 'USD' ? totalUSD : totalARS
    const totalLimiteNum = primaryCurrency === 'USD' ? limiteUSD : limiteARS
    const porcentajeGlobal = totalLimiteNum > 0 ? (totalGastadoNum / totalLimiteNum) * 100 : 0
    const enRiesgo = contarEnRiesgo(activos)

    return {
      activosCount: activos.length,
      gastadoLabel,
      limiteLabel,
      porcentajeGlobal,
      enRiesgo,
    }
  }, [presupuestos, usuario?.moneda_principal])

  return (
    <div className={styles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Presupuestos</h1>
          <p className={styles.subtitle}>Controlá tus límites de gasto por categoría</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.excelBtn}
            onClick={() => setShowDescargarExcel(true)}
            aria-label="Descargar en Excel"
            title="Descargar en Excel"
          >
            <Download size={16} />
            <span className={styles.excelBtnText}>
              Descargar<span className={styles.btnSuffix}> en Excel</span>
            </span>
          </button>
          <button className={styles.nuevaBtn} onClick={handleOpenNew}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo<span className={styles.btnSuffix}> presupuesto</span></span>
          </button>
        </div>
      </div>

      {/* ── Hero Resumen (Desktop) ─────────────────────────────────────────── */}
      {activeTab === 'activo' && !loading && resumen.activosCount > 0 && (
        <PageSummaryBar
          mobileVariant="none"
          items={[
            {
              label: 'Gastado este ciclo',
              value: resumen.gastadoLabel,
              highlight: true,
              notice: resumen.limiteLabel
                ? {
                    icon: <Target size={13} />,
                    tooltip: `Límite total asignado ${resumen.limiteLabel}`,
                    text: (
                      <>
                        Límite total asignado <strong>{resumen.limiteLabel}</strong>
                      </>
                    ),
                  }
                : undefined,
            },
            {
              label: 'Del límite total',
              value: `${resumen.porcentajeGlobal.toFixed(1)}%`,
              tone:
                resumen.porcentajeGlobal >= 80
                  ? 'negative'
                  : resumen.porcentajeGlobal >= 60
                    ? 'warning'
                    : 'positive',
            },
            {
              label: 'En riesgo',
              value: `${resumen.enRiesgo} ${resumen.enRiesgo === 1 ? 'presupuesto' : 'presupuestos'}`,
              tone: resumen.enRiesgo > 0 ? 'negative' : 'positive',
            },
          ]}
        />
      )}

      {/* ── Controls Row (Tabs) ──────────────────────────────── */}
      <div className={styles.controlsRow}>
        <SegmentedControl<'activo' | 'pausado'>
          options={[
            { value: 'activo', label: 'Activos' },
            { value: 'pausado', label: 'Pausados' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Estado de los presupuestos"
          size="md"
        />
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {loading ? (
          <PresupuestosSkeleton count={3} />
        ) : presupuestos.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title={activeTab === 'activo' ? 'Todavía no configuraste ningún presupuesto.' : 'Sin presupuestos pausados'}
            description={
              activeTab === 'activo' 
                ? 'Definí un límite de gasto para tus categorías y Argentum te avisará si te pasás.' 
                : 'No tenés presupuestos en estado pausado.'
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
                onSubirLimite={handleSubirLimite}
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
                  onDetails={() => handleDetails(p)}
                  onSubirLimite={() => handleSubirLimite(p)}
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

      {activeTab === 'activo' && !loading && sugerencia && (
        <SugerenciaRubroCard
          sugerencia={sugerencia}
          onArmar={() => {
            open('presupuesto', {
              data: {
                presupuesto: null,
                categorias,
                sugerencia: {
                  nombre: sugerencia.categoria,
                  categoria_id: sugerencia.categoria_id,
                  monto: sugerencia.monto,
                  moneda: sugerencia.moneda,
                },
                onSuccess: fetchPresupuestos,
              },
            })
          }}
        />
      )}

      <BudgetHistoryModal 
        open={showHistory}
        onClose={() => setShowHistory(false)}
        presupuesto={selectedPresupuesto}
        historial={historial}
        loading={loadingHistory}
        onSubirLimite={() => {
          setShowHistory(false)
          if (selectedPresupuesto) {
            handleSubirLimite(selectedPresupuesto)
          }
        }}
      />

      <DescargarExcelModal
        isOpen={showDescargarExcel}
        onClose={() => setShowDescargarExcel(false)}
      />
    </div>
  )
}
