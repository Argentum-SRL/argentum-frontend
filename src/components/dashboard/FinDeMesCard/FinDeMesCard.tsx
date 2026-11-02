import React, { useState } from 'react'
import type { FinDeMesResponse } from '@/types'
import { lineasFinDeMes } from '@/utils/finDeMes'
import { ProyeccionCardSkeleton } from '@/components/ui'
import { Calendar, ChevronDown, CircleCheck } from '@/components/ui/icons'
import styles from './FinDeMesCard.module.css'

export interface FinDeMesCardProps {
  data: FinDeMesResponse | null
  loading: boolean
  moneda: 'ARS' | 'USD'
}

export const FinDeMesCard: React.FC<FinDeMesCardProps> = ({ data, loading, moneda }) => {
  const [mostrarCalendario, setMostrarCalendario] = useState(false)

  if (loading || !data) {
    return (
      <div className={styles.skeletonContainer}>
        <ProyeccionCardSkeleton />
      </div>
    )
  }

  const bloque = moneda === 'USD' ? data.usd : data.ars
  const { textos, calendario } = bloque
  const lineas = lineasFinDeMes(textos)
  const tieneCompromisos = Boolean(calendario && calendario.length > 0)

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Calendar size={18} className={styles.headerIcon} />
          <h2 className={styles.title}>{textos.titulo}</h2>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.montoGroup}>
          <p className={styles.monto}>{textos.monto}</p>
          <p className={styles.subtitulo}>{textos.subtitulo}</p>
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

      <div className={styles.calendarioSeccion}>
        {tieneCompromisos ? (
          <>
            <button
              type="button"
              className={styles.toggleCalendarioBtn}
              onClick={() => setMostrarCalendario((prev) => !prev)}
              aria-expanded={mostrarCalendario}
            >
              <span className={styles.toggleLeft}>
                <Calendar size={14} className={styles.toggleIcon} />
                <span>{mostrarCalendario ? 'Ocultar calendario' : 'Ver calendario'}</span>
                <span className={styles.counterBadge}>{calendario.length}</span>
              </span>
              <ChevronDown
                size={14}
                className={`${styles.chevronIcon} ${mostrarCalendario ? styles.chevronIconOpen : ''}`}
              />
            </button>

            {mostrarCalendario && (
              <div className={styles.calendarioLista} role="list">
                {calendario.map((fila, idx) => (
                  <div key={idx} className={styles.filaCalendario} role="listitem">
                    <span className={styles.filaFecha}>{fila.fecha}</span>
                    <span className={styles.filaNombre} title={fila.nombre}>
                      {fila.nombre}
                    </span>
                    <span className={styles.filaMonto}>{fila.monto}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.sinPagosCard}>
            <CircleCheck size={16} className={styles.sinPagosIcon} />
            <p className={styles.sinPagosTexto}>No tenés pagos hasta esa fecha.</p>
          </div>
        )}
      </div>
    </article>
  )
}

export default FinDeMesCard
