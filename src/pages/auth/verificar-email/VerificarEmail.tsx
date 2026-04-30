import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import { verificarCodigoEmail, enviarCodigoEmail } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import styles from './VerificarEmail.module.css'

export default function VerificarEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email: string = (location.state as { email?: string })?.email ?? ''

  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [reenvioLoading, setReenvioLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

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
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'Algo salió mal. Intentá de nuevo.')
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
      setCountdown(60)
      setCodigo('')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'No se pudo reenviar el código.')
    } finally {
      setReenvioLoading(false)
    }
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
        <button type="button" onClick={() => navigate(-1)} className={styles.backBtn}>
          <ArrowLeft size={14} />
          Volver
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
