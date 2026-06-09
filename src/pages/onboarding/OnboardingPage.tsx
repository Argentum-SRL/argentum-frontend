import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getEstadoOnboarding } from '@/lib/api/onboarding'
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
  const { refreshUser } = useAuth()

  useEffect(() => {
    const controller = new AbortController()
    getEstadoOnboarding(controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return
        if (res.onboarding_completo) {
          refreshUser().then(() => {
            if (!controller.signal.aborted) {
              navigate('/app/dashboard', { replace: true })
            }
          })
          return
        }
        setEstado(res)
        setPasoActual(mapEstadoAPaso(res))
      })
      .catch((err) => {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        console.error(err)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      })
    return () => {
      controller.abort()
    }
  }, [navigate, refreshUser])


  function avanzar(siguientePaso: string | null) {
    if (!siguientePaso) {
      refreshUser().then(() => {
        navigate('/app/dashboard', { replace: true })
      })
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
                datosIniciales={{ ciclo_tipo: datos?.ciclo_tipo ?? null, ciclo_valor: datos?.ciclo_valor ?? null }}
                onNext={avanzar}
              />
            )}
            {pasoActual === 3 && (
              <StepMoneda
                datosIniciales={{ moneda_principal: datos?.moneda_principal ?? null }}
                onNext={avanzar}
              />
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
