import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, ArrowLeftRight, Download, AlertCircle, ArrowRight, CreditCard, RefreshCw } from 'lucide-react'
import styles from './TransaccionesPage.module.css'
import transaccionService from '@/services/transaccion.service'
import type { TransaccionFilters } from '@/services/transaccion.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import { exportarTransaccionesPDF } from '@/services/exportPdf.service'
import type { Transaccion, Billetera, Categoria, TarjetaCredito } from '@/types'
import { formatMonto } from '@/utils/format'
import { calcularPeriodoActual } from '@/lib/utils/ciclo'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'

import FilterBar from '@/components/transacciones/FilterBar'
import DayGroup from '@/components/transacciones/DayGroup'
import RecurrentesPage, { type RecurrentesPageRef } from './RecurrentesPage'
import GruposCuotasTab from '@/components/transacciones/GruposCuotasTab'
import { EmptyState, PageSummaryBar } from '@/components/ui'

export default function TransaccionesPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'historial' | 'recurrentes' | 'cuotas'>('historial')
  const mainCurrency = 'ARS' // Moneda base para el resumen
  
  const periodoActual = useMemo(() => calcularPeriodoActual(usuario), [usuario])

  const defaultFilters: TransaccionFilters = useMemo(() => ({
    tipo: undefined,
    moneda: undefined,
    fecha_desde: periodoActual.inicio.toISOString().split('T')[0],
    fecha_hasta: periodoActual.fin.toISOString().split('T')[0],
    billetera_id: undefined,
    categoria_id: undefined,
    estado_verificacion: undefined,
    busqueda: ''
  }), [periodoActual])

  const [filters, setFilters] = useState<TransaccionFilters>(defaultFilters)
  
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [pendientesIA, setPendientesIA] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)

  const { open, confirm } = useModal()
  const recurrentesRef = useRef<RecurrentesPageRef>(null)

  const hasActiveFilters = useMemo(() => Object.entries(filters).some(([k, v]) => {
    if (k === 'fecha_desde' || k === 'fecha_hasta') {
      return v !== defaultFilters[k as keyof TransaccionFilters]
    }
    return v !== undefined && v !== ''
  }), [filters, defaultFilters])

  const fetchTransacciones = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await transaccionService.getTransacciones(filters, signal)
      if (!signal?.aborted) {
        setTransacciones(data)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      showToast('Error al cargar transacciones', 'error')
    }
  }, [filters, showToast])

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
        fetchTransacciones(),
        fetchPendientes(),
        billeteraService.list(),
      ])
      setBilleteras(freshBilleteras.filter((w) => w.estado === 'activa'))
    } finally {
      setLoading(false)
    }
  }, [fetchTransacciones, fetchPendientes])

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

  // 2. Carga de datos dinámicos (Cuando cambian los filtros)
  useEffect(() => {
    const controller = new AbortController()
    
    const loadDynamic = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchTransacciones(controller.signal),
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
  }, [fetchTransacciones, fetchPendientes])

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
      title: 'Eliminar transacción',
      description: '¿Estás seguro de que querés eliminar esta transacción? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(id)
          showToast('Transacción eliminada', 'success')
          refresh()
        } catch (e) {
          console.error(e)
          showToast('Error al eliminar la transacción', 'error')
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



  const openNewRecurrente = useCallback(() => {
    recurrentesRef.current?.openNew()
  }, [])

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

  const formatCurrency = (monto: number) => formatMonto(monto, 'ARS')
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
          <p className={styles.subtitle}>{periodoActual.label} · {transacciones.length} movimientos</p>
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
            className={`${styles.btnGhost} ${activeTab === 'recurrentes' ? styles.btnTabActive : ''} ${styles.desktopOnly}`} 
            onClick={() => setActiveTab('recurrentes')}
          >
            <RefreshCw size={16} className={styles.btnIcon} />
            Recurrentes
          </button>
          <button 
            className={`${styles.btnGhost} ${activeTab === 'cuotas' ? styles.btnTabActive : ''} ${styles.desktopOnly}`} 
            onClick={() => setActiveTab('cuotas')}
          >
            <CreditCard size={16} className={styles.btnIcon} />
            Cuotas
          </button>
          <button 
            className={styles.nuevaBtn}
            onClick={activeTab === 'recurrentes' ? openNewRecurrente : openNewTransaccion}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nueva<span className={styles.btnSuffix}>{activeTab === 'recurrentes' ? ' recurrente' : ' transacción'}</span>
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
          className={`${styles.tabBtn} ${activeTab === 'recurrentes' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('recurrentes')}
        >
          Recurrentes
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
          {/* ── Hero Resumen ───────────────────────────────────────────────────── */}
          <PageSummaryBar
            className={styles.summaryBar}
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
            {loading ? (
              <div className={styles.loadingState}>Cargando transacciones...</div>
            ) : grupos.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title={hasActiveFilters ? 'No se encontraron resultados' : 'Sin movimientos en este ciclo'}
                description={
                  hasActiveFilters 
                    ? 'No encontramos transacciones con esos filtros.' 
                    : 'Todavía no registraste ninguna transacción este ciclo.'
                }
                actionLabel={hasActiveFilters ? 'Limpiar filtros' : 'Registrar primera transacción'}
                onActionClick={hasActiveFilters ? handleClearFilters : openNewTransaccion}
              />
            ) : (
              grupos.map(([fecha, txs]) => (
                <DayGroup
                  key={fecha}
                  fecha={fecha}
                  transacciones={txs}
                  categorias={categorias}
                  billeteras={billeteras}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      ) : activeTab === 'recurrentes' ? (
        <div className={styles.recurrentesWrapper}>
          <RecurrentesPage ref={recurrentesRef} embedded />
        </div>
      ) : (
        <GruposCuotasTab />
      )}
    </div>
  )
}
