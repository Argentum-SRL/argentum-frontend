import React from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import type { ConfirmarImportacionResponse } from '@/types'
import styles from './ImportacionResumenSection.module.css' // Reutilizar estructura general y botones

interface ResultadoImportacionProps {
  resultado: ConfirmarImportacionResponse
  onReset: () => void
}

export const ResultadoImportacion: React.FC<ResultadoImportacionProps> = ({
  resultado,
  onReset,
}) => {
  const { importadas, duplicadas, sin_billetera_usd, total_procesadas } = resultado

  return (
    <div className={`${styles.finalStateContainer} ${styles.resultCard}`}>
      {/* Icono de Éxito Grande */}
      <div className={styles.resultHeader}>
        <div className={styles.resultSuccessCircle}>
          <CheckCircle2 size={36} />
        </div>
        <h3 className={`${styles.finalStateTitle} ${styles.resultTitle}`}>
          ¡Importación completada!
        </h3>
        <p className={styles.resultDescription}>
          El resumen de cuenta se procesó de forma correcta. A continuación tenés el desglose de los resultados.
        </p>
      </div>

      {/* Lista de Contadores */}
      <div className={`${styles.stateDetailList} ${styles.resultDetailList}`}>
        <div className={`${styles.stateDetailItem} ${styles.resultDetailItem}`}>
          <span>Total procesadas:</span>
          <strong>{total_procesadas}</strong>
        </div>
        <div className={`${styles.stateDetailItem} ${styles.resultDetailItem}`}>
          <span className={styles.resultItemSuccessLabel}>Importadas con éxito:</span>
          <strong className={styles.resultItemSuccessValue}>{importadas}</strong>
        </div>
        <div className={`${styles.stateDetailItem} ${styles.resultDetailItem}`}>
          <span>Duplicadas omitidas:</span>
          <strong>{duplicadas}</strong>
        </div>
        {sin_billetera_usd > 0 && (
          <div className={`${styles.stateDetailItem} ${styles.resultDetailItem}`}>
            <span className={styles.resultItemOmitted}>Omitidas por USD (sin billetera):</span>
            <strong className={styles.resultItemOmitted}>{sin_billetera_usd}</strong>
          </div>
        )}
      </div>

      {/* Grupo de Botones de Reinicio */}
      <div className={`${styles.fullWidthBtnGroup} ${styles.resultBtnGroup}`}>
        <button
          type="button"
          className={`${styles.submitBtn} ${styles.fullWidthSubmitBtn} ${styles.resultBtn}`}
          onClick={onReset}
        >
          <RefreshCw size={15} />
          Importar otro resumen
        </button>
      </div>
    </div>
  )
}

export default ResultadoImportacion
