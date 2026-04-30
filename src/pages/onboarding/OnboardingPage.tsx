import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'
import AuthLayout from '../../components/auth/AuthLayout'
import { getEstadoOnboarding } from '../../services/onboarding.service'
import type { EstadoOnboarding } from '../../types/index'
import PasoDatosPersonales from '../../components/onboarding/PasoDatosPersonales'
import PasoCicloFinanciero from '../../components/onboarding/PasoCicloFinanciero'
import PasoMoneda from '../../components/onboarding/PasoMoneda'
import PasoPrimeraBilletera from '../../components/onboarding/PasoPrimeraBilletera'

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} />
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
      <div className="mb-8 flex items-center justify-between px-2">
        {pasosConfig.map((p, idx) => {
          const isComplete = !estado?.pasos_pendientes.includes(p.id) && p.id !== pasoActual
          const isCurrent = p.id === pasoActual

          return (
            <div key={p.id} className="flex flex-col items-center gap-1">
              {isComplete ? (
                <CheckCircle2 size={20} style={{ color: '#27AE60' }} />
              ) : isCurrent ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 'bold' }}
                >
                  {idx + 1}
                </div>
              ) : (
                <Circle size={20} style={{ color: 'var(--text-3)' }} />
              )}
              <span style={{ fontSize: '11px', color: isCurrent ? 'var(--text)' : 'var(--text-3)', fontWeight: isCurrent ? 600 : 400 }}>
                {p.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="min-h-[300px]">
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

      <p className="mt-8 text-center" style={{ fontSize: '13px', color: 'var(--text-3)' }}>
        Podes cambiar todo esto desde tu perfil en cualquier momento.
      </p>
    </AuthLayout>
  )
}
