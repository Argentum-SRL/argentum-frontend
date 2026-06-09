import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Calendar,
  ChevronRight,
  Plus,
  Trash2,
  Target
} from 'lucide-react'
import styles from './MetaDetallePage.module.css'
import goalsService from '@/services/goals.service'
import billeteraService from '@/services/billetera.service'
import type { Goal, GoalAnalytics as IGoalAnalytics } from '@/types/goals'
import type { Billetera } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { Button } from '@/components/ui'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

export default function MetaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { open, confirm } = useModal()

  const [goal, setGoal] = useState<Goal | null>(null)
  const [analytics, setAnalytics] = useState<IGoalAnalytics | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'analytics' | 'settings'>('overview')
  
  const datosGrafico = useMemo(() => {
    if (!analytics?.chart_data) return []
    return analytics.chart_data
  }, [analytics?.chart_data])
  
  const iconRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (goal) {
      if (iconRef.current) {
        iconRef.current.style.backgroundColor = goal.color || '#3B82F6'
      }
      if (activeTab === 'overview' && progressBarRef.current && analytics) {
        progressBarRef.current.style.width = `${Math.min(analytics.porcentaje_progreso, 100)}%`
        progressBarRef.current.style.backgroundColor = goal.color || '#3B82F6'
      }
    }
  }, [goal, activeTab, analytics])

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!id) return
    try {
      const [goalData, analyticsData, billsData] = await Promise.all([
        goalsService.getGoal(id, signal),
        goalsService.getAnalytics(id, signal),
        billeteraService.list(signal)
      ])
      if (signal?.aborted) return
      setGoal(goalData)
      setAnalytics(analyticsData)
      setBilleteras(billsData)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      showToast('Error al cargar detalle de la meta', 'error')
      navigate('/app/metas')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [id, navigate, showToast])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      await fetchData(controller.signal)
    }
    load()
    return () => {
      controller.abort()
    }
  }, [fetchData])

  const handleContribute = () => {
    if (!goal) return
    open('goalContribution', {
      data: {
        goal,
        billeteras,
        onSuccess: fetchData
      }
    })
  }

  const handleEdit = () => {
    if (!goal) return
    open('goal', {
      data: {
        goal,
        onSuccess: fetchData
      }
    })
  }

  const handleDelete = () => {
    if (!goal) return
    
    if (goal.monto_actual > 0) {
      showToast('No podés eliminar una meta que aún tiene fondos. Retirá el dinero primero.', 'info')
      return
    }

    confirm({
      title: 'Eliminar Meta',
      description: `¿Estás seguro de que querés eliminar "${goal.nombre}"? No se eliminará el dinero de tus billeteras, pero el historial de esta meta se perderá.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await goalsService.deleteGoal(goal.id)
          showToast('Meta eliminada correctamente', 'success')
          navigate('/app/metas')
        } catch (err: unknown) {
          const error = err as import('axios').AxiosError<{ detail: unknown }>
          const detail = (error.response?.data?.detail as string) || 'Error al eliminar meta'
          showToast(typeof detail === 'string' ? detail : 'Error al eliminar meta', 'error')
        }
      }
    })
  }

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>
  }

  if (!goal || !analytics) return null

  return (
    <div className={styles.page}>
      
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <div className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/app/metas')}>
          <ArrowLeft size={20} />
          <span>Volver a Metas</span>
        </button>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <div ref={iconRef} className={styles.iconContainer}>
            <Target size={24} color="white" />
          </div>
          <div className={styles.textContainer}>
            <h1 className={styles.title}>{goal.nombre}</h1>
            <div className={styles.statusRow}>
              <span className={styles.statusBadge}>{goal.estado}</span>
              <span className={styles.currencyBadge}>{goal.moneda}</span>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleContribute}>
            <Plus size={18} />
            Aportar
          </button>
          <button className={styles.btn} onClick={handleEdit} title="Configuración de la meta">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart size={16} /> Vista General
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={16} /> Actividad
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} /> Proyecciones
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} /> Configuración
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className={styles.content}>
        
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <div className={styles.mainCard}>
              <div className={styles.progressDetail}>
                <div className={styles.progressValues}>
                  <div className={styles.valGroup}>
                    <span className={styles.valLabel}>Ahorrado</span>
                    <span className={styles.valBig}>{formatMonto(goal.monto_actual, goal.moneda as 'ARS' | 'USD')}</span>
                  </div>
                  <div className={`${styles.valGroup} ${styles.valGroupRight}`}>
                    <span className={styles.valLabel}>Objetivo</span>
                    <span className={styles.valBig}>{formatMonto(goal.monto_objetivo, goal.moneda as 'ARS' | 'USD')}</span>
                  </div>
                </div>
                <div className={styles.progressBarFull}>
                  <div ref={progressBarRef} className={styles.progressBarInner} />
                </div>
                <div className={styles.progressStats}>
                  <span>Faltan {formatMonto(analytics.monto_faltante, goal.moneda as 'ARS' | 'USD')}</span>
                  <span>{analytics.porcentaje_progreso.toFixed(1)}% completado</span>
                </div>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <TrendingUp size={20} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Ahorro mensual prom.</span>
                <span className={styles.metricValue}>{formatMonto(analytics.velocidad_mensual, goal.moneda as 'ARS' | 'USD')}</span>
              </div>
              <div className={styles.metricCard}>
                <Calendar size={20} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Finalización estimada</span>
                <span className={styles.metricValue}>
                  {analytics.fecha_estimada_finalizacion ? formatFecha(analytics.fecha_estimada_finalizacion) : 'Faltan aportes'}
                </span>
              </div>
              <div className={styles.metricCard}>
                <ChevronRight size={20} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Meses restantes</span>
                <span className={styles.metricValue}>
                  {analytics.meses_restantes ? Math.ceil(analytics.meses_restantes) : 'Indefinido'}
                </span>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Evolución del ahorro</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={datosGrafico}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={goal.color || '#3B82F6'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={goal.color || '#3B82F6'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="monto" 
                      stroke={goal.color || '#3B82F6'} 
                      fillOpacity={1} 
                      fill="url(#colorMonto)" 
                      strokeWidth={3}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.activityList}>
             {/* Listado de movimientos */}
             {goal.movimientos && goal.movimientos.length > 0 ? (
               goal.movimientos.map((m) => (
                 <div key={m.id} className={styles.activityItem}>
                   <div className={`${styles.activityIcon} ${m.tipo === 'aporte' ? styles.iconAporte : styles.iconRetiro}`}>
                     {m.tipo === 'aporte' ? <Plus size={16} /> : <Trash2 size={16} />}
                   </div>
                   <div className={styles.activityInfo}>
                     <span className={styles.activityType}>
                       {m.tipo === 'aporte' ? 'Aporte desde' : 'Retiro hacia'} {m.billetera?.nombre}
                     </span>
                     <span className={styles.activityDate}>{formatFecha(m.fecha)}</span>
                   </div>
                   <div className={`${styles.activityAmount} ${m.tipo === 'aporte' ? styles.amountPositive : styles.amountNegative}`}>
                     {m.tipo === 'aporte' ? '+' : '-'}{formatMonto(m.monto, m.moneda_movimiento as 'ARS' | 'USD')}
                   </div>
                 </div>
               ))
             ) : (
               <div className={styles.emptyActivity}>No hay movimientos registrados</div>
             )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsSection}>
            <p>Sección de proyecciones avanzadas próximamente...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsSection}>
            <div className={styles.settingsCard}>
              <h3>Zona de Peligro</h3>
              <p>Una vez eliminada la meta, no se puede recuperar el historial de movimientos.</p>
              <Button variant="outline" onClick={handleDelete}>Eliminar Meta Definitivamente</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
