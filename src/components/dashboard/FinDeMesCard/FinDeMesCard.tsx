import React, { useState } from 'react'
import type { FinDeMesResponse } from '@/types'
import { lineasFinDeMes } from '@/utils/finDeMes'
import { ProyeccionCardSkeleton } from '@/components/ui'
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
  const tieneCompromisos = calendario && calendario.length > 0

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{textos.titulo}</h2>
      </header>

      <div className={styles.content}>
        <p className={styles.monto}>{textos.monto}</p>
        <p className={styles.subtitulo}>{textos.subtitulo}</p>

        {lineas.length > 0 && (
          <div className={styles.lineasLista}>
            {lineas.map((linea, idx) => (
              <p key={idx} className={styles.lineaTexto}>
                {linea}
              </p>
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
              {mostrarCalendario ? 'Ocultar calendario' : 'Ver calendario'}
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
          <p className={styles.sinPagosTexto}>No tenés pagos hasta esa fecha.</p>
        )}
      </div>
    </article>
  )
}

export default FinDeMesCard

