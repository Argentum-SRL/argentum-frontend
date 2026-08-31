/**
 * Resuelve la URL de la foto de perfil del usuario de manera segura y consistente.
 * Maneja URLs absolutas (Google OAuth), base64, blobs y rutas relativas al backend.
 */
export function getFotoUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  const rawBase = import.meta.env.VITE_API_URL || '/api'
  const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  // Si ya contiene el prefijo de la API base, no duplicar
  if (cleanBase && cleanPath.startsWith(cleanBase)) {
    return cleanPath
  }

  return `${cleanBase}${cleanPath}`
}
