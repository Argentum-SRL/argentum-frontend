import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  Search, 
  ArrowUpDown, 
  Calendar, 
  RefreshCw, 
  CreditCard,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardResumen, CotizacionDolar, Proyeccion } from '@/types'
import ProyeccionCard from '@/components/dashboard/ProyeccionCard/ProyeccionCard'
import ProyeccionModal from '@/components/dashboard/ProyeccionModal/ProyeccionModal'
import { formatMonto, formatFecha } from '@/utils/format'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import styles from './DashboardPage.module.css'

// ── Components ───────────────────────────────────────────────────────────

const Greeting = ({ nombre }: { nombre: string | null }) => {
  const hour = new Date().getHours()
  let greeting = 'Buenas noches'
  if (hour >= 6 && hour < 12) greeting = 'Buenos días'
  else if (hour >= 12 && hour < 20) greeting = 'Buenas tardes'

  return (
    <div className={styles.headerLeft}>
      <h1 className={styles.greeting}>
        {greeting}{nombre ? `, ${nombre}` : ''}
      </h1>
      <p className={styles.subtitle}>Tu panorama financiero</p>
    </div>
  )
}

const BalanceSkeleton = () => (
  <div className={`${styles.skeleton} ${styles.skeletonBalance}`} />
)

const ListSkeleton = () => (
  <div className={styles.list}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={styles.skeletonRow}>
        <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
        <div className={styles.skeletonLines}>
          <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonWidth60}`} />
          <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonWidth40}`} />
        </div>
      </div>
    ))}
  </div>
)

