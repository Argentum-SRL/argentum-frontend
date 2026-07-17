import React, { useEffect, useState } from 'react'
import type { PresionFuturaData } from '@/types'
import tarjetaService from '@/services/tarjeta.service'
import { EmptyState } from '@/components/ui'
import { CreditCard } from 'lucide-react'
import styles from './PresionFuturaCard.module.css'

interface Props {
  meses?: number
}

const formatMontoLocal = (value: number, moneda: 'ARS' | 'USD') => {
  return moneda === 'USD' 
    ? 'USD ' + Math.round(value).toLocaleString('es-AR') 
    : '$' + Math.round(value).toLocaleString('es-AR')
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

  if (error || !data) {
    return null
  }

  const totalComprometidoArs = data.total_comprometido?.ars || 0
  const totalComprometidoUsd = data.total_comprometido?.usd || 0

  const hasArs = totalComprometidoArs > 0
  const hasUsd = totalComprometidoUsd > 0

  if (!hasArs && !hasUsd) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No tenés compras en cuotas"
        description="No tenés compras en cuotas activas."
      />
    )
  }

  const renderTicket = (moneda: 'ARS' | 'USD') => {
    const totalComprometido = moneda === 'ARS' ? totalComprometidoArs : totalComprometidoUsd
    const mesesFiltrados = data.meses.filter(m => (m.total[moneda === 'ARS' ? 'ars' : 'usd'] || 0) > 0)
    if (mesesFiltrados.length === 0) return null

    const maxTotal = Math.max(...mesesFiltrados.map(m => m.total[moneda === 'ARS' ? 'ars' : 'usd'] || 0), 1)

    return (
      <div className={styles.ticket} style={{ flex: 1 }}>
        {/* Header */}
        <div className={styles.ticketHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.ticketLabel}>Deuda futura en cuotas ({moneda})</span>
            <span className={styles.ticketDate}>
              Próximos {meses} · {formatMontoLocal(totalComprometido, moneda)}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className={styles.ticketContent}>
          {mesesFiltrados.map(mes => {
            const mesTotal = mes.total[moneda === 'ARS' ? 'ars' : 'usd'] || 0
            const proporcion = maxTotal > 0 ? (mesTotal / maxTotal) * 100 : 0
            const tarjetasFiltradas = mes.tarjetas.filter(t => t.moneda === moneda && t.total > 0)

            return (
              <div key={`${mes.anio}-${mes.mes}`} className={styles.mesRow}>
                <div className={styles.mesRowMain}>
                  <span className={styles.mesLabel}>{mes.mes_label}</span>
                  
                  <div className={styles.progressContainer}>
                    <ProgressBar proporcion={proporcion} />
                  </div>
                  
                  <span className={styles.mesTotal}>{formatMontoLocal(mesTotal, moneda)}</span>
                </div>

                {tarjetasFiltradas && tarjetasFiltradas.length > 1 && (
                  <div className={styles.detalleTarjetas}>
                    {tarjetasFiltradas.map(t => (
                      <span key={t.tarjeta_id} className={styles.chipTarjeta}>
                        {t.tarjeta_nombre}: {formatMontoLocal(t.total, moneda)}
                      </span>
                    ))}
                  </div>
                )}
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
        {hasArs && renderTicket('ARS')}
        {hasUsd && renderTicket('USD')}
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
