import React, { useCallback, useEffect, useState } from 'react'
import { 
  RefreshCw, 
  AlertCircle, 
  HelpCircle,
  Info
} from '@/components/ui/icons'
import { getPerfilFinanciero, recalcularPerfilFinanciero } from '@/services/perfilFinanciero.service'
import { triggerBienvenidaFinancieraOnce } from '@/utils/bienvenidaFinancieraManager'
import { useModal } from '@/hooks/useModal'
import type { PerfilFinancieroConInterpretaciones } from '@/types'
import { formatMonto } from '@/utils/format'
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

// Hook de count-up suave para valores numéricos, respetando prefers-reduced-motion
function useCountUp(target: number | null, duration = 600, decimals = 0) {
  const [current, setCurrent] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target
    }
    return target === null ? null : 0
  })

  useEffect(() => {
    if (target === null) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    let startTime: number | null = null
    let rafId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      const nextVal = progress === 1 ? target : Number((target * ease).toFixed(decimals))
      setCurrent(nextVal)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration, decimals])

  return target === null ? null : current
}

interface PerfilFinancieroCardProps {
  moneda?: 'ARS' | 'USD'
  data?: PerfilFinancieroConInterpretaciones | null
}

export const PerfilFinancieroCard: React.FC<PerfilFinancieroCardProps> = ({ data }) => {
  const [internalPerfil, setInternalPerfil] = useState<PerfilFinancieroConInterpretaciones | null>(null)
  const [internalLoading, setInternalLoading] = useState(data === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const { open } = useModal()

  const perfil = data !== undefined ? data : internalPerfil
  const loading = data !== undefined ? false : internalLoading

  const loadData = useCallback(async (signal?: AbortSignal) => {
    if (data !== undefined) return
    setError(false)
    try {
      const res = await getPerfilFinanciero(signal)
      setInternalPerfil(res)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error al cargar perfil financiero:', err)
      setError(true)
    } finally {
      setInternalLoading(false)
    }
  }, [data])

  useEffect(() => {
    if (data !== undefined) return
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
  }, [data, loadData])

  // Trigger automático de primera vez si el backend indica mostrar_modal_bienvenida
  useEffect(() => {
    if (perfil?.mostrar_modal_bienvenida) {
      triggerBienvenidaFinancieraOnce(open, 'perfil')
    }
  }, [perfil?.mostrar_modal_bienvenida, open])

  const handleRecalcular = async () => {
    setRefreshing(true)
    try {
      const res = await recalcularPerfilFinanciero()
      setInternalPerfil(res)
    } catch (err) {
      console.error('Error al recalcular perfil financiero:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // Normalización defensiva de números
  const toNum = (val: unknown): number | null => {
    if (val === null || val === undefined || val === '') return null
    const n = Number(val)
    return isNaN(n) ? null : n
  }

  const perfilNuevo = perfil?.perfil_nuevo
  const capAhorroRaw = toNum(perfilNuevo?.capacidad_ahorro)
  const gastoCompRatioRaw = toNum(perfilNuevo?.gasto_comprometido_ratio)
  const gastoHabitosRatioRaw = toNum(perfilNuevo?.gasto_habitos_ratio)
  const runwayRaw = toNum(perfilNuevo?.runway_meses)
  const volatilidadRaw = toNum(perfilNuevo?.volatilidad_gasto_variable)
  const ingresoTipicoRaw = toNum(perfilNuevo?.ingreso_tipico_ars)

  // Animaciones de count-up
  const capAhorroAnim = useCountUp(capAhorroRaw !== null ? Math.round(capAhorroRaw * 100) : null)
  const gastoCompRatioAnim = useCountUp(gastoCompRatioRaw !== null ? Math.round(gastoCompRatioRaw * 100) : null)
  const gastoHabitosRatioAnim = useCountUp(gastoHabitosRatioRaw !== null ? Math.round(gastoHabitosRatioRaw * 100) : null)
  const runwayAnim = useCountUp(runwayRaw !== null ? Number(runwayRaw.toFixed(1)) : null, 600, 1)
  const volatilidadAnim = useCountUp(volatilidadRaw !== null ? Math.round(volatilidadRaw * 100) : null)
  const ingresoTipicoAnim = useCountUp(ingresoTipicoRaw !== null ? Math.round(ingresoTipicoRaw) : null)

  if (loading || error || !perfil || !perfilNuevo) {
    return null
  }

  // Si no corresponde mostrar la card (< 3 ciclos de historia), no renderizar nada
  const mostrarCard = perfilNuevo.mostrar_card ?? (perfil.mostrar_card ?? perfilNuevo.datos_suficientes)
  if (!mostrarCard) {
    return null
  }

  const interps = perfilNuevo.interpretaciones_relativas || {}
  const cobertura = toNum(perfilNuevo.cobertura_registro)
  const ciclos = perfilNuevo.ciclos_con_datos ?? perfilNuevo.ciclos_observados ?? 0
  const confianza = (perfilNuevo.nivel_confianza || 'en evaluación').toUpperCase()

  // Lista de las 6 métricas protagónicas
  const metrics = [
    {
      id: 'ahorro',
      title: 'Ahorro',
      valueElement: capAhorroAnim !== null ? `${capAhorroAnim}%` : '—',
      displayValue: capAhorroRaw !== null ? `${Math.round(capAhorroRaw * 100)}%` : 'Sin datos',
      statusClass: capAhorroRaw === null ? styles.statusNeutral : (capAhorroRaw >= 0.2 ? styles.statusGood : (capAhorroRaw >= 0.1 ? styles.statusNeutral : (capAhorroRaw >= 0 ? styles.statusWarning : styles.statusCritical))),
      statusText: capAhorroRaw === null ? 'Sin datos' : (capAhorroRaw >= 0.2 ? 'Saludable' : (capAhorroRaw >= 0.1 ? 'Moderado' : (capAhorroRaw >= 0 ? 'Bajo' : 'Déficit'))),
      tooltip: interps.capacidad_ahorro || (capAhorroRaw !== null ? `${Math.round(capAhorroRaw * 100)}% de tu ingreso típico regular.` : 'Sin datos suficientes de ingreso.')
    },
    {
      id: 'comprometido',
      title: 'Comprometido',
      valueElement: gastoCompRatioAnim !== null ? `${gastoCompRatioAnim}%` : '—',
      displayValue: gastoCompRatioRaw !== null ? `${Math.round(gastoCompRatioRaw * 100)}%` : 'Sin datos',
      statusClass: gastoCompRatioRaw === null ? styles.statusNeutral : (gastoCompRatioRaw <= 0.4 ? styles.statusGood : (gastoCompRatioRaw <= 0.55 ? styles.statusNeutral : styles.statusWarning)),
      statusText: gastoCompRatioRaw === null ? 'Sin datos' : (gastoCompRatioRaw <= 0.4 ? 'Bajo control' : (gastoCompRatioRaw <= 0.55 ? 'Moderado' : 'Elevado')),
      tooltip: interps.gasto_comprometido || (gastoCompRatioRaw !== null ? `${Math.round(gastoCompRatioRaw * 100)}% de tu ingreso típico comprometido en costos fijos.` : 'Sin compromisos registrados.')
    },
    {
      id: 'habitos',
      title: 'Hábitos',
      valueElement: gastoHabitosRatioAnim !== null ? `${gastoHabitosRatioAnim}%` : '—',
      displayValue: gastoHabitosRatioRaw !== null ? `${Math.round(gastoHabitosRatioRaw * 100)}%` : 'Sin datos',
      statusClass: gastoHabitosRatioRaw === null ? styles.statusNeutral : (gastoHabitosRatioRaw <= 0.15 ? styles.statusGood : (gastoHabitosRatioRaw <= 0.3 ? styles.statusNeutral : styles.statusWarning)),
      statusText: gastoHabitosRatioRaw === null ? 'Sin datos' : (gastoHabitosRatioRaw <= 0.15 ? 'Controlado' : (gastoHabitosRatioRaw <= 0.3 ? 'Moderado' : 'Flexible')),
      tooltip: interps.gasto_habitos || (gastoHabitosRatioRaw !== null ? `${Math.round(gastoHabitosRatioRaw * 100)}% de tu ingreso típico en consumos recurrentes.` : 'Sin consumos de hábitos detectados.')
    },
    {
      id: 'cobertura',
      title: 'Cobertura',
      valueElement: (
        <>
          {runwayAnim !== null ? runwayAnim.toFixed(1) : '—'}
          <small>meses</small>
        </>
      ),
      displayValue: runwayRaw !== null ? `${runwayRaw.toFixed(1)} meses` : 'Sin datos',
      statusClass: runwayRaw === null ? styles.statusNeutral : (runwayRaw >= 3 ? styles.statusGood : (runwayRaw >= 1.5 ? styles.statusNeutral : styles.statusWarning)),
      statusText: runwayRaw === null ? 'Sin datos' : (runwayRaw >= 3 ? 'Óptimo' : (runwayRaw >= 1.5 ? 'Adecuado' : 'Ajustado')),
      tooltip: interps.runway || 'Liquidez disponible sobre tu gasto mensual típico.'
    },
    {
      id: 'volatilidad',
      title: 'Volatilidad',
      valueElement: volatilidadAnim !== null ? `±${volatilidadAnim}%` : '—',
      displayValue: volatilidadRaw !== null ? `±${Math.round(volatilidadRaw * 100)}%` : 'Sin datos',
      statusClass: volatilidadRaw === null ? styles.statusNeutral : (volatilidadRaw <= 0.15 ? styles.statusGood : (volatilidadRaw <= 0.3 ? styles.statusNeutral : styles.statusWarning)),
      statusText: volatilidadRaw === null ? 'Sin datos' : (volatilidadRaw <= 0.15 ? 'Estable' : (volatilidadRaw <= 0.3 ? 'Moderada' : 'Alta')),
      tooltip: interps.volatilidad || 'Dispersión típica respecto de tu mediana mensual.'
    },
    {
      id: 'ingreso_tipico',
      title: 'Ingreso Típico',
      valueElement: ingresoTipicoAnim !== null ? formatMonto(ingresoTipicoAnim, 'ARS') : '—',
      displayValue: ingresoTipicoRaw !== null ? formatMonto(ingresoTipicoRaw, 'ARS') : 'Sin datos',
      statusClass: styles.statusNeutral,
      statusText: 'Mediana',
      tooltip: interps.ingreso_tipico || 'Mediana histórica deflactada.'
    }
  ]

  return (
    <div className={styles.pfCard}>
      {/* Header Compacto */}
      <div className={styles.pfCardHeader}>
        <div className={styles.pfHeaderLeft}>
          <h2 className={styles.pfTitle}>Tu perfil financiero</h2>
          <span className={styles.pfConfidenceBadge}>
            Confianza: <strong>{confianza}</strong>
            {ciclos > 0 && ` • ${ciclos} ciclos`}
            {cobertura !== null && ` (${Math.round(cobertura * 100)}% continuidad)`}
          </span>
        </div>
        <div className={styles.pfHeaderRight}>
          <span className={styles.pfUpdateTime}>
            {formatRelativeTime(perfil.ultima_actualizacion)}
          </span>
          <button 
            type="button"
            className={styles.pfInfoBtn}
            onClick={() => open('bienvenidaFinanciera', { data: { initialTab: 'perfil' } })}
            title="Ver explicación de tu perfil financiero"
            aria-label="Ver explicación de tu perfil financiero"
          >
            <Info size={14} />
          </button>
          <button 
            className={`${styles.pfRefreshBtn} ${refreshing ? styles.pfRefreshBtnDisabled : ''}`} 
            onClick={handleRecalcular}
            disabled={refreshing}
            aria-label="Actualizar perfil financiero"
          >
            <RefreshCw className={refreshing ? styles.pfSpin : ''} size={13} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Tira Panorámica de 6 KPIs (Propuesta PF-1) */}
      <div className={styles.pfMetricsStrip} role="list" aria-label="Métricas del perfil financiero">
        {metrics.map((kpi) => (
          <div 
            key={kpi.id}
            className={styles.pfKpiCell} 
            tabIndex={0} 
            role="listitem"
            aria-label={`${kpi.title}: ${kpi.displayValue}. ${kpi.tooltip}`}
          >
            <div className={styles.pfKpiLabelRow}>
              <span className={styles.pfKpiLabel}>
                {kpi.title}
              </span>
              <HelpCircle size={12} className={styles.pfInfoIcon} aria-hidden="true" />
            </div>
            <div className={styles.pfKpiValue}>
              {kpi.valueElement}
            </div>
            <span className={`${styles.pfKpiStatusBadge} ${kpi.statusClass}`}>
              {kpi.statusText}
            </span>
            <div className={styles.pfTooltip} role="tooltip">
              <span className={styles.pfTooltipHeader}>{kpi.title}</span>
              {kpi.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* Advertencia metodológica si aplica */}
      {perfilNuevo.calidad_registro_advertencia && (
        <div className={styles.pfQualityNotice} role="alert">
          <AlertCircle size={15} />
          <span>{perfilNuevo.calidad_registro_advertencia}</span>
        </div>
      )}
    </div>
  )
}
