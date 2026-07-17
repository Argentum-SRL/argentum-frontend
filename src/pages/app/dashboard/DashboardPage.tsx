import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowUpDown, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  AlertCircle,
  PieChart as PieChartIcon,
  LogOut,
  User,
  Sun,
  Moon,
  ArrowLeft,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardResumen, ProyeccionCategoria, Usuario, Billetera, SubcategoriaGasto, ProyeccionesResponse } from '@/types'
import ProyeccionCard from '@/components/dashboard/ProyeccionCard/ProyeccionCard'
import { PerfilFinancieroCard } from '@/components/perfil/PerfilFinancieroCard'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { EmptyState } from '@/components/ui'

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

  const [phrase] = useState(() => {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)]
  })

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

const API_URL = import.meta.env.VITE_API_URL || '/api'

const MobileGreeting = memo(({ usuario }: { usuario: Usuario | null }) => {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])
  
  const inicial = usuario?.nombre?.charAt(0)?.toUpperCase() ?? 'U'
  const fotoUrlRaw = usuario?.foto_url ? (usuario.foto_url.startsWith('http') ? usuario.foto_url : `${API_URL}${usuario.foto_url}`) : null
  const [fotoError, setFotoError] = useState(false)
  const fotoUrl = fotoError ? null : fotoUrlRaw

  const [prevFotoUrlRaw, setPrevFotoUrlRaw] = useState(fotoUrlRaw)
  if (fotoUrlRaw !== prevFotoUrlRaw) {
    setPrevFotoUrlRaw(fotoUrlRaw)
    setFotoError(false)
  }

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
            {fotoUrl ? <img src={fotoUrl} alt="avatar" referrerPolicy="no-referrer" onError={() => setFotoError(true)} /> : <span>{inicial}</span>}
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

