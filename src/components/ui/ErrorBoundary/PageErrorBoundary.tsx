import { useEffect } from 'react'
import { useRouteError, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import styles from './PageErrorBoundary.module.css'

export function PageErrorBoundary() {
  const error = useRouteError() as Error | null
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    reportarErrorFrontend({
      mensaje: 'Error al renderizar la página',
      stack: error?.stack || null,
      ruta: location.pathname,
      componente: 'PageErrorBoundary',
    })
  }, [error, location.pathname])

  const handleRetry = () => {
    navigate(0)
  }

  const handleGoHome = () => {
    navigate('/app/dashboard')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <AlertCircle size={32} />
        </div>
        <h2 className={styles.title}>No pudimos cargar esta página</h2>
        <p className={styles.message}>
          Ocurrió un error inesperado al renderizar el contenido. Podés intentar recargarla o volver al inicio.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.retryBtn} onClick={handleRetry}>
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
          <button type="button" className={styles.homeBtn} onClick={handleGoHome}>
            <Home size={16} />
            <span>Ir al inicio</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageErrorBoundary
