import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import Field from '@/components/ui/Field/Field'
import { completarPerfil } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './CompletarPerfil.module.css'

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const validateEmail = (val: string): string | null => {
  const e = val.trim()
  if (!e) return 'Ingresá tu mail.'
  if (e.length > 255) return 'El correo electrónico no puede tener más de 255 caracteres.'
  if (!EMAIL_REGEX.test(e)) return 'Ingresá un correo electrónico válido.'
  return null
}

const validateName = (val: string, campo: string): string | null => {
  const t = val.trim()
  if (!t) return `Ingresá tu ${campo}.`
  if (t.length < 2) return `El ${campo} debe tener al menos 2 caracteres.`
  if (t.length > 100) return `El ${campo} no puede tener más de 100 caracteres.`
  return null
}

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'
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

  const nombreError = hasSubmitted ? validateName(nombre, 'nombre') : null
  const apellidoError = hasSubmitted ? validateName(apellido, 'apellido') : null
  const emailError = hasSubmitted ? validateEmail(email) : null
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted 
    ? (!confirmPassword ? 'Confirmá tu contraseña.' : (password !== confirmPassword ? 'Las contraseñas no coinciden.' : null))
    : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    const nError = validateName(nombre, 'nombre')
    const aError = validateName(apellido, 'apellido')
    const eError = validateEmail(email)
    const pError = validatePassword(password)
    const cpError = !confirmPassword 
      ? 'Confirmá tu contraseña.' 
      : password !== confirmPassword 
        ? 'Las contraseñas no coinciden.' 
        : null

    if (nError || aError || eError || pError || cpError) {
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
              id="completar-nombre"
              name="given-name"
              autoComplete="given-name"
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
              id="completar-apellido"
              name="family-name"
              autoComplete="family-name"
              label="Apellido"
              type="text"
              value={apellido}
              onChange={setApellido}
              error={apellidoError}
            />
          </div>
        </div>

        <Field
          id="completar-email"
          name="email"
          autoComplete="email"
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          error={emailError}
        />

        <div className={styles.passwordRow}>
          <div className={styles.passwordCol}>
            <Field
              id="completar-password"
              name="new-password"
              autoComplete="new-password"
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
              id="completar-confirm-password"
              name="confirm-password"
              autoComplete="new-password"
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
