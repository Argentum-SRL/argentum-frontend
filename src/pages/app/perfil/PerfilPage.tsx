import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Trash2, 
  AlertTriangle,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { eliminarCuenta } from '@/services/auth.service'
import styles from './PerfilPage.module.css'

export default function PerfilPage() {
  const { usuario, logout } = useAuth()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    
    setIsDeleting(true)
    try {
      await eliminarCuenta()
      setIsSuccess(true)
      // Esperamos un momento para que el usuario vea el mensaje de éxito
      setTimeout(async () => {
        await logout({ state: { message: 'Cuenta eliminada exitosamente' } })
      }, 2500)
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error)
      alert('Hubo un error al intentar eliminar la cuenta. Por favor, reintenta más tarde.')
    } finally {
      setIsDeleting(false)
    }
  }

  const fechaRegistro = usuario?.fecha_registro 
    ? new Date(usuario.fecha_registro).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Desconocida'

  return (
    <div className={styles.root}>
      {/* Header Perfil */}
      <div className={styles.headerCard}>
        <div className={styles.headerInner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {usuario?.nombre?.charAt(0) || 'U'}
            </div>
            <div className={styles.avatarOnline} />
          </div>
          
          <div className={styles.headerMeta}>
            <h1 className={styles.headerName}>
              {usuario?.nombre} {usuario?.apellido}
            </h1>
            <p className={styles.headerVerified}>
              <ShieldCheck size={16} className={styles.headerVerifiedIcon} />
              Cuenta {usuario?.auth_provider?.toUpperCase()} Verificada
            </p>
            <div className={styles.headerBadges}>
               <span className={`${styles.badge} ${styles.badgeId}`}>
                  ID: {usuario?.id?.substring(0, 8)}...
               </span>
               <span className={`${styles.badge} ${styles.badgeRole}`}>
                  {usuario?.rol}
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        {/* Datos Personales */}
        <div className={styles.dataCard}>
          <h2 className={styles.dataCardTitle}>
            <User className={styles.dataCardTitleIcon} size={20} />
            Datos de la Cuenta
          </h2>
          
          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Mail size={20} />
              </div>
              <div>
                <p className={styles.dataRowLabel}>Email</p>
                <p className={styles.dataRowValue}>{usuario?.email || 'No asociado'}</p>
              </div>
            </div>

            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Phone size={20} />
              </div>
              <div>
                <p className={styles.dataRowLabel}>Teléfono</p>
                <p className={styles.dataRowValue}>{usuario?.telefono || 'No asociado'}</p>
              </div>
            </div>

            <div className={styles.dataRow}>
              <div className={styles.dataRowIcon}>
                <Calendar size={20} />
              </div>
              <div>
                <p className={styles.dataRowLabel}>Miembro desde</p>
                <p className={styles.dataRowValue}>{fechaRegistro}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className={styles.dangerCard}>
          <div>
            <h2 className={styles.dangerTitle}>
              <AlertTriangle size={20} />
              Zona de Peligro
            </h2>
            <p className={styles.dangerText}>
              Eliminar tu cuenta es una acción **permanente**. Se borrarán todas tus billeteras, transacciones, presupuestos y datos personales de nuestros servidores. No se puede deshacer.
            </p>
          </div>
          
          <button onClick={() => setShowConfirmDelete(true)} className={styles.dangerBtn}>
            <Trash2 size={20} />
            Eliminar mi cuenta permanentemente
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalIconWrap}>
              <AlertTriangle size={40} />
            </div>
            
            <h3 className={styles.modalTitle}>
              ¿Estás absolutamente seguro?
            </h3>
            
            {isSuccess ? (
              <div className={styles.successWrap}>
                <div className={styles.successIconWrap}>
                  <ShieldCheck size={32} />
                </div>
                <p className={styles.successTitle}>Cuenta eliminada con éxito</p>
                <p className={styles.successText}>
                  Tus datos han sido borrados de Argentum. <br/>Redirigiendo...
                </p>
              </div>
            ) : (
              <>
                <p className={styles.modalText}>
                  Esta acción borrará definitivamente todos tus datos financieros en Argentum.
                </p>
                
                <div className={styles.modalInputWrap}>
                  <p className={styles.modalInputLabel}>Escribe &quot;ELIMINAR&quot; para confirmar</p>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button 
                    disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                    onClick={handleDeleteAccount}
                    className={styles.modalConfirmBtn}
                  >
                    {isDeleting ? (
                      <div className={styles.spinner} />
                    ) : (
                      <>Confirmar Eliminación Total</>
                    )}
                  </button>
                  
                  <button 
                    disabled={isDeleting}
                    onClick={() => {
                      setShowConfirmDelete(false)
                      setDeleteConfirmText('')
                    }}
                    className={styles.modalCancelBtn}
                  >
                    Mejor no, volver atrás
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
