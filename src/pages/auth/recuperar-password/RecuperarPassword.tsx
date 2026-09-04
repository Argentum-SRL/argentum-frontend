import { type FormEvent, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import Field from '@/components/ui/Field/Field'
import { recuperarPassword, verificarRecuperacion } from '@/services/auth.service'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './RecuperarPassword.module.css'

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const validateEmail = (val: string): string | null => {
  const e = val.trim()
  if (!e) return 'Ingresá tu mail.'
  if (e.length > 255) return 'El correo electrónico no puede tener más de 255 caracteres.'
  if (!EMAIL_REGEX.test(e)) return 'Ingresá un correo electrónico válido.'
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

const validateCodigo = (val: string): string | null => {
  const c = val.trim()
  if (!c) return 'Ingresá el código de recuperación.'
  if (!/^\d{6}$/.test(c)) return 'El código debe tener 6 dígitos numéricos.'
  return null
}

export default function RecuperarPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || ''
  const codigoParam = searchParams.get('codigo') || ''
  const tieneParams = Boolean(emailParam && codigoParam)

  const [email, setEmail] = useState(emailParam)
  const [codigo, setCodigo] = useState(codigoParam)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')

  const [modoManual, setModoManual] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const emailError = hasSubmitted && (!tieneParams || modoManual) ? validateEmail(email) : null
  const codigoError = hasSubmitted && modoManual ? validateCodigo(codigo) : null
  
  const passwordError = hasSubmitted && (tieneParams || modoManual) ? validatePassword(nuevaPassword) : null
  const confirmarPasswordError = hasSubmitted && (tieneParams || modoManual)
    ? !confirmarPassword
      ? 'Confirmá tu contraseña.'
      : confirmarPassword !== nuevaPassword
        ? 'Las contraseñas no coinciden. Revisalas.'
        : null
    : null

  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    const eError = validateEmail(email)
    if (eError) return

    setLoading(true)
    setApiError(null)
    
    try {
      await recuperarPassword(email)
      setEnviado(true)
      setHasSubmitted(false)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "No pudimos enviar el correo de recuperación. Revisá que el email sea correcto e intentá de nuevo."))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    const eError = modoManual ? validateEmail(email) : null
    const cError = modoManual ? validateCodigo(codigo) : null
    const pError = validatePassword(nuevaPassword)
    const cpError = !confirmarPassword 
      ? 'Confirmá tu contraseña.' 
      : confirmarPassword !== nuevaPassword 
        ? 'Las contraseñas no coinciden. Revisalas.' 
        : null

    if (eError || cError || pError || cpError || !codigo.trim() || !email.trim()) return

    setLoading(true)
    setApiError(null)

    try {
      await verificarRecuperacion({
        email: email.trim(),
        codigo: codigo.trim(),
        nueva_password: nuevaPassword
      })
      
      navigate('/login', {
        state: { message: 'Tu contraseña fue restablecida con éxito. Ya podés iniciar sesión.' }
      })
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "No pudimos cambiar tu contraseña. El código o enlace puede haber expirado — pedí uno nuevo."))
    } finally {
      setLoading(false)
    }
  }

  if (tieneParams) {
    return (
      <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
        <form onSubmit={handleResetPassword} noValidate>
          <div className={styles.stepHeader}>
            <p className={styles.description}>
              Ingresá tu nueva contraseña para <strong>{email}</strong>.
            </p>
          </div>

          <div className={styles.passwordRow}>
            <div className={styles.passwordCol}>
              <Field
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                value={nuevaPassword}
                onChange={setNuevaPassword}
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
                label="Confirmar"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={setConfirmarPassword}
                error={confirmarPasswordError}
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
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  if (modoManual) {
    return (
      <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
        <form onSubmit={handleResetPassword} noValidate>
          <p className={styles.description}>
            Ingresá tu mail, el código de 6 dígitos recibido y tu nueva contraseña.
          </p>

          <Field
            label="Mail"
            type="email"
            value={email}
            onChange={setEmail}
            error={emailError}
          />

          <Field
            label="Código de recuperación"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={codigo}
            onChange={(val) => setCodigo(val.replace(/\D/g, '').slice(0, 6))}
            error={codigoError}
          />

          <div className={styles.passwordRow}>
            <div className={styles.passwordCol}>
              <Field
                label="Nueva contraseña"
                type={showPassword ? 'text' : 'password'}
                value={nuevaPassword}
                onChange={setNuevaPassword}
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
                label="Confirmar"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={setConfirmarPassword}
                error={confirmarPasswordError}
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
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <div className={styles.manualCodeToggle}>
            <button
              type="button"
              className={styles.manualCodeLink}
              onClick={() => {
                setModoManual(false)
                setHasSubmitted(false)
                setApiError(null)
              }}
            >
              Volver a solicitar código
            </button>
          </div>

          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  if (enviado) {
    return (
      <AuthLayout title="Código de recuperación enviado" leftPanel={<WppChatMockup />}>
        <div className={styles.successContainer}>
          <div className={styles.successIconWrap}>
            <CheckCircle2 size={48} className={styles.successIcon} />
          </div>
          <p className={styles.successMessage}>
            Si hay una cuenta con ese email, te enviamos un código y un enlace para cambiar tu contraseña.
          </p>
          <p className={styles.instructions}>
            Revisá tu casilla de correo (y la carpeta de spam o correo no deseado). Podés hacer clic en el botón del correo o ingresar el código recibido a continuación.
          </p>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => {
              setModoManual(true)
              setHasSubmitted(false)
              setApiError(null)
            }}
          >
            Ingresar código recibido
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setEnviado(false)
              setHasSubmitted(false)
              setApiError(null)
            }}
          >
            Reenviar o cambiar email
          </button>
          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
      <form onSubmit={handleSendCode} noValidate>
        <p className={styles.description}>
          Ingresá tu mail y te enviamos un enlace y un código para restablecer tu contraseña de forma segura.
        </p>

        <Field
          label="Mail"
          type="email"
          value={email}
          onChange={setEmail}
          autoFocus
          error={emailError}
        />

        {apiError && <p className={styles.error}>{apiError}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>

        <div className={styles.manualCodeToggle}>
          <button
            type="button"
            className={styles.manualCodeLink}
            onClick={() => {
              setModoManual(true)
              setHasSubmitted(false)
              setApiError(null)
            }}
          >
            ¿Ya tenés un código de recuperación? Ingresalo acá
          </button>
        </div>

        <div className={styles.backToLogin}>
          <Link to="/login" className={styles.backLink}>
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
