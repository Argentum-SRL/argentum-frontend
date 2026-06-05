import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowUpDown, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PieChart as PieChartIcon,
  LogOut,
  User,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardResumen, Proyeccion, ProyeccionCategoria, Usuario } from '@/types'
import ProyeccionCard from '@/components/dashboard/ProyeccionCard/ProyeccionCard'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'

import styles from './DashboardPage.module.css'

// ── Formatter ────────────────────────────────────────────────────────────

const fmt = (n: number, moneda: 'ARS' | 'USD' = 'ARS') => {
  const abs = Math.abs(n)
  const [int, dec] = abs.toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const monto = dec === '00' ? intFmt : `${intFmt},${dec}`
  const signo = n < 0 ? '-' : ''
  return moneda === 'USD' ? `${signo}USD $ ${monto}` : `${signo}$ ${monto}`
}

// ── Components ───────────────────────────────────────────────────────────

const PHRASES = [
  "Mantenete al tanto de tus tareas, monitoreá el progreso y seguí tu estado.",
  "Gestioná tu dinero de forma inteligente y alcanzá tus metas.",
  "Revisá tus últimos movimientos y proyectá tu balance mensual.",
  "Simplificá tus finanzas y tomá mejores decisiones todos los días.",
  "Llevá el control de tus consumos y optimizá tus pagos."
]

const Greeting = memo(({ nombre }: { nombre: string | null }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const phrase = useMemo(() => {
    if (!nombre) return PHRASES[0]
    let hash = 0
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % PHRASES.length
    return PHRASES[index]
  }, [nombre])

  return (
    <div className={styles.headerLeft}>
      <h1 className={styles.greeting}>
        {greeting}{nombre ? `, ${nombre}` : ''}
      </h1>
      <p className={styles.subtitle}>{phrase}</p>
    </div>
  )
})
Greeting.displayName = 'Greeting'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MobileGreeting = memo(({ usuario }: { usuario: Usuario | null }) => {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [fotoError, setFotoError] = useState(false)
  const [prevFotoUrl, setPrevFotoUrl] = useState(usuario?.foto_url)

  if (usuario?.foto_url !== prevFotoUrl) {
    setPrevFotoUrl(usuario?.foto_url)
    setFotoError(false)
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])
  
  const inicial = usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'U'
  const fotoUrl = usuario?.foto_url ? (usuario.foto_url.startsWith('http') ? usuario.foto_url : `${API_URL}${usuario.foto_url}`) : null

  return (
    <>
      <div className={styles.mobileGreetingWrap}>
        <div className={styles.mobileGreetingText}>
          <span className={styles.mobileGreetingSubtitle}>{greeting},</span>
          <span className={styles.mobileGreetingName}>{usuario?.nombre}</span>
        </div>
        <button 
          className={styles.mobileAvatarBtn} 
          onClick={() => setIsMenuOpen(true)}
          aria-label="Menú de perfil"
        >
          <div className={styles.mobileAvatar}>
            {fotoUrl && !fotoError ? <img src={fotoUrl} alt="avatar" onError={() => setFotoError(true)} /> : <span>{inicial}</span>}
          </div>
        </button>
      </div>

      {isMenuOpen && createPortal(
        <>
          <div className={styles.profileOverlay} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.profileSheet}>
            <div className={styles.profileSheetTitle}>Mi Cuenta</div>
            
            <button 
              className={styles.profileSheetItem}
              onClick={() => {
                setIsMenuOpen(false)
                navigate('/app/perfil')
              }}
            >
              <User size={18} />
              <span>Editar Perfil</span>
            </button>

            <button 
              className={styles.profileSheetItem}
              onClick={() => {
                toggleTheme()
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>Cambiar a Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </button>

            <button 
              className={`${styles.profileSheetItem} ${styles.profileSheetItemDanger}`}
              onClick={() => {
                setIsMenuOpen(false)
                void logout()
              }}
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
})
MobileGreeting.displayName = 'MobileGreeting'

const BalanceSkeleton = memo(() => (
  <div className={`${styles.skeleton} ${styles.skeletonBalance}`} />
))
BalanceSkeleton.displayName = 'BalanceSkeleton'

const ListSkeleton = memo(() => (
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
))
ListSkeleton.displayName = 'ListSkeleton'

const COLORES_CATEGORIA: Record<string, string> = {
  'Alimentación':               '#F97316',  // Naranja
  'Transporte':                 '#166534',  // Verde oscuro
  'Salud y cuidado personal':   '#4ADE80',  // Verde claro
  'Ropa e indumentaria':        '#38BDF8',  // Celeste
  'Educación':                  '#DC2626',  // Rojo
  'Vivienda':                   '#3B82F6',  // Azul
  'Banco':                      '#6B7280',  // Gris
  'Mascotas':                   '#92400E',  // Marrón
  'Regalos':                    '#F472B6',  // Rosa
  'Entretenimiento y salidas':  '#F87171',  // Rojo claro
  'Servicios digitales':        '#A78BFA',  // Violeta (fallback elegante)
}

const DEFAULT_COLOR = '#8A95A8'

const CategoriasChart = memo(({ data, showPercent }: { data: ProyeccionCategoria[], showPercent: boolean }) => {
  const chartData = useMemo(() => {
    return data
      .filter(c => c.gasto_actual_ciclo > 0)
      .sort((a, b) => b.gasto_actual_ciclo - a.gasto_actual_ciclo)
      .slice(0, 6)
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <div className={styles.emptyState}>
        <PieChartIcon size={40} className={styles.emptyIcon} />
        <p>Sin gastos por ahora</p>
      </div>
    )
  }

  const maxVal = chartData[0]?.gasto_actual_ciclo || 0
  const total = chartData.reduce((acc, curr) => acc + curr.gasto_actual_ciclo, 0)

  return (
    <div className={styles.barChartWrap}>
      {chartData.map((entry) => {
        const pct = total > 0 ? Math.round((entry.gasto_actual_ciclo / total) * 100) : 0
        const fillPct = maxVal > 0 ? (entry.gasto_actual_ciclo / maxVal) * 100 : 0
        const color = COLORES_CATEGORIA[entry.categoria_nombre] ?? DEFAULT_COLOR
        
        return (
          <div key={entry.categoria_id} className={styles.barItem}>
            <div className={styles.barIconWrap}>
              <SubcategoriaIcon nombre="" parentCategory={entry.categoria_nombre} size={32} />
            </div>
            <div className={styles.barContent}>
              <div className={styles.barHeader}>
                <span className={styles.barName}>{entry.categoria_nombre}</span>
                <span className={styles.barAmount}>
                  {showPercent ? `${pct}%` : fmt(entry.gasto_actual_ciclo, 'ARS')}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div 
                  className={styles.barFill} 
                  ref={el => {
                    if (el) {
                      el.style.width = `${fillPct}%`
                      el.style.background = color || 'var(--text-3)'
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
CategoriasChart.displayName = 'CategoriasChart'

const AppleCalendarIcon = memo(({ dateStr }: { dateStr: string }) => {
  const parts = dateStr.split('-')
  let date = new Date()
  if (parts.length === 3) {
    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }

  const month = date.toLocaleString('es-AR', { month: 'short' }).toUpperCase().replace('.', '')
  const day = date.getDate()

  return (
    <div className={styles.appleCalendar}>
      <div className={styles.appleCalendarMonth}>{month}</div>
      <div className={styles.appleCalendarDay}>{day}</div>
    </div>
  )
})
AppleCalendarIcon.displayName = 'AppleCalendarIcon'

// ── Main Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const customRange = null
  const [proyeccion, setProyeccion] = useState<Proyeccion | null>(null)
  const [loadingProyeccion, setLoadingProyeccion] = useState(true)
  const [showChartPercent, setShowChartPercent] = useState(false)

  const fetchData = useCallback(async () => {
    // Evitar setState sincrónico en useEffect
    await Promise.resolve()
    setError(false)
    setLoading(true)
    try {
      // Endpoint consolidado: trae resumen, billeteras y cotización
      const res = await dashboardService.getResumenCompleto(undefined, undefined)
      setData(res.resumen)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProyeccion = useCallback(async () => {
    // Evitar setState sincrónico en useEffect
    await Promise.resolve()
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
    let ignore = false

    const load = async () => {
      // Esperar un microtask para asegurar ejecución fuera del ciclo de renderizado sincrónico
      await Promise.resolve()
      if (ignore) return

      void fetchData()
      if (!customRange) {
        void fetchProyeccion()
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [fetchData, fetchProyeccion])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className={styles.root}>
        <Greeting nombre={usuario?.nombre ?? null} />
        <div className={styles.errorState}>
          <AlertCircle size={48} color="var(--error)" />
          <p>No pudimos cargar tu resumen. Intenta de nuevo.</p>
          <button className={styles.retryBtn} onClick={handleRetry}>Reintentar</button>
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
        </div>
      </header>

      {/* ── Top Row (3 Cols) ──────────────────────────────────────────────── */}
      <div className={styles.topRow}>
        {/* Col 1: Balance */}
        {loading ? (
          <BalanceSkeleton />
        ) : (
          data && (
            <div className={styles.balanceCard}>
              {/* Luna Argentum Watermark */}
              <svg
                viewBox="0 0 100 100"
                className={styles.lunaWatermark}
              >
                <circle cx="50" cy="50" r="48" fill="#8A95A8"/>
                <circle cx="58" cy="50" r="38" fill="#0D2045"/>
              </svg>

              <div className={styles.balanceContent}>
                <MobileGreeting usuario={usuario} />
                <div className={styles.balanceMain}>
                  {/* Top section */}
                  <div className={styles.balanceTop}>
                    <div className={styles.labelWithHint}>
                      <span className={styles.balanceLabel}>Balance del ciclo</span>
                      <div className={styles.hint} title="Es la diferencia entre lo que entró y salió de tu cuenta solo en este período.">
                        <AlertCircle size={14} />
                      </div>
                    </div>

                    <h2 className={styles.balanceAmount}>{fmt(data.balance.balance, 'ARS')}</h2>

                    <div className={styles.balanceBreakdown}>
                      <div className={`${styles.badge} ${styles.pos}`}>
                        <TrendingUp size={16} />
                        <span>{fmt(data.balance.ingresos, 'ARS')}</span>
                      </div>
                      <div className={`${styles.badge} ${styles.neg}`}>
                        <TrendingDown size={16} />
                        <span>{fmt(data.balance.egresos, 'ARS')}</span>
                      </div>
                    </div>

                    {data.balance.variacion_vs_ciclo_anterior !== null && (
                      <div className={`${styles.variationBadge} ${data.balance.variacion_vs_ciclo_anterior >= 0 ? styles.positive : styles.negative}`}>
                        {data.balance.variacion_vs_ciclo_anterior >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>
                          {data.balance.variacion_vs_ciclo_anterior >= 0 ? '+' : ''}
                          {data.balance.variacion_vs_ciclo_anterior}% vs ant.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom metric */}
                  <div className={styles.metricsRow}>
                    <div className={styles.metricItem}>
                      <div className={styles.metricLabel}>Disponible real</div>
                      <div className={styles.metricValue}>{fmt(data.disponible_real.disponible, 'ARS')}</div>
                      <div className={styles.metricSub}>en billeteras</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Col 2: Gastos por Categoría */}
        <div className={styles.card}>
          <div className={`${styles.cardHeader} ${styles.cardHeaderWithToggle}`}>
            <h3 className={styles.cardTitle}>Gastos por categoría</h3>
            <div className={styles.toggleGroup}>
              <button 
                className={`${styles.toggleBtn} ${!showChartPercent ? styles.active : ''}`} 
                onClick={() => setShowChartPercent(false)}
              >
                $
              </button>
              <button 
                className={`${styles.toggleBtn} ${showChartPercent ? styles.active : ''}`} 
                onClick={() => setShowChartPercent(true)}
              >
                %
              </button>
            </div>
          </div>
          <div className={styles.chartCardContent}>
            {loadingProyeccion ? <ListSkeleton /> : proyeccion && <CategoriasChart data={proyeccion.desglose_por_categoria} showPercent={showChartPercent} />}
          </div>
        </div>

        {/* Col 3: Próximos Pagos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Próximos pagos</h3>
            <Link to="/app/suscripciones" className={styles.seeAll}>
              Ver <ChevronRight size={16} />
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
                {data?.proximos_pagos.slice(0, 4).map((p) => {
                  const isUrgente = p.dias_restantes <= 1
                  let fechaTxt = formatFecha(p.fecha_cobro)
                  if (p.dias_restantes === 0) fechaTxt = 'Hoy'
                  else if (p.dias_restantes === 1) fechaTxt = 'Mañana'
                  else if (p.dias_restantes <= 7) fechaTxt = `En ${p.dias_restantes} días`

                  return (
                    <div key={p.id} className={styles.listItem}>
                      <AppleCalendarIcon dateStr={p.fecha_cobro} />
                      <div className={styles.itemMeta}>
                        <p className={styles.itemName}>{p.nombre || 'Pago próximo'}</p>
                        <p className={styles.itemSub}>{fechaTxt}</p>
                      </div>
                      <div className={styles.pagoRight}>
                        <div className={styles.itemAmount}>{formatMonto(p.monto, p.moneda)}</div>
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

      {/* ── Bottom Row (2 Cols) ───────────────────────────────────────────── */}
      <div className={styles.bottomRow}>
        {/* Col 1: Proyección */}
        {!customRange && (
          <div className={styles.proyeccionSection}>
            <ProyeccionCard data={proyeccion} loading={loadingProyeccion} />
          </div>
        )}

        {/* Col 2: Últimos Movimientos */}
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
                {data?.ultimos_movimientos.map((m) => (
                  <div key={m.id} className={styles.listItem}>
                    <div className={styles.itemIcon}>
                      <SubcategoriaIcon 
                        nombre={m.subcategoria_nombre} 
                        parentCategory={m.categoria_nombre} 
                        size={32} 
                      />
                    </div>
                    <div className={styles.itemMeta}>
                      <p className={styles.itemName}>
                        {m.descripcion || m.subcategoria_nombre || 'Sin descripción'}
                      </p>
                      <p className={styles.itemSub}>
                        {formatFecha(m.fecha)} • {m.billetera_nombre}
                      </p>
                    </div>
                    <div className={`${styles.itemAmount} ${m.tipo === 'ingreso' ? styles.amountPos : styles.amountNeg}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}{formatMonto(m.monto, 'ARS')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
