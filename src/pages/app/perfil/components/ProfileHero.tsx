import React from 'react'
import {
  Camera,
  Trash2,
  AlertCircle,
  Coins,
  Calendar,
  Edit3,
  User,
} from '@/components/ui/icons'
import type { Usuario } from '@/types'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import { getFotoUrl } from '@/utils/fotoUrl'
import styles from '../PerfilPage.module.css'

interface ProfileHeroProps {
  usuario: Usuario | null
  updateUsuario: (u: Usuario) => void
  onOpenCrop: () => void
  onEditDatos: () => void
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  usuario,
  updateUsuario,
  onOpenCrop,
  onEditDatos,
}) => {
  const { confirm } = useModal()
  const [fotoError, setFotoError] = React.useState(false)

  const isGoogle = usuario?.auth_provider === 'google'

  const fotoUrlRaw = getFotoUrl(usuario?.foto_url)
  const [prevFotoUrlRaw, setPrevFotoUrlRaw] = React.useState(fotoUrlRaw)

  if (fotoUrlRaw !== prevFotoUrlRaw) {
    setPrevFotoUrlRaw(fotoUrlRaw)
    setFotoError(false)
  }

  const fotoUrl = fotoError ? null : fotoUrlRaw

  const isEmailPending = usuario ? !usuario.email_verificado : false
  const isPhonePending = usuario ? !usuario.telefono_verificado : false
  const hasPending = isEmailPending || isPhonePending

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
          sileo.success({ title: 'Foto de perfil eliminada' })
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos eliminar la foto de perfil.') })
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

  const getEdadLabel = () => {
    if (!usuario?.fecha_nacimiento) return null
    try {
      const parts = usuario.fecha_nacimiento.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        const today = new Date()
        let age = today.getFullYear() - d.getFullYear()
        const m = today.getMonth() - d.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          age--
        }
        return `${age} años`
      }
    } catch {
      return null
    }
    return null
  }

  return (
    <div className={styles.heroCard}>
      {/* Background ambient lighting */}
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroInner}>
        {/* Left: User Identity & Contact Actions */}
        <div className={styles.heroIdentityZone}>
          <div className={styles.avatarSection}>
            <div
              className={`${styles.avatarWrapper} ${!isGoogle ? styles.avatarInteractive : ''}`}
              title={isGoogle ? 'Foto gestionada por Google' : 'Cambiar foto de perfil'}
              onClick={!isGoogle ? onOpenCrop : undefined}
              role={!isGoogle ? 'button' : undefined}
              tabIndex={!isGoogle ? 0 : undefined}
              onKeyDown={
                !isGoogle
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpenCrop()
                      }
                    }
                  : undefined
              }
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={usuario?.nombre || 'Usuario'}
                  className={styles.avatarImg}
                  referrerPolicy="no-referrer"
                  onError={() => setFotoError(true)}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Desktop hover overlay only */}
              {!isGoogle && (
                <div className={styles.avatarOverlayBtn} aria-hidden="true">
                  <Camera size={16} />
                  <span>Cambiar</span>
                </div>
              )}
            </div>

            {!isGoogle && fotoUrl && (
              <button
                type="button"
                className={styles.deletePhotoBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePhoto()
                }}
                title="Eliminar foto de perfil"
                aria-label="Eliminar foto de perfil"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          <div className={styles.heroDetails}>
            <div className={styles.heroTopRow}>
              <h2 className={styles.heroName}>
                {usuario?.nombre ? `${usuario.nombre} ${usuario.apellido || ''}`.trim() : 'Tu Cuenta'}
              </h2>

              {/* Alertas pendientes discretas */}
              {hasPending && (
                <div className={styles.heroAlertsInline}>
                  {isEmailPending && (
                    <span
                      className={`${styles.statusChip} ${styles.chipWarning}`}
                      title="Email pendiente de verificación"
                    >
                      <AlertCircle size={10} />
                      <span>Email pendiente</span>
                    </span>
                  )}

                  {isPhonePending && (
                    <span
                      className={`${styles.statusChip} ${styles.chipNeutral}`}
                      title="WhatsApp pendiente"
                    >
                      <AlertCircle size={10} />
                      <span>WhatsApp pendiente</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Resumen Financiero y Perfil: meta-línea integrada, limpia, sin cajas ni bordes anidados */}
            <div className={styles.heroGlanceZone}>
              <span className={styles.glanceItem} title="Moneda principal">
                <Coins size={12} className={styles.glanceIcon} />
                <span className={styles.glanceValue}>
                  {usuario?.moneda_principal === 'USD' ? 'Dólares' : 'Pesos'}
                </span>
                {usuario?.moneda_secundaria_activa && (
                  <span className={styles.glancePill}>
                    {usuario.tipo_dolar?.toUpperCase() || 'MEP'}
                  </span>
                )}
              </span>
              <span className={styles.glanceSep} aria-hidden="true">•</span>
              <span className={styles.glanceItem} title="Ciclo financiero">
                <Calendar size={12} className={styles.glanceIcon} />
                <span className={styles.glanceValue}>{getCicloLabel()}</span>
              </span>
              {getEdadLabel() && (
                <>
                  <span className={styles.glanceSep} aria-hidden="true">•</span>
                  <span className={styles.glanceItem} title="Edad">
                    <User size={12} className={styles.glanceIcon} />
                    <span className={styles.glanceValue}>{getEdadLabel()}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Acción directa de edición de datos personales */}
        <div className={styles.heroActionZone}>
          <button
            type="button"
            className={styles.editProfileHeroBtn}
            onClick={onEditDatos}
            title="Editar datos personales"
            aria-label="Editar datos personales"
          >
            <Edit3 size={14} />
            <span className={styles.editProfileHeroBtnText}>Editar perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}