const CategoriasChart = memo(({ 
  data, 
  showPercent, 
  moneda = 'ARS',
  onSelectCategory 
}: { 
  data: ProyeccionCategoria[], 
  showPercent: boolean,
  moneda?: 'ARS' | 'USD',
  onSelectCategory: (id: string, nombre: string) => void
}) => {
  const chartData = useMemo(() => {
    return data
      .filter(c => c.gasto_actual_ciclo > 0)
      .sort((a, b) => b.gasto_actual_ciclo - a.gasto_actual_ciclo)
      .slice(0, 6)
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <EmptyState
        variant="compact"
        icon={PieChartIcon}
        title="Sin gastos por ahora"
      />
    )
  }

  const maxVal = chartData[0]?.gasto_actual_ciclo || 0
  const total = chartData.reduce((acc, curr) => acc + curr.gasto_actual_ciclo, 0)

  const dynamicCSS = chartData.map((entry) => {
    const fillPct = maxVal > 0 ? (entry.gasto_actual_ciclo / maxVal) * 100 : 0
    const color = COLORES_CATEGORIA[entry.categoria_nombre] ?? DEFAULT_COLOR
    const classPrefix = moneda === 'ARS' ? 'bar-fill-ars' : 'bar-fill-usd'
    return `.${classPrefix}-${entry.categoria_id}{width:${fillPct.toFixed(2)}%;background:${color}}`
  }).join('')

  return (
    <div className={styles.barChartWrap}>
      <style>{dynamicCSS}</style>
      {chartData.map((entry) => {
        const pct = total > 0 ? Math.round((entry.gasto_actual_ciclo / total) * 100) : 0
        const fillClass = moneda === 'ARS' ? `bar-fill-ars-${entry.categoria_id}` : `bar-fill-usd-${entry.categoria_id}`

        return (
          <div 
            key={entry.categoria_id} 
            className={`${styles.barItem} ${styles.clickable}`}
            onClick={() => onSelectCategory(entry.categoria_id, entry.categoria_nombre)}
          >
            <div className={styles.barIconWrap}>
              <SubcategoriaIcon nombre="" parentCategory={entry.categoria_nombre} size={32} />
            </div>
            <div className={styles.barContent}>
              <div className={styles.barHeader}>
                <span className={styles.barName}>{entry.categoria_nombre}</span>
                <span className={styles.barAmount}>
                  {showPercent ? `${pct}%` : fmt(entry.gasto_actual_ciclo, moneda)}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div className={`${styles.barFill} ${fillClass}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
CategoriasChart.displayName = 'CategoriasChart'

const SubcategoriasChart = memo(({ 
  data, 
  showPercent, 
  parentCategoryName 
}: { 
  data: SubcategoriaGasto[], 
  showPercent: boolean,
  parentCategoryName: string
}) => {
  const chartDataArs = useMemo(() => {
    return data.filter(c => c.gasto_actual_ciclo.ars > 0)
      .sort((a, b) => b.gasto_actual_ciclo.ars - a.gasto_actual_ciclo.ars)
  }, [data])

  const chartDataUsd = useMemo(() => {
    return data.filter(c => c.gasto_actual_ciclo.usd > 0)
      .sort((a, b) => b.gasto_actual_ciclo.usd - a.gasto_actual_ciclo.usd)
  }, [data])

  const hasArs = chartDataArs.length > 0
  const hasUsd = chartDataUsd.length > 0

  if (!hasArs && !hasUsd) {
    return (
      <EmptyState
        variant="compact"
        icon={PieChartIcon}
        title="Sin gastos en subcategorías"
      />
    )
  }

  const maxValArs = chartDataArs[0]?.gasto_actual_ciclo.ars || 0
  const totalArs = chartDataArs.reduce((acc, curr) => acc + curr.gasto_actual_ciclo.ars, 0)

  const maxValUsd = chartDataUsd[0]?.gasto_actual_ciclo.usd || 0
  const totalUsd = chartDataUsd.reduce((acc, curr) => acc + curr.gasto_actual_ciclo.usd, 0)

  const parentColor = COLORES_CATEGORIA[parentCategoryName] ?? DEFAULT_COLOR

  const dynamicCSSArs = chartDataArs.map((entry) => {
    const fillPct = maxValArs > 0 ? (entry.gasto_actual_ciclo.ars / maxValArs) * 100 : 0
    return `.subbar-fill-ars-${entry.subcategoria_id}{width:${fillPct.toFixed(2)}%;background:${parentColor}}`
  }).join('')

  const dynamicCSSUsd = chartDataUsd.map((entry) => {
    const fillPct = maxValUsd > 0 ? (entry.gasto_actual_ciclo.usd / maxValUsd) * 100 : 0
    return `.subbar-fill-usd-${entry.subcategoria_id}{width:${fillPct.toFixed(2)}%;background:${parentColor}}`
  }).join('')

  const renderList = (
    chartData: typeof chartDataArs,
    total: number,
    moneda: 'ARS' | 'USD',
    fillClassPrefix: string
  ) => {
    return (
      <div className={styles.subcategoriaList}>
        {chartData.map((entry) => {
          const val = entry.gasto_actual_ciclo[moneda === 'ARS' ? 'ars' : 'usd']
          const pct = total > 0 ? Math.round((val / total) * 100) : 0

          return (
            <div key={entry.subcategoria_id} className={styles.barItem}>
              <div className={styles.barIconWrap}>
                <SubcategoriaIcon 
                  nombre={entry.subcategoria_nombre === 'Otros' ? null : entry.subcategoria_nombre} 
                  parentCategory={parentCategoryName} 
                  size={32} 
                />
              </div>
              <div className={styles.barContent}>
                <div className={styles.barHeader}>
                  <span className={styles.barName}>{entry.subcategoria_nombre}</span>
                  <span className={styles.barAmount}>
                    {showPercent ? `${pct}%` : fmt(val, moneda)}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={`${styles.barFill} ${fillClassPrefix}-${entry.subcategoria_id}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (hasArs && hasUsd) {
    return (
      <div className={styles.subcategoriasSplit}>
        <style>{dynamicCSSArs + dynamicCSSUsd}</style>
        <div className={styles.subcategoriasCol}>
          <h4 className={styles.subcategoriaMonedaTitle}>Gastos ARS</h4>
          {renderList(chartDataArs, totalArs, 'ARS', 'subbar-fill-ars')}
        </div>
        <div className={styles.subcategoriasColDivider} />
        <div className={styles.subcategoriasCol}>
          <h4 className={styles.subcategoriaMonedaTitle}>Gastos USD</h4>
          {renderList(chartDataUsd, totalUsd, 'USD', 'subbar-fill-usd')}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.barChartWrap}>
      <style>{hasArs ? dynamicCSSArs : dynamicCSSUsd}</style>
      {hasArs 
        ? renderList(chartDataArs, totalArs, 'ARS', 'subbar-fill-ars')
        : renderList(chartDataUsd, totalUsd, 'USD', 'subbar-fill-usd')
      }
    </div>
  )
})
SubcategoriasChart.displayName = 'SubcategoriasChart'


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
  const { open } = useModal()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [billeterasSeleccionadas, setBilleterasSeleccionadas] = useState<string[]>(() => {
    const saved = localStorage.getItem('argentum_dashboard_billeteras')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const customRange = null
  const [proyeccion, setProyeccion] = useState<ProyeccionesResponse | null>(null)
  const [loadingProyeccion, setLoadingProyeccion] = useState(true)
  const [showChartPercent, setShowChartPercent] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<{ id: string; nombre: string } | null>(null)
  const [subcategoriasData, setSubcategoriasData] = useState<SubcategoriaGasto[]>([])
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false)

  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownAbierto) return
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownAbierto(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [dropdownAbierto])

  const totalSaldoBilleterasArs = useMemo(() => {
    return billeteras
      .filter(b => b.estado === 'activa' && b.moneda === 'ARS')
      .reduce((acc, curr) => acc + curr.saldo_actual, 0)
  }, [billeteras])

  const totalSaldoBilleterasUsd = useMemo(() => {
    return billeteras
      .filter(b => b.estado === 'activa' && b.moneda === 'USD')
      .reduce((acc, curr) => acc + curr.saldo_actual, 0)
  }, [billeteras])

  const getDropdownTriggerText = () => {
    if (billeterasSeleccionadas.length === 0) {
      return 'Todas las billeteras'
    }
    if (billeterasSeleccionadas.length === 1) {
      const selected = billeteras.find(b => b.id === billeterasSeleccionadas[0])
      return selected ? selected.nombre : 'Todas las billeteras'
    }
    return `${billeterasSeleccionadas.length} billeteras`
  }

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setError(false)
    setLoading(true)
    try {
      const res = await dashboardService.getResumenCompleto(undefined, undefined, billeterasSeleccionadas, signal)
      if (signal?.aborted) return
      setData(res.resumen)
      setBilleteras(res.billeteras)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error loading dashboard:', err)
      setError(true)
      showToast(getErrorMessage(err, 'No pudimos cargar la información. Intentá de nuevo.'), 'error')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [billeterasSeleccionadas, showToast])

  const handleToggleBilletera = useCallback((id: string | null) => {
    const next = id === null
      ? []
      : billeterasSeleccionadas.includes(id)
        ? billeterasSeleccionadas.filter(item => item !== id)
        : [...billeterasSeleccionadas, id]
    setBilleterasSeleccionadas(next)
    localStorage.setItem('argentum_dashboard_billeteras', JSON.stringify(next))
  }, [billeterasSeleccionadas])

  const fetchProyeccion = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingProyeccion(true)
      const res = await dashboardService.getProyeccion(signal)
      if (signal?.aborted) return
      setProyeccion(res)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error loading proyeccion:', err)
      showToast(getErrorMessage(err, 'No pudimos cargar la información. Intentá de nuevo.'), 'error')
    } finally {
      if (!signal?.aborted) {
        setLoadingProyeccion(false)
      }
    }
  }, [showToast])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return

      void fetchData(controller.signal)
      if (!customRange) {
        void fetchProyeccion(controller.signal)
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [fetchData, fetchProyeccion, customRange])

  useEffect(() => {
    if (!selectedCategoria) {
      return
    }

    const controller = new AbortController()
    const fetchSubcategorias = async () => {
      setLoadingSubcategorias(true)
      try {
        const data = await dashboardService.getSubcategoriasGasto(
          selectedCategoria.id, 
          billeterasSeleccionadas, 
          controller.signal
        )
        setSubcategoriasData(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        console.error('Error fetching subcategories:', err)
        showToast('No pudimos cargar el detalle de subcategorías.', 'error')
      } finally {
        setLoadingSubcategorias(false)
      }
    }

    void fetchSubcategorias()

    return () => {
      controller.abort()
    }
  }, [selectedCategoria, billeterasSeleccionadas, showToast])

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
              <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 100 100"
                  className="absolute -bottom-5 -right-5 w-[120px] h-[120px] opacity-[0.04] pointer-events-none"
                >
                  <circle cx="50" cy="50" r="48" fill="#8A95A8"/>
                  <circle cx="58" cy="50" r="38" fill="#0D2045"/>
                </svg>
              </div>

              {/* Selector de billeteras dropdown flotante */}
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <button
                  className={`${styles.dropdownTrigger} ${dropdownAbierto ? styles.dropdownTriggerActive : ''}`}
                  onClick={() => setDropdownAbierto(!dropdownAbierto)}
                >
                  <span>{getDropdownTriggerText()}</span>
                  <ChevronDown size={14} />
                </button>

                {dropdownAbierto && (
                  <div className={styles.dropdownPanel}>
                    <div className={styles.dropdownHeader}>BILLETERAS</div>
                    <button
                      className={`${styles.dropdownItem} ${billeterasSeleccionadas.length === 0 ? styles.dropdownItemActive : ''}`}
                      onClick={() => {
                        handleToggleBilletera(null)
                      }}
                    >
                      <span className={styles.dropdownItemName}>Todas las billeteras</span>
                      <span className={styles.dropdownItemBalance}>
                        {fmt(totalSaldoBilleterasArs, 'ARS')} | {fmt(totalSaldoBilleterasUsd, 'USD')}
                      </span>
                    </button>
                    <div className={styles.dropdownDivider} />
                    {billeteras.filter(b => b.estado === 'activa').map(b => (
                      <button
                        key={b.id}
                        className={`${styles.dropdownItem} ${billeterasSeleccionadas.includes(b.id) ? styles.dropdownItemActive : ''}`}
                        onClick={() => {
                          handleToggleBilletera(b.id)
                        }}
                      >
                        <span className={styles.dropdownItemName}>{b.nombre}</span>
                        <span className={styles.dropdownItemBalance}>
                          {fmt(b.saldo_actual, b.moneda)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.balanceContent}>
                <MobileGreeting usuario={usuario} />
                <div className={styles.balanceMain}>
                  {/* Top section: Saldo Disponible */}
                  <div className={styles.balanceTopMulti}>
                    <div className={styles.balanceCol}>
                      <div className={styles.labelWithHint}>
                        <span className={styles.saldoLabel}>Saldo disp. ARS</span>
                        <button
                          className={styles.hint}
                          onClick={() => open('balance_ciclo', {})}
                          title="¿Qué es el balance del ciclo?"
                          aria-label="Ver explicación del balance del ciclo"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </div>
                      <h2 className={`${styles.saldoAmount} ${data.disponible_real.ars.disponible < 0 ? styles.saldoAmountNegative : ''}`}>
                        {fmt(data.disponible_real.ars.disponible, 'ARS')}
                      </h2>
                    </div>

                    <div className={styles.balanceColDivider} />

                    <div className={styles.balanceCol}>
                      <div className={styles.labelWithHint}>
                        <span className={styles.saldoLabel}>Saldo disp. USD</span>
                        <button
                          className={styles.hint}
                          onClick={() => open('balance_ciclo', {})}
                          title="¿Qué es el balance del ciclo?"
                          aria-label="Ver explicación del balance del ciclo"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </div>
                      <h2 className={`${styles.saldoAmount} ${data.disponible_real.usd.disponible < 0 ? styles.saldoAmountNegative : ''}`}>
                        {fmt(data.disponible_real.usd.disponible, 'USD')}
                      </h2>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className={styles.progressDivider} />

                  {/* Sección de barra de progreso */}
                  <div className={styles.balanceFooterMulti}>
                    <div className={styles.balanceCol}>
                      {(data.balance.ars.ingresos > 0 || data.balance.ars.egresos > 0) && (
                        <div className={styles.balanceTrends}>
                          <div className={styles.balanceTrendItem}>
                            <TrendingUp size={15} className={styles.trendUp} />
                            <span className={styles.trendAmount}>{fmt(data.balance.ars.ingresos, 'ARS')}</span>
                          </div>
                          <div className={styles.balanceTrendItem}>
                            <TrendingDown size={15} className={styles.trendDown} />
                            <span className={styles.trendAmount}>{fmt(data.balance.ars.egresos, 'ARS')}</span>
                          </div>
                        </div>
                      )}
                      <div className={styles.balanceFooterDivider} />
                      <div className={styles.disponibleReal}>
                        <span className={styles.disponibleRealLabel}>DISPONIBLE REAL ARS</span>
                        <span className={`${styles.disponibleRealAmount} ${data.disponible_real.ars.disponible < 0 ? styles.disponibleRealNegative : ''}`}>
                          {fmt(data.disponible_real.ars.disponible, 'ARS')}
                        </span>
                        <span className={styles.disponibleRealSub}>en billeteras</span>
                      </div>
                    </div>

                    <div className={styles.balanceColDivider} />

                    <div className={styles.balanceCol}>
                      {(data.balance.usd.ingresos > 0 || data.balance.usd.egresos > 0) && (
                        <div className={styles.balanceTrends}>
                          <div className={styles.balanceTrendItem}>
                            <TrendingUp size={15} className={styles.trendUp} />
                            <span className={styles.trendAmount}>{fmt(data.balance.usd.ingresos, 'USD')}</span>
                          </div>
                          <div className={styles.balanceTrendItem}>
                            <TrendingDown size={15} className={styles.trendDown} />
                            <span className={styles.trendAmount}>{fmt(data.balance.usd.egresos, 'USD')}</span>
                          </div>
                        </div>
                      )}
                      <div className={styles.balanceFooterDivider} />
                      <div className={styles.disponibleReal}>
                        <span className={styles.disponibleRealLabel}>DISPONIBLE REAL USD</span>
                        <span className={`${styles.disponibleRealAmount} ${data.disponible_real.usd.disponible < 0 ? styles.disponibleRealNegative : ''}`}>
                          {fmt(data.disponible_real.usd.disponible, 'USD')}
                        </span>
                        <span className={styles.disponibleRealSub}>en billeteras</span>
                      </div>
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
            <div className={styles.cardTitleContainer}>
              {selectedCategoria ? (
                <button 
                  className={styles.backBtn} 
                  onClick={() => {
                    setSelectedCategoria(null)
                    setSubcategoriasData([])
                  }}
                  title="Volver a categorías"
                >
                  <ArrowLeft size={16} />
                  <span className={styles.cardTitle}>{selectedCategoria.nombre}</span>
                </button>
              ) : (
                <h3 className={styles.cardTitle}>Gastos por categoría</h3>
              )}
            </div>
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
            {selectedCategoria ? (
              loadingSubcategorias ? (
                <ListSkeleton />
              ) : (
                <SubcategoriasChart 
                  data={subcategoriasData} 
                  showPercent={showChartPercent} 
                  parentCategoryName={selectedCategoria.nombre}
                />
              )
            ) : (
              loadingProyeccion ? (
                <ListSkeleton />
              ) : (
                proyeccion && (() => {
                  const hasArs = proyeccion.ars && proyeccion.ars.datos_suficientes
                  const hasUsd = proyeccion.usd && proyeccion.usd.datos_suficientes

                  if (!hasArs && !hasUsd) {
                    return (
                      <EmptyState
                        variant="compact"
                        icon={PieChartIcon}
                        title="Sin proyección por ahora"
                        description="Necesitamos más historial para proyectar tu ciclo"
                      />
                    )
                  }

                  if (hasArs && hasUsd) {
                    return (
                      <div className={styles.subcategoriasSplit}>
                        <div className={styles.subcategoriasCol}>
                          <h4 className={styles.subcategoriaMonedaTitle}>Gastos Proyectados ARS</h4>
                          <CategoriasChart 
                            data={proyeccion.ars.desglose_por_categoria} 
                            showPercent={showChartPercent} 
                            moneda="ARS"
                            onSelectCategory={(id, nombre) => setSelectedCategoria({ id, nombre })}
                          />
                        </div>
                        <div className={styles.subcategoriasColDivider} />
                        <div className={styles.subcategoriasCol}>
                          <h4 className={styles.subcategoriaMonedaTitle}>Gastos Proyectados USD</h4>
                          <CategoriasChart 
                            data={proyeccion.usd.desglose_por_categoria} 
                            showPercent={showChartPercent} 
                            moneda="USD"
                            onSelectCategory={(id, nombre) => setSelectedCategoria({ id, nombre })}
                          />
                        </div>
                      </div>
                    )
                  }

                  const activeProj = hasArs ? proyeccion.ars : proyeccion.usd
                  const activeMoneda = hasArs ? 'ARS' : 'USD'
                  return (
                    <CategoriasChart 
                      data={activeProj.desglose_por_categoria} 
                      showPercent={showChartPercent} 
                      moneda={activeMoneda as 'ARS' | 'USD'}
                      onSelectCategory={(id, nombre) => setSelectedCategoria({ id, nombre })}
                    />
                  )
                })()
              )
            )}
          </div>
        </div>

        {/* Col 3: Próximos Pagos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Próximos pagos</h3>
          </div>
          <div className={styles.cardContent}>
            {loading ? (
              <ListSkeleton />
            ) : data?.proximos_pagos.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={Calendar}
                title="Sin pagos próximos"
              />
            ) : (
              <div className={styles.list}>
                {data?.proximos_pagos.slice(0, 4).map((p) => {
                  const isUrgente = p.dias_restantes <= 1
                  let fechaTxt = formatFecha(p.fecha_cobro)
                  if (p.dias_restantes === 0) fechaTxt = 'Hoy'
                  else if (p.dias_restantes === 1) fechaTxt = 'Mañana'
                  else if (p.dias_restantes <= 7) fechaTxt = `En ${p.dias_restantes} days`

                  const handlePagoClick = () => {
                    if (p.tipo === 'suscripcion') {
                      navigate('/app/suscripciones')
                    } else if (p.tipo === 'resumen_tarjeta') {
                      navigate(p.billetera_id ? `/app/billeteras/${p.billetera_id}` : '/app/billeteras')
                    } else if (p.tipo === 'cuota') {
                      navigate('/app/transacciones')
                    }
                  }

                  return (
                    <div 
                      key={p.id} 
                      className={`${styles.listItem} ${styles.listItemClickable}`}
                      onClick={handlePagoClick}
                    >
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

      {/* Perfil Financiero */}
      <PerfilFinancieroCard />

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
              <EmptyState
                variant="compact"
                icon={ArrowUpDown}
                title="Todavía no registraste ningún movimiento."
              />
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
