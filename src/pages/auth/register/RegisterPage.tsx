import { type FormEvent, useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Phone } from 'lucide-react'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import DashboardMockup from '@/components/mock/DashboardMockup/DashboardMockup'
import Field from '@/components/ui/Field/Field'
import { registerWithEmail, loginWithGoogle } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './RegisterPage.module.css'

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

const validatePhone = (val: string): string | null => {
  const t = val.trim().replace(/\s+/g, '').replace(/-/g, '')
  if (!t) return 'Ingresá tu teléfono.'
  if (t.length < 8) return 'El teléfono debe tener al menos 8 dígitos.'
  if (t.length > 20) return 'El teléfono no puede tener más de 20 dígitos.'
  if (!/^\+?[0-9]+$/.test(t)) return 'El teléfono solo debe contener números y el signo +.'
  return null
}

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'La contraseña tiene que tener al menos 8 caracteres.'
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function RegisterPage() {
  const { login, isAuthenticated, usuario } = useAuth()
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
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const logGoogleError = (stage: string, error: unknown) => {
    if (!import.meta.env.DEV) return
    console.error(`[Auth][Google][Register] ${stage}`, error)
  }

  useEffect(() => {
    if (isAuthenticated && usuario) {
      navigate(usuario.onboarding_completo ? '/app/dashboard' : '/onboarding', { replace: true })
    }
  }, [isAuthenticated, usuario, navigate])

  const nombreError = hasSubmitted ? validateName(nombre, 'nombre') : null
  const apellidoError = hasSubmitted ? validateName(apellido, 'apellido') : null
  const emailError = hasSubmitted ? validateEmail(email) : null
  const telefonoError = hasSubmitted ? validatePhone(telefono) : null
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted
    ? !confirmPassword
      ? 'Confirmá tu contraseña.'
      : confirmPassword !== password
        ? 'Las contraseñas no coinciden. Revisalas.'
        : null
    : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    
    // Validaciones directas para evitar problemas de asincronía del estado
    const nError = validateName(nombre, 'nombre')
    const aError = validateName(apellido, 'apellido')
    const eError = validateEmail(email)
    const telError = validatePhone(telefono)
    const pError = validatePassword(password)
    const cpError = !confirmPassword 
      ? 'Confirmá tu contraseña.' 
      : confirmPassword !== password 
        ? 'Las contraseñas no coinciden. Revisalas.' 
        : null

    if (nError || aError || eError || telError || pError || cpError || !aceptaTerminos) {
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await registerWithEmail({ nombre, apellido, email, telefono, password })
      
      // Solo activamos el estado de login si ya tenemos tokens (ej: Google)
      // En registro por email, no hay tokens hasta que verifique, por lo que login()
      // rompería la lógica y nos mandaría al dashboard prematuramente.
      if (respuesta.access_token) {
        login(respuesta)
      }
      
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "No pudimos crear tu cuenta. Intentá de nuevo en unos minutos."))
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
      setApiError(getErrorMessage(err, 'Falló el login con Google.'))
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
              id="register-nombre"
              name="given-name"
              autoComplete="given-name"
              label="Nombre"
              type="text"
              value={nombre}
              onChange={setNombre}
              autoFocus
              error={nombreError}
              placeholder="Juan"
            />
          </div>
          <div className={styles.nameCol}>
            <Field
              id="register-apellido"
              name="family-name"
              autoComplete="family-name"
              label="Apellido"
              type="text"
              value={apellido}
              onChange={setApellido}
              error={apellidoError}
              placeholder="Pérez"
            />
          </div>
        </div>

        <Field
          id="register-tel"
          name="tel"
          autoComplete="tel"
          label="Teléfono"
          type="tel"
          value={telefono}
          onChange={setTelefono}
          placeholder="+5491112345678"
          error={telefonoError}
          hint="Incluí el código de país, ej: +54"
        />

        <Field
          id="register-email"
          name="email"
          autoComplete="email"
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          error={emailError}
          placeholder="tu@email.com"
        />

        <div className={styles.passwordRow}>
          <div className={styles.passwordCol}>
            <Field
              id="register-password"
              name="new-password"
              autoComplete="new-password"
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
              id="register-confirm-password"
              name="confirm-password"
              autoComplete="new-password"
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

        <div className={styles.termsRow}>
          <input
            id="acepta-terminos"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className={styles.checkbox}
          />
          <label htmlFor="acepta-terminos" className={styles.checkboxLabel}>
            Acepto los <Link to="/terminos" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>Términos y Condiciones</Link> y la <Link to="/terminos#politica" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>Política de Privacidad</Link> de Argentum, incluyendo el procesamiento de mis datos financieros mediante servicios de inteligencia artificial de terceros para brindar las funcionalidades del producto, y confirmo que soy mayor de 18 años.
          </label>
        </div>

        {apiError && <p className={styles.error}>{apiError}</p>}

        <button type="submit" disabled={loading || !aceptaTerminos} className={styles.submitBtn}>
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


        <p className={styles.infoText}>
          Una vez registrado, podrás agregar otros métodos de inicio de sesión desde tu perfil.
        </p>

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
