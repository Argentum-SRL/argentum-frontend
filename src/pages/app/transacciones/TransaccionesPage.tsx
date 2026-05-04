import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, ArrowLeftRight, Download, AlertCircle, ArrowRight } from 'lucide-react'
import styles from './TransaccionesPage.module.css'
import transaccionService from '@/services/transaccion.service'
import type { TransaccionFilters } from '@/services/transaccion.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import type { Transaccion, Billetera, Categoria } from '@/types'
import { formatMonto } from '@/utils/format'
import { calcularPeriodoActual } from '@/lib/utils/ciclo'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'

import FilterBar from '@/components/transacciones/FilterBar'
import DayGroup from '@/components/transacciones/DayGroup'
import RecurrentesPage, { type RecurrentesPageRef } from './RecurrentesPage'

export default function TransaccionesPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'historial' | 'recurrentes'>('historial')

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
  const [pendientesIA, setPendientesIA] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)

  const { open } = useModal()
  const recurrentesRef = useRef<RecurrentesPageRef>(null)

  const hasActiveFilters = useMemo(() => Object.entries(filters).some(([k, v]) => {
    if (k === 'fecha_desde' || k === 'fecha_hasta') {
      return v !== defaultFilters[k as keyof TransaccionFilters]
    }
    return v !== undefined && v !== ''
  }), [filters, defaultFilters])

  const fetchTransacciones = useCallback(async () => {
    try {
      const data = await transaccionService.getTransacciones(filters)
      setTransacciones(data)
    } catch (err) {
      console.error(err)
      showToast('Error al cargar transacciones', 'error')
    }
  }, [filters, showToast])

  const fetchPendientes = useCallback(async () => {
    try {
      const data = await transaccionService.getPendientesIA()
      setPendientesIA(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [b, c] = await Promise.all([
        billeteraService.list(),
        categoriaService.getCategorias()
      ])
      setBilleteras(b.filter((w: Billetera) => w.estado === 'activa'))
      setCategorias(c)
      await Promise.all([fetchTransacciones(), fetchPendientes()])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchTransacciones, fetchPendientes])

  useEffect(() => {
    const tid = setTimeout(() => {
      void fetchData()
    }, 0)
    return () => clearTimeout(tid)
  }, [fetchData])

  useEffect(() => {
    const tid = setTimeout(() => {
      void fetchTransacciones()
    }, 0)
    return () => clearTimeout(tid)
  }, [filters, fetchTransacciones])

  const handleEdit = useCallback((id: string) => {
    const tx = transacciones.find(t => t.id === id) || pendientesIA.find(t => t.id === id)
    if (tx) {
      open('transaccion', {
        data: {
          transaccion: tx,
          billeteras,
          categorias,
          onSuccess: fetchData,
        },
      })
    }
  }, [transacciones, pendientesIA, billeteras, categorias, open, fetchData])

  const openNewTransaccion = useCallback(() => {
    open('transaccion', {
      data: {
        transaccion: null,
        billeteras,
        categorias,
        onSuccess: fetchData,
      },
    })
  }, [billeteras, categorias, open, fetchData])

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [defaultFilters])

  const toggleTab = useCallback(() => {
    setActiveTab(prev => prev === 'historial' ? 'recurrentes' : 'historial')
  }, [])

  const openNewRecurrente = useCallback(() => {
    recurrentesRef.current?.openNew()
  }, [])

  const handleViewPendientes = useCallback(() => {
    setFilters(prev => ({ ...prev, estado_verificacion: 'pendiente' }))
  }, [])

  const grupos = useMemo(() => {
    const gruposObj: Record<string, Transaccion[]> = {}
    transacciones.forEach(tx => {
      const fecha = tx.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(tx)
    })
    return Object.entries(gruposObj).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transacciones])

  const { totalIngresos, totalEgresos, balance } = useMemo(() => {
    let ingresos = 0
    let egresos = 0
    transacciones.forEach(t => {
      if (t.tipo === 'ingreso') ingresos += t.monto
      else egresos += t.monto
    })
    return {
      totalIngresos: ingresos,
      totalEgresos: egresos,
      balance: ingresos - egresos
    }
  }, [transacciones])

  const mainCurrency = 'ARS' // Simplificado

  return (
    <div className={styles.page}>
      
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Transacciones</h1>
          <p className={styles.subtitle}>{periodoActual.label} · {transacciones.length} movimientos</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnGhost} title="Próximamente">
            <Download size={16} className={styles.btnIcon} />
            Exportar
          </button>
          <button 
            className={`${styles.btnGhost} ${activeTab === 'recurrentes' ? styles.btnTabActive : ''}`} 
            onClick={toggleTab}
          >
            <ArrowLeftRight size={16} className={styles.btnIcon} />
            Recurrentes
          </button>
          <button 
            className={`${styles.btnGhost} ${styles.btnPrimary}`}
            onClick={activeTab === 'historial' ? openNewTransaccion : openNewRecurrente}
          >
            <Plus size={16} className={styles.btnIcon} />
            {activeTab === 'historial' ? 'Nueva transacción' : 'Nueva recurrente'}
          </button>
        </div>
      </div>

      {activeTab === 'historial' ? (
        <>
          {/* ── Hero Resumen ───────────────────────────────────────────────────── */}
          <div className={styles.heroResumen}>
            <div className={styles.heroMain}>
              <span className={styles.heroLabel}>Balance del ciclo</span>
              <h2 className={styles.heroBalance}>{formatMonto(balance, mainCurrency)}</h2>
            </div>
            <div className={styles.heroGrid}>
              <div className={styles.heroMetric}>
                <span className={styles.heroLabel}>Ingresos</span>
                <span className={styles.heroValueIngreso}>+{formatMonto(totalIngresos, mainCurrency)}</span>
              </div>
              <div className={styles.heroMetric}>
                <span className={styles.heroLabel}>Egresos</span>
                <span className={styles.heroValueEgreso}>-{formatMonto(totalEgresos, mainCurrency)}</span>
              </div>
              {pendientesIA.length > 0 && (
                <div className={styles.heroMetric}>
                  <span className={styles.heroLabel}>Pendientes IA</span>
                  <button 
                    className={`${styles.heroBadgePending} ${styles.heroBadgeBtn}`} 
                    onClick={handleViewPendientes}
                  >
                    {pendientesIA.length} sin revisar
                  </button>
                </div>
              )}
            </div>
          </div>

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
          <div>
            {loading ? (
              <div className={styles.loadingState}>Cargando transacciones...</div>
            ) : grupos.length === 0 ? (
              <div className={styles.emptyState}>
                {hasActiveFilters ? (
                  <>
                    <p>No encontramos transacciones con esos filtros.</p>
                    <button className={`${styles.btnGhost} ${styles.btnGhostBg}`} onClick={handleClearFilters}>Limpiar filtros</button>
                  </>
                ) : (
                  <>
                    <p>Todavía no registraste ninguna transacción este ciclo.</p>
                    <button className={`${styles.btnGhost} ${styles.btnPrimary}`} onClick={openNewTransaccion}>Registrar primera transacción</button>
                  </>
                )}
              </div>
            ) : (
              grupos.map(([fecha, txs]) => (
                <DayGroup
                  key={fecha}
                  fecha={fecha}
                  transacciones={txs}
                  categorias={categorias}
                  billeteras={billeteras}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <RecurrentesPage ref={recurrentesRef} embedded />
      )}
    </div>
  )
}
