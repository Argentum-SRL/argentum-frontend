import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import { enviarCodigoTelefono, verificarCodigoTelefono } from '@/services/auth.service'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './VerificarTelefono.module.css'

/**
 * Maneja dos escenarios:
 * A) modoVerificacion=true: teléfono ya conocido (flujo email, paso 3).
 *    Muestra directo el input de código.
 * B) modoVerificacion=false/ausente: flujo Google o entrada directa.
 *    Muestra primero el input de teléfono.
 */
export default function VerificarTelefono() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { telefono?: string; modoVerificacion?: boolean } | null
  
  const queryParams = new URLSearchParams(location.search)
  const telefonoFromUrl = queryParams.get('telefono')
  const modoFromUrl = queryParams.get('modoVerificacion') === 'true'

  const telefonoInicial = telefonoFromUrl || state?.telefono || ''
  const modoVerificacion = modoFromUrl || state?.modoVerificacion || false

  type Step = 'phone' | 'code'
  const [step, setStep] = useState<Step>(modoVerificacion && telefonoInicial ? 'code' : 'phone')
  const [telefono, setTelefono] = useState(telefonoInicial)
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const hasTriggered = useRef(false)

  // Si llegamos en modo verificación con teléfono ya sabido, enviamos el código automáticamente.
  // Usamos hasTriggered para evitar doble envío en React StrictMode (Dev).
  useEffect(() => {
    if (modoVerificacion && telefonoInicial && step === 'code' && !hasTriggered.current) {
      hasTriggered.current = true
      enviarCodigoTelefono(telefonoInicial)
        .then(() => setCountdown(60))
        .catch(() => setApiError('No se pudo enviar el código. Pedí uno nuevo.'))
    }
  }, [modoVerificacion, telefonoInicial, step])

  useEffect(() => {
    if (step === 'code') setTimeout(() => codeInputRef.current?.focus(), 100)
  }, [step])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const telefonoError = hasSubmitted && !telefono.trim() ? 'Ingresá tu número de teléfono.' : null

  async function handleEnviarCodigo(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!telefono.trim()) return
    setLoading(true)
    setApiError(null)
    try {
      await enviarCodigoTelefono(telefono.trim())
      setStep('code')
      setCodigo('')
      setHasSubmitted(false)
      setCountdown(60)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'No se pudo enviar el código. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReenviar() {
    if (countdown > 0) return
    setLoading(true)
    setApiError(null)
    try {
      await enviarCodigoTelefono(telefono.trim())
      setCountdown(60)
      setCodigo('')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'No se pudo reenviar el código.')
    } finally {
      setLoading(false)
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
      const respuesta = await verificarCodigoTelefono(telefono.trim(), codigo.trim())
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'Algo salió mal. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <AuthLayout title="Verificá tu teléfono">
        <form onSubmit={handleEnviarCodigo} noValidate>
          <p className={styles.subtitle}>
            Necesitamos verificar tu número de teléfono para continuar.
          </p>

          <div className="mb-6">
            <label className={styles.label}>Número de teléfono</label>
            <div className={styles.phoneInputWrap}>
              <div className={styles.phoneIcon}>
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+5491112345678"
                autoFocus
                className={`${styles.phoneInput} ${telefonoError ? styles.phoneInputError : ''}`}
              />
            </div>
            {telefonoError && <p className={styles.error}>{telefonoError}</p>}
            <p className={styles.hint}>
              Incluí el código de país, ej: +54 para Argentina
            </p>
          </div>

          {apiError && <p className={styles.error}>{apiError}</p>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : 'Enviar código'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Ingresá el código">
      <form onSubmit={handleVerificar} noValidate>
        {!modoVerificacion && (
          <button
            type="button"
            onClick={() => { setStep('phone'); setCodigo(''); setApiError(null) }}
            className={styles.backBtn}
          >
            <ArrowLeft size={14} />
            Cambiar número
          </button>
        )}

        <p className={styles.subtitle}>
          Enviamos un código de 6 dígitos a{' '}
          <span className={styles.phoneHighlight}>{telefono}</span>
        </p>

        <div className="mb-6">
          <label className={styles.label}>Código de verificación</label>
          <input
            ref={codeInputRef}
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
              disabled={loading}
              className={styles.resendBtn}
            >
              Reenviar código
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}
