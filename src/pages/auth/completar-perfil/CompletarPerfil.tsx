import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import Field from '@/components/ui/Field/Field'
import { completarPerfil } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './CompletarPerfil.module.css'

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function CompletarPerfil() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const nombreError = hasSubmitted && !nombre.trim() ? 'Ingresá tu nombre.' : null
  const apellidoError = hasSubmitted && !apellido.trim() ? 'Ingresá tu apellido.' : null
  const emailError = hasSubmitted && !email.trim() ? 'Ingresá tu mail.' : null
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted 
    ? (!confirmPassword ? 'Confirmá tu contraseña.' : (password !== confirmPassword ? 'Las contraseñas no coinciden.' : null))
    : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    const pError = validatePassword(password)
    const cpError = !confirmPassword 
      ? 'Confirmá tu contraseña.' 
      : password !== confirmPassword 
        ? 'Las contraseñas no coinciden.' 
        : null

    if (!nombre.trim() || !apellido.trim() || !email.trim() || pError || cpError) {
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await completarPerfil({ nombre, apellido, email, password })
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Completá tu perfil">
      <p className={styles.subtitle}>
        Para terminar de configurar tu cuenta necesitamos algunos datos más.
      </p>

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
              hint="Mínimo 8 caracteres, una mayúscula, una minúscula y un número."
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
              label="Repetir contraseña"
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
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Guardar y continuar'}
        </button>
      </form>
    </AuthLayout>
  )
}