const Cotizacion = () => {
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getCotizacion()
      .then(setCotizacion)
      .catch(() => {}) // Ignorar error segun requerimiento
      .finally(() => setLoading(false))
  }, [])

  if (loading || !cotizacion) return null

  return (
    <div className={styles.cotizacion}>
      <span className={styles.cotLabel}>USD {cotizacion.tipo}:</span>
      <span className={styles.cotValue}>{formatMonto(cotizacion.venta || 0, 'ARS').replace('ARS', '').trim()}</span>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [customRange, setCustomRange] = useState<{desde: string, hasta: string} | null>(null)
  const [proyeccion, setProyeccion] = useState<Proyeccion | null>(null)
  const [loadingProyeccion, setLoadingProyeccion] = useState(true)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isProyeccionModalOpen, setIsProyeccionModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setError(false)
    setLoading(true)
    try {
      const res = await dashboardService.getResumen(customRange?.desde, customRange?.hasta)
      setData(res)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [customRange])

  const fetchProyeccion = useCallback(async () => {
    try {
      setLoadingProyeccion(true)
      const res = await dashboardService.getProyeccion()
      setProyeccion(res)
    } catch (err) {
      console.error('Error loading proyeccion:', err)
    } finally {
      setLoadingProyeccion(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
      fetchProyeccion()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData, fetchProyeccion])



  const handleResetPeriod = () => {
    setCustomRange(null)
  }

  const handleCustomRangeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const desde = formData.get('desde') as string
    const hasta = formData.get('hasta') as string
    if (desde && hasta) {
      setCustomRange({ desde, hasta })
      setIsDatePickerOpen(false)
    }
  }

  if (error) {
    return (
      <div className={styles.root}>
        <Greeting nombre={usuario?.nombre ?? null} />
        <div className={styles.errorState}>
          <AlertCircle size={48} color="var(--error)" />
          <p>No pudimos cargar tu resumen. Intenta de nuevo.</p>
          <button className={styles.retryBtn} onClick={() => { setLoading(true); fetchData(); }}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Greeting nombre={usuario?.nombre ?? null} />
          {data && (
            <div className={styles.headerInfo}>
              <div className={styles.cycleNavigation}>
                <div className={styles.dateSelectorWrap}>
                  <span className={styles.cycleDates} onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    {formatFecha(data.periodo.fecha_inicio)} — {formatFecha(data.periodo.fecha_fin)}
                  </span>
                  {isDatePickerOpen && (
                    <div className={styles.datePickerPopover}>
                      <form onSubmit={handleCustomRangeSubmit}>
                        <div className={styles.popoverField}>
                          <label htmlFor="dash-desde">Desde</label>
                          <input id="dash-desde" name="desde" type="date" defaultValue={data.periodo.fecha_inicio} required />
                        </div>
                        <div className={styles.popoverField}>
                          <label htmlFor="dash-hasta">Hasta</label>
                          <input id="dash-hasta" name="hasta" type="date" defaultValue={data.periodo.fecha_fin} required />
                        </div>
                        <div className={styles.popoverActions}>
                          <button type="button" className={styles.popoverReset} onClick={handleResetPeriod}>Mi Ciclo</button>
                          <button type="submit" className={styles.popoverApply}>Aplicar</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
              <Cotizacion />
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} aria-label="Notificaciones">
            <Bell size={20} />
          </button>
          <button className={styles.actionBtn} aria-label="Buscar">
            <Search size={20} />
          </button>
        </div>
      </header>

      {/* Balance Card */}
      {loading ? (
        <BalanceSkeleton />
      ) : (
        data && (
          <div className={styles.balanceCard}>
            <div className={styles.balanceContent}>
              <div className={styles.balanceMain}>
                <div className={styles.labelWithHint}>
                  <span className={styles.balanceLabel}>Balance del ciclo</span>
                  <div className={styles.hint} title="Es la diferencia entre lo que entró y salió de tu cuenta solo en este período.">
                    <AlertCircle size={14} />
                  </div>
                </div>
                <h2 className={styles.balanceAmount}>{formatMonto(data.balance.balance, 'ARS')}</h2>
                <div className={styles.balanceBreakdown}>
                  <div className={styles.breakdownItem}>
                    <TrendingUp size={14} className={styles.iconPos} />
                    <span>{formatMonto(data.balance.ingresos, 'ARS')}</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <TrendingDown size={14} className={styles.iconNeg} />
                    <span>{formatMonto(data.balance.egresos, 'ARS')}</span>
                  </div>
                </div>
                {data.balance.variacion_vs_ciclo_anterior !== null && (
                  <div className={`${styles.variationBadge} ${data.balance.variacion_vs_ciclo_anterior >= 0 ? styles.positive : styles.negative}`}>
                    {data.balance.variacion_vs_ciclo_anterior >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                      {data.balance.variacion_vs_ciclo_anterior >= 0 ? '+' : ''}
                      {data.balance.variacion_vs_ciclo_anterior}% vs ciclo ant.
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.balanceSecondary}>
                <div className={styles.secMetric}>
                  <div className={styles.labelWithHint}>
                    <span className={styles.secLabel}>Disponible real</span>
                    <div className={styles.hint} title="Tu plata total en billeteras menos las cuotas que tenés que pagar el mes que viene.">
                      <AlertCircle size={12} />
                    </div>
                  </div>
                  <span className={styles.secValue}>{formatMonto(data.disponible_real.disponible, 'ARS')}</span>
                </div>
                <div className={styles.secMetric}>
                  <div className={styles.labelWithHint} onClick={() => proyeccion && setIsProyeccionModalOpen(true)}>
                    <span className={styles.secLabel}>Proyección cierre</span>
                    {proyeccion && (
                      <div className={`${styles.confianzaDot} ${styles[proyeccion.nivel_confianza]}`} />
                    )}
                    {proyeccion && proyeccion.advertencias.length > 0 && (
                      <AlertCircle size={14} color="#f59e0b" style={{ marginLeft: '4px' }} />
                    )}
                  </div>
                  <span className={styles.secValue}>
                    {loadingProyeccion ? 'Calculando...' : proyeccion ? formatMonto(proyeccion.gasto_proyectado_total, 'ARS') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}


      {/* Grid */}
      <div className={styles.dashboardGrid}>
        {/* Ultimos Movimientos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Últimos movimientos</h3>
            <Link to="/app/transacciones" className={styles.seeAll}>
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.cardContent}>
            {loading ? (
              <ListSkeleton />
            ) : data?.ultimos_movimientos.length === 0 ? (
              <div className={styles.emptyState}>
                <ArrowUpDown size={40} className={styles.emptyIcon} />
                <p>Sin movimientos en este ciclo</p>
              </div>
            ) : (
              <div className={styles.list}>
                {data?.ultimos_movimientos.map((m) => {
                  return (
                    <div key={m.id} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        <CategoriaIcon nombre={m.categoria_nombre || ''} size={32} />
                      </div>
                      <div className={styles.itemMeta}>
                        <p className={styles.itemName}>{m.descripcion}</p>
                        <p className={styles.itemSub}>
                          {formatFecha(m.fecha)} • {m.billetera_nombre}
                        </p>
                        {m.estado_verificacion === 'pendiente' && (
                          <span className={styles.pendingBadge}>Pendiente IA</span>
                        )}
                      </div>
                      <div className={`${styles.itemAmount} ${m.tipo === 'ingreso' ? styles.amountPos : styles.amountNeg}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'}{formatMonto(m.monto, 'ARS')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Proximos Pagos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Próximos pagos</h3>
            <Link to="/app/suscripciones" className={styles.seeAll}>
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <div className={styles.cardContent}>
            {loading ? (
              <ListSkeleton />
            ) : data?.proximos_pagos.length === 0 ? (
              <div className={styles.emptyState}>
                <Calendar size={40} className={styles.emptyIcon} />
                <p>Sin pagos próximos</p>
              </div>
            ) : (
              <div className={styles.list}>
                {data?.proximos_pagos.map((p) => {
                  const isUrgente = p.dias_restantes <= 1
                  let fechaTxt = formatFecha(p.fecha_cobro)
                  if (p.dias_restantes === 0) fechaTxt = 'Hoy'
                  else if (p.dias_restantes === 1) fechaTxt = 'Mañana'
                  else if (p.dias_restantes <= 7) fechaTxt = `En ${p.dias_restantes} días`

                  return (
                    <div key={p.id} className={styles.listItem}>
                      <div className={styles.itemIcon}>
                        {p.tipo === 'suscripcion' ? <RefreshCw size={20} /> : <CreditCard size={20} />}
                      </div>
                      <div className={styles.itemMeta}>
                        <p className={styles.itemName}>{p.nombre}</p>
                        <p className={styles.itemSub}>{fechaTxt}</p>
                      </div>
                      <div className={styles.pagoRight}>
                        <div className={styles.itemAmount}>{formatMonto(p.monto, 'ARS')}</div>
                        {isUrgente && <span className={styles.urgentBadge}>Urgente</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projection Card (Only shown if on current cycle) */}
      {!customRange && (
        <div className={styles.proyeccionSection}>
          <ProyeccionCard />
        </div>
      )}

      {proyeccion && (
        <ProyeccionModal 
          isOpen={isProyeccionModalOpen}
          onClose={() => setIsProyeccionModalOpen(false)}
          proyeccion={proyeccion}
        />
      )}
    </div>
  )
}
