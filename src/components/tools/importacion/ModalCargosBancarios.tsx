import React from 'react'
import Modal from '@/components/ui/Modal/Modal'
import styles from './ModalesImportacion.module.css'

interface ModalCargosBancariosProps {
  isOpen: boolean
  onClose: () => void
  decision: 'importar' | 'ignorar' | null
  onChange: (decision: 'importar' | 'ignorar') => void
  onConfirm: () => void
  onBack: () => void
  onCancelImport: () => void
  currentStep: number
  totalSteps: number
}

export const ModalCargosBancarios: React.FC<ModalCargosBancariosProps> = ({
  isOpen,
  onClose,
  decision,
  onChange,
  onConfirm,
  onBack,
  onCancelImport,
  currentStep,
  totalSteps,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={true}
      title="Encontramos cargos del banco"
      size="md"
      stepDots={totalSteps > 1 ? { total: totalSteps, current: currentStep } : undefined}
    >
      <div className={styles.formContainer} data-modal-frame>
        <div className={styles.formBody} data-modal-stack>
          <p className={styles.modalText}>
            Detectamos transacciones que corresponden a comisiones, mantenimientos o cargos del banco. ¿Qué querés hacer con ellos?
          </p>

          <div data-modal-block>
          <div className={styles.radioGroup} data-modal-options>
            <div
              className={`${styles.checkboxItem} ${
                decision === 'importar' ? styles.checkboxItemActive : ''
              }`}
              onClick={() => onChange('importar')}
            >
              <input
                id="cargo-importar"
                type="radio"
                name="cargos_decision"
                className={styles.checkboxInput}
                checked={decision === 'importar'}
                onChange={() => onChange('importar')}
              />
              <label htmlFor="cargo-importar" className={styles.checkboxLabel}>
                Importarlos con categoría Cargos bancarios
              </label>
            </div>

            <div
              className={`${styles.checkboxItem} ${
                decision === 'ignorar' ? styles.checkboxItemActive : ''
              }`}
              onClick={() => onChange('ignorar')}
            >
              <input
                id="cargo-ignorar"
                type="radio"
                name="cargos_decision"
                className={styles.checkboxInput}
                checked={decision === 'ignorar'}
                onChange={() => onChange('ignorar')}
              />
              <label htmlFor="cargo-ignorar" className={styles.checkboxLabel}>Ignorarlos</label>
            </div>
          </div>
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
              disabled={decision === null}
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

export default ModalCargosBancarios
