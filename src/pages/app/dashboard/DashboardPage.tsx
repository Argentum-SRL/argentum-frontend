import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowUpDown, 
  Calendar, 
  ChevronRight,
  AlertCircle,
  PieChart as PieChartIcon,
  LogOut,
  User,
  Sun,
  Moon,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Star,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { useModal } from '@/hooks/useModal'
import { triggerBienvenidaFinancieraOnce, resetBienvenidaTriggerState } from '@/utils/bienvenidaFinancieraManager'
import { getErrorMessage } from '@/utils/errorMessages'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardResumen, CategoriaGastoItem, Usuario, Billetera, SubcategoriaGasto, ProyeccionesResponse } from '@/types'
import ProyeccionCard from '@/components/dashboard/ProyeccionCard/ProyeccionCard'
import { hasProyeccionVisible } from '@/components/dashboard/ProyeccionCard/proyeccionUtils'
import { PerfilFinancieroCard } from '@/components/perfil/PerfilFinancieroCard'
import { formatMonto, formatFecha } from '@/utils/format'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { EmptyState, WidgetErrorBoundary } from '@/components/ui'

import { getFotoUrl } from '@/utils/fotoUrl'
import styles from './DashboardPage.module.css'

// ── Formatter ────────────────────────────────────────────────────────────

const fmt = (n: number, moneda: 'ARS' | 'USD' = 'ARS') => {
  return formatMonto(n, moneda)
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
  const fotoUrlRaw = getFotoUrl(usuario?.foto_url)
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
  'Alimentación':             '#F97316',  // Naranja
  'Indumentaria':             '#7C3AED',  // Violeta
  'Servicios':                '#EAB308',  // Dorado / Amarillo
  'Hogar':                    '#8B5CF6',  // Púrpura
  'Salud':                    '#10B981',  // Esmeralda
  'Transporte':               '#0284C7',  // Azul cielo
  'Comunicación':             '#6366F1',  // Índigo
  'Entretenimiento':          '#EC4899',  // Rosa / Magenta
  'Recreativo':               '#EC4899',  // Fallback
  'Educación':                '#DC2626',  // Rojo
  'Restaurante':              '#F59E0B',  // Ámbar
  'Restaurantes y delivery':  '#F59E0B',  // Fallback
  'Otros':                    '#6B7280',  // Gris neutro
  'Banco':                    '#64748B',  // Slate / Gris azulado
}

const DEFAULT_COLOR = '#8A95A8'

