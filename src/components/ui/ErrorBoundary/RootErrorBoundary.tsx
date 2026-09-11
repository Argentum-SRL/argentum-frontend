import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { reportarErrorFrontend } from '@/services/reporteError.service'
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
    <div className={styles.root}>
      <div className={styles.box}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={36} />
        </div>
        <h1 className={styles.title}>Algo salió mal en la aplicación</h1>
        <p className={styles.message}>
          Ocurrió un error inesperado al inicializar la pantalla. Por favor, recargá la aplicación.
        </p>
        <button type="button" className={styles.reloadBtn} onClick={handleReload}>
          <RotateCcw size={16} />
          <span>Recargar aplicación</span>
        </button>
      </div>
    </div>
  )
}

export default RootErrorBoundary
