import React from 'react'
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Edit3,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { Usuario } from '@/types'
import { formatearTelefonoVisual } from '@/utils/telefono.utils'
import styles from '../PerfilPage.module.css'

interface TabGeneralProps {
  usuario: Usuario | null
  onEditDatos: () => void
  onEditEmail: () => void
  onEditTelefono: () => void
  onVerificarEmail: () => void
}

export const TabGeneral: React.FC<TabGeneralProps> = ({
  usuario,
  onEditDatos,
  onEditEmail,
  onEditTelefono,
  onVerificarEmail,
}) => {
  const isGoogle = usuario?.auth_provider === 'google'

  // Format birthdate and calculate age
  const formatBirthdate = (dateStr: string | null) => {
    if (!dateStr) return 'No especificada'
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        const formatted = d.toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        const today = new Date()
        let age = today.getFullYear() - d.getFullYear()
        const m = today.getMonth() - d.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          age--
        }
        return `${formatted} (${age} años)`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  const getSexoLabel = (sexo: string | null) => {
    switch (sexo) {
      case 'masculino': return 'Masculino'
      case 'femenino': return 'Femenino'
      case 'no_binario': return 'No binario'
      case 'prefiero_no_decir': return 'Prefiero no decirlo'
      default: return 'No especificado'
    }
  }

  return (
    <div className={styles.tabGrid}>
      {/* 1. Datos Personales Card */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <User size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Datos personales</h3>
            <p>Tu información de identidad y perfil para personalizar Argentum</p>
          </div>
          <button
            type="button"
            className={styles.actionBtnOutline}
            onClick={onEditDatos}
          >
            <Edit3 size={14} />
            <span>Editar</span>
          </button>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Nombre completo</span>
            <span className={styles.fieldValue}>
              {usuario?.nombre ? `${usuario.nombre} ${usuario.apellido || ''}` : 'Sin definir'}
            </span>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Fecha de nacimiento</span>
            <div className={styles.fieldValueWithIcon}>
              <Calendar size={15} className={styles.mutedIcon} />
              <span className={styles.fieldValue}>{formatBirthdate(usuario?.fecha_nacimiento || null)}</span>
            </div>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Género / Sexo</span>
            <span className={styles.fieldValue}>{getSexoLabel(usuario?.sexo || null)}</span>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Estado de la cuenta</span>
            <div className={styles.statusPillActive}>
              <ShieldCheck size={14} />
              <span>Cuenta Activa</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Información de Contacto Card */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Mail size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Contacto & Vinculación</h3>
            <p>Medios de comunicación para alertas, soporte y recuperación</p>
          </div>
        </div>

        <div className={styles.contactList}>
          {/* Correo Electrónico */}
          <div className={styles.contactRow}>
            <div className={styles.contactIconCircle}>
              <Mail size={18} />
            </div>
            <div className={styles.contactDetails}>
              <div className={styles.contactTop}>
                <span className={styles.contactType}>Correo Electrónico</span>
                {usuario?.email_verificado ? (
                  <span className={styles.verifiedTag}>
                    <CheckCircle2 size={12} /> Verificado
                  </span>
                ) : (
                  <span className={styles.unverifiedTag}>
                    <AlertCircle size={12} /> Sin verificar
                  </span>
                )}
              </div>
              <span className={styles.contactValue}>{usuario?.email || 'Sin correo asociado'}</span>
            </div>

            <div className={styles.contactActions}>
              {!usuario?.email_verificado && usuario?.email && (
                <button
                  type="button"
                  className={styles.verifyDirectBtn}
                  onClick={onVerificarEmail}
                >
                  Verificar ahora <ArrowRight size={13} />
                </button>
              )}
              {isGoogle ? (
                <div className={styles.lockedBadge} title="Email gestionado por Google">
                  <Lock size={14} />
                  <span>Google</span>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.actionBtnOutlineSm}
                  onClick={onEditEmail}
                  title="Cambiar correo"
                >
                  <Edit3 size={13} />
                  <span>Cambiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Teléfono / WhatsApp */}
          <div className={styles.contactRow}>
            <div className={styles.contactIconCircle}>
              <Phone size={18} />
            </div>
            <div className={styles.contactDetails}>
              <div className={styles.contactTop}>
                <span className={styles.contactType}>WhatsApp / Teléfono</span>
                {usuario?.telefono_verificado ? (
                  <span className={styles.verifiedTag}>
                    <CheckCircle2 size={12} /> Vinculado
                  </span>
                ) : (
                  <span className={styles.unverifiedTag}>
                    <AlertCircle size={12} /> No vinculado
                  </span>
                )}
              </div>
              <span className={styles.contactValue}>
                {formatearTelefonoVisual(usuario?.telefono) || 'No asociado todavía'}
              </span>
            </div>

            <div className={styles.contactActions}>
              <button
                type="button"
                className={styles.actionBtnOutlineSm}
                onClick={onEditTelefono}
              >
                <Edit3 size={13} />
                <span>{usuario?.telefono ? 'Cambiar' : 'Asociar'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