const CategoriasChart = memo(({ 
  data, 
  showPercent, 
  moneda = 'ARS',
  onSelectCategory 
}: { 
  data: CategoriaGastoItem[], 
  showPercent: boolean,
  moneda?: 'ARS' | 'USD',
  onSelectCategory: (id: string, nombre: string) => void
}) => {
  const chartData = useMemo(() => {
    return data
      .filter(c => c.monto > 0)
      .sort((a, b) => b.monto - a.monto)
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

  const maxVal = Math.max(...chartData.map(entry => Number(entry.monto)), 0)
  const total = chartData.reduce((acc, curr) => acc + Number(curr.monto), 0)

  const dynamicCSS = chartData.map((entry) => {
    const val = Number(entry.monto)
    const fillPct = maxVal > 0 ? Math.max(0, Math.min(100, (val / maxVal) * 100)) : 0
    const color = COLORES_CATEGORIA[entry.categoria_nombre] ?? DEFAULT_COLOR
    const classPrefix = moneda === 'ARS' ? 'bar-fill-ars' : 'bar-fill-usd'
    const safeCatId = (entry.categoria_id || entry.categoria_nombre).replace(/[^a-zA-Z0-9_-]/g, '')
    return `.${classPrefix}-${safeCatId}{width:${fillPct.toFixed(2)}%;background:${color}}`
  }).join('')

  return (
    <div className={styles.barChartWrap}>
      <style>{dynamicCSS}</style>
      {chartData.map((entry) => {
        const val = entry.monto
        const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((val / total) * 100))) : 0
        const safeCatId = (entry.categoria_id || entry.categoria_nombre).replace(/[^a-zA-Z0-9_-]/g, '')
        const fillClass = moneda === 'ARS' ? `bar-fill-ars-${safeCatId}` : `bar-fill-usd-${safeCatId}`
        const canDrillDown = Boolean(entry.categoria_id)

        return (
          <div 
            key={entry.categoria_id || entry.categoria_nombre} 
            className={`${styles.barItem} ${canDrillDown ? styles.clickable : ''}`}
            onClick={() => {
              if (canDrillDown && entry.categoria_id) {
                onSelectCategory(entry.categoria_id, entry.categoria_nombre)
              }
            }}
          >
            <div className={styles.barIconWrap}>
              <CategoriaIcon nombre={entry.categoria_nombre} size={32} />
            </div>
            <div className={styles.barContent}>
              <div className={styles.barHeader}>
                <div className={styles.barTitleGroup}>
                  <span className={styles.barName}>{entry.categoria_nombre}</span>
                </div>
                <span className={styles.barAmount}>
                  {showPercent ? `${pct}%` : fmt(val, moneda)}
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
  parentCategoryName,
  moneda = 'ARS'
}: { 
  data: SubcategoriaGasto[], 
  showPercent: boolean,
  parentCategoryName: string,
  moneda?: 'ARS' | 'USD'
}) => {
  const chartData = useMemo(() => {
    return data
      .filter(c => moneda === 'ARS' ? c.gasto_actual_ciclo.ars > 0 : c.gasto_actual_ciclo.usd > 0)
      .sort((a, b) => {
        const aVal = moneda === 'ARS' ? a.gasto_actual_ciclo.ars : a.gasto_actual_ciclo.usd
        const bVal = moneda === 'ARS' ? b.gasto_actual_ciclo.ars : b.gasto_actual_ciclo.usd
        return bVal - aVal
      })
  }, [data, moneda])

  if (chartData.length === 0) {
    return (
      <EmptyState
        variant="compact"
        icon={PieChartIcon}
        title="Sin gastos en subcategorías"
      />
    )
  }

  const getVal = (entry: SubcategoriaGasto) => moneda === 'ARS' ? entry.gasto_actual_ciclo.ars : entry.gasto_actual_ciclo.usd
  const maxVal = getVal(chartData[0]) || 0
  const total = chartData.reduce((acc, curr) => acc + getVal(curr), 0)
  const parentColor = COLORES_CATEGORIA[parentCategoryName] ?? DEFAULT_COLOR
  const fillPrefix = moneda === 'ARS' ? 'subbar-fill-ars' : 'subbar-fill-usd'

  const dynamicCSS = chartData.map((entry) => {
    const val = getVal(entry)
    const fillPct = maxVal > 0 ? Math.max(0, Math.min(100, (val / maxVal) * 100)) : 0
    const safeSubId = (entry.subcategoria_id || entry.subcategoria_nombre).replace(/[^a-zA-Z0-9_-]/g, '')
    return `.${fillPrefix}-${safeSubId}{width:${fillPct.toFixed(2)}%;background:${parentColor}}`
  }).join('')

  return (
    <div className={styles.barChartWrap}>
      <style>{dynamicCSS}</style>
      {chartData.map((entry) => {
        const val = getVal(entry)
        const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((val / total) * 100))) : 0
        const safeSubId = (entry.subcategoria_id || entry.subcategoria_nombre).replace(/[^a-zA-Z0-9_-]/g, '')

        return (
          <div key={entry.subcategoria_id} className={styles.barItem}>
            <div className={styles.barIconWrap}>
              <SubcategoriaIcon 
                nombre={entry.subcategoria_nombre === 'Otros' || entry.subcategoria_nombre === 'General' ? null : entry.subcategoria_nombre} 
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
                <div className={`${styles.barFill} ${fillPrefix}-${safeSubId}`} />
              </div>
            </div>
          </div>
        )
      })}
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
  const { showToast } = useToast()
  const { lastDataUpdate } = useNotificaciones()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [billeterasSeleccionadas, setBilleterasSeleccionadas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('argentum_dashboard_billeteras')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    } catch {
      return []
    }
  })
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>(() => {
    return (localStorage.getItem('argentum_dashboard_moneda') as 'ARS' | 'USD') || 'ARS'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const customRange = null
  const [proyeccion, setProyeccion] = useState<ProyeccionesResponse | null>(null)
  const [loadingProyeccion, setLoadingProyeccion] = useState(true)
  const { open } = useModal()

  // Trigger de primera vez para el modal explicativo si la proyección lo indica
  useEffect(() => {
    if (proyeccion?.mostrar_modal_bienvenida) {
      triggerBienvenidaFinancieraOnce(open, 'proyeccion')
    }
  }, [proyeccion?.mostrar_modal_bienvenida, open])

  const tieneProyeccion = useMemo(() => {
    return Boolean(!customRange && !loadingProyeccion && hasProyeccionVisible(proyeccion, moneda))
  }, [customRange, loadingProyeccion, proyeccion, moneda])
  const [showChartPercent, setShowChartPercent] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<{ id: string; nombre: string } | null>(null)
  const [subcategoriasData, setSubcategoriasData] = useState<SubcategoriaGasto[]>([])
  const [loadingSubcategorias, setLoadingSubcategorias] = useState(false)
  const [showDesglose, setShowDesglose] = useState(false)

  // Resetear filtros y datos si el usuario autenticado cambia
  const prevUserIdRef = useRef<string | null>(usuario?.id ?? null)
  useEffect(() => {
    if (usuario?.id && prevUserIdRef.current && prevUserIdRef.current !== usuario.id) {
      setBilleterasSeleccionadas([])
      setSelectedCategoria(null)
      setSubcategoriasData([])
      setData(null)
      setProyeccion(null)
      resetBienvenidaTriggerState()
    }
    prevUserIdRef.current = usuario?.id ?? null
  }, [usuario?.id])

  const [showBalance, setShowBalance] = useState(() => {
    return localStorage.getItem('argentum_hide_balance') !== 'true'
  })

  const handleTogglePrivacy = useCallback(() => {
    setShowBalance(prev => {
      const next = !prev
      localStorage.setItem('argentum_hide_balance', next ? 'false' : 'true')
      return next
    })
  }, [])

  // Determinar si entre las billeteras relevantes existe al menos una en USD
  const tieneBilleterasUsd = useMemo(() => {
    const relevantes = billeterasSeleccionadas.length === 0
      ? billeteras.filter(b => b.estado === 'activa')
      : billeteras.filter(b => billeterasSeleccionadas.includes(b.id))
    return relevantes.some(b => b.moneda === 'USD')
  }, [billeteras, billeterasSeleccionadas])

  // Si el switch se oculta y la moneda estaba en USD, forzar a ARS durante el render
  if (!tieneBilleterasUsd && moneda === 'USD') {
    setMoneda('ARS')
    localStorage.setItem('argentum_dashboard_moneda', 'ARS')
  }

  const billeterasActivas = useMemo(() => {
    return billeteras
      .filter(b => b.estado === 'activa' && b.moneda === moneda)
      .sort((a, b) => {
        // 1. Favorita / Principal primero
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        // 2. Mayor saldo a menor saldo
        const diff = (Number(b.saldo_actual) || 0) - (Number(a.saldo_actual) || 0)
        if (diff !== 0) return diff
        // 3. Fallback alfabético
        return a.nombre.localeCompare(b.nombre)
      })
  }, [billeteras, moneda])

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setError(false)
    setLoading(true)
    try {
      const res = await dashboardService.getResumenCompleto(undefined, undefined, billeterasSeleccionadas, signal)
      if (signal?.aborted) return
      setData(res.resumen)
      setBilleteras(res.billeteras)

      // Sanitizar billeteras seleccionadas para que no queden IDs ajenos
      if (billeterasSeleccionadas.length > 0) {
        const validIds = new Set(res.billeteras.map(b => b.id))
        const sanitized = billeterasSeleccionadas.filter(id => validIds.has(id))
        if (sanitized.length !== billeterasSeleccionadas.length) {
          setBilleterasSeleccionadas(sanitized)
          localStorage.setItem('argentum_dashboard_billeteras', JSON.stringify(sanitized))
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      // Si falló por billeteras inválidas heredadas, resetear y reintentar sin filtro
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      if (axiosErr.response?.status === 400 && billeterasSeleccionadas.length > 0) {
        setBilleterasSeleccionadas([])
        localStorage.removeItem('argentum_dashboard_billeteras')
        try {
          const retryRes = await dashboardService.getResumenCompleto(undefined, undefined, [], signal)
          if (signal?.aborted) return
          setData(retryRes.resumen)
          setBilleteras(retryRes.billeteras)
          return
        } catch {
          // Continuar al manejo normal de error
        }
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

  const handleToggleMoneda = useCallback((m: 'ARS' | 'USD') => {
    setMoneda(m)
    localStorage.setItem('argentum_dashboard_moneda', m)
    // Descartar billeteras seleccionadas que no pertenezcan a la nueva moneda
    setBilleterasSeleccionadas(prev => {
      const valid = prev.filter(id => {
        const b = billeteras.find(w => w.id === id)
        return b && b.moneda === m
      })
      localStorage.setItem('argentum_dashboard_billeteras', JSON.stringify(valid))
      return valid
    })
    // Reset category drill-down when switching currency
    setSelectedCategoria(null)
    setSubcategoriasData([])
  }, [billeteras])

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

  // Auto-refresco en vivo ante eventos SSE de actualización de datos
  useEffect(() => {
    if (lastDataUpdate?.entidad === 'transacciones' || lastDataUpdate?.entidad === 'billeteras') {
      const controller = new AbortController()
      const tid = setTimeout(() => {
        void fetchData(controller.signal)
        if (!customRange) {
          void fetchProyeccion(controller.signal)
        }
      }, 0)
      return () => {
        clearTimeout(tid)
        controller.abort()
      }
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchData, fetchProyeccion, customRange])

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

  const monedaKey = moneda === 'ARS' ? 'ars' : 'usd'
  const saldoInfo = data?.saldo_disponible?.[monedaKey]
  const saldoTotal = saldoInfo ? Number(saldoInfo.saldo_total) : (moneda === 'ARS' ? (data?.disponible_real.ars.saldo_billeteras ?? 0) : (data?.disponible_real.usd.saldo_billeteras ?? 0))
  const saldoDisponible = saldoInfo ? Number(saldoInfo.saldo_disponible) : (moneda === 'ARS' ? (data?.disponible_real.ars.disponible ?? 0) : (data?.disponible_real.usd.disponible ?? 0))
  const cuotasPendientes = saldoInfo ? Number(saldoInfo.cuotas_pendientes) : (moneda === 'ARS' ? (data?.disponible_real.ars.cuotas_proximo_ciclo ?? 0) : (data?.disponible_real.usd.cuotas_proximo_ciclo ?? 0))
  const suscripcionesPendientes = saldoInfo ? Number(saldoInfo.suscripciones_pendientes) : (moneda === 'ARS' ? (data?.disponible_real.ars.suscripciones_mensuales || 0) : (data?.disponible_real.usd.suscripciones_mensuales || 0))

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.desktopGreeting}>
          <Greeting nombre={usuario?.nombre ?? null} />
        </div>
        <div className={styles.mobileGreetingHeader}>
          <MobileGreeting usuario={usuario} />
        </div>
      </header>

      {/* ── Top Row (3 Cols) ──────────────────────────────────────────────── */}
      <div className={styles.topRow}>
        {/* Col 1: Balance */}
        <WidgetErrorBoundary title="Saldo disponible">
          {loading ? (
            <BalanceSkeleton />
          ) : (
            data && (
              <div className={styles.balanceCard}>
                {/* Header: Currency Tabs a la izquierda + Acciones a la derecha */}
                <div className={styles.balanceCardHeader}>
                  {/* Currency Tabs Minimalistas (ARS / USD) condicionales */}
                  {tieneBilleterasUsd ? (
                    <div className={styles.currencyTabs} role="tablist" aria-label="Moneda">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={moneda === 'ARS'}
                        className={`${styles.currencyTab} ${moneda === 'ARS' ? styles.currencyTabActive : ''}`}
                        onClick={() => handleToggleMoneda('ARS')}
                      >
                        ARS
                      </button>
                      <span className={styles.currencyTabSep}>/</span>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={moneda === 'USD'}
                        className={`${styles.currencyTab} ${moneda === 'USD' ? styles.currencyTabActive : ''}`}
                        onClick={() => handleToggleMoneda('USD')}
                      >
                        USD
                      </button>
                    </div>
                  ) : <div />}

                  {/* Acciones del Header: Ocultar saldo */}
                  <div className={styles.balanceHeaderActions}>
                    <button
                      type="button"
                      className={styles.balanceHeaderIconBtn}
                      onClick={handleTogglePrivacy}
                      title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                      aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                    >
                      {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>

                {/* Saldo Principal */}
                <div className={styles.balanceBody}>
                  <h2 className={`${styles.saldoAmount} ${saldoTotal < 0 ? styles.saldoAmountNegative : ''}`}>
                    {showBalance ? fmt(saldoTotal, moneda) : '••••••••'}
                  </h2>
                  <span className={styles.disponibleSub}>
                    {billeterasSeleccionadas.length === 0
                      ? `Total en ${billeterasActivas.length} ${billeterasActivas.length === 1 ? 'billetera' : 'billeteras'}`
                      : billeterasSeleccionadas.length === 1
                        ? `Saldo en ${billeterasActivas.find(b => b.id === billeterasSeleccionadas[0])?.nombre ?? 'billetera'}`
                        : `${billeterasSeleccionadas.length} billeteras seleccionadas`}
                  </span>

                  {/* Disponible para gastar con desglose */}
                  <div className={styles.disponibleGastarContainer}>
                    <button
                      type="button"
                      className={styles.disponibleGastarRow}
                      onClick={() => setShowDesglose(prev => !prev)}
                      aria-expanded={showDesglose}
                      title="Click para ver desglose de compromisos del ciclo"
                    >
                      <div className={styles.disponibleGastarLabelWrap}>
                        <span className={styles.disponibleGastarLabel}>Disponible para gastar</span>
                        <HelpCircle size={13} className={styles.disponibleGastarInfoIcon} />
                      </div>
                      <span className={`${styles.disponibleGastarValue} ${saldoDisponible < 0 ? styles.disponibleNegative : ''}`}>
                        {showBalance ? fmt(saldoDisponible, moneda) : '••••••••'}
                      </span>
                    </button>

                    {showDesglose && (
                      <div className={styles.desglosePopover}>
                        <div className={styles.desgloseItem}>
                          <span className={styles.desgloseItemLabel}>Saldo total</span>
                          <span className={styles.desgloseItemValue}>{showBalance ? fmt(saldoTotal, moneda) : '••••'}</span>
                        </div>
                        <div className={styles.desgloseItem}>
                          <span className={styles.desgloseItemLabel}>Cuotas pendientes</span>
                          <span className={`${styles.desgloseItemValue} ${cuotasPendientes > 0 ? styles.desgloseDeduction : ''}`}>
                            {showBalance ? (cuotasPendientes > 0 ? `- ${fmt(cuotasPendientes, moneda)}` : fmt(0, moneda)) : '••••'}
                          </span>
                        </div>
                        <div className={styles.desgloseItem}>
                          <span className={styles.desgloseItemLabel}>Suscripciones pendientes</span>
                          <span className={`${styles.desgloseItemValue} ${suscripcionesPendientes > 0 ? styles.desgloseDeduction : ''}`}>
                            {showBalance ? (suscripcionesPendientes > 0 ? `- ${fmt(suscripcionesPendientes, moneda)}` : fmt(0, moneda)) : '••••'}
                          </span>
                        </div>
                        <div className={styles.desgloseDivider} />
                        <div className={`${styles.desgloseItem} ${styles.desgloseTotalRow}`}>
                          <span className={styles.desgloseTotalLabel}>Disponible para gastar</span>
                          <span className={styles.desgloseTotalValue}>{showBalance ? fmt(saldoDisponible, moneda) : '••••'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Filter Pills (Acceso directo, 1 toque, con saldo en vivo) */}
                {billeterasActivas.length > 0 && (
                  <div className={styles.walletPillsTrack} role="tablist" aria-label="Filtrar por billetera">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={billeterasSeleccionadas.length === 0}
                      className={`${styles.walletPill} ${billeterasSeleccionadas.length === 0 ? styles.walletPillActive : ''}`}
                      onClick={() => handleToggleBilletera(null)}
                      title="Ver todas las billeteras"
                    >
                      <span className={styles.walletPillDot} />
                      <span className={styles.walletPillName}>Todas</span>
                      <span className={styles.walletPillCount}>{billeterasActivas.length}</span>
                    </button>

                    {billeterasActivas.map(b => {
                      const isSelected = billeterasSeleccionadas.includes(b.id)
                      return (
                        <button
                          key={b.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          className={`${styles.walletPill} ${isSelected ? styles.walletPillActive : ''}`}
                          onClick={() => handleToggleBilletera(b.id)}
                          title={`Filtrar por ${b.nombre}${b.es_principal ? ' (Favorita)' : ''}`}
                        >
                          <span className={styles.walletPillName}>
                            {b.nombre}
                            {b.es_principal && (
                              <Star size={10} fill="currentColor" className={styles.walletPillStar} />
                            )}
                          </span>
                          <span className={styles.walletPillAmount}>
                            {showBalance ? fmt(b.saldo_actual, b.moneda) : '••••'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Flechas de Ingreso y Egreso */}
                <div className={styles.balanceTrends}>
                  <div className={styles.balanceTrendItem}>
                    <TrendingUp size={15} className={styles.trendUp} />
                    <span className={styles.trendAmount}>
                      {showBalance ? fmt(moneda === 'ARS' ? (data.balance?.ars?.ingresos ?? 0) : (data.balance?.usd?.ingresos ?? 0), moneda) : '••••'}
                    </span>
                  </div>
                  <div className={styles.balanceTrendItem}>
                    <TrendingDown size={15} className={styles.trendDown} />
                    <span className={styles.trendAmount}>
                      {showBalance ? fmt(moneda === 'ARS' ? (data.balance?.ars?.egresos ?? 0) : (data.balance?.usd?.egresos ?? 0), moneda) : '••••'}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </WidgetErrorBoundary>

        {/* Col 2: Gastos por Categoría */}
        <WidgetErrorBoundary title="Gastos por categoría">
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
              <div className={styles.unitTabs} role="tablist" aria-label="Unidad de visualización">
                <button 
                  type="button"
                  role="tab"
                  aria-selected={!showChartPercent}
                  className={`${styles.unitTab} ${!showChartPercent ? styles.unitTabActive : ''}`} 
                  onClick={() => setShowChartPercent(false)}
                >
                  $
                </button>
                <span className={styles.unitTabSep}>/</span>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={showChartPercent}
                  className={`${styles.unitTab} ${showChartPercent ? styles.unitTabActive : ''}`} 
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
                    moneda={moneda}
                  />
                )
              ) : (
                loading ? (
                  <ListSkeleton />
                ) : (
                  <CategoriasChart
                    data={data?.gastos_por_categoria?.[moneda === 'ARS' ? 'ars' : 'usd'] ?? []}
                    showPercent={showChartPercent}
                    moneda={moneda}
                    onSelectCategory={(id, nombre) => setSelectedCategoria({ id, nombre })}
                  />
                )
              )}
            </div>
          </div>
        </WidgetErrorBoundary>

        {/* Col 3: Próximos Pagos */}
        <WidgetErrorBoundary title="Próximos pagos">
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Próximos pagos</h3>
            </div>
            <div className={styles.cardContent}>
              {loading ? (
                <ListSkeleton />
              ) : (() => {
                const pagosFiltrados = (data?.proximos_pagos ?? []).filter(p => p.moneda === moneda)
                if (pagosFiltrados.length === 0) {
                  return (
                    <EmptyState
                      variant="compact"
                      icon={Calendar}
                      title={`Sin pagos próximos en ${moneda}`}
                    />
                  )
                }
                return (
                  <div className={styles.list}>
                    {pagosFiltrados.slice(0, 4).map((p) => {
                      const isVencido = Boolean(p.es_vencido || p.dias_restantes < 0)
                      const isUrgente = !isVencido && p.dias_restantes <= 1
                      let fechaTxt = formatFecha(p.fecha_cobro)
                      if (isVencido) {
                        const diasPasados = Math.abs(p.dias_restantes)
                        fechaTxt = diasPasados === 1 ? 'Venció ayer' : `Venció hace ${diasPasados} días`
                      } else if (p.dias_restantes === 0) {
                        fechaTxt = 'Hoy'
                      } else if (p.dias_restantes === 1) {
                        fechaTxt = 'Mañana'
                      } else if (p.dias_restantes <= 7) {
                        fechaTxt = `En ${p.dias_restantes} días`
                      }

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
                            {isVencido ? (
                              <span className={styles.vencidoBadge}>Vencido</span>
                            ) : isUrgente ? (
                              <span className={styles.urgentBadge}>Urgente</span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </WidgetErrorBoundary>
      </div>

      {/* Perfil Financiero */}
      <WidgetErrorBoundary title="Perfil financiero">
        <PerfilFinancieroCard moneda={moneda} />
      </WidgetErrorBoundary>

      {/* ── Bottom Row (2 Cols si hay proyección, 1 Col full width si no) ─── */}
      <div className={`${styles.bottomRow} ${!tieneProyeccion ? styles.bottomRowSingle : ''}`}>
        {/* Col 1: Proyección */}
        {tieneProyeccion && (
          <div className={styles.proyeccionSection}>
            <WidgetErrorBoundary title="Proyección">
              <ProyeccionCard data={proyeccion} loading={loadingProyeccion} moneda={moneda} />
            </WidgetErrorBoundary>
          </div>
        )}

        {/* Col 2 (o Col 1 full width): Últimos Movimientos */}
        <WidgetErrorBoundary title="Últimos movimientos">
          <div className={`${styles.card} ${!tieneProyeccion ? styles.cardFullWidth : ''}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Últimos movimientos</h3>
              <Link to="/app/transacciones" className={styles.seeAll}>
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>
            <div className={styles.cardContent}>
              {loading ? (
                <ListSkeleton />
              ) : (() => {
                const movsFiltrados = (data?.ultimos_movimientos ?? []).filter(m => m.moneda === moneda)
                if (movsFiltrados.length === 0) {
                  return (
                    <EmptyState
                      variant="compact"
                      icon={ArrowUpDown}
                      title={`Sin movimientos en ${moneda}.`}
                    />
                  )
                }
                return (
                  <div className={styles.list}>
                    {movsFiltrados.map((m) => {
                      const isMeta = Boolean(
                        m.movimiento_meta_id ||
                        m.descripcion?.startsWith('Aporte a la meta:') ||
                        m.descripcion?.startsWith('Retiro de la meta:')
                      )
                      const isAporte = isMeta && m.tipo === 'egreso'
                      const isRetiro = isMeta && m.tipo === 'ingreso'

                      return (
                        <div key={m.id} className={styles.listItem}>
                          <div className={styles.itemIcon}>
                            <SubcategoriaIcon
                              nombre={isMeta ? 'ahorro' : m.subcategoria_nombre}
                              parentCategory={isMeta ? 'Ahorro' : m.categoria_nombre}
                              size={32}
                            />
                          </div>
                          <div className={styles.itemMeta}>
                            <p className={styles.itemName}>
                              {m.descripcion || m.subcategoria_nombre || 'Sin descripción'}
                            </p>
                            <p className={styles.itemSub}>
                              {formatFecha(m.fecha)} • {m.billetera_nombre}
                              {isAporte && ' • Apartado para meta'}
                              {isRetiro && ' • Retiro de meta'}
                            </p>
                          </div>
                          <div className={`${styles.itemAmount} ${
                            isAporte || isRetiro ? '' : (m.tipo === 'ingreso' ? styles.amountPos : styles.amountNeg)
                          }`}>
                            {m.tipo === 'ingreso' ? '+' : '-'}{formatMonto(m.monto, m.moneda)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}
