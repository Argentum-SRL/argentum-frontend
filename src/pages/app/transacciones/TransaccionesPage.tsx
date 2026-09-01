import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, ArrowLeftRight, Download, AlertCircle, ArrowRight, CreditCard, Loader2 } from 'lucide-react'
import styles from './TransaccionesPage.module.css'
import transaccionService from '@/services/transaccion.service'
import type { TransaccionFilters } from '@/services/transaccion.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import { exportarTransaccionesPDF } from '@/services/exportPdf.service'
import type { Transaccion, Billetera, Categoria, TarjetaCredito } from '@/types'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'

import FilterBar from '@/components/transacciones/FilterBar'
import DayGroup from '@/components/transacciones/DayGroup'
import GruposCuotasTab from '@/components/transacciones/GruposCuotasTab'
import { EmptyState, PageSummaryBar } from '@/components/ui'

const PAGE_SIZE = 50

export default function TransaccionesPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()
  const { periodo: periodoActual, loading: loadingPeriodo } = usePeriodoActual()
  const { lastDataUpdate } = useNotificaciones()

  const [activeTab, setActiveTab] = useState<'historial' | 'cuotas'>('historial')
  const mainCurrency = 'ARS' // Moneda base para el resumen
  
  const defaultFilters: TransaccionFilters = useMemo(() => ({
    tipo: undefined,
    moneda: undefined,
    fecha_desde: periodoActual?.fecha_inicio,
    fecha_hasta: periodoActual?.fecha_fin,
    billetera_id: undefined,
    categoria_id: undefined,
    estado_verificacion: undefined,
    busqueda: ''
  }), [periodoActual])

  const [filters, setFilters] = useState<TransaccionFilters>(defaultFilters)

  // Sincronizar filtros por defecto cuando el usuario cargue o cambie su ciclo
  const periodoKey = periodoActual ? `${periodoActual.fecha_inicio}_${periodoActual.fecha_fin}` : ''
  const [lastPeriodoKey, setLastPeriodoKey] = useState<string>('')
  if (periodoKey && periodoKey !== lastPeriodoKey) {
    setLastPeriodoKey(periodoKey)
    setFilters(defaultFilters)
  }
  
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [pendientesIA, setPendientesIA] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { open, confirm } = useModal()

  const hasActiveFilters = useMemo(() => Object.entries(filters).some(([k, v]) => {
    if (k === 'fecha_desde' || k === 'fecha_hasta') {
      return v !== defaultFilters[k as keyof TransaccionFilters]
    }
    return v !== undefined && v !== ''
  }), [filters, defaultFilters])

  // Carga inicial (página 0)
  const fetchInitialTransacciones = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await transaccionService.getTransacciones({
        ...filters,
        skip: 0,
        limit: PAGE_SIZE
      }, signal)
      if (!signal?.aborted) {
        setTransacciones(data)
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      showToast(getErrorMessage(err, 'No pudimos cargar las transacciones. Intentá de nuevo.'), 'error')
    }
  }, [filters, showToast])

  // Carga de siguientes páginas (scroll infinito)
  const loadMore = useCallback(async () => {
    if (loading || loadingPeriodo || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextData = await transaccionService.getTransacciones({
        ...filters,
        skip: transacciones.length,
        limit: PAGE_SIZE
      })
      if (nextData.length < PAGE_SIZE) {
        setHasMore(false)
      }
      setTransacciones(prev => {
        const existingIds = new Set(prev.map(t => t.id))
        const fresh = nextData.filter(t => !existingIds.has(t.id))
        return [...prev, ...fresh]
      })
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      showToast(getErrorMessage(err, 'No pudimos cargar más transacciones.'), 'error')
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingPeriodo, loadingMore, hasMore, filters, transacciones.length, showToast])

  const fetchPendientes = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await transaccionService.getPendientesIA(signal)
      if (!signal?.aborted) {
        setPendientesIA(data)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
    }
  }, [])

  // Función para refrescar todo (usada por modales)
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [, , freshBilleteras] = await Promise.all([
        fetchInitialTransacciones(),
        fetchPendientes(),
        billeteraService.list(),
      ])
      setBilleteras(freshBilleteras.filter((w) => w.estado === 'activa'))
    } finally {
      setLoading(false)
    }
  }, [fetchInitialTransacciones, fetchPendientes])

  // 1. Carga de datos estáticos (Solo al montar)
  useEffect(() => {
    let isMounted = true
    const loadStatic = async () => {
      try {
        const [b, c, t] = await Promise.all([
          billeteraService.list(),
          categoriaService.getCategorias(),
          tarjetaService.getTarjetas()
        ])
        if (isMounted) {
          setBilleteras(b.filter((w: Billetera) => w.estado === 'activa'))
          setCategorias(c)
          setTarjetas(t)
        }
      } catch (err) {
        console.error('Error loading static data:', err)
      }
    }
    loadStatic()
    return () => { isMounted = false }
  }, [])

  // 2. Carga de datos dinámicos (Cuando cambian los filtros y el período está listo)
  useEffect(() => {
    if (loadingPeriodo) return

    const controller = new AbortController()
    
    const loadDynamic = async () => {
      setLoading(true)
      setHasMore(true)
      try {
        await Promise.all([
          fetchInitialTransacciones(controller.signal),
          fetchPendientes(controller.signal)
        ])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    
    loadDynamic()
    return () => controller.abort()
  }, [loadingPeriodo, fetchInitialTransacciones, fetchPendientes])

  // 3. Observer para infinite scroll
  useEffect(() => {
    if (loading || loadingPeriodo || !hasMore || loadingMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '250px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, loadingPeriodo, hasMore, loadingMore, loadMore])

  // 4. Auto-refresco en vivo ante eventos SSE de actualización de datos
  useEffect(() => {
    if (loadingPeriodo) return
    if (lastDataUpdate?.entidad === 'transacciones') {
      const controller = new AbortController()
      const tid = setTimeout(() => {
        void fetchInitialTransacciones(controller.signal)
        void fetchPendientes(controller.signal)
      }, 0)
      return () => {
        clearTimeout(tid)
        controller.abort()
      }
    }
  }, [loadingPeriodo, lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchInitialTransacciones, fetchPendientes])


  const handleEdit = useCallback((id: string) => {
    const tx = transacciones.find(t => t.id === id) || pendientesIA.find(t => t.id === id)
    if (tx) {
      open('transaccion', {
        data: {
          transaccion: tx,
          billeteras,
          categorias,
          tarjetas,
          onSuccess: refresh,
        },
      })
    }
  }, [transacciones, pendientesIA, billeteras, categorias, tarjetas, open, refresh])

  const handleDelete = useCallback((id: string) => {
    const tx = transacciones.find(t => t.id === id) || pendientesIA.find(t => t.id === id)
    if (!tx) return

    confirm({
      title: '¿Eliminás esta transacción?',
      description: 'Se va a borrar para siempre y no hay forma de recuperarla.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(id)
          showToast('La transacción se eliminó.', 'success')
          refresh()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos eliminar la transacción. Intentá de nuevo.'), 'error')
        }
      },
    })
  }, [transacciones, pendientesIA, confirm, refresh, showToast])

  const openNewTransaccion = useCallback(() => {
    open('transaccion', {
      data: {
        transaccion: null,
        billeteras,
        categorias,
        tarjetas,
        onSuccess: refresh,
      },
    })
  }, [billeteras, categorias, tarjetas, open, refresh])

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const handleViewPendientes = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      estado_verificacion: 'pendiente',
      fecha_desde: undefined,
      fecha_hasta: undefined,
    }))
  }, [])

  const filteredTransacciones = useMemo(() => {
    if (!filters.categoria_ids || filters.categoria_ids.length === 0) {
      return transacciones
    }
    return transacciones.filter(t => t.categoria_id && filters.categoria_ids?.includes(t.categoria_id))
  }, [transacciones, filters.categoria_ids])

  const grupos = useMemo(() => {
    const gruposObj: Record<string, Transaccion[]> = {}
    filteredTransacciones.forEach(tx => {
      const fecha = tx.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(tx)
    })
    return Object.entries(gruposObj).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredTransacciones])

  const { totalIngresos, totalEgresos, balance } = useMemo(() => {
    let ingresos = 0
    let egresos = 0
    
    // Solo sumamos lo que corresponde a la moneda principal para que el resumen sea coherente
    const txsMoneda = filteredTransacciones.filter(t => t.moneda === mainCurrency)

    txsMoneda.forEach(t => {
      const monto = Number(t.monto) || 0
      if (t.tipo === 'ingreso') ingresos += monto
      else egresos += monto
    })

    return {
      totalIngresos: ingresos,
      totalEgresos: egresos,
      balance: ingresos - egresos
    }
  }, [filteredTransacciones, mainCurrency])

  const formatCurrency = (monto: number) => formatMonto(Math.round(monto), 'ARS')
  const resumen = useMemo(() => ({
    balance,
    ingresos: totalIngresos,
    egresos: totalEgresos
  }), [balance, totalIngresos, totalEgresos])

  const handleExportar = useCallback(() => {
    exportarTransaccionesPDF({
      transacciones: filteredTransacciones,
      resumen: {
        totalIngresos: resumen.ingresos,
        totalEgresos: resumen.egresos,
        balance: resumen.balance
      },
      filters,
      usuario
    })
  }, [filteredTransacciones, resumen, filters, usuario])

  return (
    <div className={styles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Transacciones</h1>
          <p className={styles.subtitle}>{periodoActual?.label ?? 'Cargando período...'} · {transacciones.length} movimientos</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btnGhost} ${styles.desktopOnly}`}
            onClick={handleExportar}
            disabled={filteredTransacciones.length === 0}
            title={filteredTransacciones.length === 0
              ? 'No hay transacciones para exportar'
              : 'Exportar PDF'}
          >
            <Download size={16} className={styles.btnIcon} />
            Exportar
          </button>
          <button 
            className={`${styles.btnGhost} ${activeTab === 'cuotas' ? styles.btnTabActive : ''} ${styles.desktopOnly}`} 
            onClick={() => setActiveTab(prev => prev === 'cuotas' ? 'historial' : 'cuotas')}
          >
            <CreditCard size={16} className={styles.btnIcon} />
            Cuotas
          </button>
          <button 
            className={styles.nuevaBtn}
            onClick={openNewTransaccion}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nueva<span className={styles.btnSuffix}> transacción</span>
          </button>
        </div>
      </div>

      {/* Switch de pestañas solo para mobile */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'historial' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'cuotas' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('cuotas')}
        >
          Cuotas
        </button>
      </div>

      {activeTab === 'historial' ? (
        <>
          {/* ── Mobile Split Strip Resumen (1 sola fila limpia y compacta) ── */}
          <div className={styles.mobileSplitStrip}>
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Balance</span>
              <span className={`${styles.splitValue} ${resumen.balance < 0 ? styles.colorRed : styles.colorGreen}`}>
                {resumen.balance < 0 ? '-' : '+'}{formatCurrency(Math.abs(resumen.balance))}
              </span>
            </div>
            <div className={styles.splitDivider} />
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Ingresos</span>
              <span className={`${styles.splitValue} ${styles.colorGreen}`}>
                +{formatCurrency(resumen.ingresos)}
              </span>
            </div>
            <div className={styles.splitDivider} />
            <div className={styles.splitItem}>
              <span className={styles.splitLabel}>Gastos</span>
              <span className={`${styles.splitValue} ${styles.colorRed}`}>
                -{formatCurrency(Math.abs(resumen.egresos))}
              </span>
            </div>
          </div>

          {/* ── Hero Resumen (Desktop) ────────────────────────────────────────── */}
          <PageSummaryBar
            className={styles.desktopSummaryBar}
            leftSlot={
              <div className={styles.balanceCicloSlot}>
                <span className={styles.balanceCicloLabel}>Balance del ciclo</span>
                <span
                  className={`${styles.balanceCicloValue} ${resumen.balance < 0 ? styles.balanceNegative : styles.balancePositive}`}
                >
                  {resumen.balance < 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(resumen.balance))}
                </span>
              </div>
            }
            items={[
              {
                label: "Ingresos",
                value: `+${formatCurrency(resumen.ingresos)}`,
                valueColor: '#4CAF7D',
              },
              {
                label: "Egresos",
                value: `-${formatCurrency(Math.abs(resumen.egresos))}`,
                valueColor: '#FF8A65',
              },
            ]}
          />

          {/* ── Filter Bar ───────────────────────────────────────────────────── */}
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onClear={handleClearFilters}
            billeteras={billeteras}
            categorias={categorias}
            hasActiveFilters={hasActiveFilters}
          />

          {/* ── Pendientes Banner ────────────────────────────────────────────── */}
          {pendientesIA.length > 0 && filters.estado_verificacion !== 'pendiente' && (
            <div className={styles.pendientesBanner}>
              <div className={styles.pendientesInfo}>
                <AlertCircle size={16} strokeWidth={2.5} />
                <span>{pendientesIA.length} transacc{pendientesIA.length > 1 ? 'iones' : 'ión'} pendiente{pendientesIA.length > 1 ? 's' : ''} de confirmación IA</span>
              </div>
              <button 
                className={styles.pendientesLink}
                onClick={handleViewPendientes}
              >
                Ver pendientes <ArrowRight size={14} className={styles.btnIcon} />
              </button>
            </div>
          )}

          {/* ── Lista ────────────────────────────────────────────────────────── */}
          <div className={styles.listContainer}>
            {loading || loadingPeriodo ? (
              <div className={styles.loadingState}>Cargando transacciones...</div>
            ) : grupos.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title={hasActiveFilters ? 'No se encontraron resultados' : 'Sin movimientos en este ciclo'}
                description={
                  hasActiveFilters 
                    ? 'No encontramos transacciones con esos filtros.' 
                    : 'Todavía no registraste ningún movimiento.'
                }
                actionLabel={hasActiveFilters ? 'Limpiar filtros' : 'Registrar primera transacción'}
                onActionClick={hasActiveFilters ? handleClearFilters : openNewTransaccion}
              />
            ) : (
              <>
                {grupos.map(([fecha, txs]) => (
                  <DayGroup
                    key={fecha}
                    fecha={fecha}
                    transacciones={txs}
                    categorias={categorias}
                    billeteras={billeteras}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Sentinel para IntersectionObserver */}
                <div ref={sentinelRef} style={{ height: 1, margin: 0, padding: 0 }} />

                {loadingMore && (
                  <div className={styles.loadingMore}>
                    <Loader2 size={16} className="animate-spin" />
                    Cargando más transacciones...
                  </div>
                )}

                {!hasMore && transacciones.length > 0 && (
                  <div className={styles.endOfList}>
                    Llegaste al final de las transacciones
                  </div>
                )}
              </>
            )}
          </div>

        </>
      ) : (
        <GruposCuotasTab />
      )}
    </div>
  )
}
