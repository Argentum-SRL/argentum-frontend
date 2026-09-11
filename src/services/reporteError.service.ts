import api from '@/services/api'

export interface ReporteErrorParams {
  mensaje: string
  stack?: string | null
  ruta?: string | null
  componente?: string | null
}

const reportedFingerprints = new Set<string>()

export function reportarErrorFrontend(params: ReporteErrorParams): void {
  try {
    const ruta = (params.ruta ?? (typeof window !== 'undefined' ? window.location.pathname : '')).slice(0, 500)
    const mensaje = (params.mensaje || 'Error desconocido').slice(0, 1000)
    const componente = (params.componente || 'Desconocido').slice(0, 200)
    const stack = params.stack ? params.stack.slice(0, 5000) : null
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : undefined

    const fingerprint = `${componente}:${mensaje}:${ruta}`
    if (reportedFingerprints.has(fingerprint)) {
      return
    }
    reportedFingerprints.add(fingerprint)

    void api.post('/reporte-error', {
      mensaje,
      stack,
      ruta,
      componente,
      user_agent: userAgent,
    }).catch((err) => {
      // Silencioso: no bloquea ni rompe la interfaz
      if (import.meta.env.DEV) {
        console.warn('[ReporteError] Fallo al enviar reporte al backend:', err)
      }
    })
  } catch {
    // Nunca lanza
  }
}
