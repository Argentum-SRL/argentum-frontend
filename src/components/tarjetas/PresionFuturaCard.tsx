import React, { useEffect, useState, useMemo } from 'react'
import type { PresionFuturaData } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import { CreditCard, Calendar } from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import styles from './PresionFuturaCard.module.css'

interface Props {
  tarjetaId?: string
  tarjetaNombre?: string
  meses?: number
}

const ProgressBar: React.FC<{ proporcion: number }> = ({ proporcion }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${Math.max(proporcion, 3)}%`
    }
  }, [proporcion])

  return (
    <div className={styles.barTrack}>
      <div ref={ref} className={styles.barFill} />
    </div>
  )
}

export const PresionFuturaCard: React.FC<Props> = ({ 
  tarjetaId, 
  tarjetaNombre, 
  meses = 6 
}) => {
  const [data, setData] = useState<PresionFuturaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [prevMeses, setPrevMeses] = useState(meses)

  if (meses !== prevMeses) {
    setPrevMeses(meses)
    setLoading(true)
    setError(false)
  }

  useEffect(() => {
    const controller = new AbortController()

    tarjetaService.getPresionFutura(meses, controller.signal)
      .then(d => {
        if (d) {
          setData(d)
        }
      })
      .catch(err => {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return
        console.error('Error loading future financial pressure:', err)
        setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [meses])

  // Filtrar datos según la tarjeta seleccionada
  const filteredData = useMemo(() => {
    if (!data) return null

    const mesesProcesados = data.meses.map(mes => {
      const tarjetasDelMes = tarjetaId
        ? mes.tarjetas.filter(t => t.tarjeta_id === tarjetaId)
        : mes.tarjetas

      const totalArs = tarjetasDelMes
        .filter(t => t.moneda === 'ARS')
        .reduce((acc, t) => acc + (t.total || 0), 0)

      const totalUsd = tarjetasDelMes
        .filter(t => t.moneda === 'USD')
        .reduce((acc, t) => acc + (t.total || 0), 0)

      return {
        ...mes,
        total: { ars: totalArs, usd: totalUsd },
        tarjetas: tarjetasDelMes,
      }
    })

    const totalComprometidoArs = mesesProcesados.reduce((acc, m) => acc + m.total.ars, 0)
    const totalComprometidoUsd = mesesProcesados.reduce((acc, m) => acc + m.total.usd, 0)

    return {
      meses: mesesProcesados,
      total_comprometido: {
        ars: totalComprometidoArs,
        usd: totalComprometidoUsd,
      }
    }
  }, [data, tarjetaId])

  if (loading) {
    return <PresionFuturaSkeleton />
  }

  if (error || !filteredData) {
    return null
  }

  const totalComprometidoArs = filteredData.total_comprometido.ars
  const totalComprometidoUsd = filteredData.total_comprometido.usd

  const hasArs = totalComprometidoArs > 0
  const hasUsd = totalComprometidoUsd > 0

  if (!hasArs && !hasUsd) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIconCircle}>
          <CreditCard size={18} strokeWidth={2} className={styles.emptyIcon} />
        </div>
        <div className={styles.emptyInfo}>
          <span className={styles.emptyTitle}>Sin cuotas pendientes</span>
          <span className={styles.emptyDesc}>
            {tarjetaNombre 
              ? `"${tarjetaNombre}" no tiene cuotas a vencer en los próximos ${meses} meses.` 
              : `No hay compras en cuotas registradas para los próximos ${meses} meses.`}
          </span>
        </div>
      </div>
    )
  }

  const renderCard = (moneda: 'ARS' | 'USD') => {
    const totalComprometido = moneda === 'ARS' ? totalComprometidoArs : totalComprometidoUsd
    const key = moneda === 'ARS' ? 'ars' : 'usd'
    const mesesConCuotas = filteredData.meses.filter(m => (m.total[key] || 0) > 0)
    if (mesesConCuotas.length === 0) return null

    const maxMonto = Math.max(...mesesConCuotas.map(m => m.total[key] || 0), 1)

    return (
      <div className={styles.card}>
        {/* Header con resumen métrico */}
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <Calendar size={15} className={styles.headerIcon} />
              <h3 className={styles.cardTitle}>
                Cuotas futuras {hasArs && hasUsd ? `(${moneda === 'ARS' ? 'Pesos' : 'Dólares'})` : ''}
              </h3>
              <span className={styles.mesesTag}>Próximos {meses} meses</span>
            </div>
            <p className={styles.cardSubtitle}>
              {tarjetaNombre ? `${tarjetaNombre} · ` : ''}Compromiso de pago en {moneda === 'ARS' ? 'pesos' : 'dólares'}
            </p>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.totalLabel}>Total comprometido</span>
            <span className={styles.totalValue}>
              {formatMonto(Math.round(totalComprometido), moneda)}
            </span>
          </div>
        </div>

        {/* Lista de meses con barras de avance */}
        <div className={styles.monthsList}>
          {mesesConCuotas.map(mes => {
            const mesTotal = mes.total[key] || 0
            const porcentaje = maxMonto > 0 ? (mesTotal / maxMonto) * 100 : 0

            return (
              <div key={`${mes.anio}-${mes.mes}`} className={styles.monthRow}>
                <div className={styles.monthLabelCol}>
                  <span className={styles.monthLabel}>{mes.mes_label}</span>
                </div>

                <div className={styles.barArea}>
                  <ProgressBar proporcion={porcentaje} />
                </div>

                <div className={styles.monthTotalCol}>
                  <span className={styles.monthTotal}>
                    {formatMonto(Math.round(mesTotal), moneda)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryContainerMulti}>
        {hasArs && renderCard('ARS')}
        {hasUsd && renderCard('USD')}
      </div>
    </div>
  )
}

const PresionFuturaSkeleton: React.FC = () => (
  <div className={styles.summaryContainer}>
    <div className={styles.skeletonCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={`${styles.skeletonItem} ${styles.skeletonHeaderLabel}`} />
          <div className={`${styles.skeletonItem} ${styles.skeletonHeaderDetail}`} />
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.skeletonItem} ${styles.skeletonTotalLabel}`} />
          <div className={`${styles.skeletonItem} ${styles.skeletonTotalValue}`} />
        </div>
      </div>
      <div className={styles.monthsList}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.monthRow}>
            <div className={`${styles.skeletonItem} ${styles.skeletonLabel}`} />
            <div className={`${styles.skeletonItem} ${styles.skeletonBar}`} />
            <div className={`${styles.skeletonItem} ${styles.skeletonTotal}`} />
          </div>
        ))}
      </div>
    </div>
  </div>
)
