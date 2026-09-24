import { useEffect } from 'react'
import { useRouteError, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, RefreshCw, Home } from '@/components/ui/icons'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import { AtmosphericBackground, AtmosphericCard } from '@/components/ui'
import styles from './PageErrorBoundary.module.css'

export function PageErrorBoundary() {
  const error = useRouteError() as Error | null
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    reportarErrorFrontend({
      mensaje: error?.message || String(error) || 'Error al renderizar la página',
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
    <AtmosphericBackground role="alert" ariaLive="assertive">
      <AtmosphericCard>
        <div className={styles.iconWrapper} aria-hidden="true">
          <AlertCircle size={32} />
        </div>
        <h1 className={styles.title}>No pudimos cargar esta página</h1>
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
      </AtmosphericCard>
    </AtmosphericBackground>
  )
}

export default PageErrorBoundary
