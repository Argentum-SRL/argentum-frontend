import React, { useEffect, useState } from 'react'
import { 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  Activity, 
  ShieldCheck,
  Coffee
} from 'lucide-react'
import { getPerfilFinanciero, recalcularPerfilFinanciero } from '@/services/perfilFinanciero.service'
import type { PerfilFinancieroConInterpretaciones } from '@/types'
import styles from './PerfilFinancieroCard.module.css'

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return 'Nunca'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Hace instantes'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} días`
  } catch {
    return 'Recientemente'
  }
}

interface PerfilFinancieroCardProps {
  moneda?: 'ARS' | 'USD'
}

export const PerfilFinancieroCard: React.FC<PerfilFinancieroCardProps> = () => {
  const [perfil, setPerfil] = useState<PerfilFinancieroConInterpretaciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const loadData = async (signal?: AbortSignal) => {
    setError(false)
    try {
      const data = await getPerfilFinanciero(signal)
      setPerfil(data)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error al cargar perfil financiero:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return
      void loadData(controller.signal)
    }
    void run()
    return () => {
      controller.abort()
    }
  }, [])

  const handleRecalcular = async () => {
    setRefreshing(true)
    try {
      const data = await recalcularPerfilFinanciero()
      setPerfil(data)
    } catch (err) {
      console.error('Error al recalcular perfil financiero:', err)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.pfLoadingContainer}>
        <RefreshCw className={`${styles.pfSpin} animate-spin`} size={32} color="var(--primary)" />
        <p className={styles.pfLoadingText}>Analizando tu comportamiento financiero...</p>
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className={styles.pfErrorContainer}>
        <AlertCircle size={40} color="var(--error)" />
        <p className={styles.pfErrorText}>
          <strong>Por ahora no podemos mostrar tu perfil financiero.</strong>
          <br />
          <span className={styles.pfErrorSubtext}>
            Puede ser algo temporal. Esperá unos minutos y volvé a intentarlo.
          </span>
        </p>
        <button className={styles.pfRetryBtn} onClick={() => { setLoading(true); void loadData(); }}>
          Reintentar
        </button>
      </div>
    )
  }

  const perfilNuevo = perfil.perfil_nuevo

  // Estado de datos insuficientes (< 3 ciclos)
  if (!perfilNuevo.datos_suficientes) {
    const ciclos = perfilNuevo.ciclos_con_datos || 0
    const pct = Math.min(100, Math.round((ciclos / 3) * 100))
    return (
      <div className={styles.pfCard}>
        <div className={styles.pfCardHeader}>
          <div className={styles.pfHeaderLeft}>
            <h2 className={styles.pfTitle}>Tu perfil financiero</h2>
            <span className={styles.pfUpdateTime}>
              Última actualización: {formatRelativeTime(perfil.ultima_actualizacion)}
            </span>
          </div>
          <button 
            className={`${styles.pfRefreshBtn} ${refreshing ? styles.pfRefreshBtnDisabled : ''}`} 
            onClick={handleRecalcular}
            disabled={refreshing}
            aria-label="Actualizar perfil financiero"
          >
            <RefreshCw className={refreshing ? styles.pfSpin : ''} size={15} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>

        <div className={styles.pfInsufficientContainer}>
          <Calendar className={styles.pfInsufficientIcon} size={44} />
          <h3 className={styles.pfInsufficientTitle}>Construyendo tu perfil financiero</h3>
          <p className={styles.pfInsufficientText}>
            {perfilNuevo.mensaje_insuficiente || 'Se requieren al menos 3 ciclos mensuales completos de ingresos y gastos para generar métricas confiables.'}
          </p>
          <div className={styles.pfInsufficientProgress}>
            <div className={styles.pfProgressTrack}>
              <div 
                className={styles.pfProgressBar} 
                style={{ width: `${pct}%`, background: 'var(--primary)' }} 
              />
            </div>
            <div className={styles.pfInsufficientSub}>
              {ciclos} de 3 ciclos completados ({pct}%)
            </div>
          </div>
        </div>
      </div>
    )
  }

  const interps = perfilNuevo.interpretaciones_relativas || {}

  return (
    <div className={styles.pfCard}>
      {/* Header */}
      <div className={styles.pfCardHeader}>
        <div className={styles.pfHeaderLeft}>
          <h2 className={styles.pfTitle}>Tu perfil financiero</h2>
          <span className={styles.pfUpdateTime}>
            Última actualización: {formatRelativeTime(perfil.ultima_actualizacion)}
          </span>
        </div>
        <button 
          className={`${styles.pfRefreshBtn} ${refreshing ? styles.pfRefreshBtnDisabled : ''}`} 
          onClick={handleRecalcular}
          disabled={refreshing}
          aria-label="Actualizar perfil financiero"
        >
          <RefreshCw className={refreshing ? styles.pfSpin : ''} size={15} />
          <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* Grid Superior: Pilares de Salud Financiera */}
      <div className={styles.pfGrid}>
        {/* Indicador 1: Capacidad de Ahorro */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Capacidad de ahorro</span>
            <TrendingUp size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.capacidad_ahorro !== null ? `${Math.round(perfilNuevo.capacidad_ahorro * 100)}%` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.capacidad_ahorro || (perfilNuevo.capacidad_ahorro !== null ? `${Math.round(perfilNuevo.capacidad_ahorro * 100)}% de tu ingreso típico` : 'Sin datos de ingreso')}
            </span>
          </div>
        </div>

        {/* Indicador 2: Gasto Comprometido */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Gasto comprometido</span>
            <CreditCard size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.gasto_comprometido_ratio !== null ? `${Math.round(perfilNuevo.gasto_comprometido_ratio * 100)}%` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.gasto_comprometido || `${Math.round((perfilNuevo.gasto_comprometido_ratio || 0) * 100)}% de tu ingreso típico`}
            </span>
          </div>
        </div>

        {/* Indicador 3: Gasto en Hábitos */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Gasto en hábitos</span>
            <Coffee size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.gasto_habitos_ratio != null ? `${Math.round(perfilNuevo.gasto_habitos_ratio * 100)}%` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.gasto_habitos || (perfilNuevo.gasto_habitos_ratio != null ? `${Math.round(perfilNuevo.gasto_habitos_ratio * 100)}% de tu ingreso típico` : 'Sin datos')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Cobertura, Volatilidad e Ingreso */}
      <div className={styles.pfBottomRow}>
        {/* Indicador 4: Meses de Cobertura (Runway) */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Meses de cobertura</span>
            <ShieldCheck size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.runway_meses !== null ? `${perfilNuevo.runway_meses.toFixed(1)} meses` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.runway || 'Liquidez disponible sobre tu gasto mensual típico'}
            </span>
          </div>
        </div>

        {/* Indicador 5: Volatilidad de Variables */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Volatilidad de variables</span>
            <Activity size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.volatilidad_gasto_variable !== null ? `±${Math.round(perfilNuevo.volatilidad_gasto_variable * 100)}%` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.volatilidad || 'Dispersión típica respecto de tu mediana mensual'}
            </span>
          </div>
        </div>

        {/* Indicador 6: Ingreso Típico */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Ingreso típico mensual</span>
            <TrendingUp size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfilNuevo.ingreso_tipico_ars !== null ? `$${Math.round(perfilNuevo.ingreso_tipico_ars).toLocaleString('es-AR')}` : '—'}
            </span>
            <span className={styles.pfIndicatorSubtext}>
              {interps.ingreso_tipico || 'Mediana histórica deflactada'}
            </span>
          </div>
        </div>
      </div>

      {/* Advertencia metodológica si aplica */}
      {perfilNuevo.calidad_registro_advertencia && (
        <div className={styles.pfQualityNotice}>
          <AlertCircle size={18} />
          <span>{perfilNuevo.calidad_registro_advertencia}</span>
        </div>
      )}

      {/* Footer de confianza del análisis */}
      <div className={styles.pfConfidenceFooter}>
        <span>Nivel de confianza: <strong>{perfilNuevo.nivel_confianza.toUpperCase()}</strong></span>
        <span>{perfilNuevo.ciclos_con_datos} ciclos con datos observados ({Math.round(perfilNuevo.cobertura_registro * 100)}% continuidad activa)</span>
      </div>
    </div>
  )
}
