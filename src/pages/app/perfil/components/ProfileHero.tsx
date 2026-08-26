import React from 'react'
import { Camera, Trash2, CheckCircle2, AlertCircle, Sparkles, Copy, Check } from 'lucide-react'
import type { Usuario } from '@/types'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatearTelefonoVisual } from '@/utils/telefono.utils'
import styles from '../PerfilPage.module.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

interface ProfileHeroProps {
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
  onOpenCrop: () => void
  onVerifyEmail?: () => void
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  usuario,
  updateUsuario,
  onOpenCrop,
}) => {
  const { confirm } = useModal()
  const { showToast } = useToast()
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const isGoogle = usuario?.auth_provider === 'google'

  const fotoUrl = usuario?.foto_url
    ? usuario.foto_url.startsWith('http')
      ? usuario.foto_url
      : `${API_URL}${usuario.foto_url}`
    : null

  const handleCopy = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    showToast(`${label} copiado al portapapeles`, 'info')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDeletePhoto = () => {
    confirm({
      title: '¿Eliminar foto de perfil?',
      description: 'Se borrará tu foto actual y se mostrará la inicial de tu nombre.',
      variant: 'danger',
      confirmLabel: 'Eliminar foto',
      onConfirm: async () => {
        try {
          await usuarioService.eliminarFoto()
          if (usuario) updateUsuario({ ...usuario, foto_url: null })
          showToast('Foto de perfil eliminada.', 'success')
        } catch (err: unknown) {
          showToast(getErrorMessage(err, 'No pudimos eliminar la foto de perfil.'), 'error')
        }
      },
    })
  }

  const getCicloLabel = () => {
    if (!usuario?.ciclo_tipo) return 'Día 1 de cada mes'
    if (usuario.ciclo_tipo === 'dia_fijo') {
      return `Día ${usuario.ciclo_valor || '1'} del mes`
    }
    return usuario.ciclo_valor ? usuario.ciclo_valor.replace(/_/g, ' ') : 'Regla personalizada'
  }

  return (
    <div className={styles.heroCard}>
      {/* Background ambient lighting */}
      <div className={styles.heroGlow} />

      <div className={styles.heroInner}>
        {/* Left: Avatar with interactive actions */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} title={isGoogle ? 'Foto gestionada por Google' : undefined}>
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={usuario?.nombre || 'Usuario'}
                className={styles.avatarImg}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}

            {/* Hover overlay with Camera only for non-Google */}
            {!isGoogle && (
              <button
                type="button"
                className={styles.avatarOverlayBtn}
                onClick={onOpenCrop}
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
              >
                <Camera size={18} />
                <span>Cambiar</span>
              </button>
            )}
          </div>

          {!isGoogle && fotoUrl && (
            <button
              type="button"
              className={styles.deletePhotoBtn}
              onClick={handleDeletePhoto}
              title="Eliminar foto"
              aria-label="Eliminar foto"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Center: User Details */}
        <div className={styles.heroDetails}>
          <div className={styles.heroTopRow}>
            <div className={styles.nameBadgeGroup}>
              <h2 className={styles.heroName}>
                {usuario?.nombre ? `${usuario.nombre} ${usuario.apellido || ''}` : 'Tu Cuenta'}
              </h2>
            </div>
            <span className={styles.memberTag}>
              <Sparkles size={13} /> Cuenta Argentum
            </span>
          </div>

          {/* Contact Details with Copy Actions */}
          <div className={styles.heroContacts}>
            {usuario?.email && (
              <button
                type="button"
                className={styles.contactItem}
                onClick={() => handleCopy(usuario.email!, 'Email')}
                title="Click para copiar email"
              >
                <span>{usuario.email}</span>
                {copiedField === 'Email' ? <Check size={13} className={styles.copyCheck} /> : <Copy size={13} />}
              </button>
            )}
            {usuario?.telefono && (
              <button
                type="button"
                className={styles.contactItem}
                onClick={() => handleCopy(usuario.telefono!, 'Teléfono')}
                title="Click para copiar teléfono"
              >
                <span>{formatearTelefonoVisual(usuario.telefono)}</span>
                {copiedField === 'Teléfono' ? <Check size={13} className={styles.copyCheck} /> : <Copy size={13} />}
              </button>
            )}
          </div>

          {/* Badges Row */}
          <div className={styles.heroBadges}>
            <div
              className={`${styles.statusChip} ${
                usuario?.email_verificado ? styles.chipSuccess : styles.chipWarning
              }`}
            >
              {usuario?.email_verificado ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{usuario?.email_verificado ? 'Email verificado' : 'Email pendiente'}</span>
            </div>

            <div
              className={`${styles.statusChip} ${
                usuario?.telefono_verificado ? styles.chipSuccess : styles.chipNeutral
              }`}
            >
              {usuario?.telefono_verificado ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{usuario?.telefono_verificado ? 'WhatsApp activo' : 'WhatsApp pendiente'}</span>
            </div>

            <div className={`${styles.statusChip} ${styles.chipInfo}`}>
              <span>Moneda: <strong>{usuario?.moneda_principal || 'ARS'}</strong></span>
              {usuario?.moneda_secundaria_activa && (
                <span className={styles.chipSub}>({usuario.tipo_dolar?.toUpperCase() || 'USD'})</span>
              )}
            </div>

            <div className={`${styles.statusChip} ${styles.chipInfo}`}>
              <span>Ciclo: <strong>{getCicloLabel()}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
