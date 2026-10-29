import React, { useState } from 'react'
import { LogOut, Download } from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { nombreArchivoMisDatos } from '@/utils/misDatos'
import authService from '@/services/auth.service'
import usuarioService from '@/services/usuario.service'
import styles from '../PerfilPage.module.css'

export const SesionesYDatos: React.FC = () => {
  const { logout } = useAuth()
  const { confirm } = useModal()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleCerrarSesiones = () => {
    confirm({
      title: '¿Cerrar sesión en todos los dispositivos?',
      description: 'Vas a tener que volver a entrar en todos, también en este.',
      variant: 'danger',
      confirmLabel: 'Cerrar sesiones',
      onConfirm: async () => {
        try {
          await authService.cerrarSesionEnTodos()
          await logout()
        } catch (err: unknown) {
          sileo.error({
            title: getErrorMessage(err, 'No pudimos cerrar las sesiones.'),
          })
        }
      },
    })
  }

  const handleDescargarMisDatos = async () => {
    setIsDownloading(true)
    try {
      const blob = await usuarioService.descargarMisDatos()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivoMisDatos(new Date())
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      sileo.success({ title: 'Listo, ya se descargó.' })
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos armar el archivo. Probá de nuevo en un rato.'),
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      {/* 1. Sesiones */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <LogOut size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Sesiones</h3>
          </div>
        </div>

        <div className={styles.contactList}>
          <div className={styles.contactItemBox}>
            <div className={styles.contactItemInfo}>
              <div className={styles.contactItemLabelRow}>
                <span className={styles.contactItemLabel}>Cerrar sesión en todos los dispositivos</span>
              </div>
              <span className={styles.contactItemDesc}>
                Vas a tener que volver a entrar en todos, también en este.
              </span>
            </div>
            <div className={styles.contactItemAction}>
              <button
                type="button"
                onClick={handleCerrarSesiones}
                className={styles.unlinkContactBtn}
              >
                Cerrar sesiones
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tus datos */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Download size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Tus datos</h3>
          </div>
        </div>

        <div className={styles.contactList}>
          <div className={styles.contactItemBox}>
            <div className={styles.contactItemInfo}>
              <div className={styles.contactItemLabelRow}>
                <span className={styles.contactItemLabel}>Descargar mis datos</span>
              </div>
              <span className={styles.contactItemDesc}>
                Un archivo con tus movimientos, billeteras, tarjetas y cuotas, metas, presupuestos, suscripciones y los mensajes con el asistente de los últimos 90 días.
              </span>
            </div>
            <div className={styles.contactItemAction}>
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDescargarMisDatos}
                className={styles.editContactBtn}
              >
                {isDownloading ? 'Descargando...' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default SesionesYDatos

