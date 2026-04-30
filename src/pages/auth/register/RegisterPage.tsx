import { type FormEvent, useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Phone } from 'lucide-react'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import DashboardMockup from '@/components/mock/DashboardMockup/DashboardMockup'
import Field from '@/components/ui/Field/Field'
import { registerWithEmail, loginWithGoogle } from '@/services/auth.service'
import { getToken } from '@/services/api'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './RegisterPage.module.css'

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const logGoogleError = (stage: string, error: unknown) => {
    if (!import.meta.env.DEV) return
    console.error(`[Auth][Google][Register] ${stage}`, error)
  }

  useEffect(() => {
    if (getToken()) navigate('/app/dashboard', { replace: true })
  }, [navigate])

  const nombreError = hasSubmitted && !nombre.trim() ? 'Ingresá tu nombre.' : null
  const apellidoError = hasSubmitted && !apellido.trim() ? 'Ingresá tu apellido.' : null
  const emailError = hasSubmitted && !email.trim() ? 'Ingresá tu mail.' : null
  const telefonoError = hasSubmitted && !telefono.trim() ? 'Ingresá tu teléfono.' : null
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted
    ? !confirmPassword
      ? 'Confirmá tu contraseña.'
      : confirmPassword !== password
        ? 'Las contraseñas no coinciden.'
        : null
    : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !telefono.trim() || passwordError || confirmPasswordError) return
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await registerWithEmail({ nombre, apellido, email, telefono, password })
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: unknown } } }
      const status = e.response?.status
      const detail = e.response?.data?.detail
      if ((status === 400 || status === 409) && typeof detail === 'string') {
        setApiError(detail)
      } else if (status === 422 && Array.isArray(detail)) {
        const msg = (detail[0] as { msg?: string })?.msg
        setApiError(msg ? msg.replace('Value error, ', '') : 'Verificá los datos ingresados.')
      } else {
        setApiError('Algo salió mal. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = useCallback(async (credentialResponse: { credential: string }) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Auth][Google][Register] onSuccess', {
          credentialLength: credentialResponse.credential.length,
          credentialPrefix: `${credentialResponse.credential.slice(0, 12)}...`,
        })
      }
      setLoading(true)
      setApiError(null)
      const respuesta = await loginWithGoogle(credentialResponse.credential)
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
  }, [navigate, login])

  const handleGoogleError = useCallback(() => {
    if (import.meta.env.DEV) {
      console.error('[Auth][Google][Register] onError del botón Google')
    }
    setApiError('Falló el login con Google.')
  }, [])

  return (
    <AuthLayout title="Crear cuenta" leftPanel={<DashboardMockup />}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.nameRow}>
          <div className={styles.nameCol}>
            <Field
              label="Nombre"
              type="text"
              value={nombre}
              onChange={setNombre}
              autoFocus
              error={nombreError}
            />
          </div>
          <div className={styles.nameCol}>
            <Field
              label="Apellido"
              type="text"
              value={apellido}
              onChange={setApellido}
              error={apellidoError}
            />
          </div>
        </div>

        <Field
          label="Teléfono"
          type="tel"
          value={telefono}
          onChange={setTelefono}
          placeholder="+5491112345678"
          error={telefonoError}
          hint="Incluí el código de país, ej: +54"
        />

        <Field
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          error={emailError}
        />

        <div className={styles.passwordRow}>
          <div className={styles.passwordCol}>
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
          </div>
          <div className={styles.passwordCol}>
            <Field
              label="Repetir"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={confirmPasswordError}
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
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>o</span>
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.googleWrap}>
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <Link to="/login/telefono" className={styles.altBtn}>
          <Phone size={18} />
          Continuar con teléfono
        </Link>


        <p className={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className={styles.footerLink}>
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
