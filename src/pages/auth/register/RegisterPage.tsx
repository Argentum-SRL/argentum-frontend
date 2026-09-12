import { type FormEvent, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton/GoogleLoginButton'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import DashboardMockup from '@/components/mock/DashboardMockup/DashboardMockup'
import Field from '@/components/ui/Field/Field'
import { registerWithEmail, loginWithGoogle } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/utils/errorMessages'
import { validatePassword, validatePasswordConfirmation } from '@/utils/password.utils'
import styles from './RegisterPage.module.css'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: (err?: unknown) => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId?: string) => string
      ready?: (callback: () => void) => void
    }
  }
}

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

export default function RegisterPage() {

  const { login, isAuthenticated, usuario } = useAuth()
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
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || import.meta.env.TURNSTILE_SITE_KEY || '0x4AAAAAAEw9D_25MtFi7DYX') as string

  useEffect(() => {
    let isMounted = true
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    if (!siteKey && import.meta.env.DEV) {
      console.warn('[Turnstile] TURNSTILE_SITE_KEY no está configurada.')
    }

    const doRender = () => {
      if (!isMounted || !window.turnstile?.render || !turnstileContainerRef.current || widgetIdRef.current || !siteKey) {
        return
      }
      try {
        widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token: string) => {
            if (isMounted) {
              setTurnstileToken(token)
              setApiError(null)
            }
          },
          'expired-callback': () => {
            if (isMounted) {
              setTurnstileToken('')
            }
          },
          'error-callback': () => {
            if (isMounted) {
              setTurnstileToken('')
              setApiError('Error al validar el captcha de Turnstile. Recargá la página.')
            }
          },
        })
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('[Turnstile] Error rendering widget:', e)
        }
      }
    }

    const renderWidget = () => {
      if (!isMounted || !turnstileContainerRef.current || widgetIdRef.current || !siteKey) {
        return
      }
      if (window.turnstile?.render) {
        doRender()
      } else {
        let attempts = 0
        const interval = setInterval(() => {
          attempts++
          if (!isMounted || widgetIdRef.current || attempts > 50) {
            clearInterval(interval)
            return
          }
          if (window.turnstile?.render) {
            clearInterval(interval)
            doRender()
          }
        }, 100)
        retryTimer = setTimeout(() => clearInterval(interval), 5000)
      }
    }

    const scriptId = 'cf-turnstile-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile?.render) {
      renderWidget()
    } else {
      script.addEventListener('load', renderWidget)
      renderWidget()
    }

    return () => {
      isMounted = false
      if (retryTimer) clearTimeout(retryTimer)
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

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
  const passwordError = hasSubmitted ? validatePassword(password) : null
  const confirmPasswordError = hasSubmitted ? validatePasswordConfirmation(password, confirmPassword) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    
    const nError = validateName(nombre, 'nombre')
    const aError = validateName(apellido, 'apellido')
    const eError = validateEmail(email)
    const pError = validatePassword(password)
    const cpError = validatePasswordConfirmation(password, confirmPassword)

    if (nError || aError || eError || pError || cpError || !aceptaTerminos) {
      return
    }

    if (!turnstileToken) {
      setApiError('Por favor completá la verificación de seguridad (captcha).')
      return
    }

    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await registerWithEmail({
        nombre,
        apellido,
        email,
        password,
        turnstile_token: turnstileToken,
      })
      
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

        <div className={styles.turnstileWrap}>
          <div ref={turnstileContainerRef} />
        </div>

        {apiError && <p className={styles.error}>{apiError}</p>}

        <button type="submit" disabled={loading || !aceptaTerminos || !turnstileToken} className={styles.submitBtn}>
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

        <p className={styles.infoText}>
          Una vez registrado, podrás asociar tu WhatsApp desde tu perfil para gestionar tus finanzas por chat.
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
