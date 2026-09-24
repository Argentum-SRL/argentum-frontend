import { useState } from 'react'
import { X, TrendingUp } from '@/components/ui/icons'
import type { Billetera } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import billeteraService from '@/services/billetera.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './BankPickerModal.module.css'

interface RegistrarRendimientoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedBilletera: Billetera) => void
  billetera: Billetera | null
  rendimientoEstimado?: number | null
}

export default function RegistrarRendimientoModal({
  isOpen,
  onClose,
  onSuccess,
  billetera,
  rendimientoEstimado,
}: RegistrarRendimientoModalProps) {
  const [prevRendimiento, setPrevRendimiento] = useState(rendimientoEstimado)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [monto, setMonto] = useState<string>(
    rendimientoEstimado != null && rendimientoEstimado > 0 ? String(rendimientoEstimado) : ''
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (prevIsOpen !== isOpen || prevRendimiento !== rendimientoEstimado) {
    setPrevIsOpen(isOpen)
    setPrevRendimiento(rendimientoEstimado)
    if (isOpen) {
      setMonto(rendimientoEstimado != null && rendimientoEstimado > 0 ? String(rendimientoEstimado) : '')
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !billetera) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedMonto = parseFloat(monto)
    if (isNaN(parsedMonto) || parsedMonto <= 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const updated = await billeteraService.confirmarRendimiento(billetera.id, {
        monto: parsedMonto,
      })
      sileo.success({ title: 'Rendimiento registrado exitosamente' })
      onSuccess(updated)
      onClose()
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos registrar el rendimiento. Intentá de nuevo.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const simboloMoneda = billetera.moneda === 'USD' ? 'USD' : '$'
  const parsedMonto = parseFloat(monto)
  const isValid = !isNaN(parsedMonto) && parsedMonto > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      ariaLabel="Registrar rendimiento"
    >
      <form onSubmit={handleSubmit} className={`${styles.formContainer} ${styles.formContainerFlex}`}>
        <div className={styles.formHeader}>
          <div className={`${styles.bankPreview} ${styles.bankPreviewNoMargin}`}>
            <div className={`${styles.pickerLogoCircle} ${styles.size36}`} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div className={styles.bankPreviewInfo}>
              <p className={styles.bankPreviewNombre}>Registrar Rendimiento</p>
              <p className={styles.bankPreviewTipo}>{billetera.nombre}</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.formBody}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="rendimiento-monto">
              Monto a acreditar
            </label>
            <div className={styles.saldoWrap}>
              <span className={styles.saldoPrefix}>{simboloMoneda}</span>
              <input
                id="rendimiento-monto"
                type="number"
                step="0.01"
                min="0.01"
                className={styles.saldoInput}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            {rendimientoEstimado != null && (
              <span className={styles.fieldOptional} style={{ marginTop: 4 }}>
                Estimado según TNA: <strong>+{formatMonto(rendimientoEstimado, billetera.moneda)}</strong>
              </span>
            )}
          </div>

          <div className={styles.warningBox} style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <span className={styles.warningIcon}>💡</span>
            <p className={styles.warningText} style={{ color: 'var(--text-2)' }}>
              Al confirmar, el monto se acreditará directamente en el saldo de la billetera y comenzará un nuevo período de devengamiento.
            </p>
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.crearBtn}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar rendimiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
