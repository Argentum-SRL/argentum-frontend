import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ArrowLeftRight, Download, AlertCircle, ArrowRight, CreditCard } from '@/components/ui/icons'
import { LunarLoader, TransactionsListSkeleton, Skeleton } from '@/components/ui'
import styles from './TransaccionesPage.module.css'
import transaccionService from '@/services/transaccion.service'
import movimientoService from '@/services/movimiento.service'
import type { FiltrosMovimientos } from '@/types'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import type { Transaccion, Billetera, Categoria, TarjetaCredito, MovimientoItem, TotalesMoneda } from '@/types'
import { formatMonto } from '@/utils/format'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import { getErrorMessage } from '@/utils/errorMessages'
import { usePeriodoActual } from '@/hooks/usePeriodoActual'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'

import FilterBar from '@/components/transacciones/FilterBar'
import DayGroup from '@/components/transacciones/DayGroup'
import GruposCuotasTab from '@/components/transacciones/GruposCuotasTab'
import { EmptyState, PageSummaryBar } from '@/components/ui'
import SegmentedControl from '@/components/ui/SegmentedControl'

const PAGE_SIZE = 50

export default function TransaccionesPage() {
  const { usuario } = useAuth()
  const { periodo: periodoActual, loading: loadingPeriodo } = usePeriodoActual()
  const { lastDataUpdate } = useNotificaciones()

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: 'historial' | 'cuotas' = searchParams.get('tab') === 'cuotas' ? 'cuotas' : 'historial'

  const setActiveTab = useCallback((tabOrFn: 'historial' | 'cuotas' | ((prev: 'historial' | 'cuotas') => 'historial' | 'cuotas')) => {
    setSearchParams(prev => {
      const currentTab = prev.get('tab') === 'cuotas' ? 'cuotas' : 'historial'
      const nextTab = typeof tabOrFn === 'function' ? tabOrFn(currentTab) : tabOrFn
      const next = new URLSearchParams(prev)
      if (nextTab === 'cuotas') {
        next.set('tab', 'cuotas')
      } else {
        next.delete('tab')
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const [cuotasRefreshTrigger, setCuotasRefreshTrigger] = useState(0)
  const [grupoInicialId, setGrupoInicialId] = useState<string | null>(null)
  
  const defaultFilters: FiltrosMovimientos = useMemo(() => ({
    tipo: undefined,
    moneda: undefined,
    fecha_desde: periodoActual?.fecha_inicio,
    fecha_hasta: periodoActual?.fecha_fin,
    billetera_id: undefined,
    categoria_id: undefined,
    estado_verificacion: undefined,
    busqueda: ''
  }), [periodoActual])

  const [filters, setFilters] = useState<FiltrosMovimientos>(defaultFilters)
  const mainCurrency = (filters?.moneda as 'ARS' | 'USD') || 'ARS'

  // Sincronizar filtros por defecto cuando el usuario cargue o cambie su ciclo
  const periodoKey = periodoActual ? `${periodoActual.fecha_inicio}_${periodoActual.fecha_fin}` : ''
  const [lastPeriodoKey, setLastPeriodoKey] = useState<string>('')
  if (periodoKey && periodoKey !== lastPeriodoKey) {
    setLastPeriodoKey(periodoKey)
    setFilters(defaultFilters)
  }
  
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>([])
  const [totalesServidor, setTotalesServidor] = useState<Record<string, TotalesMoneda>>({})
  const [totalItems, setTotalItems] = useState(0)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [pendientesIA, setPendientesIA] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { open, confirm } = useModal()

  const showMonedaFilter = useMemo(() => {
    return billeteras.some(b => b.moneda === 'USD') || movimientos.some(m => m.moneda === 'USD')
  }, [billeteras, movimientos])

  const hasActiveFilters = useMemo(() => Object.entries(filters).some(([k, v]) => {
    if (k === 'fecha_desde' || k === 'fecha_hasta') {
      return v !== defaultFilters[k as keyof FiltrosMovimientos]
    }
    if (Array.isArray(v)) {
      return v.length > 0
    }
    return v !== undefined && v !== ''
  }), [filters, defaultFilters])

  // Carga inicial (página 0)
  const fetchInitialMovimientos = useCallback(async (signal?: AbortSignal) => {
    try {
      const resp = await movimientoService.getMovimientos({
        ...filters,
        modo: 'general',
        skip: 0,
        limit: PAGE_SIZE
      }, signal)
      if (!signal?.aborted) {
        setMovimientos(resp.items)
        setTotalesServidor(resp.totales)
        setTotalItems(resp.total_items)
        setHasMore(resp.hay_mas)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      sileo.error({ title: getErrorMessage(err, 'No pudimos cargar los movimientos. Intentá de nuevo.') })
    }
  }, [filters])

  // Carga de siguientes páginas (scroll infinito)
  const loadMore = useCallback(async () => {
    if (loading || loadingPeriodo || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextResp = await movimientoService.getMovimientos({
        ...filters,
        modo: 'general',
        skip: movimientos.length,
        limit: PAGE_SIZE
      })
      setHasMore(nextResp.hay_mas)
      setTotalItems(nextResp.total_items)
      setTotalesServidor(nextResp.totales)
      setMovimientos(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const fresh = nextResp.items.filter(m => !existingIds.has(m.id))
        return [...prev, ...fresh]
      })
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      sileo.error({ title: getErrorMessage(err, 'No pudimos cargar más movimientos.') })
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingPeriodo, loadingMore, hasMore, filters, movimientos.length])

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
    setCuotasRefreshTrigger(prev => prev + 1)

    try {
      const [, , freshBilleteras] = await Promise.all([
        fetchInitialMovimientos(),
        fetchPendientes(),
        billeteraService.list(),
      ])
      setBilleteras(sortBilleteras(freshBilleteras.filter((w) => w.estado === 'activa'), usuario?.moneda_principal ?? 'ARS'))
    } finally {
      setLoading(false)
    }
  }, [fetchInitialMovimientos, fetchPendientes, usuario?.moneda_principal])

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
          setBilleteras(sortBilleteras(b.filter((w: Billetera) => w.estado === 'activa'), usuario?.moneda_principal ?? 'ARS'))
          setCategorias(c)
          setTarjetas(t)
        }
      } catch (err) {
        console.error('Error loading static data:', err)
      }
    }
    loadStatic()
    return () => { isMounted = false }
  }, [usuario?.moneda_principal])

  // 2. Carga de datos dinámicos (Cuando cambian los filtros y el período está listo)
  useEffect(() => {
    if (loadingPeriodo) return

    const controller = new AbortController()
    
    const loadDynamic = async () => {
      setLoading(true)
      setHasMore(true)
      try {
        await Promise.all([
          fetchInitialMovimientos(controller.signal),
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
  }, [loadingPeriodo, fetchInitialMovimientos, fetchPendientes])

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
    if (
      lastDataUpdate?.entidad === 'transacciones' ||
      lastDataUpdate?.entidad === 'cuotas' ||
      lastDataUpdate?.entidad === 'tarjetas'
    ) {
      const controller = new AbortController()
      const tid = setTimeout(() => {
        void fetchInitialMovimientos(controller.signal)
        void fetchPendientes(controller.signal)
        setCuotasRefreshTrigger(prev => prev + 1)
      }, 0)
      return () => {
        clearTimeout(tid)
        controller.abort()
      }
    }
  }, [loadingPeriodo, lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchInitialMovimientos, fetchPendientes])

  // 5. Escuchar evento global de transacciones creadas/modificadas localmente
  useEffect(() => {
    const handleTxCreated = () => {
      void refresh()
    }
    window.addEventListener('argentum:transaccion-creada', handleTxCreated)
    return () => window.removeEventListener('argentum:transaccion-creada', handleTxCreated)
  }, [refresh])

  // 6. Si la URL trae ?transaccion=<id>, abrir modal de edición y sacar el parámetro de la URL
  const paramTransaccionId = searchParams.get('transaccion')
  const handledTxRef = useRef<string | null>(null)

  useEffect(() => {
    if (!paramTransaccionId || handledTxRef.current === paramTransaccionId) return
    handledTxRef.current = paramTransaccionId

    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('transaccion')
      return next
    }, { replace: true })

    const fetchAndOpenTx = async () => {
      try {
        const tx = await transaccionService.getTransaccion(paramTransaccionId)
        if (tx) {
          const [b, c, t] = await Promise.all([
            billeteras.length > 0 ? Promise.resolve(billeteras) : billeteraService.list(),
            categorias.length > 0 ? Promise.resolve(categorias) : categoriaService.getCategorias(),
            tarjetas.length > 0 ? Promise.resolve(tarjetas) : tarjetaService.getTarjetas(),
          ])
          open('transaccion', {
            data: {
              transaccion: tx,
              billeteras: b,
              categorias: c,
              tarjetas: t,
              onSuccess: refresh,
            },
          })
        }
      } catch (err) {
        console.error('Error al abrir transacción desde URL:', err)
      }
    }

    void fetchAndOpenTx()
  }, [paramTransaccionId, setSearchParams, billeteras, categorias, tarjetas, open, refresh])

  const handleEdit = useCallback((id: string) => {
    // Si id viene como "transaccion:<uuid>" o "<uuid>"
    const rawId = id.includes(':') ? id.split(':')[1] : id
    const mov = movimientos.find(m => m.id === id || (m.transaccion && m.transaccion.id === rawId))
    const tx = mov?.transaccion || pendientesIA.find(t => t.id === rawId)
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
  }, [movimientos, pendientesIA, billeteras, categorias, tarjetas, open, refresh])

  const handleOpenCuotasGroup = useCallback((grupoId: string) => {
    setGrupoInicialId(grupoId)
    setActiveTab('cuotas')
  }, [setActiveTab])

  const handleDelete = useCallback((id: string) => {
    const rawId = id.includes(':') ? id.split(':')[1] : id
    const mov = movimientos.find(m => m.id === id || (m.transaccion && m.transaccion.id === rawId))
    const tx = mov?.transaccion || pendientesIA.find(t => t.id === rawId)
    if (!tx) return

    if (tx.es_cuota_hija) {
      confirm({
        title: '¿Eliminás esta cuota?',
        description: 'Se eliminará únicamente esta cuota pendiente. El resto del plan de cuotas se mantendrá intacto.',
        variant: 'danger',
        confirmLabel: 'Eliminar cuota',
        onConfirm: async () => {
          try {
            await transaccionService.deleteCuotaIndividual(rawId)
            sileo.success({ title: 'La cuota se eliminó correctamente.' })
            refresh()
          } catch (e) {
            console.error(e)
            sileo.error({ title: getErrorMessage(e, 'No pudimos eliminar la cuota. Intentá de nuevo.') })
          }
        },
      })
      return
    }

    confirm({
      title: '¿Eliminás esta transacción?',
      description: 'Se va a borrar para siempre y no hay forma de recuperarla.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(rawId)
          sileo.success({ title: 'La transacción se eliminó.' })
          refresh()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No pudimos eliminar la transacción. Intentá de nuevo.') })
        }
      },
    })
  }, [movimientos, pendientesIA, confirm, refresh])

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

  const filteredMovimientos = useMemo(() => {
    if (!filters.categoria_ids || filters.categoria_ids.length === 0) {
      return movimientos
    }
    return movimientos.filter(m => {
      const cid = m.transaccion?.categoria_id
      return cid && filters.categoria_ids?.includes(cid)
    })
  }, [movimientos, filters.categoria_ids])

  const grupos = useMemo(() => {
    const gruposObj: Record<string, MovimientoItem[]> = {}
    filteredMovimientos.forEach(mov => {
      const fecha = mov.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(mov)
    })
    return Object.entries(gruposObj).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredMovimientos])

  // Totales oficiales calculados por el servidor
  const totalesMonedaActiva = totalesServidor[mainCurrency] || { gastos: 0, ingresos: 0, balance: 0 }
  const totalIngresos = Number(totalesMonedaActiva.ingresos) || 0
  const totalGastos = Number(totalesMonedaActiva.gastos) || 0
  const balance = Number(totalesMonedaActiva.balance) || (totalIngresos - totalGastos)

  const formatCurrency = (monto: number) => formatMonto(Math.round(monto), mainCurrency)
  const resumen = useMemo(() => ({
    balance,
    ingresos: totalIngresos,
    gastos: totalGastos
  }), [balance, totalIngresos, totalGastos])

  const handleExportar = useCallback(async () => {
    try {
      // Pedir al servidor todos los ítems del filtro (limit 5000) y usar totales del servidor
      const allData = await movimientoService.getMovimientos({
        ...filters,
        modo: 'general',
        skip: 0,
        limit: 5000
      })
      const { exportarTransaccionesPDF } = await import('@/services/exportPdf.service')
      exportarTransaccionesPDF({
        movimientos: allData.items,
        totalesServidor: allData.totales,
        resumen: {
          totalIngresos: allData.totales[mainCurrency]?.ingresos ?? resumen.ingresos,
          totalEgresos: allData.totales[mainCurrency]?.gastos ?? resumen.gastos,
          balance: allData.totales[mainCurrency]?.balance ?? resumen.balance
        },
        filters: {
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
        },
        usuario
      })
    } catch (e) {
      console.error(e)
      sileo.error({ title: 'No pudimos armar el PDF. Intentá de nuevo.' })
    }
  }, [filters, mainCurrency, resumen, usuario])

  return (
    <div className={styles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Transacciones</h1>
          {loadingPeriodo || !periodoActual ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '18px', width: '100%', maxWidth: 220 }} aria-hidden="true">
              <Skeleton variant="text" width="55%" height={12} style={{ maxWidth: 110 }} />
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <Skeleton variant="text" width="40%" height={12} style={{ maxWidth: 75 }} />
            </div>
          ) : (
            <p className={styles.subtitle}>{periodoActual.label} · {loading ? '—' : `${totalItems} movimientos`}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btnGhost} ${styles.desktopOnly}`}
            onClick={handleExportar}
            disabled={filteredMovimientos.length === 0}
            title={filteredMovimientos.length === 0
              ? 'No hay movimientos para exportar'
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

      {/* Selector de pestañas oficial solo para mobile */}
      <SegmentedControl<'historial' | 'cuotas'>
        options={[
          { value: 'historial', label: 'Historial' },
          { value: 'cuotas', label: 'Cuotas' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        fullWidth
        ariaLabel="Secciones de transacciones"
        className={styles.tabsMobileOnly}
      />

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
              <span className={styles.splitLabel}>Egresos</span>
              <span className={`${styles.splitValue} ${styles.colorRed}`}>
                -{formatCurrency(Math.abs(resumen.gastos))}
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
                value: `-${formatCurrency(Math.abs(resumen.gastos))}`,
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
            showMonedaFilter={showMonedaFilter}
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
              <TransactionsListSkeleton groupsCount={2} rowsPerGroup={3} />
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
                {grupos.map(([fecha, movs]) => (
                  <DayGroup
                    key={fecha}
                    fecha={fecha}
                    movimientos={movs}
                    categorias={categorias}
                    billeteras={billeteras}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpenCuotasGroup={handleOpenCuotasGroup}
                    modo="general"
                  />
                ))}

                {/* Sentinel para IntersectionObserver */}
                <div ref={sentinelRef} style={{ height: 1, margin: 0, padding: 0 }} />

                {loadingMore && (
                  <div className={styles.loadingMore}>
                    <LunarLoader size={16} />
                    Cargando más movimientos...
                  </div>
                )}

                {!hasMore && movimientos.length > 0 && (
                  <div className={styles.endOfList}>
                    Llegaste al final de las transacciones
                  </div>
                )}
              </>
            )}
          </div>

        </>
      ) : (
        <GruposCuotasTab
          refreshTrigger={cuotasRefreshTrigger}
          onRefreshNeeded={refresh}
          onOpenNew={openNewTransaccion}
          grupoInicialId={grupoInicialId}
        />
      )}
    </div>
  )
}
