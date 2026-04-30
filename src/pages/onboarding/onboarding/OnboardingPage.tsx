import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import { getEstadoOnboarding } from '@/services/onboarding.service'
import type { EstadoOnboarding } from '@/types/index'
import PasoDatosPersonales from '@/components/onboarding/PasoDatosPersonales/PasoDatosPersonales'
import PasoCicloFinanciero from '@/components/onboarding/PasoCicloFinanciero/PasoCicloFinanciero'
import PasoMoneda from '@/components/onboarding/PasoMoneda/PasoMoneda'
import PasoPrimeraBilletera from '@/components/onboarding/PasoPrimeraBilletera/PasoPrimeraBilletera'
import styles from './OnboardingPage.module.css'

type StepID = 'datos_personales' | 'ciclo_financiero' | 'moneda' | 'primera_billetera'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null)
  const [pasoActual, setPasoActual] = useState<StepID | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const res = await getEstadoOnboarding()
        if (res.onboarding_completo) {
          navigate('/app/dashboard', { replace: true })
          return
        }
        setEstado(res)
        if (res.pasos_pendientes.length > 0) {
          setPasoActual(res.pasos_pendientes[0] as StepID)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [navigate])

  function handleNext(siguiente: string | null) {
    if (!siguiente) {
      navigate('/app/dashboard', { replace: true })
      return
    }
    setPasoActual(siguiente as StepID)

    if (estado) {
      setEstado({
        ...estado,
        pasos_pendientes: estado.pasos_pendientes.filter(p => p !== pasoActual)
      })
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 className={`animate-spin ${styles.loadingIcon}`} />
      </div>
    )
  }

  const pasosConfig = [
    { id: 'datos_personales', label: 'Datos' },
    { id: 'ciclo_financiero', label: 'Ciclo' },
    { id: 'moneda', label: 'Moneda' },
    { id: 'primera_billetera', label: 'Billetera' },
  ]

  return (
    <AuthLayout title="Configurá tu cuenta">
      <div className={styles.progressBar}>
        {pasosConfig.map((p, idx) => {
          const isComplete = !estado?.pasos_pendientes.includes(p.id) && p.id !== pasoActual
          const isCurrent = p.id === pasoActual
          const labelCls = [
            styles.progressStepLabel,
            isCurrent ? styles.progressStepLabelActive : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div key={p.id} className={styles.progressStep}>
              {isComplete ? (
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              ) : isCurrent ? (
                <div className={styles.progressStepCurrent}>{idx + 1}</div>
              ) : (
                <Circle size={20} style={{ color: 'var(--text-3)' }} />
              )}
              <span className={labelCls}>{p.label}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.stepContent}>
        {pasoActual === 'datos_personales' && (
          <PasoDatosPersonales
            datos={{ nombre: estado?.datos_actuales.nombre || null, apellido: estado?.datos_actuales.apellido || null }}
            onNext={handleNext}
          />
        )}
        {pasoActual === 'ciclo_financiero' && (
          <PasoCicloFinanciero
            datos={{ ciclo_tipo: estado?.datos_actuales.ciclo_tipo || null, ciclo_valor: estado?.datos_actuales.ciclo_valor || null }}
            onNext={handleNext}
          />
        )}
        {pasoActual === 'moneda' && (
          <PasoMoneda
            datos={{ moneda_principal: estado?.datos_actuales.moneda_principal || null }}
            onNext={handleNext}
          />
        )}
        {pasoActual === 'primera_billetera' && (
          <PasoPrimeraBilletera
            monedaPrincipal={estado?.datos_actuales.moneda_principal || 'ARS'}
            onFinish={() => navigate('/app/dashboard', { replace: true })}
          />
        )}
      </div>

      <p className={styles.footer}>
        Podes cambiar todo esto desde tu perfil en cualquier momento.
      </p>
    </AuthLayout>
  )
}
