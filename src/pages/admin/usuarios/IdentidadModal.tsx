import React, { useState } from 'react'
import { Button, Input, Modal, ModalFooter } from '@/components/ui'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import { useAuth } from '@/hooks/useAuth'
import { esPunteroFino } from '@/utils/foco'
import type { ReauthPayload } from '@/types/admin'
import styles from './IdentidadModal.module.css'

export type ModoIdentidadAdmin = 'hacer_admin' | 'quitar_admin' | 'eliminar'

interface IdentidadModalProps {
  isOpen: boolean
  modo: ModoIdentidadAdmin
  nombreObjetivo: string
  emailObjetivo: string | null
  loading: boolean
  errorMsg: string | null
  onClose: () => void
  onSubmit: (payload: { reauth: ReauthPayload; emailConfirmacion?: string }) => Promise<void> | void
}

export const IdentidadModal: React.FC<IdentidadModalProps> = ({
  isOpen,
  modo,
  nombreObjetivo,
  emailObjetivo,
  loading,
  errorMsg,
  onClose,
  onSubmit,
}) => {
  const { usuario: adminActual } = useAuth()
  const tienePassword = Boolean(adminActual?.password_configurada)

  const [emailConfirmacion, setEmailConfirmacion] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [googleError, setGoogleError] = useState<string | null>(null)

  const emailEsperado = (emailObjetivo ?? '').trim().toLowerCase()
  const emailIngresado = emailConfirmacion.trim().toLowerCase()
  const emailValido =
    modo !== 'eliminar' ||
    (emailEsperado ? emailIngresado === emailEsperado : emailIngresado.length > 0)
  const camposCompletos = emailValido && (!tienePassword || passwordActual.length > 0)

  const textoAccion =
    modo === 'hacer_admin'
      ? `Vas a darle permisos de admin a ${nombreObjetivo}.`
      : modo === 'quitar_admin'
      ? `Vas a quitarle los permisos de admin a ${nombreObjetivo}.`
      : `Vas a eliminar la cuenta de ${nombreObjetivo} y todos sus datos. No se puede deshacer.`

  const textoBotonPrincipal =
    modo === 'hacer_admin'
      ? 'Dar permisos'
      : modo === 'quitar_admin'
      ? 'Quitar permisos'
      : 'Eliminar cuenta'

  const enviarConPassword = async () => {
    if (!camposCompletos || loading) return
    setGoogleError(null)
    await onSubmit({
      reauth: { password_actual: passwordActual },
      emailConfirmacion: modo === 'eliminar' ? emailConfirmacion.trim() : undefined,
    })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tienePassword) {
      void enviarConPassword()
    }
  }

  const mensajeErrorVisible = googleError || errorMsg

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmá que sos vos"
      size="sm"
      footer={
        <ModalFooter
          secondary={
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          }
          primary={
            <Button
              type="button"
              variant={modo === 'eliminar' ? 'danger' : 'primary'}
              fullWidth
              loading={loading}
              disabled={tienePassword ? !camposCompletos : true}
              onClick={() => void enviarConPassword()}
            >
              {textoBotonPrincipal}
            </Button>
          }
        />
      }
    >
      <form onSubmit={handleFormSubmit} data-modal-stack="">
        <p className={styles.introText} data-modal-block="">
          {textoAccion}
        </p>

        {modo === 'eliminar' && (
          <div className={styles.fieldGroup} data-modal-field="">
            <label htmlFor="admin-identidad-email" className={styles.fieldLabel}>
              Escribí el email de la cuenta
            </label>
            <Input
              id="admin-identidad-email"
              type="email"
              value={emailConfirmacion}
              onChange={(e) => setEmailConfirmacion(e.target.value)}
              placeholder={emailObjetivo ?? 'usuario@ejemplo.com'}
              autoComplete="off"
              autoFocus={esPunteroFino()}
              disabled={loading}
            />
          </div>
        )}

        {tienePassword ? (
          <div className={styles.fieldGroup} data-modal-field="">
            <label htmlFor="admin-identidad-password" className={styles.fieldLabel}>
              Tu contraseña
            </label>
            <Input
              id="admin-identidad-password"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              autoComplete="current-password"
              autoFocus={modo !== 'eliminar' && esPunteroFino()}
              disabled={loading}
            />
          </div>
        ) : (
          <div className={styles.googleSection} data-modal-block="">
            <p className={styles.googleHint}>Elegí tu cuenta de Google para confirmar.</p>
            <div className={!emailValido ? styles.googleDisabled : undefined}>
              <GoogleLoginButton
                onSuccess={({ credential }) => {
                  if (!emailValido || loading) return
                  setGoogleError(null)
                  void onSubmit({
                    reauth: { google_credential: credential },
                    emailConfirmacion: modo === 'eliminar' ? emailConfirmacion.trim() : undefined,
                  })
                }}
                onError={() => {
                  setGoogleError('No se pudo abrir Google. Probá de nuevo.')
                }}
              />
            </div>
          </div>
        )}

        {mensajeErrorVisible && (
          <p className={styles.errorText} role="alert" data-modal-block="">
            {mensajeErrorVisible}
          </p>
        )}
      </form>
    </Modal>
  )
}

export default IdentidadModal
