import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Phone, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import { enviarCodigoTelefono, verificarCodigoTelefono } from '../../services/auth.service'
import { manejarRespuestaAuth } from '../../utils/authRedirect'

/**
 * Maneja dos escenarios:
 * A) modoVerificacion=true: teléfono ya conocido (flujo email, paso 3).
 *    Muestra directo el input de código.
 * B) modoVerificacion=false/ausente: flujo Google o entrada directa.
 *    Muestra primero el input de teléfono.
 */
export default function VerificarTelefono() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { telefono?: string; modoVerificacion?: boolean } | null

  const telefonoInicial = state?.telefono ?? ''
  const modoVerificacion = state?.modoVerificacion ?? false

  type Step = 'phone' | 'code'
  const [step, setStep] = useState<Step>(modoVerificacion && telefonoInicial ? 'code' : 'phone')
  const [telefono, setTelefono] = useState(telefonoInicial)
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Si llegamos en modo verificación con teléfono ya sabido, enviamos el código automáticamente
  useEffect(() => {
    if (modoVerificacion && telefonoInicial && step === 'code') {
      enviarCodigoTelefono(telefonoInicial)
        .then(() => setCountdown(60))
        .catch(() => setApiError('No se pudo enviar el código. Pedí uno nuevo.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          <p className="mb-5" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Necesitamos verificar tu número de teléfono para continuar.
          </p>

          <div className="mb-6">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Número de teléfono
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+5491112345678"
                autoFocus
                className="w-full h-12 pl-11 pr-4 rounded-[10px] border outline-none transition-colors"
                style={{
                  fontSize: '16px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  borderColor: telefonoError ? '#C0392B' : 'var(--surface-alt)',
                }}
              />
            </div>
            {telefonoError && <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{telefonoError}</p>}
            <p className="mt-2" style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              Incluí el código de país, ej: +54 para Argentina
            </p>
          </div>

          {apiError && (
            <p className="mb-4 text-center" style={{ fontSize: '13px', color: '#C0392B' }}>{apiError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--primary)', fontSize: '15px' }}
          >
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
            className="flex items-center gap-1 mb-4 transition-colors"
            style={{ fontSize: '13px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={14} />
            Cambiar número
          </button>
        )}

        <p className="mb-5" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
          Enviamos un código de 6 dígitos a{' '}
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{telefono}</span>
        </p>

        <div className="mb-6">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Código de verificación
          </label>
          <input
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full h-14 px-4 rounded-[10px] border outline-none transition-colors text-center"
            style={{
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '0.5em',
              background: 'var(--surface)',
              color: 'var(--text)',
              borderColor: apiError ? '#C0392B' : 'var(--surface-alt)',
            }}
          />
        </div>

        {apiError && (
          <p className="mb-4 text-center" style={{ fontSize: '13px', color: '#C0392B' }}>{apiError}</p>
        )}

        <button
          type="submit"
          disabled={loading || codigo.length !== 6}
          className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--primary)', fontSize: '15px' }}
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verificando...</> : 'Verificar'}
        </button>

        <div className="text-center mt-5">
          {countdown > 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Reenviar código en {countdown}s</p>
          ) : (
            <button
              type="button"
              onClick={handleReenviar}
              disabled={loading}
              className="font-medium transition-colors disabled:opacity-60"
              style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Reenviar código
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}
