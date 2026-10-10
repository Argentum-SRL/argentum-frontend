import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { AlertCircle, RotateCcw } from '@/components/ui/icons'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import { AtmosphericBackground, AtmosphericCard } from '@/components/ui'
import styles from './RootErrorBoundary.module.css'

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

export function RootErrorBoundary() {
  const error = useRouteError() as Error | null
  const isChunkError = isChunkLoadError(error)

  useEffect(() => {
    reportarErrorFrontend({
      mensaje: error?.message || String(error) || 'Error crítico en la raíz de la aplicación',
      stack: error?.stack || null,
      ruta: typeof window !== 'undefined' ? window.location.pathname : '/',
      componente: 'RootErrorBoundary',
    })
  }, [error])

  // Si falló la carga por un nuevo despliegue en la raíz/rutas públicas, recargar una vez
  useEffect(() => {
    if (isChunkError) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
      const reloadKey = `argentum_chunk_retry_root_${pathname}`
      const last = Number(sessionStorage.getItem(reloadKey) || '0')
      const now = Date.now()
      if (now - last > 15000) {
        sessionStorage.setItem(reloadKey, String(now))
        window.location.reload()
      }
    }
  }, [isChunkError])

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
        <h1 className={styles.title}>
          {isChunkError ? 'Actualización disponible' : 'Algo salió mal en la aplicación'}
        </h1>
        <p className={styles.message}>
          {isChunkError
            ? 'Hubo una nueva actualización en Argentum. Por favor, recargá la aplicación para continuar con la versión más reciente.'
            : 'Ocurrió un error inesperado al inicializar la pantalla. Por favor, recargá la aplicación.'}
        </p>
        <button type="button" className={styles.reloadBtn} onClick={handleReload}>
          <RotateCcw size={16} />
          <span>{isChunkError ? 'Actualizar aplicación' : 'Recargar aplicación'}</span>
        </button>
      </AtmosphericCard>
    </AtmosphericBackground>
  )
}

export default RootErrorBoundary
