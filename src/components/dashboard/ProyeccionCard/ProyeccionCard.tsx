import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react'
import { TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { formatMonto } from '@/utils/format'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { dashboardService } from '@/services/dashboard.service'
import type { Proyeccion, ProyeccionesResponse } from '@/types'
import styles from './ProyeccionCard.module.css'
import { useModal } from '@/hooks/useModal'
import { hasProyeccionVisible } from './proyeccionUtils'

const ProgressBar = ({ progress }: { progress: number }) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${progress}%`
    }
  }, [progress])

  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} ref={ref} />
    </div>
  )
}

// Hook count-up suave para valores numéricos, respetando prefers-reduced-motion
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

interface SingleProyeccionCardProps {
  proyeccion: Proyeccion;
  moneda: 'ARS' | 'USD';
}

const SingleProyeccionCard: React.FC<SingleProyeccionCardProps> = ({ proyeccion, moneda }) => {
  const [expanded, setExpanded] = useState(false)
  const { open } = useModal()

  const pasaPuerta = Boolean(
    proyeccion.calibracion?.pasa_puerta &&
    proyeccion.datos_suficientes &&
    proyeccion.gasto_proyectado_total !== null
  )

  const { progressPercent, actualGasto } = useMemo(() => {
    if (!proyeccion.desglose_por_categoria || proyeccion.gasto_proyectado_total === null) {
      return { progressPercent: 0, actualGasto: 0 }
    }
    const actual = proyeccion.desglose_por_categoria.reduce((acc, cat) => acc + (cat.gasto_actual_ciclo > 0 ? cat.gasto_actual_ciclo : 0), 0)
    const totalProyectado = proyeccion.gasto_proyectado_total > 0 ? proyeccion.gasto_proyectado_total : 1
    const percent = Math.max(0, Math.min(Math.round((actual / totalProyectado) * 100), 100))
    return { progressPercent: percent, actualGasto: actual }
  }, [proyeccion])

  const {
    gasto_proyectado_total,
    balance_proyectado,
    desglose_por_categoria,
    certezas,
    rango,
    mensaje_insuficiente,
    intervalos,
  } = proyeccion

  // Count-up animations
  const totalCertezasAnim = useCountUp(certezas.total ?? 0)
  const gastoAnim = useCountUp(gasto_proyectado_total)
  const balanceAnim = useCountUp(balance_proyectado)

  return (
    <div className={styles.card}>
      {/* Header Compacto */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <TrendingUp size={18} className={styles.titleIcon} />
          <h2>Proyección del ciclo ({moneda})</h2>
          {pasaPuerta && proyeccion.calibracion?.pasa_puerta ? (
            <span className={styles.badgeCalibration}>
              Calibrada: {Math.round((proyeccion.calibracion.cobertura_80 ?? 0.8) * 100)}% ({proyeccion.calibracion.ciclos_evaluados} ciclos)
            </span>
          ) : (
            <span className={styles.badgeNotice}>
              Compromisos ciertos
            </span>
          )}
        </div>
        <button 
          className={styles.infoButton} 
          onClick={() => open('bienvenidaFinanciera', { data: { initialTab: 'proyeccion' } })}
          title={`Ver explicación de la proyección en ${moneda}`}
          aria-label={`Ver explicación de la proyección en ${moneda}`}
        >
          <Info size={18} />
        </button>
      </div>

      {/* Caso No Calibrada / Compromisos Ciertos (testingadmin real hoy) */}
      {!pasaPuerta ? (
        <>
          <div className={styles.noticeBox} role="status">
            <span>{proyeccion.mensaje || mensaje_insuficiente || proyeccion.calibracion?.mensaje || 'Mostramos tus compromisos ciertos (cuotas y suscripciones).'}</span>
          </div>

          <div className={styles.certezasCompactHero}>
            <div className={styles.certezasHeroHeader}>
              <span className={styles.certezasHeroLabel}>Total compromisos del ciclo</span>
              <div className={styles.certezasHeroTotal}>
                {formatMonto(totalCertezasAnim ?? certezas.total, moneda)}
              </div>
            </div>

            <div className={styles.certezasPillsTrack}>
              <div className={styles.certezaPillItem}>
                <span className={styles.certezaPillLabel}>Cuotas pendientes</span>
                <span className={styles.certezaPillValue}>{formatMonto(certezas.cuotas_restantes, moneda)}</span>
              </div>
              <div className={styles.certezaPillItem}>
                <span className={styles.certezaPillLabel}>Suscripciones</span>
                <span className={styles.certezaPillValue}>{formatMonto(certezas.suscripciones_restantes, moneda)}</span>
              </div>
              {(certezas.compromisos_restantes ?? 0) > 0 && (
                <div className={styles.certezaPillItem}>
                  <span className={styles.certezaPillLabel}>Otros compromisos</span>
                  <span className={styles.certezaPillValue}>{formatMonto(certezas.compromisos_restantes ?? 0, moneda)}</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Caso Calibrada / Proyección Completa (Propuesta PROY-1 Split Hero) */
        <>
          <div className={styles.splitHero}>
            <div className={styles.heroMetric}>
              <span className={styles.heroLabel}>Gasto proyectado</span>
              <div className={styles.heroValue}>
                {formatMonto(gastoAnim ?? (gasto_proyectado_total ?? 0), moneda)}
              </div>
              <span className={styles.heroSubtext}>
                Rango 80%: {formatMonto(rango?.piso ?? 0, moneda)} a {formatMonto(rango?.techo ?? 0, moneda)}
              </span>
            </div>

            <div className={styles.heroMetric}>
              <span className={styles.heroLabel}>Balance estimado</span>
              <div className={`${styles.heroValue} ${(balance_proyectado ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                {formatMonto(balanceAnim ?? (balance_proyectado ?? 0), moneda)}
              </div>
              <span className={`${styles.heroSubtext} ${(balance_proyectado ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                {(balance_proyectado ?? 0) >= 0 ? 'Superávit probable' : 'Déficit probable'}
              </span>
            </div>
          </div>

          <div className={styles.paceContainer}>
            <div className={styles.paceHeader}>
              <span>
                Consumido {formatMonto(actualGasto, moneda)} de {formatMonto(gasto_proyectado_total ?? 0, moneda)}
                {proyeccion.periodo?.dias_restantes !== undefined && ` • Restan ${proyeccion.periodo.dias_restantes} días`}
              </span>
              <span className={styles.pacePercent}>{progressPercent}%</span>
            </div>
            <ProgressBar progress={progressPercent} />
          </div>

          <button 
            className={styles.accordionToggle} 
            onClick={() => setExpanded(prev => !prev)}
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Ocultar desglose e intervalos' : 'Ver desglose e intervalos'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className={`${styles.accordionGrid} ${expanded ? styles.accordionGridOpen : ''}`}>
            <div className={styles.accordionInner}>
              {intervalos && (
                <div className={styles.intervalosRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className={styles.sectionTitle}>Intervalos de probabilidad calibrados</h3>
                    {proyeccion.calibracion && (
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        Validado: {Math.round((proyeccion.calibracion.cobertura_80 ?? 0.8) * 100)}% ({proyeccion.calibracion.ciclos_evaluados} ciclos)
                      </span>
                    )}
                  </div>
                  <div className={styles.intervalosGrid}>
                    <div className={styles.intervaloPill}>
                      <span className={styles.intervaloPillLabel}>Nivel 50%</span>
                      <span className={styles.intervaloPillValue}>
                        {formatMonto(intervalos.intervalo_50.piso, moneda)} - {formatMonto(intervalos.intervalo_50.techo, moneda)}
                      </span>
                    </div>
                    <div className={styles.intervaloPill}>
                      <span className={styles.intervaloPillLabel}>Nivel 80%</span>
                      <span className={styles.intervaloPillValue}>
                        {formatMonto(intervalos.intervalo_80.piso, moneda)} - {formatMonto(intervalos.intervalo_80.techo, moneda)}
                      </span>
                    </div>
                    <div className={styles.intervaloPill}>
                      <span className={styles.intervaloPillLabel}>Nivel 95%</span>
                      <span className={styles.intervaloPillValue}>
                        {formatMonto(intervalos.intervalo_95.piso, moneda)} - {formatMonto(intervalos.intervalo_95.techo, moneda)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {desglose_por_categoria && desglose_por_categoria.length > 0 && (
                <div className={styles.categoryList}>
                  <h3 className={styles.sectionTitle}>Gasto por categoría</h3>
                  {desglose_por_categoria.map((cat, i) => {
                    const catActual = cat.gasto_actual_ciclo > 0 ? cat.gasto_actual_ciclo : 0
                    const catTotal = cat.proyectado > 0 ? cat.proyectado : 1
                    const catProgress = Math.max(0, Math.min(Math.round((catActual / catTotal) * 100), 100))
                    
                    return (
                      <div key={cat.categoria_id || `cat-${i}`} className={styles.categoryRow}>
                        <div className={styles.categoryIcon}>
                          <CategoriaIcon nombre={cat.categoria_nombre} size={20} />
                        </div>
                        <div className={styles.categoryInfo}>
                          <div className={styles.categoryName}>
                            <span>{cat.categoria_nombre}</span>
                            {cat.fuera_de_patron && <span className={styles.badgePatron}>Fuera de patrón</span>}
                          </div>
                          <ProgressBar progress={catProgress} />
                        </div>
                        <div className={styles.categoryAmount}>
                          {formatMonto(cat.proyectado, moneda)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className={styles.certezasList}>
                <h3 className={styles.sectionTitle} style={{ marginBottom: '4px' }}>Compromisos fijos</h3>
                <div className={styles.certezaItem}>
                  <span>Cuotas pendientes</span>
                  <span className={styles.certezaValue}>{formatMonto(certezas.cuotas_restantes, moneda)}</span>
                </div>
                <div className={styles.certezaItem}>
                  <span>Suscripciones pendientes</span>
                  <span className={styles.certezaValue}>{formatMonto(certezas.suscripciones_restantes, moneda)}</span>
                </div>
                {(certezas.compromisos_restantes ?? 0) > 0 && (
                  <div className={styles.certezaItem}>
                    <span>Otros compromisos pendientes</span>
                    <span className={styles.certezaValue}>{formatMonto(certezas.compromisos_restantes ?? 0, moneda)}</span>
                  </div>
                )}
                <div className={`${styles.certezaItem} ${styles.certezaTotal}`}>
                  <span>Total compromisos</span>
                  <span className={`${styles.certezaValue} ${styles.certezaTotalValue}`}>
                    {formatMonto(certezas.total, moneda)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface ProyeccionCardProps {
  data?: ProyeccionesResponse | null;
  loading?: boolean;
  moneda?: 'ARS' | 'USD';
}

const ProyeccionCard: React.FC<ProyeccionCardProps> = ({ data, loading: externalLoading, moneda }) => {
  const [internalProyeccion, setInternalProyeccion] = useState<ProyeccionesResponse | null>(null)
  const [internalLoading, setInternalLoading] = useState(true)
  const [error, setError] = useState(false)

  const proyeccion = data !== undefined ? data : internalProyeccion
  const loading = externalLoading !== undefined ? externalLoading : (data !== undefined ? false : internalLoading)

  const fetchProyeccion = useCallback(async () => {
    if (data !== undefined) return
    try {
      setInternalLoading(true)
      const res = await dashboardService.getProyeccion()
      setInternalProyeccion(res)
      setError(false)
    } catch (err) {
      console.error('Error fetching proyeccion:', err)
      setError(true)
    } finally {
      setInternalLoading(false)
    }
  }, [data])

  useEffect(() => {
    if (data === undefined) {
      const tid = setTimeout(() => {
        void fetchProyeccion()
      }, 0)
      return () => clearTimeout(tid)
    }
  }, [data, fetchProyeccion])

  if (loading || error || !proyeccion) {
    return null
  }

  if (!hasProyeccionVisible(proyeccion, moneda)) {
    return null
  }

  const mostrarArs = Boolean(proyeccion.ars?.mostrar_card ?? proyeccion.ars?.datos_suficientes ?? false)
  const mostrarUsd = Boolean(proyeccion.usd?.mostrar_card ?? proyeccion.usd?.datos_suficientes ?? false)
  const showArs = (!moneda || moneda === 'ARS') && Boolean(proyeccion.ars && mostrarArs)
  const showUsd = (!moneda || moneda === 'USD') && Boolean(proyeccion.usd && mostrarUsd)

  return (
    <div className={styles.proyeccionesContainer}>
      {showArs && proyeccion.ars && <SingleProyeccionCard proyeccion={proyeccion.ars} moneda="ARS" />}
      {showUsd && proyeccion.usd && <SingleProyeccionCard proyeccion={proyeccion.usd} moneda="USD" />}
    </div>
  )
}

export default ProyeccionCard
