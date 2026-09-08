import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageCircle,
  Copy,
  Check,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import {
  solicitarCodigoVinculacion,
  type CodigoVinculacionResponse,
} from '@/services/auth.service'
import usuarioService from '@/services/usuario.service'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatearTelefonoVisual } from '@/utils/telefono.utils'
import styles from './VerificarTelefono.module.css'

export default function VerificarTelefono() {
  const { usuario, updateUsuario, refreshUser } = useAuth()
  const { showToast } = useToast()
  const { lastDataUpdate } = useNotificaciones()
  const navigate = useNavigate()
  const location = useLocation()

  const handleContinuar = useCallback(() => {
    const state = location.state as { from?: string } | null
    if (state?.from) {
      navigate(state.from, { replace: true })
    } else if (usuario && !usuario.onboarding_completo) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/app/dashboard', { replace: true })
    }
  }, [location.state, navigate, usuario])

  const [codigoData, setCodigoData] = useState<CodigoVinculacionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [copied, setCopied] = useState(false)
  const [vinculado, setVinculado] = useState(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const hasLoadedRef = useRef(false)

  // Obtener código de vinculación desde el backend
  const cargarCodigo = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const data = await solicitarCodigoVinculacion()
      setCodigoData(data)
      setCountdown(data.expira_en_segundos || 15 * 60)
      startTimeRef.current = Date.now()
    } catch (err: unknown) {
      const msg = getErrorMessage(
        err,
        'No pudimos generar el código de vinculación. Intentá de nuevo.'
      )
      setApiError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      void cargarCodigo()
    }
  }, [cargarCodigo])

  // Temporizador de expiración (cuenta regresiva cada 1 segundo)
  useEffect(() => {
    if (countdown <= 0 || vinculado) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, vinculado])

  // Función para verificar si el usuario ya quedó vinculado
  const verificarEstadoVinculacion = useCallback(async () => {
    if (vinculado) return
    try {
      const me = await usuarioService.getMe()
      if (me?.telefono_verificado) {
        setVinculado(true)
        updateUsuario(me)
        await refreshUser()
        showToast('¡Tu cuenta de WhatsApp fue vinculada exitosamente!', 'success')

        // Redirección suave
        setTimeout(() => {
          const state = location.state as { from?: string } | null
          if (state?.from) {
            navigate(state.from, { replace: true })
          } else if (!me.onboarding_completo) {
            navigate('/onboarding', { replace: true })
          } else {
            navigate('/app/dashboard', { replace: true })
          }
        }, 1500)
      }
    } catch {
      // Ignorar errores de red transitorios durante el sondeo
    }
  }, [vinculado, updateUsuario, refreshUser, showToast, location.state, navigate])

  // 1. Escuchar eventos SSE en tiempo real
  useEffect(() => {
    if (lastDataUpdate?.entidad === 'usuario') {
      const timeoutId = setTimeout(() => {
        void verificarEstadoVinculacion()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, verificarEstadoVinculacion])

  // 2. Consulta periódica cada 3 segundos, con corte a los 15 minutos (900s)
  useEffect(() => {
    if (vinculado) return

    pollingRef.current = setInterval(() => {
      const transcurrido = (Date.now() - startTimeRef.current) / 1000
      if (transcurrido > 15 * 60) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }
      void verificarEstadoVinculacion()
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [vinculado, verificarEstadoVinculacion])

  // Copiar link al portapapeles
  const handleCopiarEnlace = async () => {
    if (!codigoData?.link_whatsapp) return
    try {
      await navigator.clipboard.writeText(codigoData.link_whatsapp)
      setCopied(true)
      showToast('Enlace de WhatsApp copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      showToast('No se pudo copiar el enlace', 'error')
    }
  }

  // Formato mm:ss
  const formatCountdown = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Si ya se vinculó
  if (vinculado) {
    return (
      <AuthLayout title="¡WhatsApp Vinculado!">
        <div className={styles.successCard}>
          <CheckCircle2 size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>¡Vinculación completada!</h2>
          <p className={styles.successDesc}>
            Tu número de WhatsApp quedó verificado y asociado a tu cuenta. Ya podés interactuar con
            Argentum desde tu chat.
          </p>
          <div className={styles.waitingIndicator}>
            <Loader2 size={16} className="animate-spin" />
            <span>Redirigiendo a tu cuenta...</span>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Vinculá tu WhatsApp">
      <div className={styles.contentWrap}>
        <p className={styles.subtitle}>
          Iniciá la conversación desde tu WhatsApp para verificar y asociar tu teléfono de forma
          automática y segura.
        </p>

        {usuario?.telefono && !usuario?.telefono_verificado && (
          <div className={styles.refPhoneNotice}>
            <span className={styles.refPhoneLabel}>Número registrado actualmente</span>
            <span className={styles.refPhoneValue}>{formatearTelefonoVisual(usuario.telefono)}</span>
            <p className={styles.refPhoneSub}>
              Se vinculará el número de WhatsApp desde el cual envíes el mensaje. Si es diferente, se actualizará automáticamente.
            </p>
          </div>
        )}

        {usuario?.telefono && usuario?.telefono_verificado && (
          <div className={styles.refPhoneNotice}>
            <span className={styles.refPhoneLabel}>Número actualmente vinculado</span>
            <span className={styles.refPhoneValue}>{formatearTelefonoVisual(usuario.telefono)}</span>
            <p className={styles.refPhoneSub}>
              Para cambiarlo, enviá el mensaje desde tu nueva cuenta de WhatsApp. Se actualizará automáticamente.
            </p>
          </div>
        )}

        {loading ? (
          <div className={styles.loaderWrap}>
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Generando código de vinculación...</span>
          </div>
        ) : apiError && !codigoData ? (
          <div className={styles.errorBox}>
            <p>{apiError}</p>
            <button
              type="button"
              onClick={cargarCodigo}
              className={styles.renewBtn}
              style={{ marginTop: 12 }}
            >
              <RefreshCw size={16} /> Reintentar
            </button>
            <div className={styles.skipWrap}>
              <button
                type="button"
                onClick={handleContinuar}
                className={styles.skipBtn}
              >
                Continuar al panel
              </button>
            </div>
          </div>
        ) : codigoData ? (
          <>
            {/* Sección QR en pantallas de escritorio */}
            <div className={styles.qrContainer}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  codigoData.link_whatsapp
                )}&margin=8`}
                alt="Código QR para vincular WhatsApp"
                className={styles.qrImage}
                loading="eager"
              />
              <span className={styles.qrHint}>
                Escaneá el código QR con la cámara de tu celular para abrir WhatsApp
              </span>
            </div>

            {/* Tarjeta de Código */}
            <div className={styles.codeCard}>
              <div className={styles.codeLabel}>Código de vinculación único</div>
              <div className={styles.codeValue}>{codigoData.codigo}</div>
              <p className={styles.codeExplanation}>
                Al abrir el enlace, el mensaje ya incluirá este código. Solo tenés que presionar
                enviar.
              </p>
            </div>

            {/* Temporizador / Estado */}
            {countdown > 0 ? (
              <div className={styles.timerBadge}>
                <Clock size={14} />
                <span>Expira en {formatCountdown(countdown)}</span>
              </div>
            ) : (
              <div className={`${styles.timerBadge} ${styles.timerExpired}`}>
                <AlertCircle size={14} />
                <span>El código expiró. Pedí uno nuevo para continuar.</span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className={styles.actionsWrap}>
              {countdown > 0 ? (
                <>
                  <a
                    href={codigoData.link_whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappBtn}
                  >
                    <MessageCircle size={20} />
                    <span>Abrir en WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopiarEnlace}
                    className={styles.copyBtn}
                  >
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={cargarCodigo}
                  disabled={loading}
                  className={styles.renewBtn}
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  <span>Generar nuevo código</span>
                </button>
              )}
            </div>

            {/* Indicador de espera activa */}
            {countdown > 0 && (
              <div className={styles.waitingIndicator}>
                <Loader2 size={14} className="animate-spin" />
                <span>Esperando que envíes el mensaje en WhatsApp...</span>
              </div>
            )}

            {/* Saltear por ahora */}
            <div className={styles.skipWrap}>
              <button
                type="button"
                onClick={handleContinuar}
                className={styles.skipBtn}
              >
                Vincular más tarde e ir al panel
              </button>
            </div>
          </>
        ) : null}
      </div>
    </AuthLayout>
  )
}
