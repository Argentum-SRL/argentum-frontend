import { useEffect } from 'react'
import { useRouteError, useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle, RefreshCw, Home } from '@/components/ui/icons'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import { AtmosphericBackground, AtmosphericCard } from '@/components/ui'
import styles from './PageErrorBoundary.module.css'

function isChunkLoadError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('expected a javascript-or-wasm module script') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk')
  )
}

export function PageErrorBoundary() {
  const error = useRouteError() as Error | null
  const navigate = useNavigate()
  const location = useLocation()
  const isChunkError = isChunkLoadError(error)

  useEffect(() => {
    reportarErrorFrontend({
      mensaje: error?.message || String(error) || 'Error al renderizar la página',
      stack: error?.stack || null,
      ruta: location.pathname,
      componente: 'PageErrorBoundary',
    })
  }, [error, location.pathname])

  // Si falló la carga dinámica por un nuevo despliegue, recargar automáticamente una vez
  useEffect(() => {
    if (isChunkError) {
      const reloadKey = `argentum_chunk_retry_${location.pathname}`
      const last = Number(sessionStorage.getItem(reloadKey) || '0')
      const now = Date.now()
      if (now - last > 15000) {
        sessionStorage.setItem(reloadKey, String(now))
        window.location.reload()
      }
    }
  }, [isChunkError, location.pathname])

  const handleRetry = () => {
    // Si fue un error de módulo o despliegue, navigate(0) no sirve (no recarga JS).
    // Se fuerza una recarga real de la ventana del navegador.
    if (isChunkError) {
      window.location.reload()
    } else {
      window.location.reload()
    }
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
        <h1 className={styles.title}>
          {isChunkError ? 'Actualización disponible' : 'No pudimos cargar esta página'}
        </h1>
        <p className={styles.message}>
          {isChunkError
            ? 'Hubo una nueva actualización en Argentum. Por favor, recargá la página para continuar con la versión más reciente.'
            : 'Ocurrió un error inesperado al renderizar el contenido. Podés intentar recargarla o volver al inicio.'}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.retryBtn} onClick={handleRetry}>
            <RefreshCw size={16} />
            <span>{isChunkError ? 'Actualizar aplicación' : 'Reintentar'}</span>
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
