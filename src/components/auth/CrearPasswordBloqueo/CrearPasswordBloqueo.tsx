import React, { useState } from 'react'
import { esPunteroFino } from '@/utils/foco'
import { Eye, EyeOff, LogOut } from '@/components/ui/icons'
import type { Usuario } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import {
  getPasswordMissingError,
  validatePassword,
  validatePasswordConfirmation,
} from '@/utils/password.utils'
import {
  AtmosphericBackground,
  AtmosphericMoonIcon,
  ThemeToggle,
  Field,
  Button,
} from '@/components/ui'
import styles from './CrearPasswordBloqueo.module.css'

interface Props {
  usuario: Usuario
}

export default function CrearPasswordBloqueo({ usuario }: Props) {
  const { updateUsuario, logout } = useAuth()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const passwordError = hasSubmitted ? getPasswordMissingError(password) : null
  const confirmError = hasSubmitted ? validatePasswordConfirmation(password, passwordConfirm) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)
    setErrorMsg(null)

    const pErr = validatePassword(password)
    const cErr = validatePasswordConfirmation(password, passwordConfirm)
    if (pErr || cErr) return

    setIsSubmitting(true)
    try {
      await usuarioService.actualizarPassword({
        password_nueva: password,
        password_nueva_confirmacion: passwordConfirm,
      })
      sileo.success({ title: 'Contraseña creada.' })
      updateUsuario({ ...usuario, password_configurada: true })
    } catch (err: unknown) {
      const msg = getErrorMessage(
        err,
        'No se pudo guardar la contraseña. Revisá los datos y probá de nuevo.'
      )
      setErrorMsg(msg)
      sileo.error({ title: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AtmosphericBackground
      fullScreen={false}
      centered={false}
      compensateBottomNav={false}
      className={styles.page}
    >
      <ThemeToggle />

      <div className={styles.inner}>
        <header className={styles.header}>
          <AtmosphericMoonIcon size={32} />
          <span className={styles.logoText}>Argentum</span>
        </header>

        <main className={styles.card}>
          <h1 className={styles.title}>Creá tu contraseña</h1>

          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="bloqueo-nueva-pw"
              name="new_password"
              label="Nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(val) => {
                setPassword(val)
                if (errorMsg) setErrorMsg(null)
              }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              autoFocus={esPunteroFino()}
              maxLength={128}
              error={passwordError}
              disabled={isSubmitting}
              rightSlot={
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Field
              id="bloqueo-confirm-pw"
              name="confirm_password"
              label="Confirmar contraseña"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(val) => {
                setPasswordConfirm(val)
                if (errorMsg) setErrorMsg(null)
              }}
              placeholder="Repetí tu contraseña"
              autoComplete="new-password"
              maxLength={128}
              error={confirmError}
              disabled={isSubmitting}
              rightSlot={
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  aria-label={showPasswordConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={isSubmitting}
                >
                  {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {errorMsg && (
              <p className={styles.error} role="alert">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              fullWidth
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
          </form>

          <div className={styles.logoutWrap}>
            <button
              type="button"
              onClick={() => logout()}
              className={styles.logoutBtn}
              disabled={isSubmitting}
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </main>

        <p className={styles.footer}>
          Podés cambiarla en cualquier momento desde tu perfil.
        </p>
      </div>
    </AtmosphericBackground>
  )
}
