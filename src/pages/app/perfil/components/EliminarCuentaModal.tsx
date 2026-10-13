import React, { useState, useCallback } from 'react'
import { AlertTriangle, AlertCircle } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { LunarLoader } from '@/components/ui/LunarLoader'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import { useAuth } from '@/hooks/useAuth'
import usuarioService from '@/services/usuario.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import confirmStyles from '@/components/ui/ConfirmModal/ConfirmModal.module.css'
import styles from './EliminarCuentaModal.module.css'

interface EliminarCuentaModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EliminarCuentaModal: React.FC<EliminarCuentaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { usuario, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const tienePassword = Boolean(usuario?.password_configurada)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setPassword('')
    setErrorMsg(null)
    onClose()
  }, [isSubmitting, onClose])

  const ejecutarEliminacion = async (payload: { password?: string; google_token?: string }) => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await usuarioService.eliminarCuenta(payload)
      sileo.success({ title: 'Tu cuenta ha sido eliminada exitosamente.' })
      onClose()
      await logout()
    } catch (err) {
      console.error('Error al eliminar la cuenta:', err)
      const msg = getErrorMessage(err, 'Hubo un error al intentar eliminar la cuenta.')
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tienePassword) return
    const passLimpia = password.trim()
    if (!passLimpia || isSubmitting) return
    ejecutarEliminacion({ password: passLimpia })
  }

  const handleGoogleSuccess = ({ credential }: { credential: string }) => {
    if (isSubmitting) return
    ejecutarEliminacion({ google_token: credential })
  }

  const handleGoogleError = () => {
    setErrorMsg('No se pudo verificar tu cuenta de Google. Intentá nuevamente.')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showHeader={false}
      size="md"
      autoHeight
      className={styles.modal}
    >
      <form className={confirmStyles.modalContent} onSubmit={handleSubmit}>
        <div className={[confirmStyles.iconWrap, confirmStyles.iconWrapDanger, styles.iconWrap].join(' ')}>
          <AlertTriangle className={styles.iconAlert} size={32} />
        </div>

        <h2 className={[confirmStyles.title, styles.title].join(' ')}>
          ¿Eliminar tu cuenta de Argentum permanentemente?
        </h2>
        <p className={[confirmStyles.description, styles.description].join(' ')}>
          <span className={styles.descDesktop}>
            Esta acción es IRREVERSIBLE. Se borrarán todas tus billeteras, transacciones, presupuestos, suscripciones y datos personales sin posibilidad de recuperación.
          </span>
          <span className={styles.descMobile}>
            Esta acción es <strong>IRREVERSIBLE</strong>. Se borrarán todas tus billeteras, transacciones y datos sin posibilidad de recuperación.
          </span>
        </p>

        {tienePassword ? (
          <div className={styles.inputWrap}>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              className={styles.passwordInput}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errorMsg) setErrorMsg(null)
              }}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        ) : (
          <div className={styles.googleWrap}>
            <p className={styles.googleInstruction}>Para confirmar, elegí tu cuenta de Google.</p>
            <div className={styles.googleBtnContainer}>
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={[confirmStyles.actions, styles.actions].join(' ')}>
          <button
            type="button"
            className={[confirmStyles.cancelBtn, styles.cancelBtn].join(' ')}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          {tienePassword && (
            <button
              type="submit"
              className={[confirmStyles.confirmBtn, confirmStyles.confirmBtnDanger, styles.confirmBtn].join(' ')}
              disabled={!password.trim() || isSubmitting}
            >
              {isSubmitting && <LunarLoader size={16} />}
              Eliminar cuenta definitivamente
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
