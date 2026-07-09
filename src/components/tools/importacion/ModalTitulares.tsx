import React from 'react'
import Modal from '@/components/ui/Modal/Modal'
import styles from './ModalesImportacion.module.css'

interface ModalTitularesProps {
  isOpen: boolean
  onClose: () => void
  titulares: string[]
  seleccionados: string[]
  onChange: (seleccionados: string[]) => void
  onConfirm: () => void
  onBack: () => void
  onCancelImport: () => void
  currentStep: number
  totalSteps: number
}

export const ModalTitulares: React.FC<ModalTitularesProps> = ({
  isOpen,
  onClose,
  titulares,
  seleccionados,
  onChange,
  onConfirm,
  onBack,
  onCancelImport,
  currentStep,
  totalSteps,
}) => {
  const handleToggle = (titular: string) => {
    if (seleccionados.includes(titular)) {
      onChange(seleccionados.filter(t => t !== titular))
    } else {
      onChange([...seleccionados, titular])
    }
  }

  const handleSelectAll = () => {
    onChange([...titulares])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={true}
      title="¿De quién son estos gastos?"
      size="md"
    >
      <div className={styles.formContainer}>
        {/* Step Indicator Dots */}
        {totalSteps > 1 && (
          <div className={styles.stepDots}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`${styles.stepDot} ${
                  idx === currentStep ? styles.stepDotActive : styles.stepDotInactive
                }`}
              />
            ))}
          </div>
        )}

        <div className={styles.formBody}>
          <p className={styles.modalText}>
            Detectamos consumos de múltiples personas en este resumen. Seleccioná de quiénes querés importar los gastos.
          </p>

          <button
            type="button"
            className={styles.selectAllBtn}
            onClick={handleSelectAll}
            disabled={seleccionados.length === titulares.length}
          >
            Seleccionar todos
          </button>

          <div className={styles.checkboxGroup}>
            {titulares.map(titular => {
              const isChecked = seleccionados.includes(titular)
              return (
                <div
                  key={titular}
                  className={`${styles.checkboxItem} ${
                    isChecked ? styles.checkboxItemActive : ''
                  }`}
                  onClick={() => handleToggle(titular)}
                >
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={isChecked}
                    onChange={() => {}} // Manejado por el onClick del contenedor
                    aria-label={`Seleccionar titular ${titular}`}
                  />
                  <span className={styles.checkboxLabel}>{titular}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.formFooter}>
          <div className={styles.actionRow}>
            <button type="button" className={styles.cancelBtn} onClick={onBack}>
              Atrás
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={onConfirm}
              disabled={seleccionados.length === 0}
            >
              Continuar
            </button>
          </div>
          <button
            type="button"
            className={styles.cancelImportBtn}
            onClick={onCancelImport}
          >
            Cancelar importación completa
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalTitulares
