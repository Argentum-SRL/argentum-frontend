import React from 'react'
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/hooks/useModal'
import { useToast } from '@/hooks/useToast'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from '../PerfilPage.module.css'

export const DangerZone: React.FC = () => {
  const { logout } = useAuth()
  const { confirm } = useModal()
  const { showToast } = useToast()

  const handleLogout = () => {
    confirm({
      title: 'Cerrar sesión',
      description: '¿Estás seguro de que querés salir de tu cuenta en este dispositivo?',
      variant: 'default',
      confirmLabel: 'Cerrar sesión',
      onConfirm: logout,
    })
  }

  const handleDeleteAccount = () => {
    confirm({
      title: '¿Eliminar tu cuenta de Argentum permanentemente?',
      description:
        'Esta acción es IRREVERSIBLE. Se borrarán todas tus billeteras, transacciones, presupuestos, suscripciones y datos personales sin posibilidad de recuperación.',
      variant: 'danger',
      confirmLabel: 'Eliminar cuenta definitivamente',
      requireTyping: 'ELIMINAR',
      onConfirm: async () => {
        try {
          await usuarioService.eliminarCuenta()
          showToast('Tu cuenta ha sido eliminada exitosamente.', 'success')
          await logout()
        } catch (error) {
          console.error('Error al eliminar la cuenta:', error)
          showToast(getErrorMessage(error, 'Hubo un error al intentar eliminar la cuenta.'), 'error')
        }
      },
    })
  }

  return (
    <div className={styles.dangerZoneContainer}>
      <div className={styles.dangerHeader}>
        <div className={styles.dangerIconBadge}>
          <AlertTriangle size={20} />
        </div>
        <div className={styles.dangerHeaderText}>
          <h3>Zona de Peligro & Sesión</h3>
          <p>Acciones críticas sobre tu sesión activa y la permanencia de tu cuenta</p>
        </div>
      </div>

      <div className={styles.dangerActionsList}>
        {/* Cerrar Sesión */}
        <div className={styles.dangerRow}>
          <div className={styles.dangerRowInfo}>
            <span className={styles.dangerActionTitle}>Cerrar Sesión</span>
            <span className={styles.dangerActionDesc}>
              Finalizá tu sesión actual en este navegador. Vas a tener que volver a identificarte.
            </span>
          </div>
          <button
            type="button"
            className={styles.logoutBtnModern}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Eliminar Cuenta */}
        <div className={`${styles.dangerRow} ${styles.dangerRowDestructive}`}>
          <div className={styles.dangerRowInfo}>
            <span className={styles.dangerActionTitleDestructive}>Eliminar Cuenta Definitivamente</span>
            <span className={styles.dangerActionDesc}>
              Borra todos tus registros contables, balances y cuentas asociadas para siempre.
            </span>
          </div>
          <button
            type="button"
            className={styles.deleteBtnModern}
            onClick={handleDeleteAccount}
          >
            <Trash2 size={15} />
            <span>Eliminar mi cuenta</span>
          </button>
        </div>
      </div>
    </div>
  )
}
