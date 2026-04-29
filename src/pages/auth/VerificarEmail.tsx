import { type FormEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import AuthLayout from '../../components/ui/AuthLayout'
import { verificarCodigoEmail, enviarCodigoEmail } from '../../lib/api/auth'
import { manejarRespuestaAuth } from '../../utils/authRedirect'

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
        <p style={{ fontSize: '14px', color: 'var(--text-2)', textAlign: 'center' }}>
          No se encontró el email a verificar.{' '}
          <Link to="/register" style={{ color: 'var(--primary)' }}>Volvé a registrarte.</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verificá tu mail">
      <form onSubmit={handleVerificar} noValidate>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 mb-4 transition-colors"
          style={{ fontSize: '13px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        <p className="mb-5" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
          Enviamos un código de 6 dígitos a{' '}
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{email}</span>.
          Revisá también la carpeta de spam.
        </p>

        <div className="mb-6">
          <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>
            Código de verificación
          </label>
          <input
            ref={inputRef}
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
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Reenviar código en {countdown}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenvioLoading}
              className="font-medium transition-colors disabled:opacity-60"
              style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {reenvioLoading ? 'Enviando...' : 'Reenviar código'}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}
