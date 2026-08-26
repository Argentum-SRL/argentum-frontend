import React from 'react'
import { Trash2 } from 'lucide-react'
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
    <div className={styles.dangerSingleCard}>
      <div className={styles.dangerRowInfo}>
        <span className={styles.dangerActionTitleDestructive}>Eliminar Cuenta Definitivamente</span>
        <span className={styles.dangerActionDesc}>
          Borra todos tus registros contables, balances, transacciones y cuentas asociadas para siempre de forma irreversible.
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
  )
}
