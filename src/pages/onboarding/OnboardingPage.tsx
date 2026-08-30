import { useEffect, useId, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getEstadoOnboarding } from '@/services/onboarding.service'
import type { EstadoOnboarding } from '@/types/index'
import StepIndicator from '@/components/onboarding/StepIndicator'
import StepDatosPersonales from '@/components/onboarding/StepDatosPersonales'
import StepCicloFinanciero from '@/components/onboarding/StepCicloFinanciero'
import StepMoneda from '@/components/onboarding/StepMoneda'
import { useAuth } from '@/hooks/useAuth'
import styles from './OnboardingPage.module.css'

const PASO_NUMERO: Record<string, number> = {
  datos_personales:  1,
  ciclo_financiero:  2,
  moneda:            3,
}

function mapEstadoAPaso(estado: EstadoOnboarding): number {
  if (estado.pasos_pendientes.length === 0) return 1
  return PASO_NUMERO[estado.pasos_pendientes[0]] ?? 1
}

function MoonIcon({ size }: { size: number }) {
  const maskId = `moon-${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver)" mask={`url(#${maskId})`} />
    </svg>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null)
  const [pasoActual, setPasoActual] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [cargandoReintento, setCargandoReintento] = useState(false)
  const { refreshUser } = useAuth()

  const cargarEstado = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await getEstadoOnboarding(signal)
      if (signal?.aborted) return
      if (res.onboarding_completo) {
        try {
          await refreshUser()
          if (!signal?.aborted) {
            navigate('/app/dashboard', { replace: true })
          }
        } catch (err) {
          if (!signal?.aborted) {
            console.error(err)
            setErrorCarga(true)
          }
        }
        return
      }
      if (!signal?.aborted) {
        setEstado(res)
        setPasoActual(mapEstadoAPaso(res))
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      if (!signal?.aborted) {
        console.error(err)
        setErrorCarga(true)
      }
    } finally {
      if (!signal?.aborted) {
        setCargando(false)
      }
    }
  }, [navigate, refreshUser])

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        cargarEstado(controller.signal)
      }
    })
    return () => {
      controller.abort()
    }
  }, [cargarEstado])

  async function handleRefreshAndNavigate() {
    setCargandoReintento(true)
    setErrorCarga(false)
    try {
      await refreshUser()
      navigate('/app/dashboard', { replace: true })
    } catch (error) {
      console.error('Error al refrescar usuario tras onboarding:', error)
      setErrorCarga(true)
    } finally {
      setCargandoReintento(false)
    }
  }

  const handleReintentar = () => {
    if (!estado) {
      setCargando(true)
      setErrorCarga(false)
      cargarEstado()
    } else {
      handleRefreshAndNavigate()
    }
  }


  function avanzar(siguientePaso: string | null) {
    if (!siguientePaso) {
      void handleRefreshAndNavigate()
      return
    }
    const next = PASO_NUMERO[siguientePaso]
    if (next) {
      setPasoActual(next)
    } else {
      navigate('/app/dashboard', { replace: true })
    }
  }

  if (cargando) {
    return (
      <div className={styles.loading}>
        <Loader2 size={32} className="animate-spin" />
      </div>
    )
  }

  const datos = estado?.datos_actuales

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <MoonIcon size={32} />
          <span className={styles.logoText}>Argentum</span>
        </div>

        <StepIndicator total={3} current={pasoActual} />

        <div className={styles.card}>
          <div key={pasoActual} className={styles.stepWrap}>
            {errorCarga ? (
              <div className="text-center">
                <p className="text-[var(--error)] mb-4">
                  Hubo un problema al cargar tu cuenta. Por favor intentá de nuevo.
                </p>
                <button
                  onClick={handleReintentar}
                  disabled={cargandoReintento || cargando}
                  className="w-full h-12 rounded-xl font-semibold text-white bg-[var(--primary)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                >
                  {cargandoReintento || cargando ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Cargando...
                    </>
                  ) : (
                    'Reintentar'
                  )}
                </button>
              </div>
            ) : (
              <>
                {pasoActual === 1 && (
                  <StepDatosPersonales
                    datosIniciales={{ 
                      nombre: datos?.nombre ?? null, 
                      apellido: datos?.apellido ?? null,
                      fecha_nacimiento: datos?.fecha_nacimiento ?? null,
                      sexo: datos?.sexo ?? null
                    }}
                    onNext={avanzar}
                  />
                )}
                {pasoActual === 2 && (
                  <StepCicloFinanciero
                    datosIniciales={{
                      ciclo_tipo: datos?.ciclo_tipo ?? null,
                      ciclo_valor: datos?.ciclo_valor ?? null,
                      ciclo_ajuste_direccion: datos?.ciclo_ajuste_direccion ?? null
                    }}
                    onNext={avanzar}
                  />
                )}
                {pasoActual === 3 && (
                  <StepMoneda
                    datosIniciales={{
                      moneda_principal: datos?.moneda_principal ?? null,
                      moneda_secundaria_activa: datos?.moneda_secundaria_activa ?? false,
                      tipo_dolar: datos?.tipo_dolar ?? 'blue',
                    }}
                    onNext={avanzar}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <p className={styles.footer}>
          Podés cambiar todo esto desde tu perfil en cualquier momento.
        </p>
      </div>
    </div>
  )
}
