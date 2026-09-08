import React, { useId, useState } from 'react'
import { Shield, Eye, EyeOff, Check, AlertCircle, Save, LogOut, Info } from 'lucide-react'
import type { Usuario } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import { getPasswordRequirements, validatePassword, validatePasswordConfirmation } from '@/utils/password.utils'
import { Modal } from '@/components/ui'
import styles from './CrearPasswordBloqueo.module.css'

interface Props {
  usuario: Usuario
}

function MoonIcon({ size }: { size: number }) {
  const maskId = `m-${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver, #cbd5e1)" mask={`url(#${maskId})`} />
    </svg>
  )
}

interface DecoMoonDef {
  id: string
  top: string
  left?: string
  right?: string
  size: number
  opacity: number
  anim: string
}

const DECO_MOONS: DecoMoonDef[] = [
  { id: 'bg1', top: '8%', right: '10%', size: 90, opacity: 0.08, anim: 'floatSlow 10s ease-in-out infinite' },
  { id: 'bg2', top: '68%', left: '5%', size: 56, opacity: 0.10, anim: 'floatMedium 8s ease-in-out infinite 1s' },
  { id: 'bg3', top: '78%', right: '12%', size: 120, opacity: 0.05, anim: 'floatSlow 12s ease-in-out infinite 2s' },
  { id: 'bg4', top: '22%', left: '4%', size: 40, opacity: 0.12, anim: 'floatMedium 9s ease-in-out infinite 0.5s' },
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function DecoMoonItem({ id, top, left, right, size, opacity, anim }: DecoMoonDef) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={styles.decoMoon}
      style={{
        '--top': top,
        '--left': left,
        '--right': right,
        '--opacity': opacity,
        '--anim': reducedMotion ? 'none' : anim,
      } as React.CSSProperties}
    >
      <defs>
        <mask id={`deco-${id}`}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver, #cbd5e1)" mask={`url(#deco-${id})`} />
    </svg>
  )
}

export default function CrearPasswordBloqueo({ usuario }: Props) {
  const { updateUsuario, logout } = useAuth()
  const { showToast } = useToast()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const reqs = getPasswordRequirements(password, passwordConfirm)
  const isFormValid = reqs.length && reqs.maxLength && reqs.upper && reqs.lower && reqs.number && reqs.match

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const pErr = validatePassword(password)
    if (pErr) {
      setErrorMsg(pErr)
      return
    }

    const cErr = validatePasswordConfirmation(password, passwordConfirm)
    if (cErr) {
      setErrorMsg(cErr)
      return
    }

    setIsSubmitting(true)
    try {
      await usuarioService.actualizarPassword({
        password_nueva: password,
        password_nueva_confirmacion: passwordConfirm,
      })
      showToast('¡Contraseña configurada con éxito!', 'success')
      updateUsuario({ ...usuario, password_configurada: true })
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No se pudo configurar la contraseña. Verificá los datos e intentá de nuevo.')
      setErrorMsg(msg)
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.pageRoot}>
      {/* Ambient background glows */}
      <div className={styles.ambientGlowTop} aria-hidden="true" />
      <div className={styles.ambientGlowBottom} aria-hidden="true" />

      {/* Signature Argentum decorative floating moons */}
      {DECO_MOONS.map((moon) => (
        <DecoMoonItem key={moon.id} {...moon} />
      ))}

      {/* Brand header */}
      <header className={styles.bgHeader}>
        <div className={styles.bgLogoWrap}>
          <MoonIcon size={32} />
          <span className={styles.bgLogoText}>Argentum</span>
        </div>
        <div className={styles.bgBadge}>
          <span className={styles.bgBadgeDot} />
          <span>Acceso Seguro</span>
        </div>
      </header>

      {/* Central Modal (bottom sheet on mobile, centered card on desktop) */}
      <Modal
        isOpen={true}
        onClose={() => logout()}
        size="md"
        noPadding
        closeOnOverlayClick={false}
        closeOnEscape={false}
        ariaLabel="Establecer contraseña de acceso"
        title={
          <div className={styles.modalTitleWrap}>
            <Shield size={18} className={styles.modalTitleIcon} />
            <span>Establecer Contraseña de Acceso</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className={styles.modalFormContainer} noValidate>
          {errorMsg && (
            <div className={styles.modalAlertError} role="alert">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className={styles.modalFormBody}>
            <div className={styles.explanationBanner}>
              <Info size={16} />
              <span>
                Para tu seguridad y para garantizar que nunca pierdas el acceso a tu cuenta ni a tus datos financieros si no podés ingresar con Google, necesitás configurar una contraseña de acceso.
              </span>
            </div>

            <div className={styles.formField}>
              <label htmlFor="bloqueo-nueva-pw" className={styles.fieldLabel}>
                Nueva contraseña *
              </label>
              <div className={styles.passwordInputWrap}>
                <input
                  id="bloqueo-nueva-pw"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.fieldInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá una contraseña segura"
                  autoComplete="new-password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.modalPwEyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="bloqueo-confirm-pw" className={styles.fieldLabel}>
                Confirmar nueva contraseña *
              </label>
              <div className={styles.passwordInputWrap}>
                <input
                  id="bloqueo-confirm-pw"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  className={styles.fieldInput}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.modalPwEyeBtn}
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  aria-label={showPasswordConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

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
          </div>

          <div className={styles.modalFormFooter}>
            <button
              type="button"
              onClick={() => logout()}
              className={styles.modalCancelBtn}
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={styles.modalSubmitBtn}
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar contraseña'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
