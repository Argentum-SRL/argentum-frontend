/**
 * Utilidades para la descarga y manejo de archivos Excel de presupuestos.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Obtiene el nombre del archivo Excel a partir del header Content-Disposition o de la fecha de hoy.
 */
export function nombreArchivoExcel(
  contentDisposition: string | undefined | null,
  hoy: Date
): string {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="([^"]+)"/)
    if (match && match[1]) {
      return match[1]
    }
  }

  const yyyy = hoy.getFullYear()
  const mm = pad2(hoy.getMonth() + 1)
  const dd = pad2(hoy.getDate())
  return `Argentum_presupuestos_${yyyy}-${mm}-${dd}.xlsx`
}

/**
 * Lee el detalle de error a partir de la respuesta del servidor cuando se descarga un Blob.
 */
export async function leerDetalleError(data: unknown): Promise<string | null> {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const texto = await data.text()
      const json = JSON.parse(texto)
      if (json && typeof json.detail === 'string') {
        return json.detail
      }
    } catch {
      return null
    }
    return null
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === 'string') {
      return obj.detail
    }
  }

  return null
}

