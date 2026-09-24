import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { AlertCircle, RotateCcw } from '@/components/ui/icons'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import { AtmosphericBackground, AtmosphericCard } from '@/components/ui'
import styles from './RootErrorBoundary.module.css'

export function RootErrorBoundary() {
  const error = useRouteError() as Error | null

  useEffect(() => {
    reportarErrorFrontend({
      mensaje: error?.message || String(error) || 'Error crítico en la raíz de la aplicación',
      stack: error?.stack || null,
      ruta: typeof window !== 'undefined' ? window.location.pathname : '/',
      componente: 'RootErrorBoundary',
    })
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <AtmosphericBackground
      role="alert"
      ariaLive="assertive"
      zIndex={100}
      compensateBottomNav={false}
    >
      <AtmosphericCard>
        <div className={styles.iconWrapper} aria-hidden="true">
          <AlertCircle size={32} />
        </div>
        <h1 className={styles.title}>Algo salió mal en la aplicación</h1>
        <p className={styles.message}>
          Ocurrió un error inesperado al inicializar la pantalla. Por favor, recargá la aplicación.
        </p>
        <button type="button" className={styles.reloadBtn} onClick={handleReload}>
          <RotateCcw size={16} />
          <span>Recargar aplicación</span>
        </button>
      </AtmosphericCard>
    </AtmosphericBackground>
  )
}

export default RootErrorBoundary
