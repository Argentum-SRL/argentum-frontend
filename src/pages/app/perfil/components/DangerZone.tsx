import React, { useState } from 'react'
import { Trash2 } from '@/components/ui/icons'
import { EliminarCuentaModal } from './EliminarCuentaModal'
import styles from '../PerfilPage.module.css'

export const DangerZone: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBtnHovered, setIsBtnHovered] = useState(false)

  return (
    <div className={styles.dangerSingleCard}>
      <div className={styles.dangerRowInfo}>
        <span className={styles.dangerActionTitleDestructive}>Eliminar Cuenta Definitivamente</span>
        <span className={styles.dangerActionDesc}>
          Borra todos tus registros contables, balances, transacciones y cuentas asociadas para siempre de forma irreversible.
        </span>
      </div>
      <button
        type="button"
        className={styles.deleteBtnModern}
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsBtnHovered(true)}
        onMouseLeave={() => setIsBtnHovered(false)}
      >
        <Trash2 size={15} isHovered={isBtnHovered} />
        <span>Eliminar mi cuenta</span>
      </button>

      <EliminarCuentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

