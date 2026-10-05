import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import VinculacionWhatsAppCard from '@/components/whatsapp/VinculacionWhatsAppCard'
import { useAuth } from '@/hooks/useAuth'

export default function VerificarTelefono() {
  const { usuario } = useAuth()
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

  return (
    <AuthLayout
      title="Vinculá tu WhatsApp"
      cardMaxWidth={700}
      cardPadding="20px 24px"
      compact
    >
      <VinculacionWhatsAppCard
        subtitle="Iniciá la conversación desde tu WhatsApp para verificar y asociar tu teléfono de forma automática y segura."
        onSuccess={handleContinuar}
        onSkip={handleContinuar}
        skipLabel="Vincular más tarde e ir al panel"
        showSkipButton={true}
      />
    </AuthLayout>
  )
}
