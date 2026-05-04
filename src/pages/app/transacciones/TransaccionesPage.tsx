import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { useFinancial } from '@/hooks/useFinancial'

import FilterBar from '@/components/transacciones/FilterBar'
import DayGroup from '@/components/transacciones/DayGroup'
import TransaccionDrawer from '@/components/transacciones/TransaccionDrawer'
import RecurrentesPage from './RecurrentesPage'

export default function TransaccionesPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()
  const { setBilleteras: setGlobalBilleteras } = useFinancial()

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

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null)

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
    if (k === 'fecha_desde' || k === 'fecha_hasta') {
      return v !== defaultFilters[k as keyof TransaccionFilters]
    }
    return v !== undefined && v !== ''
  })

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
      setGlobalBilleteras(b.map((d: Billetera) => ({
        ...d,
        saldo_actual: Number(d.saldo_actual),
        saldo_inicial: Number(d.saldo_inicial),
      })))
      setCategorias(c)
      await Promise.all([fetchTransacciones(), fetchPendientes()])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchTransacciones, fetchPendientes, setGlobalBilleteras])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchTransacciones()
  }, [filters, fetchTransacciones])



  const handleEdit = (id: string) => {
    const tx = transacciones.find(t => t.id === id) || pendientesIA.find(t => t.id === id)
    if (tx) {
      setSelectedTx(tx)
      setDrawerOpen(true)
    }
  }

  const openNewTransaccion = () => {
    setSelectedTx(null)
    setDrawerOpen(true)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
  }

  const agruparPorFecha = (txs: Transaccion[]) => {
    const grupos: Record<string, Transaccion[]> = {}
    txs.forEach(tx => {
      const fecha = tx.fecha.split('T')[0]
      if (!grupos[fecha]) grupos[fecha] = []
      grupos[fecha].push(tx)
    })
    return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]))
  }

  const grupos = agruparPorFecha(transacciones)

  // Calcular totales del período mostrado
  const totalIngresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + t.monto, 0)
  const totalEgresos = transacciones.filter(t => t.tipo === 'egreso').reduce((acc, t) => acc + t.monto, 0)
  const balance = totalIngresos - totalEgresos
  const mainCurrency = 'ARS' // Simplificado, idealmente viene de las preferencias

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
            <Download size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-3px' }} />
            Exportar
          </button>
          <button 
            className={styles.btnGhost} 
            onClick={() => setActiveTab(activeTab === 'historial' ? 'recurrentes' : 'historial')}
            style={{ background: activeTab === 'recurrentes' ? '#F5F4F0' : 'transparent' }}
          >
            <ArrowLeftRight size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-3px' }} />
            Recurrentes
          </button>
          <button 
            className={styles.btnGhost} 
            style={{ background: '#0D2045', color: 'white' }}
            onClick={openNewTransaccion}
          >
            <Plus size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: '-3px' }} />
            Nueva transacción
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
                    className={styles.heroBadgePending} 
                    style={{ border: 'none', cursor: 'pointer' }}
                    onClick={() => setFilters({ ...filters, estado_verificacion: 'pendiente' })}
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
                onClick={() => setFilters({ ...filters, estado_verificacion: 'pendiente' })}
              >
                Ver pendientes <ArrowRight size={14} style={{ display: 'inline-block', verticalAlign: '-3px' }} />
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
                    <button className={styles.btnGhost} style={{ background: '#F5F4F0' }} onClick={handleClearFilters}>Limpiar filtros</button>
                  </>
                ) : (
                  <>
                    <p>Todavía no registraste ninguna transacción este ciclo.</p>
                    <button className={styles.btnGhost} style={{ background: '#0D2045', color: 'white' }} onClick={openNewTransaccion}>Registrar primera transacción</button>
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
        <RecurrentesPage embedded />
      )}

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      <TransaccionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        transaccion={selectedTx}
        billeteras={billeteras}
        categorias={categorias}
        onSuccess={fetchData}
      />
    </div>
  )
}
