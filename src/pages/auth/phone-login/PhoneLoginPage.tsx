import { type FormEvent, type ChangeEvent, type KeyboardEvent, type ClipboardEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import { enviarCodigoTelefono, verificarCodigoTelefono } from '@/services/auth.service'
import { getToken } from '@/services/api'
import { manejarRespuestaAuth } from '@/utils/authRedirect'
import { useAuth } from '@/hooks/useAuth'
import styles from './PhoneLoginPage.module.css'

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
        <form onSubmit={handleSendCode} noValidate>
          <p className={styles.subtitle}>
            Te mandamos un código por WhatsApp al número que ingreses.
          </p>

          <div className="mb-6">
            <label htmlFor="phone_number" className={styles.label}>Número de teléfono</label>

            <div className={`${styles.phoneInputWrap} ${telefonoError ? styles.phoneInputWrapError : ''}`}>
              <select
                value={codigoPais}
                onChange={(e) => setCodigoPais(e.target.value)}
                className={styles.phoneSelect}
                aria-label="Código de país"
              >
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.bandera} {p.codigo}
                  </option>
                ))}
              </select>

              <div className={styles.phoneSep} />

              <input
                id="phone_number"
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="91112345678"
                autoFocus
                className={styles.phoneInput}
              />
            </div>

            {telefonoError && <p className={styles.error}>{telefonoError}</p>}
            {phonePreview && (
              <p className={styles.phonePreview}>
                Se enviará a: <strong>{phonePreview}</strong>
              </p>
            )}
          </div>

          {apiError && <p className={`${styles.error} ${styles.errorCenter}`}>{apiError}</p>}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Enviando...</>
              : 'Enviar código'
            }
          </button>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>o</span>
            <div className={styles.dividerLine} />
          </div>

          <Link to="/login" className={styles.altBtn}>
            Ingresar con mail y contraseña
          </Link>

          <p className={styles.footer}>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className={styles.footerLink}>
              Registrate
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} noValidate>
          <p className={styles.codeSubtitle}>
            Te mandamos un código de 6 dígitos por WhatsApp al{' '}
            <span className={styles.phoneHighlight}>
              {maskPhone(buildPhone(codigoPais, telefono))}
            </span>
          </p>

          <div className="mb-6">
            <label className={styles.label}>Código de verificación</label>
            <div className={styles.otpWrap}>
              {digits.map((d, i) => {
                const digitCls = [
                  styles.otpDigit,
                  apiError ? styles.otpDigitError : d ? styles.otpDigitFilled : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <input
                    key={i}
                    id={`otp-${i}`}
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
                    className={digitCls}
                    aria-label={`Dígito ${i + 1} del código de verificación`}
                  />
                )
              })}
            </div>
          </div>

          {apiError && <p className={styles.error}>{apiError}</p>}

          <button
            type="submit"
            disabled={!digits.every(d => d !== '')}
            className={styles.submitBtn}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Verificando...</>
              : 'Verificar'
            }
          </button>

          <div className={styles.resendWrap}>
            {countdown > 0 ? (
              <p className={styles.countdown}>
                Reenviar código en{' '}
                <span className={styles.countdownBold}>{countdown}s</span>
              </p>
            ) : (
              <p className={styles.countdown}>
                ¿No te llegó?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className={styles.resendBtn}
                >
                  Reenviar
                </button>
              </p>
            )}
          </div>

          <button type="button" onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={14} />
            Cambiar número
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
