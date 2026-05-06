import React from 'react'
import type { TarjetaCredito } from '@/types'
import { calcularProximoCierre, calcularProximoVencimiento } from '@/lib/utils/tarjeta.utils'
import { formatMonto } from '@/utils/format'
import styles from './TarjetaSummary.module.css'

interface TarjetaSummaryProps {
  tarjeta: TarjetaCredito
}

const TarjetaSummary: React.FC<TarjetaSummaryProps> = ({ tarjeta }) => {
  const proximoCierre = calcularProximoCierre(tarjeta.dia_cierre)
  const proximoVencimiento = calcularProximoVencimiento(tarjeta.dia_vencimiento)

  return (
    <div className={styles.summary}>
      <div className={styles.summaryRow}>
        <span className={styles.label}>Próximo cierre:</span>
        <span className={styles.value}>
          {proximoCierre.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.label}>Próximo vencimiento:</span>
        <span className={styles.value}>
          {proximoVencimiento.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
      {tarjeta.limite_credito && (
        <div className={styles.summaryRow}>
          <span className={styles.label}>Límite:</span>
          <span className={styles.value}>
            {formatMonto(tarjeta.limite_credito, 'ARS')}
          </span>
        </div>
      )}
    </div>
  )
}

export default TarjetaSummary
