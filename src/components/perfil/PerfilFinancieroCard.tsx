import React, { useEffect, useState } from 'react'
import { 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  CreditCard, 
  Calendar, 
  Activity, 
  PieChart 
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

const toClassName = (nivel: string) =>
  nivel.charAt(0).toUpperCase() + nivel.slice(1).replace(/_([a-z])/g, (_, g: string) => g.toUpperCase())

interface PerfilFinancieroCardProps {
  moneda?: 'ARS' | 'USD';
}

export const PerfilFinancieroCard: React.FC<PerfilFinancieroCardProps> = ({ moneda = 'ARS' }) => {
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

  const INDICADORES_PERFIL = [
    'tasa_ahorro_ars',
    'tasa_ahorro_usd',
    'score_impulsividad_ars',
    'score_impulsividad_usd',
    'ratio_cuotas_ars',
    'ratio_cuotas_usd',
    'cumplimiento_presupuesto',
    'consistencia_registro',
    'porcentaje_suscripciones_ars',
    'porcentaje_suscripciones_usd',
  ] as const

  const todosSinDatos = perfil
    ? INDICADORES_PERFIL.every(
        (key) => perfil.interpretaciones[key].nivel === 'sin_datos'
      )
    : false

  if (todosSinDatos) return null

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

  const { interpretaciones } = perfil

  const wTasaAhorroArs = Math.max(0, Math.min(100, perfil.tasa_ahorro_ars !== null ? perfil.tasa_ahorro_ars * 100 : 0))
  const wTasaAhorroUsd = Math.max(0, Math.min(100, perfil.tasa_ahorro_usd !== null ? perfil.tasa_ahorro_usd * 100 : 0))
  const wImpulsividadArs = perfil.score_impulsividad_ars !== null ? perfil.score_impulsividad_ars : 0
  const wImpulsividadUsd = perfil.score_impulsividad_usd !== null ? perfil.score_impulsividad_usd : 0
  const wRatioCuotasArs = Math.max(0, Math.min(100, perfil.ratio_cuotas_ars !== null ? perfil.ratio_cuotas_ars * 100 : 0))
  const wRatioCuotasUsd = Math.max(0, Math.min(100, perfil.ratio_cuotas_usd !== null ? perfil.ratio_cuotas_usd * 100 : 0))
  
  const wConsistencia = perfil.consistencia_registro !== null ? perfil.consistencia_registro * 100 : 0
  const wCumplimiento = perfil.cumplimiento_presupuesto !== null ? perfil.cumplimiento_presupuesto * 100 : 0
  
  const wSuscripcionesArs = Math.max(0, Math.min(100, perfil.porcentaje_suscripciones_ars !== null ? perfil.porcentaje_suscripciones_ars * 100 : 0))
  const wSuscripcionesUsd = Math.max(0, Math.min(100, perfil.porcentaje_suscripciones_usd !== null ? perfil.porcentaje_suscripciones_usd * 100 : 0))

  const barCSS = [
    `.pf-bar-1-ars{width:${wTasaAhorroArs.toFixed(2)}%}`,
    `.pf-bar-1-usd{width:${wTasaAhorroUsd.toFixed(2)}%}`,
    `.pf-bar-2-ars{width:${wImpulsividadArs.toFixed(2)}%}`,
    `.pf-bar-2-usd{width:${wImpulsividadUsd.toFixed(2)}%}`,
    `.pf-bar-3-ars{width:${wRatioCuotasArs.toFixed(2)}%}`,
    `.pf-bar-3-usd{width:${wRatioCuotasUsd.toFixed(2)}%}`,
    `.pf-bar-4{width:${wConsistencia.toFixed(2)}%}`,
    `.pf-bar-5{width:${wCumplimiento.toFixed(2)}%}`,
    `.pf-bar-6-ars{width:${wSuscripcionesArs.toFixed(2)}%}`,
    `.pf-bar-6-usd{width:${wSuscripcionesUsd.toFixed(2)}%}`,
  ].join('')

  return (
    <div className={styles.pfCard}>
      <style>{barCSS}</style>

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

      {/* Grid Superior: 3 Indicadores Principales */}
      <div className={styles.pfGrid}>
        {/* Indicador 1: Tasa de Ahorro */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Tasa de ahorro</span>
            <TrendingUp size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {moneda === 'ARS'
                ? (perfil.tasa_ahorro_ars !== null ? `${Math.round(perfil.tasa_ahorro_ars * 100)}%` : '—')
                : (perfil.tasa_ahorro_usd !== null ? `${Math.round(perfil.tasa_ahorro_usd * 100)}%` : '—')
              }
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(moneda === 'ARS' ? interpretaciones.tasa_ahorro_ars.nivel : interpretaciones.tasa_ahorro_usd.nivel)]}`}>
              {moneda === 'ARS' ? interpretaciones.tasa_ahorro_ars.label : interpretaciones.tasa_ahorro_usd.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(moneda === 'ARS' ? interpretaciones.tasa_ahorro_ars.nivel : interpretaciones.tasa_ahorro_usd.nivel)]} pf-bar-1-${moneda.toLowerCase()}`} />
            </div>
          </div>
        </div>

        {/* Indicador 2: Impulsividad */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Impulsividad</span>
            <Zap size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {moneda === 'ARS'
                ? (perfil.score_impulsividad_ars !== null ? `${perfil.score_impulsividad_ars}/100` : '—')
                : (perfil.score_impulsividad_usd !== null ? `${perfil.score_impulsividad_usd}/100` : '—')
              }
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(moneda === 'ARS' ? interpretaciones.score_impulsividad_ars.nivel : interpretaciones.score_impulsividad_usd.nivel)]}`}>
              {moneda === 'ARS' ? interpretaciones.score_impulsividad_ars.label : interpretaciones.score_impulsividad_usd.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(moneda === 'ARS' ? interpretaciones.score_impulsividad_ars.nivel : interpretaciones.score_impulsividad_usd.nivel)]} pf-bar-2-${moneda.toLowerCase()}`} />
            </div>
          </div>
        </div>

        {/* Indicador 3: Carga de Cuotas */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Carga de cuotas</span>
            <CreditCard size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {moneda === 'ARS'
                ? (perfil.ratio_cuotas_ars !== null ? `${Math.round(perfil.ratio_cuotas_ars * 100)}%` : '—')
                : (perfil.ratio_cuotas_usd !== null ? `${Math.round(perfil.ratio_cuotas_usd * 100)}%` : '—')
              }
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(moneda === 'ARS' ? interpretaciones.ratio_cuotas_ars.nivel : interpretaciones.ratio_cuotas_usd.nivel)]}`}>
              {moneda === 'ARS' ? interpretaciones.ratio_cuotas_ars.label : interpretaciones.ratio_cuotas_usd.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(moneda === 'ARS' ? interpretaciones.ratio_cuotas_ars.nivel : interpretaciones.ratio_cuotas_usd.nivel)]} pf-bar-3-${moneda.toLowerCase()}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Consistencia, Presupuestos y Suscripciones */}
      <div className={styles.pfBottomRow}>
        {/* Indicador 4: Consistencia de Registro */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Consistencia de registro</span>
            <Activity size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfil.consistencia_registro !== null ? `${Math.round(perfil.consistencia_registro * 100)}%` : '—'}
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(interpretaciones.consistencia_registro.nivel)]}`}>
              {interpretaciones.consistencia_registro.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(interpretaciones.consistencia_registro.nivel)]} pf-bar-4`} />
            </div>
          </div>
        </div>

        {/* Indicador 5: Cumplimiento de Presupuestos */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Uso de presupuestos</span>
            <PieChart size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {perfil.cumplimiento_presupuesto !== null ? `${Math.round(perfil.cumplimiento_presupuesto * 100)}%` : '—'}
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(interpretaciones.cumplimiento_presupuesto.nivel)]}`}>
              {interpretaciones.cumplimiento_presupuesto.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(interpretaciones.cumplimiento_presupuesto.nivel)]} pf-bar-5`} />
            </div>
          </div>
        </div>

        {/* Indicador 6: Suscripciones */}
        <div className={styles.pfIndicatorBox}>
          <div className={styles.pfIndicatorHeader}>
            <span className={styles.pfIndicatorLabel}>Gasto en suscripciones</span>
            <Calendar size={18} color="var(--text-3)" />
          </div>
          <div className={styles.pfIndicatorValueRow}>
            <span className={styles.pfIndicatorValue}>
              {moneda === 'ARS'
                ? (perfil.porcentaje_suscripciones_ars !== null ? `${Math.round(perfil.porcentaje_suscripciones_ars * 100)}%` : '—')
                : (perfil.porcentaje_suscripciones_usd !== null ? `${Math.round(perfil.porcentaje_suscripciones_usd * 100)}%` : '—')
              }
            </span>
            <span className={`${styles.pfBadge} ${styles['pfNivel' + toClassName(moneda === 'ARS' ? interpretaciones.porcentaje_suscripciones_ars.nivel : interpretaciones.porcentaje_suscripciones_usd.nivel)]}`}>
              {moneda === 'ARS' ? interpretaciones.porcentaje_suscripciones_ars.label : interpretaciones.porcentaje_suscripciones_usd.label}
            </span>
            <div className={styles.pfProgressTrack}>
              <div className={`${styles.pfProgressBar} ${styles['pfProgress' + toClassName(moneda === 'ARS' ? interpretaciones.porcentaje_suscripciones_ars.nivel : interpretaciones.porcentaje_suscripciones_usd.nivel)]} pf-bar-6-${moneda.toLowerCase()}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
