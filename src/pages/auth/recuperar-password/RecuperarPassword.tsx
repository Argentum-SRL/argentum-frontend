import { type FormEvent, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import Field from '@/components/ui/Field/Field'
import { recuperarPassword, verificarRecuperacion } from '@/services/auth.service'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './RecuperarPassword.module.css'

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'La contraseña tiene que tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function RecuperarPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || ''
  const codigoParam = searchParams.get('codigo') || ''
  const tieneParams = Boolean(emailParam && codigoParam)

  const [email, setEmail] = useState(emailParam)
  const [codigo] = useState(codigoParam)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const emailError = hasSubmitted && !tieneParams && !email.trim() ? 'Ingresá tu mail.' : null
  
  const passwordError = hasSubmitted && tieneParams ? validatePassword(nuevaPassword) : null
  const confirmarPasswordError = hasSubmitted && tieneParams
    ? !confirmarPassword
      ? 'Confirmá tu contraseña.'
      : confirmarPassword !== nuevaPassword
        ? 'Las contraseñas no coinciden. Revisalas.'
        : null
    : null

  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!email.trim()) return

    setLoading(true)
    setApiError(null)
    
    try {
      await recuperarPassword(email)
      setEnviado(true)
      setHasSubmitted(false)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "No pudimos mandarte el email. Revisá que el email sea correcto e intentá de nuevo."))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    const pError = validatePassword(nuevaPassword)
    const cpError = !confirmarPassword 
      ? 'Confirmá tu contraseña.' 
      : confirmarPassword !== nuevaPassword 
        ? 'Las contraseñas no coinciden. Revisalas.' 
        : null

    if (pError || cpError || !codigo || !email.trim()) return

    setLoading(true)
    setApiError(null)

    try {
      await verificarRecuperacion({
        email: email.trim(),
        codigo: codigo.trim(),
        nueva_password: nuevaPassword
      })
      
      navigate('/login', {
        state: { message: 'Tu contraseña fue restablecida con éxito. Ya podés iniciar sesión.' }
      })
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "No pudimos cambiar tu contraseña. El enlace puede haber expirado — pedí uno nuevo."))
    } finally {
      setLoading(false)
    }
  }

  if (tieneParams) {
    return (
      <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
        <form onSubmit={handleResetPassword} noValidate>
          <div className={styles.stepHeader}>
            <p className={styles.description}>
              Ingresá tu nueva contraseña para <strong>{email}</strong>.
            </p>
          </div>

          <div className={styles.passwordRow}>
            <div className={styles.passwordCol}>
              <Field
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                value={nuevaPassword}
                onChange={setNuevaPassword}
                error={passwordError}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className={styles.togglePassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
            <div className={styles.passwordCol}>
              <Field
                label="Confirmar"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={setConfirmarPassword}
                error={confirmarPasswordError}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className={styles.togglePassword}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
          </div>

          {apiError && <p className={styles.error}>{apiError}</p>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  if (enviado) {
    return (
      <AuthLayout title="¡Enlace enviado!" leftPanel={<WppChatMockup />}>
        <div className={styles.successContainer}>
          <div className={styles.successIconWrap}>
            <CheckCircle2 size={48} className={styles.successIcon} />
          </div>
          <p className={styles.successMessage}>
            Si hay una cuenta con ese email, te vamos a mandar un enlace para cambiar tu contraseña.
          </p>
          <p className={styles.instructions}>
            Por favor, revisá tu bandeja de entrada (y la carpeta de correo no deseado/spam) y hacé clic en el botón del correo para continuar.
          </p>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => setEnviado(false)}
          >
            Volver a intentar
          </button>
          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
      <form onSubmit={handleSendCode} noValidate>
        <p className={styles.description}>
          Ingresá tu mail y te enviamos un enlace para restablecer tu contraseña de forma segura.
        </p>

        <Field
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
          error={emailError}
        />

        {apiError && <p className={styles.error}>{apiError}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>

        <div className={styles.backToLogin}>
          <Link to="/login" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
