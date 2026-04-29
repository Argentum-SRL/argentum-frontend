import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Phone, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../components/ui/AuthLayout'
import WppChatMockup from '../components/ui/WppChatMockup'
import GoogleLoginButton from '../components/ui/GoogleLoginButton'
import { loginWithEmail, loginWithGoogle } from '../lib/api/auth'
import { getToken } from '../lib/auth'
import { manejarRespuestaAuth } from '../utils/authRedirect'
import { useAuth } from '../hooks/useAuth'

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.32.07 2.24.77 3.01.8.96-.19 1.88-.9 3.05-.96 1.55-.08 2.98.57 3.82 1.76-3.53 2.08-2.94 6.72.56 8.03-.65 1.56-1.47 3.1-2.44 3.23zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="currentColor"
      />
    </svg>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoFocus?: boolean
  error?: string | null
  rightSlot?: React.ReactNode
}

function Field({ label, value, onChange, type = 'text', autoFocus, error, rightSlot }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
          style={{
            fontSize: '16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderColor: error ? '#C0392B' : 'var(--surface-alt)',
            paddingRight: rightSlot ? '48px' : '16px',
          }}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{error}</p>
      )}
    </div>
  )
}

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
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-400 animate-in slide-in-from-top-2 duration-500">
          <CheckCircle2 size={20} />
          <p className="text-sm font-bold">{successMessage}</p>
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

        <div className="mb-6">
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
                style={{ color: 'var(--text-3)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        {apiError && (
          <p className="mb-4 text-center" style={{ fontSize: '13px', color: '#C0392B' }}>
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)', fontSize: '15px' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>o</span>
          <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
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

        <Link
          to="/login/telefono"
          className="w-full h-12 rounded-[10px] border flex items-center justify-center gap-3 font-medium mt-3 transition-colors"
          style={{ borderColor: 'var(--silver)', color: 'var(--text)', fontSize: '15px', textDecoration: 'none' }}
        >
          <Phone size={18} />
          Continuar con teléfono
        </Link>

        <button
          type="button"
          disabled
          className="w-full h-12 rounded-[10px] border flex items-center justify-center gap-3 font-medium mt-3 opacity-60 cursor-not-allowed"
          style={{ borderColor: 'var(--silver)', color: 'var(--text)', fontSize: '15px' }}
        >
          <AppleIcon />
          Continuar con Apple
        </button>

        <p className="text-center mt-6" style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--primary)' }}>
            Registrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
