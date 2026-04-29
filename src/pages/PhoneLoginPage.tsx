import { type FormEvent, type ChangeEvent, type KeyboardEvent, type ClipboardEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '../components/ui/AuthLayout'
import WppChatMockup from '../components/ui/WppChatMockup'
import { enviarCodigoTelefono, verificarCodigoTelefono } from '../lib/api/auth'
import { getToken } from '../lib/auth'
import { manejarRespuestaAuth } from '../utils/authRedirect'
import { useAuth } from '../hooks/useAuth'

type Step = 'phone' | 'code'

const PAISES = [
  { bandera: '🇦🇷', nombre: 'Argentina', codigo: '+54' },
  { bandera: '🇺🇾', nombre: 'Uruguay',   codigo: '+598' },
  { bandera: '🇧🇷', nombre: 'Brasil',    codigo: '+55' },
  { bandera: '🇨🇱', nombre: 'Chile',     codigo: '+56' },
  { bandera: '🇲🇽', nombre: 'México',    codigo: '+52' },
  { bandera: '🇪🇸', nombre: 'España',    codigo: '+34' },
  { bandera: '🇺🇸', nombre: 'EE.UU.',   codigo: '+1' },
]

function buildPhone(codigo: string, numero: string): string {
  let n = numero.trim()
  if (!n) return codigo
  if (codigo === '+54') {
    if (n.startsWith('0')) n = n.slice(1)
    if (!n.startsWith('9')) n = '9' + n
  }
  return codigo + n
}

function maskPhone(phone: string): string {
  const clean = phone.trim()
  if (clean.length <= 13) return clean
  return `${clean.slice(0, 4)} **** ${clean.slice(-4)}`
}

export default function PhoneLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [codigoPais, setCodigoPais] = useState('+54')
  const [telefono, setTelefono] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  const codigo = digits.join('')
  const telefonoError = hasSubmitted && !telefono.trim() ? 'Ingresá tu número de teléfono.' : null
  const phonePreview = telefono.trim() ? buildPhone(codigoPais, telefono) : ''

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
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [step])

  // ── OTP handlers ─────────────────────────────────────────────────────────
  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      if (newDigits[index]) {
        newDigits[index] = ''
        setDigits(newDigits)
      } else if (index > 0) {
        newDigits[index - 1] = ''
        setDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) return
    const newDigits = [...digits]
    newDigits[index] = val[val.length - 1]
    setDigits(newDigits)
    if (index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = Array(6).fill('')
    text.split('').forEach((char, i) => { newDigits[i] = char })
    setDigits(newDigits)
    const nextEmpty = newDigits.findIndex((d: string) => !d)
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0)
  }

  // ── Step handlers ─────────────────────────────────────────────────────────
  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setHasSubmitted(true)
    if (!telefono.trim()) return
    setLoading(true)
    setApiError(null)
    try {
      await enviarCodigoTelefono(buildPhone(codigoPais, telefono))
      setStep('code')
      setDigits(Array(6).fill(''))
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
    if (countdown > 0 || loading) return
    setLoading(true)
    setApiError(null)
    try {
      await enviarCodigoTelefono(buildPhone(codigoPais, telefono))
      setCountdown(60)
      setDigits(Array(6).fill(''))
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'No se pudo reenviar el código.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    if (codigo.length !== 6) {
      setApiError('Ingresá el código de 6 dígitos.')
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      const respuesta = await verificarCodigoTelefono(buildPhone(codigoPais, telefono), codigo)
      login(respuesta)
      manejarRespuestaAuth(respuesta, navigate)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setApiError(detail || 'Código incorrecto. Revisalo e intentá de nuevo.')
      setDigits(Array(6).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setStep('phone')
    setDigits(Array(6).fill(''))
    setApiError(null)
    setHasSubmitted(false)
  }

  const title = step === 'phone' ? 'Ingresá con tu teléfono' : 'Ingresá el código'

  return (
    <AuthLayout title={title} leftPanel={<WppChatMockup />}>
      {step === 'phone' ? (
        // ── PASO 1: número ────────────────────────────────────────────────────
        <form onSubmit={handleSendCode} noValidate>
          <p className="mb-5" style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Te mandamos un código por WhatsApp al número que ingreses.
          </p>

          <div className="mb-6">
            <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Número de teléfono
            </label>

            {/* Selector de país + input de número */}
            <div
              className="flex items-center h-12 rounded-[10px] border"
              style={{
                borderColor: telefonoError ? '#C0392B' : 'var(--surface-alt)',
                background: 'var(--surface)',
              }}
            >
              <select
                value={codigoPais}
                onChange={(e) => setCodigoPais(e.target.value)}
                style={{
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '15px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  paddingLeft: '12px',
                  paddingRight: '4px',
                  flexShrink: 0,
                }}
              >
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.bandera} {p.codigo}
                  </option>
                ))}
              </select>

              <div style={{ width: '1px', height: '28px', background: 'var(--surface-alt)', flexShrink: 0 }} />

              <input
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="91112345678"
                autoFocus
                className="flex-1 h-full outline-none bg-transparent"
                style={{ fontSize: '16px', paddingLeft: '12px', paddingRight: '12px', color: 'var(--text)' }}
              />
            </div>

            {telefonoError && (
              <p className="mt-1" style={{ fontSize: '13px', color: '#C0392B' }}>{telefonoError}</p>
            )}
            {phonePreview && (
              <p className="mt-2" style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                Se enviará a: <strong>{phonePreview}</strong>
              </p>
            )}
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
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Enviando...</>
              : 'Enviar código'
            }
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'var(--surface-alt)' }} />
          </div>

          <Link
            to="/login"
            className="w-full h-12 rounded-[10px] border flex items-center justify-center gap-3 font-medium transition-colors"
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
      ) : (
        // ── PASO 2: código OTP ────────────────────────────────────────────────
        <form onSubmit={handleVerifyCode} noValidate>
          <p className="mb-6" style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Te mandamos un código de 6 dígitos por WhatsApp al{' '}
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
              {maskPhone(buildPhone(codigoPais, telefono))}
            </span>
          </p>

          <div className="mb-6">
            <label className="block mb-3" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
              Código de verificación
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="one-time-code"
                  value={d}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleOtpChange(i, e)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  className="outline-none transition-colors"
                  style={{
                    width: '44px',
                    height: '56px',
                    borderRadius: '10px',
                    border: `1px solid ${apiError ? '#C0392B' : d ? 'var(--primary)' : 'var(--surface-alt)'}`,
                    background: apiError ? '#FFF5F5' : d ? 'var(--surface-alt)' : 'var(--surface)',
                    fontSize: '24px',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: 'var(--text)',
                  }}
                />
              ))}
            </div>
          </div>

          {apiError && (
            <p className="mb-4" style={{ fontSize: '13px', color: '#C0392B' }}>{apiError}</p>
          )}

          <button
            type="submit"
            disabled={!digits.every(d => d !== '')}
            className="w-full h-12 rounded-[10px] font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'var(--primary)', fontSize: '15px' }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Verificando...</>
              : 'Verificar'
            }
          </button>

          <div className="text-center mt-5">
            {countdown > 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                Reenviar código en{' '}
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{countdown}s</span>
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                ¿No te llegó?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold transition-opacity disabled:opacity-60"
                  style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Reenviar
                </button>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 mt-5 transition-opacity hover:opacity-70"
            style={{ fontSize: '13px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={14} />
            Cambiar número
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
