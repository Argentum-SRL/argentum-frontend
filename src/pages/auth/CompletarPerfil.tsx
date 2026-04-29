import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthLayout from '../../components/ui/AuthLayout'
import { completarPerfil } from '../../lib/api/auth'
import { manejarRespuestaAuth } from '../../utils/authRedirect'

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function CompletarPerfil() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const nombreError = hasSubmitted && !nombre.trim() ? 'Ingresá tu nombre.' : null
  const apellidoError = hasSubmitted && !apellido.trim() ? 'Ingresá tu apellido.' : null
  const emailError = hasSubmitted && !email.trim() ? 'Ingresá tu mail.' : null
  const passwordError = hasSubmitted ? validatePassword(password) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!nombre.trim() || !apellido.trim() || !email.trim() || passwordError) return
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await completarPerfil({ nombre, apellido, email, password })
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full h-12 px-4 rounded-[10px] border outline-none transition-colors"
  const inputStyle = (error: string | null) => ({
    fontSize: '16px',
    background: 'var(--surface)',
    color: 'var(--text)',
    borderColor: error ? '#C0392B' : 'var(--surface-alt)',
  })
  const labelStyle = { fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' } as const
  const errorStyle = { fontSize: '13px', color: '#C0392B' } as const

  return (
    <AuthLayout title="Completá tu perfil">
      <p className="mb-5" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
        Para terminar de configurar tu cuenta necesitamos algunos datos más.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block mb-1.5" style={labelStyle}>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              className={inputClass}
              style={inputStyle(nombreError)}
            />
            {nombreError && <p className="mt-1" style={errorStyle}>{nombreError}</p>}
          </div>
          <div className="flex-1">
            <label className="block mb-1.5" style={labelStyle}>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className={inputClass}
              style={inputStyle(apellidoError)}
            />
            {apellidoError && <p className="mt-1" style={errorStyle}>{apellidoError}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5" style={labelStyle}>Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle(emailError)}
          />
          {emailError && <p className="mt-1" style={errorStyle}>{emailError}</p>}
        </div>

        <div className="mb-6">
          <label className="block mb-1.5" style={labelStyle}>Contraseña</label>
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
          {passwordError && <p className="mt-1" style={errorStyle}>{passwordError}</p>}
          <p className="mt-1" style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            Mínimo 8 caracteres, una mayúscula, una minúscula y un número.
          </p>
        </div>

        {apiError && (
          <p className="mb-4 text-center" style={errorStyle}>{apiError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)', fontSize: '15px' }}
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Guardar y continuar'}
        </button>
      </form>
    </AuthLayout>
  )
}
