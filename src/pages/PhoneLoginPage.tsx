import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '../components/ui/AuthLayout'
import { enviarCodigoTelefono, verificarCodigoTelefono } from '../lib/api/auth'
import { getToken } from '../lib/auth'
import { manejarRespuestaAuth } from '../utils/authRedirect'
import { useAuth } from '../hooks/useAuth'

type Step = 'phone' | 'code'

export default function PhoneLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [telefono, setTelefono] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (getToken()) navigate('/app/dashboard', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeInputRef.current?.focus(), 100)
    }
  }, [step])

  const telefonoError = hasSubmitted && !telefono.trim() ? 'Ingresá tu número de teléfono.' : null

  async function handleSendCode(e: FormEvent) {
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

  async function handleResend() {
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

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim() || codigo.trim().length !== 6) {
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

  function handleBack() {
    setStep('phone')
    setCodigo('')
    setApiError(null)
    setHasSubmitted(false)
  }

  if (step === 'phone') {
    return (
      <AuthLayout title="Ingresá con tu teléfono">
        <form onSubmit={handleSendCode} noValidate>
          <p className="mb-5" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Te vamos a enviar un código de verificación por WhatsApp al número que ingreses.
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

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
          </div>

          <Link
            to="/login"
            className="w-full h-12 rounded-[10px] border flex items-center justify-center gap-2 font-medium transition-colors"
            style={{ borderColor: 'var(--silver)', color: 'var(--text)', fontSize: '15px', textDecoration: 'none' }}
          >
            Ingresar con mail y contraseña
          </Link>

          <p className="text-center mt-6" style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-medium" style={{ color: 'var(--primary)' }}>
              Registrate
            </Link>
          </p>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Ingresá el código">
      <form onSubmit={handleVerifyCode} noValidate>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 mb-4 transition-colors"
          style={{ fontSize: '13px', color: 'var(--text-3)' }}
        >
          <ArrowLeft size={14} />
          Cambiar número
        </button>

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
              onClick={handleResend}
              disabled={loading}
              className="font-medium transition-colors"
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
