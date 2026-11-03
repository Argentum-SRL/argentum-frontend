import React from 'react'
import type { FinDeMesTarjeta } from '@/types'
import { lineasFinDeMes } from '@/utils/finDeMes'
import { Calendar } from '@/components/ui/icons'
import styles from './FinDeMesCard.module.css'

export interface FinDeMesCardProps {
  tarjeta: FinDeMesTarjeta
}

export const FinDeMesCard: React.FC<FinDeMesCardProps> = ({ tarjeta }) => {
  const lineas = lineasFinDeMes(tarjeta)

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Calendar size={18} className={styles.headerIcon} />
          <h2 className={styles.title}>{tarjeta.titulo}</h2>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.montoGroup}>
          <p className={styles.monto}>{tarjeta.monto}</p>
          <p className={styles.subtitulo}>{tarjeta.subtitulo}</p>
        </div>

        {lineas.length > 0 && (
          <div className={styles.metricGroup}>
            {lineas.map((linea, idx) => (
              <div key={idx} className={styles.lineaItem}>
                <span className={styles.lineaDot} aria-hidden="true" />
                <p className={styles.lineaTexto}>{linea}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default FinDeMesCard
