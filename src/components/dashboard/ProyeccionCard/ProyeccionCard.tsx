import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import { TrendingUp, Info, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'
import { formatMonto } from '@/utils/format'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { dashboardService } from '@/services/dashboard.service'
import type { Proyeccion } from '@/types'
import ProyeccionModal from '../ProyeccionModal/ProyeccionModal'
import styles from './ProyeccionCard.module.css'

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

const ProyeccionCard: React.FC = () => {
  const [proyeccion, setProyeccion] = useState<Proyeccion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchProyeccion = useCallback(async () => {
    try {
      const data = await dashboardService.getProyeccion()
      setProyeccion(data)
      setError(false)
    } catch (err) {
      console.error('Error fetching proyeccion:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProyeccion()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchProyeccion])

  const handleRetry = () => {
    setLoading(true)
    setError(false)
    fetchProyeccion()
  }

  if (loading) {
    return <div className={`${styles.card} ${styles.skeleton} ${styles.skeletonCard}`} />
  }

  if (error || !proyeccion) {
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

  const { gasto_proyectado_total, balance_proyectado, desglose_por_categoria, certezas } = proyeccion
  
  // Calcular gasto actual total (sumando categorias)
  const gasto_actual_total = desglose_por_categoria.reduce((acc, cat) => acc + cat.gasto_actual_ciclo, 0)
  
  // El progreso es cuanto del proyectado ya se gasto (excluyendo certezas que son futuras)
  // O mejor, cuanto del gasto_proyectado_total ya se gasto
  const progressPercent = Math.min(Math.round((gasto_actual_total / (gasto_proyectado_total || 1)) * 100), 100)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <TrendingUp size={20} className={styles.titleIcon} />
          <h2>Proyección del ciclo</h2>
        </div>
        <button 
          className={styles.infoButton} 
          onClick={() => setModalOpen(true)}
          title="Ver explicación de la proyección"
          aria-label="Ver explicación de la proyección"
        >
          <Info size={20} />
        </button>
      </div>

      <div className={styles.mainStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Gasto proyectado</span>
          <span className={styles.statValue}>{formatMonto(gasto_proyectado_total, 'ARS')}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Balance estimado</span>
          <span className={`${styles.balanceValue} ${balance_proyectado >= 0 ? styles.positive : styles.negative}`}>
            {formatMonto(balance_proyectado, 'ARS')}
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
            {desglose_por_categoria.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.categoria_nombre)
              const catProgress = Math.min(Math.round((cat.gasto_actual_ciclo / (cat.proyectado || 1)) * 100), 100)
              
              return (
                <div key={cat.categoria_id} className={styles.categoryRow}>
                  <div className={styles.categoryIcon}>
                    <CategoryIcon size={20} />
                  </div>
                  <div className={styles.categoryInfo}>
                    <div className={styles.categoryName}>
                      {cat.categoria_nombre}
                      {cat.fuera_de_patron && <span className={`${styles.badge} ${styles.badgePatron}`}>Fuera de patrón</span>}
                    </div>
                    <ProgressBar progress={catProgress} />
                  </div>
                  <div className={styles.categoryAmount}>
                    {formatMonto(cat.proyectado, 'ARS')}
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.certezasSection}>
            <h3 className={styles.sectionTitle}>Compromisos fijos</h3>
            <div className={styles.certezaItem}>
              <span className={styles.certezaLabel}>Cuotas pendientes</span>
              <span className={styles.certezaValue}>{formatMonto(certezas.cuotas_restantes, 'ARS')}</span>
            </div>
            <div className={styles.certezaItem}>
              <span className={styles.certezaLabel}>Suscripciones pendientes</span>
              <span className={styles.certezaValue}>{formatMonto(certezas.suscripciones_restantes, 'ARS')}</span>
            </div>
            <div className={`${styles.certezaItem} ${styles.certezaTotal}`}>
              <span className={styles.certezaLabel}>Total compromisos</span>
              <span className={`${styles.certezaValue} ${styles.certezaTotalValue}`}>
                {formatMonto(certezas.total, 'ARS')}
              </span>
            </div>
          </div>

          <button className={styles.expandButton} onClick={() => setExpanded(false)}>
            Ocultar desglose <ChevronUp size={16} />
          </button>
        </div>
      )}

      {modalOpen && (
        <ProyeccionModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          proyeccion={proyeccion} 
        />
      )}
    </div>
  )
}

export default ProyeccionCard
