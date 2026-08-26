import React, { useState } from 'react'
import { Shield, Key, CheckCircle2, AlertCircle, Eye, EyeOff, Save, Check, Lock, Edit3 } from 'lucide-react'
import type { Usuario, MetodosLogin } from '@/types'
import { formatearTelefonoVisual } from '@/utils/telefono.utils'
import usuarioService from '@/services/usuario.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from '../PerfilPage.module.css'



interface TabSeguridadProps {
  usuario: Usuario | null
  metodosLogin: MetodosLogin | null
  updateUsuario: (u: Usuario) => void
  onEditEmail: () => void
  onEditTelefono: () => void
  onVerificarEmail: () => void
}

export const TabSeguridad: React.FC<TabSeguridadProps> = ({
  usuario,
  metodosLogin,
  updateUsuario,
  onEditEmail,
  onEditTelefono,
  onVerificarEmail,
}) => {
  const { showToast } = useToast()

  // Password form state
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPwActual, setShowPwActual] = useState(false)
  const [showPwNueva, setShowPwNueva] = useState(false)
  const [isSavingPw, setIsSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Password validations
  const pw = passwordNueva
  const reqs = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    match: pw.length > 0 && pw === passwordConfirm,
  }
  const isPwValid = reqs.length && reqs.upper && reqs.lower && reqs.number && reqs.match

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)

    if (usuario?.password_configurada && !passwordActual.trim()) {
      setPwError('Ingresá tu contraseña actual para confirmar el cambio.')
      return
    }

    if (usuario?.password_configurada && passwordActual === passwordNueva) {
      setPwError('La nueva contraseña no puede ser idéntica a tu contraseña actual.')
      return
    }

    if (!isPwValid) {
      setPwError('Por favor asegurate de cumplir todos los requisitos de seguridad y que las contraseñas coincidan.')
      return
    }

    setIsSavingPw(true)
    try {
      await usuarioService.actualizarPassword({
        password_actual: passwordActual || undefined,
        password_nueva: passwordNueva,
        password_nueva_confirmacion: passwordConfirm,
      })
      showToast('¡Contraseña actualizada con éxito!', 'success')
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirm('')
      if (usuario) {
        updateUsuario({ ...usuario, password_configurada: true })
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo actualizar la contraseña. Verificá que la contraseña actual sea correcta.')
      setPwError(msg)
      showToast(msg, 'error')
    } finally {
      setIsSavingPw(false)
    }
  }

  return (
    <div className={styles.tabGrid}>
      {/* 1. Métodos de Acceso Vinculados */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Shield size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Métodos de Inicio de Sesión</h3>
          </div>
        </div>

        <div className={styles.contactList}>
          {/* Email y Contraseña */}
          <div className={styles.contactItemBox}>
            <div className={styles.contactItemInfo}>
              <div className={styles.contactItemLabelRow}>
                <span className={styles.contactItemLabel}>Email y Contraseña</span>
                {metodosLogin?.email_password ? (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle2 size={11} /> Activo
                  </span>
                ) : metodosLogin?.puede_agregar_password ? (
                  <span className={styles.unverifiedBadge}>
                    <AlertCircle size={11} /> Sin contraseña
                  </span>
                ) : (
                  <span className={styles.unverifiedBadge}>
                    <AlertCircle size={11} /> No configurado
                  </span>
                )}
              </div>
              <span className={styles.contactItemValue}>
                {usuario?.email || 'Sin correo asignado'}
              </span>
            </div>

            <div className={styles.contactItemAction}>
              {metodosLogin?.puede_agregar_email && (
                <>
                  <button
                    type="button"
                    className={styles.verifyDirectBtn}
                    onClick={onVerificarEmail}
                  >
                    Verificar
                  </button>
                  <button
                    type="button"
                    className={styles.editContactBtn}
                    onClick={onEditEmail}
                  >
                    <Edit3 size={13} />
                    <span>Cambiar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* WhatsApp OTP */}
          <div className={styles.contactItemBox}>
            <div className={styles.contactItemInfo}>
              <div className={styles.contactItemLabelRow}>
                <span className={styles.contactItemLabel}>WhatsApp OTP</span>
                {metodosLogin?.telefono ? (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle2 size={11} /> Activo
                  </span>
                ) : (
                  <span className={styles.unverifiedBadge}>
                    <AlertCircle size={11} /> No vinculado
                  </span>
                )}
              </div>
              <span className={styles.contactItemValue}>
                {usuario?.telefono
                  ? formatearTelefonoVisual(usuario.telefono)
                  : 'Sin WhatsApp asignado'}
              </span>
            </div>

            <div className={styles.contactItemAction}>
              <button
                type="button"
                className={styles.editContactBtn}
                onClick={onEditTelefono}
              >
                <Edit3 size={13} />
                <span>{usuario?.telefono ? 'Cambiar' : 'Asociar'}</span>
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <div className={styles.contactItemBox}>
            <div className={styles.contactItemInfo}>
              <div className={styles.contactItemLabelRow}>
                <span className={styles.contactItemLabel}>Google OAuth</span>
                {metodosLogin?.google ? (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle2 size={11} /> Vinculado
                  </span>
                ) : (
                  <span className={styles.unverifiedBadge}>
                    <AlertCircle size={11} /> No vinculado
                  </span>
                )}
              </div>
              <span className={styles.contactItemValue}>
                {usuario?.auth_provider === 'google'
                  ? `Vinculado como ${usuario.email}`
                  : 'Ingreso rápido con tu cuenta Google'}
              </span>
            </div>

            <div className={styles.contactItemAction}>
              {usuario?.auth_provider === 'google' && (
                <span className={styles.lockedTag} title="Cuenta vinculada con Google">
                  <Lock size={12} /> Google
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Cambiar o Configurar Contraseña */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Key size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Contraseña de Acceso</h3>
          </div>
        </div>

        {usuario?.auth_provider === 'google' ? (
          <div className={styles.googleAuthInfoBanner}>
            <div className={styles.googleIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div className={styles.googleAuthInfoText}>
              <h4>Cuenta autenticada mediante Google</h4>
              <p>
                Iniciás sesión directamente a través de <strong>Google OAuth</strong>. Tu contraseña, autenticación en dos pasos y recuperación son administradas de forma protegida directamente por Google, por lo que no necesitás una contraseña local en Argentum.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePassword} className={styles.formInsideCard}>
            {pwError && (
              <div className={styles.formAlertError}>
                <AlertCircle size={15} />
                <span>{pwError}</span>
              </div>
            )}

          {usuario?.password_configurada && (
            <div className={styles.formGroup}>
              <label htmlFor="pw-actual-input" className={styles.formGroupLabel}>
                Contraseña actual *
              </label>
              <div className={styles.passwordInputWrap}>
                <input
                  id="pw-actual-input"
                  name="current_account_pw"
                  type={showPwActual ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={styles.cleanInput}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="Ingresá tu contraseña actual"
                  required
                />
                <button
                  type="button"
                  className={styles.pwEyeBtn}
                  onClick={() => setShowPwActual(!showPwActual)}
                  tabIndex={-1}
                >
                  {showPwActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="pw-nueva-input" className={styles.formGroupLabel}>
              Nueva contraseña *
            </label>
            <div className={styles.passwordInputWrap}>
              <input
                id="pw-nueva-input"
                name="new_account_pw"
                type={showPwNueva ? 'text' : 'password'}
                autoComplete="new-password"
                className={styles.cleanInput}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Ingresá tu nueva contraseña"
                required
              />
              <button
                type="button"
                className={styles.pwEyeBtn}
                onClick={() => setShowPwNueva(!showPwNueva)}
                tabIndex={-1}
              >
                {showPwNueva ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pw-confirm-input" className={styles.formGroupLabel}>
              Confirmar nueva contraseña *
            </label>
            <div className={styles.passwordInputWrap}>
              <input
                id="pw-confirm-input"
                name="confirm_new_account_pw"
                type="password"
                autoComplete="new-password"
                className={styles.cleanInput}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                required
              />
            </div>
          </div>

          {/* Realtime checklist: only shown if invalid while typing */}
          {(passwordNueva.length > 0 || passwordConfirm.length > 0) && !isPwValid && (
            <div className={styles.pwChecklist}>
              <span className={styles.pwChecklistTitle}>Requisitos de seguridad:</span>
              <div className={styles.pwChecklistGrid}>
                <div className={`${styles.reqItem} ${reqs.length ? styles.reqSuccess : ''}`}>
                  {reqs.length ? <Check size={13} /> : <span className={styles.reqDot} />}
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`${styles.reqItem} ${reqs.upper ? styles.reqSuccess : ''}`}>
                  {reqs.upper ? <Check size={13} /> : <span className={styles.reqDot} />}
                  <span>Al menos una mayúscula</span>
                </div>
                <div className={`${styles.reqItem} ${reqs.lower ? styles.reqSuccess : ''}`}>
                  {reqs.lower ? <Check size={13} /> : <span className={styles.reqDot} />}
                  <span>Al menos una minúscula</span>
                </div>
                <div className={`${styles.reqItem} ${reqs.number ? styles.reqSuccess : ''}`}>
                  {reqs.number ? <Check size={13} /> : <span className={styles.reqDot} />}
                  <span>Al menos un número</span>
                </div>
                <div className={`${styles.reqItem} ${reqs.match ? styles.reqSuccess : ''}`}>
                  {reqs.match ? <Check size={13} /> : <span className={styles.reqDot} />}
                  <span>Las contraseñas coinciden</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.cardFooterActions}>
            <button
              type="submit"
              disabled={isSavingPw || !isPwValid}
              className={styles.saveBtnPrimary}
            >
              <Save size={15} />
              <span>
                {isSavingPw
                  ? 'Guardando...'
                  : usuario?.password_configurada
                  ? 'Actualizar contraseña'
                  : 'Crear contraseña'}
              </span>
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
  )
}
