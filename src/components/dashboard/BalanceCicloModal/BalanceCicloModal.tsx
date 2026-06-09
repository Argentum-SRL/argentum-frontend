import React from 'react'
import Modal from '@/components/ui/Modal/Modal'
import styles from './BalanceCicloModal.module.css'

interface BalanceCicloModalProps {
  isOpen: boolean
  onClose: () => void
}

const BalanceCicloModal: React.FC<BalanceCicloModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Qué es el balance del ciclo?">
      <div className={styles.modalContent}>
        <section className={styles.section}>
          <h3>Qué muestra</h3>
          <p>
            El balance del ciclo es la diferencia entre todo lo que entró y todo lo que salió de tus billeteras durante el período actual. Si es positivo, ingresaste más de lo que gastaste. Si es negativo, gastaste más de lo que ingresaste.
          </p>
        </section>

        <section className={sectionClass}>
          <h3>Qué no incluye</h3>
          <p>
            No incluye transferencias entre tus propias billeteras ni compras en cuotas con tarjeta de crédito (esas aparecen cuando se debita el resumen). Tampoco considera transacciones pendientes de confirmación.
          </p>
        </section>

        <section className={sectionClass}>
          <h3>Disponible real</h3>
          <p>
            El "disponible real" es diferente: es la plata que tenés hoy en tus billeteras, menos lo que ya debés por resúmenes de tarjeta que vencen próximamente. Es lo que podés gastar sin quedar en rojo.
          </p>
        </section>
      </div>
    </Modal>
  )
}

// Helper to avoid duplicate string syntax
const sectionClass = styles.section

export default BalanceCicloModal
