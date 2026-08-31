import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, Lock, AlertTriangle } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import Field from '@/components/ui/Field/Field'
import { validarResetToken, confirmarResetPassword } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './ResetPasswordPage.module.css'

const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'Debe tener al menos 8 caracteres.'
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export default function ResetPasswordPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  // Estados del flujo
  const [status, setStatus] = useState<'validando' | 'invalido' | 'valido' | 'confirmado'>(
    token ? 'validando' : 'invalido'
  )
  const [nombre, setNombre] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const initialized = useRef(false)

  // 1. Validar el token al montar el componente
  useEffect(() => {
    if (!token) return
    if (initialized.current) return
    initialized.current = true

    async function checkToken() {
      try {
        const res = await validarResetToken(token)
        if (res.success) {
          setNombre(res.data.nombre)
          setStatus('valido')
        } else {
          setStatus('invalido')
        }
      } catch {
        setStatus('invalido')
      }
    }

    checkToken()
  }, [token])

  // Validaciones inline
  const passwordError = hasSubmitted ? validatePassword(nuevaPassword) : null
  const confirmarPasswordError = hasSubmitted
    ? !confirmarPassword
      ? 'Confirmá tu contraseña.'
      : confirmarPassword !== nuevaPassword
        ? 'Las contraseñas no coinciden. Revisalas.'
        : null
    : null

  // 2. Procesar el envío de la nueva contraseña
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)

    const pError = validatePassword(nuevaPassword)
    const cpError = !confirmarPassword
      ? 'Confirmá tu contraseña.'
      : confirmarPassword !== nuevaPassword
        ? 'Las contraseñas no coinciden. Revisalas.'
        : null

    if (pError || cpError || !token) return

    setLoading(true)
    setApiError(null)

    try {
      await confirmarResetPassword(token, nuevaPassword)
      showToast('¡Listo! Tu contraseña se actualizó. Ya podés iniciar sesión con la nueva.', 'success')
      setStatus('confirmado')
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Tu contraseña fue actualizada con éxito. Iniciá sesión con tu nueva contraseña.' },
        })
      }, 3000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { code?: string; message?: string } } } }
      const code = error.response?.data?.error?.code

      if (code === 'TOKEN_INVALIDO') {
        setStatus('invalido')
      } else {
        const msg = getErrorMessage(err, "No pudimos cambiar tu contraseña. El enlace puede haber expirado — pedí uno nuevo.")
        setApiError(msg)
        showToast(msg, "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Estado 1: VALIDANDO ---
  if (status === 'validando') {
    return (
      <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
        <div className={styles.centerContainer}>
          <div className={`${styles.iconWrap} ${styles.loading}`}>
            <Loader2 size={40} className="animate-spin" />
          </div>
          <p className={styles.message}>Validando el enlace de recuperación...</p>
        </div>
      </AuthLayout>
    )
  }

  // --- Estado 2a: TOKEN INVÁLIDO ---
  if (status === 'invalido') {
    return (
      <AuthLayout title="Link inválido o expirado" leftPanel={<WppChatMockup />}>
        <div className={styles.centerContainer}>
          <div className={`${styles.iconWrap} ${styles.error}`}>
            <Lock size={48} />
          </div>
          <p className={styles.message}>
            Este link de restablecimiento ya no es válido. Puede haber expirado o ya fue utilizado.
            Contactá a tu administrador para solicitar uno nuevo.
          </p>
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

  // --- Estado 4b: ÉXITO (CONFIRMADO) ---
  if (status === 'confirmado') {
    return (
      <AuthLayout title="¡Contraseña actualizada!" leftPanel={<WppChatMockup />}>
        <div className={styles.centerContainer}>
          <div className={`${styles.iconWrap} ${styles.success}`}>
            <CheckCircle2 size={48} />
          </div>
          <p className={styles.message}>
            Tu contraseña fue cambiada exitosamente. Iniciá sesión con tu nueva contraseña.
          </p>
          <p className={styles.subText}>Serás redirigido al inicio de sesión en 3 segundos...</p>
        </div>
      </AuthLayout>
    )
  }

  // --- Estado 2b: FORMULARIO (TOKEN VÁLIDO) ---
  return (
    <AuthLayout title="Restablecer contraseña" leftPanel={<WppChatMockup />}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.stepHeader}>
          <p className={styles.description}>
            Hola <strong>{nombre}</strong>, elegí tu nueva contraseña.
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
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>
          <div className={styles.passwordCol}>
            <Field
              label="Confirmar contraseña"
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
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>
        </div>

        {apiError && (
          <div className={styles.errorFlex}>
            <AlertTriangle size={16} />
            <span>{apiError}</span>
          </div>
        )}

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
