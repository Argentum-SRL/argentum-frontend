/**
 * src/utils/sessionCleanup.ts
 *
 * Módulo centralizado de limpieza de sesión e invalidación automática de cachés por usuario.
 *
 * ¡ATENCIÓN DESARROLLADORES!
 * Si creás una nueva caché en cualquier servicio:
 * 1. Utilizá los helpers `createUserCache` o `createKeyedUserCache` para vincular automáticamente
 *    los datos al usuario autenticado (evita servir datos de otro usuario por error).
 * 2. Exportá en tu servicio una función de invalidación (ej. `invalidateMiServicioCache`).
 * 3. Registrá esa función de invalidación en la lista `CACHE_CLEANERS` de este módulo.
 */
import api, { getToken } from '@/services/api'
import type { InternalAxiosRequestConfig } from 'axios'
import { invalidateDashboardCache } from '@/services/dashboard.service'
import { invalidateBilleteras } from '@/services/billetera.service'
import { invalidatePresupuestos } from '@/services/presupuesto.service'
import { invalidateCategorias } from '@/services/categoria.service'

// ── Interceptor para cancelación de peticiones HTTP en curso ──────────────

interface RequestWithAbortController extends InternalAxiosRequestConfig {
  _sessionAbortController?: AbortController
}

const activeControllers = new Set<AbortController>()

api.interceptors.request.use((config: RequestWithAbortController) => {
  const controller = new AbortController()
  activeControllers.add(controller)
  config._sessionAbortController = controller

  if (config.signal) {
    if (config.signal.aborted) {
      controller.abort()
    } else if (typeof config.signal.addEventListener === 'function') {
      config.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  config.signal = controller.signal
  return config
})

api.interceptors.response.use(
  (response) => {
    const controller = (response.config as RequestWithAbortController)?._sessionAbortController
    if (controller) activeControllers.delete(controller)
    return response
  },
  (error) => {
    const controller = (error?.config as RequestWithAbortController)?._sessionAbortController
    if (controller) activeControllers.delete(controller)
    return Promise.reject(error)
  }
)

/**
 * Cancela inmediatamente todas las peticiones HTTP activas en curso.
 */
export function cancelInFlightRequests(): void {
  for (const controller of activeControllers) {
    try {
      controller.abort()
    } catch {
      // Ignorar errores al abortar
    }
  }
  activeControllers.clear()
}

// ── Helper de identificación del usuario actual ───────────────────────────

/**
 * Extrae el ID del usuario actual (claim `sub`) desde el JWT en memoria.
 * Retorna null si no hay token o si el token es inválido.
 */
export function getCurrentUserId(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonStr)
    return payload.sub ? String(payload.sub) : null
  } catch {
    return null
  }
}

// ── Helpers compartidos para cachés con verificación por usuario ───────────

export interface UserCacheEntry<T> {
  data: T
  timestamp: number
  userId: string | null
}

export interface UserCache<T> {
  get: (ttlMs?: number) => T | null
  set: (data: T) => void
  clear: () => void
  getRaw: () => UserCacheEntry<T> | null
}

/**
 * Crea una caché simple vinculada al usuario autenticado.
 * Antes de retornar un valor cacheado, valida:
 * 1. Que el usuario actual coincida con el usuario que guardó el dato.
 * 2. Que el tiempo de vida (TTL) no haya expirado.
 * Si no coincide el usuario o expiró el TTL, descarta el dato y retorna null.
 */
export function createUserCache<T>(defaultTtlMs: number): UserCache<T> {
  let cache: UserCacheEntry<T> | null = null

  return {
    get: (ttlMs = defaultTtlMs): T | null => {
      if (!cache) return null
      const currentUserId = getCurrentUserId()
      // Si no hay usuario autenticado o el usuario no coincide con el dueño de los datos, descartar
      if (!currentUserId || cache.userId !== currentUserId) {
        cache = null
        return null
      }
      // Si expiró el TTL, descartar
      if (Date.now() - cache.timestamp >= ttlMs) {
        cache = null
        return null
      }
      return cache.data
    },
    set: (data: T): void => {
      cache = {
        data,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      }
    },
    clear: (): void => {
      cache = null
    },
    getRaw: () => cache,
  }
}

export interface KeyedUserCache<T> {
  get: (key: string, ttlMs?: number) => T | null
  set: (key: string, data: T) => void
  clear: () => void
  getRaw: () => Record<string, UserCacheEntry<T>>
}

/**
 * Crea una caché por clave (map/diccionario) vinculada al usuario autenticado.
 */
export function createKeyedUserCache<T>(defaultTtlMs: number): KeyedUserCache<T> {
  let cache: Record<string, UserCacheEntry<T>> = {}

  return {
    get: (key: string, ttlMs = defaultTtlMs): T | null => {
      const entry = cache[key]
      if (!entry) return null
      const currentUserId = getCurrentUserId()
      if (!currentUserId || entry.userId !== currentUserId) {
        delete cache[key]
        return null
      }
      if (Date.now() - entry.timestamp >= ttlMs) {
        delete cache[key]
        return null
      }
      return entry.data
    },
    set: (key: string, data: T): void => {
      cache[key] = {
        data,
        timestamp: Date.now(),
        userId: getCurrentUserId(),
      }
    },
    clear: (): void => {
      cache = {}
    },
    getRaw: () => cache,
  }
}

// ── Limpieza de almacenamiento local ──────────────────────────────────────

/**
 * Claves de localStorage que contienen datos financieros o de sesión del usuario.
 * 'argentum_theme' NO se incluye porque es preferencia del navegador.
 */
export const USER_STORAGE_KEYS = [
  'argentum_dashboard_billeteras',
  'argentum_dashboard_moneda',
] as const

export function clearUserStorage(): void {
  for (const key of USER_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignorar restricciones de localStorage en entornos restringidos
    }
  }
}

// ── Registro e invocación centralizada de limpiadores ─────────────────────

/**
 * Lista de limpiadores de caché de servicios registrados.
 * Toda nueva caché en la aplicación DEBE registrar aquí su limpiador.
 */
const CACHE_CLEANERS: Array<() => void> = [
  invalidateDashboardCache, // Limpia proyeccionCache, resumenCache, cotizacionCache, periodoActualCache
  invalidateBilleteras,     // Limpia billeterasCache
  invalidatePresupuestos,   // Limpia presupuestosCache
  invalidateCategorias,     // Limpia categoriesCache
]

/**
 * Vacía completamente el estado de sesión del frontend:
 * 1. Cancela peticiones HTTP en curso.
 * 2. Vacía las 7 cachés en memoria de todos los servicios.
 * 3. Elimina las claves de localStorage con datos del usuario (preservando argentum_theme).
 */
export function limpiarSesionCompleta(): void {
  // 1. Cancelar peticiones HTTP en vuelo
  cancelInFlightRequests()

  // 2. Invocar todos los limpiadores de cachés de servicios
  for (const cleaner of CACHE_CLEANERS) {
    try {
      cleaner()
    } catch (err) {
      console.error('[SessionCleanup] Error al invalidar caché:', err)
    }
  }

  // 3. Limpiar claves de almacenamiento local del usuario
  clearUserStorage()
}
