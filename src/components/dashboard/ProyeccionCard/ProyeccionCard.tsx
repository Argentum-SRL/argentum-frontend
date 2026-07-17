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

  const { progressPercent } = useMemo(() => {
    const actual = proyeccion.desglose_por_categoria.reduce((acc, cat) => acc + cat.gasto_actual_ciclo, 0)
    const percent = Math.min(Math.round((actual / (proyeccion.gasto_proyectado_total || 1)) * 100), 100)
    return { progressPercent: percent }
  }, [proyeccion])

  const { gasto_proyectado_total, balance_proyectado, desglose_por_categoria, certezas } = proyeccion

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

      <div className={styles.mainStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Gasto proyectado</span>
          <span className={styles.statValue}>{formatMonto(gasto_proyectado_total, moneda)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Balance estimado</span>
          <span className={`${styles.balanceValue} ${balance_proyectado >= 0 ? styles.positive : styles.negative}`}>
            {formatMonto(balance_proyectado, moneda)}
          </span>
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
          Ver desglose <ChevronDown size={16} />
        </button>
      ) : (
        <div className={styles.expandedContent}>
          <div className={styles.categoryList}>
            <h3 className={styles.sectionTitle}>Gasto por categoría</h3>
            {desglose_por_categoria.map((cat, i) => {
              const catProgress = Math.min(Math.round((cat.gasto_actual_ciclo / (cat.proyectado || 1)) * 100), 100)
              
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
    </div>
  )
}

interface ProyeccionCardProps {
  data?: ProyeccionesResponse | null;
  loading?: boolean;
}

const ProyeccionCard: React.FC<ProyeccionCardProps> = ({ data, loading: externalLoading }) => {
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

  const hasArs = proyeccion.ars && proyeccion.ars.datos_suficientes
  const hasUsd = proyeccion.usd && proyeccion.usd.datos_suficientes

  if (!hasArs && !hasUsd) {
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
      {hasArs && <SingleProyeccionCard proyeccion={proyeccion.ars} moneda="ARS" />}
      {hasUsd && <SingleProyeccionCard proyeccion={proyeccion.usd} moneda="USD" />}
    </div>
  )
}

export default ProyeccionCard
