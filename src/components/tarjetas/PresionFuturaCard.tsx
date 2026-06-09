import React, { useEffect, useState } from 'react'
import type { PresionFuturaData } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import styles from './PresionFuturaCard.module.css'

interface Props {
  meses?: number
}

const formatARS = (value: number) => {
  return '$' + Math.round(value).toLocaleString('es-AR')
}

const ProgressBar: React.FC<{ proporcion: number }> = ({ proporcion }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${proporcion}%`
    }
  }, [proporcion])

  return <div ref={ref} className={styles.progressBar} />
}

export const PresionFuturaCard: React.FC<Props> = ({ meses = 6 }) => {
  const [data, setData] = useState<PresionFuturaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Ajustar estado durante render al cambiar de prop, evitando updates sincrónicos en useEffect
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

  if (loading) {
    return <PresionFuturaSkeleton />
  }

  if (error || !data || !data.meses || data.meses.length === 0) {
    return null // Ocultar si no hay datos o error
  }

  const maxTotal = Math.max(...data.meses.map(m => m.total), 1)

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.ticket}>
        {/* Header */}
        <div className={styles.ticketHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.ticketLabel}>Deuda futura en cuotas</span>
            <span className={styles.ticketDate}>
              Próximos {meses} meses · Comprometido: {formatARS(data.total_comprometido)}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className={styles.ticketContent}>
          {data.meses.map(mes => {
            const proporcion = maxTotal > 0 ? (mes.total / maxTotal) * 100 : 0
            return (
              <div key={`${mes.anio}-${mes.mes}`} className={styles.mesRow}>
                <div className={styles.mesRowMain}>
                  <span className={styles.mesLabel}>{mes.mes_label}</span>
                  
                  <div className={styles.progressContainer}>
                    <ProgressBar proporcion={proporcion} />
                  </div>
                  
                  <span className={styles.mesTotal}>{formatARS(mes.total)}</span>
                </div>

                {/* Detalle por tarjeta — mostrar solo si hay más de 1 tarjeta en el mes */}
                {mes.tarjetas && mes.tarjetas.length > 1 && (
                  <div className={styles.detalleTarjetas}>
                    {mes.tarjetas.map(t => (
                      <span key={t.tarjeta_id} className={styles.chipTarjeta}>
                        {t.tarjeta_nombre}: {formatARS(t.total)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PresionFuturaSkeleton: React.FC = () => (
  <div className={styles.summaryContainer}>
    <div className={styles.ticket}>
      <div className={styles.ticketHeader}>
        <div className={styles.headerLeft}>
          <div className={`${styles.skeletonItem} ${styles.skeletonHeaderLabel}`} />
          <div className={`${styles.skeletonItem} ${styles.skeletonHeaderDetail}`} />
        </div>
      </div>
      <div className={styles.ticketContent}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={`${styles.skeletonItem} ${styles.skeletonLabel}`} />
            <div className={`${styles.skeletonItem} ${styles.skeletonBar}`} />
            <div className={`${styles.skeletonItem} ${styles.skeletonTotal}`} />
          </div>
        ))}
      </div>
    </div>
  </div>
)
