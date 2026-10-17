import React, { type ReactNode } from 'react'
import styles from './Modal.module.css'

export interface ModalFooterProps {
  secondary?: ReactNode
  primary: ReactNode
}

/**
 * Pie de modal canónico según DISENO_UNIFICADO.md (sección 7).
 * Con acción secundaria: secundario (flex 1) + principal (flex 2).
 * Sin acción secundaria: el botón principal ocupa el ancho completo.
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({ secondary, primary }) => {
  if (secondary) {
    return (
      <div className={styles.footerActions}>
        <div className={styles.footerSecondary}>{secondary}</div>
        <div className={styles.footerPrimary}>{primary}</div>
      </div>
    )
  }

  return (
    <div className={styles.footerActions}>
      <div className={styles.footerPrimaryOnly}>
        {primary}
      </div>
    </div>
  )
}

export default ModalFooter
