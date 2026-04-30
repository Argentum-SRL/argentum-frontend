import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Phone, CheckCircle2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import Field from '@/components/ui/Field/Field'
import { loginWithEmail, loginWithGoogle } from '@/services/auth.service'
import { getToken } from '@/services/api'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const successMessage = location.state?.message

  const logGoogleError = (stage: string, error: unknown) => {
    if (!import.meta.env.DEV) return
    console.error(`[Auth][Google][Login] ${stage}`, error)
  }

  useEffect(() => {
    if (getToken()) navigate('/app/dashboard', { replace: true })
  }, [navigate])

  const emailError = hasSubmitted && !email.trim() ? 'Ingresá tu mail.' : null
  const passwordError = hasSubmitted && !password ? 'Ingresá tu contraseña.' : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!email.trim() || !password) return
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await loginWithEmail({ email, password })
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('[Auth][Email][Login] Error visible en UI', err)
      }
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const message = (err as { message?: string })?.message
      setApiError(detail || message || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Bienvenido de vuelta" leftPanel={<WppChatMockup />}>
      {successMessage && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={20} />
          <p className={styles.successText}>{successMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
          error={emailError}
        />

        <Field
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
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

        {apiError && (
          <div className={styles.errorContainer}>
            <p className={styles.error}>{apiError}</p>
            {apiError.includes('contraseña configurada') && (
              <Link to="/login/telefono" className={styles.errorLink}>
                Ingresá con tu teléfono
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
          onSuccess={async ({ credential }) => {
            try {
              if (import.meta.env.DEV) {
                console.log('[Auth][Google][Login] credential recibido', { length: credential.length })
              }
              setLoading(true)
              setApiError(null)
              const respuesta = await loginWithGoogle(credential)
              login(respuesta)
              manejarRespuestaAuth(respuesta, navigate)
            } catch (err: unknown) {
              logGoogleError('Error al llamar loginWithGoogle', err)
              const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
              const message = (err as { message?: string })?.message
              setApiError(detail || message || 'Falló el login con Google.')
            } finally {
              setLoading(false)
            }
          }}
          onError={() => {
            if (import.meta.env.DEV) {
              console.error('[Auth][Google][Login] onError del botón Google')
            }
            setApiError('Falló el login con Google.')
          }}
        />

        <Link to="/login/telefono" className={styles.altBtn}>
          <Phone size={18} />
          Continuar con teléfono
        </Link>


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
