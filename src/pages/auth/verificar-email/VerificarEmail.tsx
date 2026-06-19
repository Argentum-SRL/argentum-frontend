import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import { verificarCodigoEmail, enviarCodigoEmail } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './VerificarEmail.module.css'

export default function VerificarEmail() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Prioridad: 1. URL Params (?email=...), 2. Location State (registro previo)
  const queryParams = new URLSearchParams(location.search)
  const emailFromUrl = queryParams.get('email')
  const verificadoFromUrl = queryParams.get('verificado') === 'true'
  const emailFromState = (location.state as { email?: string })?.email ?? ''
  
  const email = emailFromUrl || emailFromState
  const [yaVerificado] = useState(verificadoFromUrl)

  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [reenvioLoading, setReenvioLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!yaVerificado) {
      inputRef.current?.focus()
    }
  }, [yaVerificado])

  useEffect(() => {
    if (countdown <= 0 || yaVerificado) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, yaVerificado])

  async function handleVerificar(e: FormEvent) {
    e.preventDefault()
    if (codigo.length !== 6) {
      setApiError('Ingresá el código de 6 dígitos.')
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await verificarCodigoEmail(email, codigo)
      showToast('¡Tu email quedó verificado! Ya podés entrar a Argentum.', 'success')
      
      // Solo hacemos login si la respuesta ya trae tokens.
      // Si falta verificar el teléfono, no habrá tokens y login() nos rebotaría al Dashboard/Login.
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
    if (countdown > 0 || !email) return
    setReenvioLoading(true)
    setApiError(null)
    try {
      await enviarCodigoEmail(email)
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

  if (!email) {
    return (
      <AuthLayout title="Verificar email">
        <p className={styles.fallback}>
          No se encontró el email a verificar.{' '}
          <Link to="/register" className={styles.fallbackLink}>Volvé a registrarte.</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verificá tu mail">
      <form onSubmit={handleVerificar} noValidate>
        <button type="button" onClick={() => navigate('/register')} className={styles.backBtn}>
          <ArrowLeft size={14} />
          Volver al registro
        </button>

        <p className={styles.subtitle}>
          Enviamos un código de 6 dígitos a{' '}
          <span className={styles.emailHighlight}>{email}</span>.
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
