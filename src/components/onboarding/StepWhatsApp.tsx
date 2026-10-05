import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VinculacionWhatsAppCard from '@/components/whatsapp/VinculacionWhatsAppCard'
import styles from './StepWhatsApp.module.css'

interface Props {
  onNext?: (siguientePaso: string | null) => void
}

export default function StepWhatsApp({ onNext }: Props) {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const handleCompletado = async () => {
    try {
      await refreshUser()
    } catch {
      // Ignorar error de refresh
    }
    if (onNext) {
      onNext(null)
    } else {
      navigate('/app/dashboard', { replace: true })
    }
  }

  const handleHacerloDespues = () => {
    if (onNext) {
      onNext(null)
    } else {
      navigate('/app/dashboard', { replace: true })
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Asistente de WhatsApp</h2>
      <p className={styles.subtitle}>
        Podés registrar gastos y consultar saldos al instante desde tu chat de WhatsApp.
      </p>

      <VinculacionWhatsAppCard
        onSuccess={handleCompletado}
        onSkip={handleHacerloDespues}
        skipLabel="Hacerlo después"
        showSkipButton={true}
      />
    </div>
  )
}
