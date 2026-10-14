import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import VinculacionWhatsAppCard from '@/components/whatsapp/VinculacionWhatsAppCard'
import usuarioService from '@/services/usuario.service'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './StepWhatsApp.module.css'

interface Props {
  onNext?: (siguientePaso: string | null) => void
}

export default function StepWhatsApp({ onNext }: Props) {
  const navigate = useNavigate()
  const { usuario, updateUsuario, refreshUser } = useAuth()
  const [permiso, setPermiso] = useState(false)
  const [loadingPermiso, setLoadingPermiso] = useState(false)

  const handleTogglePermiso = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.checked
    setPermiso(nuevoValor)
    setLoadingPermiso(true)
    try {
      const usuarioActualizado = await usuarioService.actualizarPermisoMensajes(nuevoValor)
      if (usuario) {
        updateUsuario({
          ...usuarioActualizado,
          onboarding_completo: usuario.onboarding_completo,
        })
      }
    } catch (err: unknown) {
      setPermiso(!nuevoValor)
      sileo.error({ title: getErrorMessage(err, 'No se pudo actualizar el permiso de lectura de mensajes.') })
    } finally {
      setLoadingPermiso(false)
    }
  }

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

  const handleHacerloDespues = async () => {
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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Asistente de WhatsApp</h2>
      <p className={styles.subtitle}>
        Podés registrar gastos y consultar saldos al instante desde tu chat de WhatsApp.
      </p>

      <div className={styles.permisoBox}>
        <label className={styles.permisoLabel}>
          <input
            type="checkbox"
            className={styles.permisoCheckbox}
            checked={permiso}
            onChange={handleTogglePermiso}
            disabled={loadingPermiso}
          />
          <span className={styles.permisoTexto}>
            Permitir que el equipo de Argentum lea mis mensajes con el asistente para mejorarlo.
          </span>
        </label>
        <span className={styles.permisoAclaracion}>
          Es opcional y lo podés cambiar cuando quieras en Perfil &gt; Seguridad.
        </span>
      </div>

      <VinculacionWhatsAppCard
        onSuccess={handleCompletado}
        onSkip={handleHacerloDespues}
        skipLabel="Hacerlo después"
        showSkipButton={true}
      />
    </div>
  )
}
