import { ChevronLeft, X, Trash2 } from '@/components/ui/icons'
import styles from './TransaccionModal.module.css'
import ReintegroBloque from './ReintegroBloque'
import type { useReintegro } from './useReintegro'

export interface ReintegroPasoProps {
  step: number
  slideDirection: 'forward' | 'back'
  isEdit: boolean
  isCuotaHija: boolean
  isSubmitting: boolean
  isPendienteIA: boolean
  esDebitoUsdEnPesos: boolean
  reintegroHook: ReturnType<typeof useReintegro>
  onGoBack: () => void
  onGoNext: () => void
  onSubmit: () => void
  onClose: () => void
  onDelete: () => void
  onToggleOff: () => void
}

export default function ReintegroPaso({
  step,
  slideDirection,
  isEdit,
  isCuotaHija,
  isSubmitting,
  isPendienteIA,
  esDebitoUsdEnPesos,
  reintegroHook,
  onGoBack,
  onGoNext,
  onSubmit,
  onClose,
  onDelete,
  onToggleOff,
}: ReintegroPasoProps) {
  return (
    <div
      className={`${styles.slide} ${
        step === 4
          ? styles.slideVisible
          : step < 4
          ? (slideDirection === 'forward' ? styles.slideEnterRight : styles.slideEnterLeft)
          : (slideDirection === 'forward' ? styles.slideExitLeft : styles.slideExitRight)
      }`}
      data-modal-frame
    >
      <form 
        className={styles.formContainer}
        onSubmit={(e) => {
          e.preventDefault()
          if (esDebitoUsdEnPesos) {
            onGoNext()
          } else {
            onSubmit()
          }
        }}
      >
        <div
          className={`${styles.formBody} ${styles.formBodyWithHeader}`}
        >
          <div className={styles.formHeader}>
            <div className={styles.headerLeft}>
              <button type="button" className={styles.backBtn} onClick={onGoBack} title="Atrás" aria-label="Atrás">
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <div>
                <h2 className={styles.headerTitle}>Reintegro</h2>
              </div>
            </div>
            <div className={styles.headerRightActions}>
              {isEdit && (
                <button
                  type="button"
                  className={styles.deleteHeaderBtn}
                  onClick={onDelete}
                  title={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                  aria-label={isCuotaHija ? 'Eliminar esta cuota' : 'Eliminar transacción'}
                  data-modal-delete
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className={styles.formFields} data-modal-stack>
            <ReintegroBloque
              reintegro={reintegroHook}
              isEdit={isEdit}
              onToggleOff={onToggleOff}
            />
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onGoBack}>Atrás</button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {esDebitoUsdEnPesos
              ? 'Continuar'
              : isSubmitting
              ? 'Guardando...'
              : isPendienteIA
              ? 'Confirmar transacción'
              : isEdit
              ? 'Guardar cambios'
              : 'Guardar transacción'}
          </button>
        </div>
      </form>
    </div>
  )
}
