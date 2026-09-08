import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import Field from '@/components/ui/Field/Field'
import { verificarCodigoEmail, enviarCodigoEmail } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './VerificarEmail.module.css'

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function VerificarEmail() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Prioridad: 1. URL Params (?email=...), 2. Location State (registro previo)
  const queryParams = new URLSearchParams(location.search)
  const emailFromUrl = queryParams.get('email')
  const verificadoFromUrl = queryParams.get('verificado') === 'true'
  const errorFromUrl = queryParams.get('error')
  const emailFromState = (location.state as { email?: string })?.email ?? ''
  
  const initialEmail = emailFromUrl || emailFromState
  const [email, setEmail] = useState(initialEmail)
  const [modoIngresoEmail, setModoIngresoEmail] = useState(!initialEmail)
  const [yaVerificado] = useState(verificadoFromUrl)

  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [reenvioLoading, setReenvioLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(errorFromUrl || null)
  const [emailInputError, setEmailInputError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(initialEmail ? 60 : 0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!yaVerificado && !modoIngresoEmail) {
      inputRef.current?.focus()
    }
  }, [yaVerificado, modoIngresoEmail])

  useEffect(() => {
    if (countdown <= 0 || yaVerificado) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, yaVerificado])

  async function handlePedirCodigo(e: FormEvent) {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setEmailInputError('Ingresá tu correo electrónico.')
      return
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setEmailInputError('Ingresá un correo electrónico válido.')
      return
    }
    setEmailInputError(null)
    setReenvioLoading(true)
    setApiError(null)
    try {
      await enviarCodigoEmail(cleanEmail)
      setEmail(cleanEmail)
      setModoIngresoEmail(false)
      setCountdown(60)
      setCodigo('')
      showToast('Si tu correo está registrado, te enviamos un nuevo código.', 'success')
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No pudimos enviar el código. Intentá de nuevo.')
      setApiError(msg)
      showToast(msg, 'error')
    } finally {
      setReenvioLoading(false)
    }
  }

  async function handleVerificar(e: FormEvent) {
    e.preventDefault()
    if (codigo.length !== 6) {
      setApiError('Ingresá el código de 6 dígitos.')
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await verificarCodigoEmail(email.trim(), codigo)
      showToast('¡Tu email quedó verificado! Ya podés entrar a Argentum.', 'success')
      
      // Solo hacemos login si la respuesta ya trae tokens.
      if (respuesta.access_token) {
        login(respuesta)
      }
      
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "No pudimos verificar tu email. El enlace puede haber expirado — pedí uno nuevo.")
      setApiError(msg)
      showToast(msg, "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleReenviar() {
    if (countdown > 0 || !email.trim()) return
    setReenvioLoading(true)
    setApiError(null)
    try {
      await enviarCodigoEmail(email.trim())
      showToast('Te mandamos un código nuevo.', 'success')
      setCountdown(60)
      setCodigo('')
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'No pudimos reenviar el código.')
      setApiError(msg)
      showToast(msg, 'error')
    } finally {
      setReenvioLoading(false)
    }
  }

  if (yaVerificado) {
    return (
      <AuthLayout title="¡Email Verificado!">
        <div className={styles.successContainer}>
          <p className={styles.subtitle}>
            ¡Tu email quedó verificado! Ya podés entrar a Argentum.
          </p>
          <Link to="/login" className={styles.submitBtn} style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Ir al Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (modoIngresoEmail) {
    return (
      <AuthLayout title="Verificá tu mail">
        <form onSubmit={handlePedirCodigo} noValidate>
          <button type="button" onClick={() => navigate('/login')} className={styles.backBtn}>
            <ArrowLeft size={14} />
            Volver al login
          </button>

          <p className={styles.subtitle}>
            Ingresá tu correo electrónico para recibir un código de verificación de 6 dígitos.
          </p>

          <Field
            id="email-verificacion"
            name="email"
            type="email"
            label="Correo electrónico"
            value={email}
            onChange={(val) => {
              setEmail(val)
              if (emailInputError) setEmailInputError(null)
            }}
            placeholder="tu@email.com"
            error={emailInputError}
            autoFocus
          />

          {apiError && <p className={styles.error}>{apiError}</p>}

          <button
            type="submit"
            disabled={reenvioLoading || !email.trim()}
            className={styles.submitBtn}
          >
            {reenvioLoading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : 'Pedir código'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verificá tu mail">
      <form onSubmit={handleVerificar} noValidate>
        <button type="button" onClick={() => navigate('/login')} className={styles.backBtn}>
          <ArrowLeft size={14} />
          Volver al login
        </button>

        <p className={styles.subtitle}>
          Enviamos un código de 6 dígitos a{' '}
          <span className={styles.emailHighlight}>{email}</span>.{' '}
          <button
            type="button"
            onClick={() => {
              setModoIngresoEmail(true)
              setApiError(null)
            }}
            className={styles.resendBtn}
            style={{ fontSize: '0.8125rem', textDecoration: 'underline', padding: 0 }}
          >
            Cambiar
          </button>
          <br />
          Revisá también la carpeta de spam.
        </p>

        <div className="mb-6">
          <label className={styles.label}>Código de verificación</label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className={`${styles.codeInput} ${apiError ? styles.codeInputError : ''}`}
          />
        </div>

        {apiError && <p className={styles.error}>{apiError}</p>}

        <button
          type="submit"
          disabled={loading || codigo.length !== 6}
          className={styles.submitBtn}
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verificando...</> : 'Verificar'}
        </button>

        <div className={styles.resendWrap}>
          {countdown > 0 ? (
            <p className={styles.countdown}>Reenviar código en {countdown}s</p>
          ) : (
            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenvioLoading}
              className={styles.resendBtn}
            >
              {reenvioLoading ? 'Enviando...' : 'Reenviar código'}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}

