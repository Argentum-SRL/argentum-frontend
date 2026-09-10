import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react'
import { TrendingUp, Info, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'
import { formatMonto } from '@/utils/format'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { dashboardService } from '@/services/dashboard.service'
import type { Proyeccion, ProyeccionesResponse } from '@/types'
import styles from './ProyeccionCard.module.css'
import { useModal } from '@/hooks/useModal'

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

  const { progressPercent } = useMemo(() => {
    if (!proyeccion.desglose_por_categoria || proyeccion.gasto_proyectado_total === null) {
      return { progressPercent: 0 }
    }
    const actual = proyeccion.desglose_por_categoria.reduce((acc, cat) => acc + (cat.gasto_actual_ciclo > 0 ? cat.gasto_actual_ciclo : 0), 0)
    const totalProyectado = proyeccion.gasto_proyectado_total > 0 ? proyeccion.gasto_proyectado_total : 1
    const percent = Math.max(0, Math.min(Math.round((actual / totalProyectado) * 100), 100))
    return { progressPercent: percent }
  }, [proyeccion])

  const {
    gasto_proyectado_total,
    balance_proyectado,
    desglose_por_categoria,
    certezas,
    rango,
    nivel_confianza,
    mensaje_insuficiente,
    intervalos,
  } = proyeccion

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <TrendingUp size={20} className={styles.titleIcon} />
          <h2>Proyección del ciclo ({moneda})</h2>
        </div>
        <button 
          className={styles.infoButton} 
          onClick={() => open('proyeccion', { data: { proyeccion } })}
          title={`Ver explicación de la proyección en ${moneda}`}
          aria-label={`Ver explicación de la proyección en ${moneda}`}
        >
          <Info size={20} />
        </button>
      </div>

      {!pasaPuerta ? (
        <>
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            color: 'var(--text-2)',
            lineHeight: 1.4,
            borderLeft: '3px solid var(--primary)',
            marginBottom: '1rem'
          }}>
            {proyeccion.mensaje || mensaje_insuficiente || proyeccion.calibracion?.mensaje || 'Mostramos tus compromisos ciertos (cuotas y suscripciones).'}
          </div>

          <div className={styles.certezasSection}>
            <h3 className={styles.sectionTitle}>Compromisos ciertos del ciclo</h3>
            <div className={styles.certezaItem}>
              <span className={styles.certezaLabel}>Cuotas pendientes</span>
              <span className={styles.certezaValue}>{formatMonto(certezas.cuotas_restantes, moneda)}</span>
            </div>
            <div className={styles.certezaItem}>
              <span className={styles.certezaLabel}>Suscripciones pendientes</span>
              <span className={styles.certezaValue}>{formatMonto(certezas.suscripciones_restantes, moneda)}</span>
            </div>
            {(certezas.compromisos_restantes ?? 0) > 0 && (
              <div className={styles.certezaItem}>
                <span className={styles.certezaLabel}>Otros compromisos pendientes</span>
                <span className={styles.certezaValue}>{formatMonto(certezas.compromisos_restantes ?? 0, moneda)}</span>
              </div>
            )}
            <div className={`${styles.certezaItem} ${styles.certezaTotal}`}>
              <span className={styles.certezaLabel}>Total compromisos</span>
              <span className={`${styles.certezaValue} ${styles.certezaTotalValue}`}>
                {formatMonto(certezas.total, moneda)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {proyeccion.calibracion?.pasa_puerta && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: 500,
              marginBottom: '0.5rem',
              alignSelf: 'flex-start'
            }}>
              <span>Calibración validada: {Math.round((proyeccion.calibracion.cobertura_80 ?? 0.8) * 100)}% en {proyeccion.calibracion.ciclos_evaluados} ciclos</span>
            </div>
          )}

          <div className={styles.mainStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Gasto proyectado (mediana)</span>
              <span className={styles.statValue}>{formatMonto(gasto_proyectado_total ?? 0, moneda)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Balance estimado</span>
              <span className={`${styles.balanceValue} ${(balance_proyectado ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                {formatMonto(balance_proyectado ?? 0, moneda)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Rango probable (80%)</span>
              <span className={styles.statValue}>{formatMonto(rango?.piso ?? 0, moneda)} a {formatMonto(rango?.techo ?? 0, moneda)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Confianza</span>
              <span className={styles.statValue}>{nivel_confianza}</span>
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Gasto actual vs proyectado</span>
              <span className={styles.progressPercent}>{progressPercent}%</span>
            </div>
            <ProgressBar progress={progressPercent} />
          </div>

          {!expanded ? (
            <button className={styles.expandButton} onClick={() => setExpanded(true)}>
              Ver desglose e intervalos <ChevronDown size={16} />
            </button>
          ) : (
            <div className={styles.expandedContent}>
              {intervalos && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Intervalos de probabilidad calibrados</h3>
                    {proyeccion.calibracion && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        Validado: {Math.round((proyeccion.calibracion.cobertura_80 ?? 0.8) * 100)}% ({proyeccion.calibracion.ciclos_evaluados} ciclos)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--surface-alt)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-3)', display: 'block' }}>Nivel 50%</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {formatMonto(intervalos.intervalo_50.piso, moneda)} - {formatMonto(intervalos.intervalo_50.techo, moneda)}
                      </span>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--surface-alt)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-3)', display: 'block' }}>Nivel 80%</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {formatMonto(intervalos.intervalo_80.piso, moneda)} - {formatMonto(intervalos.intervalo_80.techo, moneda)}
                      </span>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'var(--surface-alt)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-3)', display: 'block' }}>Nivel 95%</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {formatMonto(intervalos.intervalo_95.piso, moneda)} - {formatMonto(intervalos.intervalo_95.techo, moneda)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.categoryList}>
                <h3 className={styles.sectionTitle}>Gasto por categoría</h3>
                {(desglose_por_categoria ?? []).map((cat, i) => {
                  const catActual = cat.gasto_actual_ciclo > 0 ? cat.gasto_actual_ciclo : 0
                  const catTotal = cat.proyectado > 0 ? cat.proyectado : 1
                  const catProgress = Math.max(0, Math.min(Math.round((catActual / catTotal) * 100), 100))
                  
                  return (
                    <div key={cat.categoria_id || `cat-${i}`} className={styles.categoryRow}>
                      <div className={styles.categoryIcon}>
                        <CategoriaIcon nombre={cat.categoria_nombre} size={32} />
                      </div>
                      <div className={styles.categoryInfo}>
                        <div className={styles.categoryName}>
                          {cat.categoria_nombre}
                          {cat.fuera_de_patron && <span className={`${styles.badge} ${styles.badgePatron}`}>Fuera de patrón</span>}
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

              <div className={styles.certezasSection}>
                <h3 className={styles.sectionTitle}>Compromisos fijos</h3>
                <div className={styles.certezaItem}>
                  <span className={styles.certezaLabel}>Cuotas pendientes</span>
                  <span className={styles.certezaValue}>{formatMonto(certezas.cuotas_restantes, moneda)}</span>
                </div>
                <div className={styles.certezaItem}>
                  <span className={styles.certezaLabel}>Suscripciones pendientes</span>
                  <span className={styles.certezaValue}>{formatMonto(certezas.suscripciones_restantes, moneda)}</span>
                </div>
                {(certezas.compromisos_restantes ?? 0) > 0 && (
                  <div className={styles.certezaItem}>
                    <span className={styles.certezaLabel}>Otros compromisos pendientes</span>
                    <span className={styles.certezaValue}>{formatMonto(certezas.compromisos_restantes ?? 0, moneda)}</span>
                  </div>
                )}
                <div className={`${styles.certezaItem} ${styles.certezaTotal}`}>
                  <span className={styles.certezaLabel}>Total compromisos</span>
                  <span className={`${styles.certezaValue} ${styles.certezaTotalValue}`}>
                    {formatMonto(certezas.total, moneda)}
                  </span>
                </div>
              </div>

              <button className={styles.expandButton} onClick={() => setExpanded(false)}>
                Ocultar desglose <ChevronUp size={16} />
              </button>
            </div>
          )}
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

  const handleRetry = () => {
    setError(false)
    fetchProyeccion()
  }

  if (loading) {
    return <div className={`${styles.card} ${styles.skeleton} ${styles.skeletonCard}`} />
  }

  if (error || !proyeccion) {
    if (data !== undefined) return null
    return (
      <div className={`${styles.card} ${styles.errorCard}`}>
        <p className={styles.errorText}>No pudimos calcular la proyección</p>
        <button className={styles.retryButton} onClick={handleRetry}>
          <RefreshCcw size={14} className={styles.retryIcon} />
          Reintentar
        </button>
      </div>
    )
  }

  const hasArs = Boolean(
    proyeccion.ars && (
      proyeccion.ars.datos_suficientes ||
      proyeccion.ars.certezas?.total > 0 ||
      (proyeccion.ars.gasto_proyectado_total !== null && (proyeccion.ars.gasto_proyectado_total ?? 0) > 0) ||
      (proyeccion.ars.ciclos_analizados ?? 0) >= 0
    )
  )
  const hasUsd = Boolean(
    proyeccion.usd && (
      proyeccion.usd.datos_suficientes ||
      proyeccion.usd.certezas?.total > 0 ||
      (proyeccion.usd.gasto_proyectado_total !== null && (proyeccion.usd.gasto_proyectado_total ?? 0) > 0) ||
      (proyeccion.usd.ingresos_proyectados !== null && (proyeccion.usd.ingresos_proyectados ?? 0) > 0)
    )
  )

  const showArs = (!moneda || moneda === 'ARS') && hasArs
  const showUsd = (!moneda || moneda === 'USD') && hasUsd

  if (!showArs && !showUsd) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyStateContainer}>
          <TrendingUp size={24} className={styles.emptyIcon} />
          <p className={styles.emptyText}>Necesitamos más historial para proyectar tu ciclo</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.proyeccionesContainer}>
      {showArs && <SingleProyeccionCard proyeccion={proyeccion.ars} moneda="ARS" />}
      {showUsd && <SingleProyeccionCard proyeccion={proyeccion.usd} moneda="USD" />}
    </div>
  )
}

export default ProyeccionCard
