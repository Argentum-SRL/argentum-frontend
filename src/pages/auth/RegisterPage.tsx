import { type FormEvent, useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Phone } from 'lucide-react'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'
import AuthLayout from '../../components/auth/AuthLayout'
import DashboardMockup from '../../components/ui/DashboardMockup'
import { registerWithEmail, loginWithGoogle } from '../../services/auth.service'
import { getToken } from '../../services/api'
import { manejarRespuestaAuth } from '../../utils/authRedirect'
import { useAuth } from '../../hooks/useAuth'

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

  const inputClass = "w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
  const inputStyle = (error: string | null) => ({
    fontSize: '16px',
    background: 'var(--surface)',
    color: 'var(--text)',
    borderColor: error ? '#C0392B' : 'var(--surface-alt)',
  })

  return (
    <AuthLayout title="Crear cuenta" leftPanel={<DashboardMockup />}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              className={inputClass}
              style={inputStyle(nombreError)}
            />
            {nombreError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{nombreError}</p>}
          </div>
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Apellido
            </label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className={inputClass}
              style={inputStyle(apellidoError)}
            />
            {apellidoError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{apellidoError}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Teléfono
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+5491112345678"
            className={inputClass}
            style={inputStyle(telefonoError)}
          />
          {telefonoError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{telefonoError}</p>}
          <p className="mt-1" style={{ fontSize: '12px', color: 'var(--text-3)' }}>Incluí el código de país, ej: +54</p>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle(emailError)}
          />
          {emailError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{emailError}</p>}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                style={{ ...inputStyle(passwordError), paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ color: 'var(--text-3)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{passwordError}</p>}
          </div>
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Repetir
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                style={{ ...inputStyle(confirmPasswordError), paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{ color: 'var(--text-3)' }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{confirmPasswordError}</p>}
          </div>
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
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>o</span>
          <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
        </div>

        <div className="flex justify-center w-full">
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

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
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
