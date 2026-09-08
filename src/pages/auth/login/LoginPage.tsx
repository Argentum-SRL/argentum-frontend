import { type FormEvent, useState, useCallback } from 'react'
import { useNavigate, Link, useLocation, type Location } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import Field from '@/components/ui/Field/Field'
import { loginWithEmail, loginWithGoogle } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './LoginPage.module.css'

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isEmailNoVerificado, setIsEmailNoVerificado] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const successMessage = location.state?.message

  const logGoogleError = (stage: string, error: unknown) => {
    if (!import.meta.env.DEV) return
    console.error(`[Auth][Google][Login] ${stage}`, error)
  }

  const emailError = hasSubmitted
    ? !email.trim()
      ? 'Ingresá tu mail.'
      : !EMAIL_REGEX.test(email.trim())
        ? 'Ingresá un correo electrónico válido.'
        : null
    : null
  const passwordError = hasSubmitted && !password ? 'Ingresá tu contraseña.' : null

  const handleGoogleSuccess = useCallback(async ({ credential }: { credential: string }) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Auth][Google][Login] credential recibido', { length: credential.length })
      }
      setLoading(true)
      setApiError(null)
      const respuesta = await loginWithGoogle(credential)
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate, from)
    } catch (err: unknown) {
      logGoogleError('Error al llamar loginWithGoogle', err)
      setApiError(getErrorMessage(err, 'Falló el login con Google.'))
    } finally {
      setLoading(false)
    }
  }, [login, navigate, from])

  const handleGoogleError = useCallback(() => {
    if (import.meta.env.DEV) {
      console.error('[Auth][Google][Login] onError del botón Google')
    }
    setApiError('Falló el login con Google.')
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!email.trim() || !password) return
    setLoading(true)
    setApiError(null)
    setIsEmailNoVerificado(false)
    try {
      const respuesta = await loginWithEmail({ email, password })
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate, from)
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[Auth][Email][Login] Error visible en UI', err)
      }
      const axiosError = err as { response?: { data?: { error?: { code?: string; message?: string } } } }
      const errCode = axiosError?.response?.data?.error?.code
      const msg = getErrorMessage(err, "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.")
      if (errCode === 'EMAIL_NO_VERIFICADO' || msg.includes('Todavía no verificaste tu cuenta')) {
        setIsEmailNoVerificado(true)
      }
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Te damos la bienvenida de vuelta" leftPanel={<WppChatMockup />}>
      {successMessage && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={20} />
          <p className={styles.successText}>{successMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          id="login-email"
          name="email"
          autoComplete="username email"
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
          error={emailError}
          placeholder="tu@email.com"
        />

        <Field
          id="login-password"
          name="password"
          autoComplete="current-password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          error={passwordError}
          placeholder="Tu contraseña"
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

        <div className={styles.forgotContainer}>
          <Link to="/auth/recuperar-password" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {apiError && (
          <div className={styles.errorContainer}>
            <p className={styles.error}>{apiError}</p>
            {isEmailNoVerificado && (
              <Link
                to={`/auth/verificar-email?email=${encodeURIComponent(email.trim())}`}
                className={styles.errorLink}
              >
                Verificar mi email
              </Link>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>o</span>
          <div className={styles.dividerLine} />
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <p className={styles.footer}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className={styles.footerLink}>
            Registrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
