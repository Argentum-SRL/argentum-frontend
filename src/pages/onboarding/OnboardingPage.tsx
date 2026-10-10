import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstadoOnboarding } from '@/services/onboarding.service'
import type { EstadoOnboarding } from '@/types/index'
import StepIndicator from '@/components/onboarding/StepIndicator'
import StepDatosPersonales from '@/components/onboarding/StepDatosPersonales'
import StepCicloFinanciero from '@/components/onboarding/StepCicloFinanciero'
import StepMoneda from '@/components/onboarding/StepMoneda'
import StepWhatsApp from '@/components/onboarding/StepWhatsApp'
import { useAuth } from '@/hooks/useAuth'
import { AtmosphericBackground, AtmosphericLoading, AtmosphericMoonIcon, ThemeToggle, LunarLoader } from '@/components/ui'
import styles from './OnboardingPage.module.css'

const PASO_NUMERO: Record<string, number> = {
  datos_personales:  1,
  ciclo_financiero:  2,
  moneda:            3,
  whatsapp:          4,
}

function mapEstadoAPaso(estado: EstadoOnboarding): number {
  if (estado.pasos_pendientes.length === 0) return 1
  return PASO_NUMERO[estado.pasos_pendientes[0]] ?? 1
}


export default function OnboardingPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null)
  const [pasoActual, setPasoActual] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [cargandoReintento, setCargandoReintento] = useState(false)
  const { usuario, refreshUser } = useAuth()
  const totalPasos = usuario?.telefono_verificado ? 3 : 4

  const cargarEstado = useCallback(async () => {
    const controller = new AbortController()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 10000)

    try {
      const res = await getEstadoOnboarding(controller.signal)
      clearTimeout(timeoutId)
      if (res.onboarding_completo) {
        try {
          await refreshUser()
          navigate('/app/dashboard', { replace: true })
        } catch (err) {
          console.error('Error al refrescar usuario tras onboarding:', err)
          setErrorCarga(true)
        }
        return
      }
      setEstado(res)
      setPasoActual(mapEstadoAPaso(res))
    } catch (err) {
      clearTimeout(timeoutId)
      if (timedOut) {
        console.error('Tiempo de espera agotado al obtener estado de onboarding (>10s)')
      } else {
        console.error('Error al obtener estado de onboarding:', err)
      }
      setErrorCarga(true)
    } finally {
      clearTimeout(timeoutId)
      setCargando(false)
    }
  }, [navigate, refreshUser])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      await Promise.resolve()
      if (!isMounted) return
      void cargarEstado()
    }

    void load()

    return () => {
      isMounted = false
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
    if (pasoActual === 3) {
      if (!usuario?.telefono_verificado) {
        setPasoActual(4)
        return
      } else {
        void handleRefreshAndNavigate()
        return
      }
    }
    if (pasoActual >= 4 || !siguientePaso) {
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
    return <AtmosphericLoading />
  }

  const datos = estado?.datos_actuales
  const isStepWide = pasoActual === 4

  return (
    <AtmosphericBackground fullScreen={false} centered={false} compensateBottomNav={false} className={styles.page}>
      <ThemeToggle />
      <div className={[styles.inner, isStepWide ? styles.innerWide : ''].filter(Boolean).join(' ')}>
        <div className={styles.header}>
          <AtmosphericMoonIcon size={32} />
          <span className={styles.logoText}>Argentum</span>
        </div>

        <StepIndicator total={totalPasos} current={pasoActual} />

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
                      <LunarLoader size={18} />
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
                {pasoActual === 4 && (
                  <StepWhatsApp onNext={avanzar} />
                )}
              </>
            )}
          </div>
        </div>

        <p className={styles.footer}>
          Podés cambiar todo esto desde tu perfil en cualquier momento.
        </p>
      </div>
    </AtmosphericBackground>
  )
}
