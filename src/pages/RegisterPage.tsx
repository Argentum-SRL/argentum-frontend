import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import AuthLayout from '../components/ui/AuthLayout'
import { registerWithEmail, loginWithGoogle } from '../lib/api/auth'
import { getToken } from '../lib/auth'

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
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

  useEffect(() => {
    if (getToken()) navigate('/app/dashboard', { replace: true })
  }, [navigate])

  const nameError = hasSubmitted && !name.trim() ? 'Ingresá tu nombre.' : null
  const apellidoError = hasSubmitted && !apellido.trim() ? 'Ingresá tu apellido.' : null
  const emailError = hasSubmitted && !email.trim() ? 'Ingresá tu mail.' : null
  const telefonoError = hasSubmitted && !telefono.trim() ? 'Ingresá tu teléfono.' : null

  const validatePassword = (pwd: string) => {
    if (!pwd) return 'Creá una contraseña.'
    if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
    if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
    if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
    if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
    return null
  }
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted && confirmPassword !== password ? 'Las contraseñas no coinciden.' : (!confirmPassword && hasSubmitted ? 'Confirmá tu contraseña.' : null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!name.trim() || !apellido.trim() || !email.trim() || !telefono.trim() || passwordError || confirmPasswordError) return
    setLoading(true)
    setApiError(null)
    try {
      await registerWithEmail({ name, apellido, email, telefono, password })
      navigate('/onboarding', { replace: true })
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (status === 409 && detail) {
        setApiError(detail)
      } else if (status === 422 && detail) {
        const msg = Array.isArray(detail) ? detail[0]?.msg : detail
        setApiError(msg ? msg.replace('Value error, ', '') : 'Verificá los datos ingresados.')
      } else {
        setApiError('Algo salió mal. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-3 mb-4">
          {/* Nombre */}
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
              style={{
                fontSize: '16px',
                background: 'var(--surface)',
                color: 'var(--text)',
                borderColor: nameError ? '#C0392B' : 'var(--surface-alt)',
              }}
            />
            {nameError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{nameError}</p>}
          </div>

          {/* Apellido */}
          <div className="flex-1">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Apellido
            </label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
              style={{
                fontSize: '16px',
                background: 'var(--surface)',
                color: 'var(--text)',
                borderColor: apellidoError ? '#C0392B' : 'var(--surface-alt)',
              }}
            />
            {apellidoError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{apellidoError}</p>}
          </div>
        </div>

        {/* Teléfono */}
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Teléfono
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
            style={{
              fontSize: '16px',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderColor: telefonoError ? '#C0392B' : 'var(--surface-alt)',
            }}
          />
          {telefonoError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{telefonoError}</p>}
        </div>

        {/* Mail */}
        <div className="mb-4">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
            style={{
              fontSize: '16px',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderColor: emailError ? '#C0392B' : 'var(--surface-alt)',
            }}
          />
          {emailError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{emailError}</p>}
        </div>

        {/* Contraseña y Confirmar Contraseña */}
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
                className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
                style={{
                  fontSize: '16px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  borderColor: passwordError ? '#C0392B' : 'var(--surface-alt)',
                  paddingRight: '48px',
                }}
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
              Repetir Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
                style={{
                  fontSize: '16px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  borderColor: confirmPasswordError ? '#C0392B' : 'var(--surface-alt)',
                  paddingRight: '48px',
                }}
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
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  setLoading(true)
                  setApiError(null)
                  const data = await loginWithGoogle(credentialResponse.credential)
                  if (!data.user.onboarding_completo) {
                    navigate('/onboarding', { replace: true })
                  } else {
                    navigate('/app/dashboard', { replace: true })
                  }
                } catch (error) {
                  setApiError('Falló el login con Google')
                } finally {
                  setLoading(false)
                }
              }
            }}
            onError={() => {
              setApiError('Falló el login con Google')
            }}
          />
        </div>

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
