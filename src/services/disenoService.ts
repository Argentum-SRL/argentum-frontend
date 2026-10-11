import api from './api'
import type {
  DesignAuditData,
  DesignDecision,
  DesignSpecification,
} from '@/types/diseno'
import staticAuditData from '@/data/design-audit-inventory.json'
import axios from 'axios'

const STORAGE_KEY_DECISIONES = 'argentum_diseno_decisiones'
const STORAGE_KEY_SPECS = 'argentum_diseno_especificaciones'

export class ConcurrencyConflictError extends Error {
  public serverData: unknown
  public code: string

  constructor(message: string, serverData: unknown, code = 'CONCURRENCY_CONFLICT') {
    super(message)
    this.name = 'ConcurrencyConflictError'
    this.code = code
    this.serverData = serverData
  }
}

export class DisenoSyncError extends Error {
  public statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'DisenoSyncError'
    this.statusCode = statusCode
  }
}

function getLocalDecisiones(): Record<string, DesignDecision> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECISIONES)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLocalDecisiones(data: Record<string, DesignDecision>) {
  try {
    localStorage.setItem(STORAGE_KEY_DECISIONES, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function getLocalSpecs(): Record<string, DesignSpecification> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SPECS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLocalSpecs(data: Record<string, DesignSpecification>) {
  try {
    localStorage.setItem(STORAGE_KEY_SPECS, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export const disenoService = {
  getInventory: (): DesignAuditData => {
    return staticAuditData as unknown as DesignAuditData
  },

  getDecisiones: async (): Promise<{ data: Record<string, DesignDecision>; source: 'backend' | 'local' }> => {
    try {
      const response = await api.get<{ success: boolean; data: Record<string, DesignDecision> }>(
        '/v1/admin/diseno/decisiones'
      )
      if (response?.data?.success && response.data.data) {
        setLocalDecisiones(response.data.data)
        return { data: response.data.data, source: 'backend' }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        console.warn('[DISENO] Usuario actual no posee rol admin en backend, usando almacenamiento local.')
      }
    }
    return { data: getLocalDecisiones(), source: 'local' }
  },

  saveDecision: async (decision: DesignDecision): Promise<DesignDecision> => {
    try {
      const response = await api.post<{ success: boolean; data: DesignDecision }>(
        '/v1/admin/diseno/decisiones',
        decision
      )
      if (response?.data?.success && response.data.data) {
        const saved = response.data.data
        const local = getLocalDecisiones()
        local[decision.categoryId] = saved
        setLocalDecisiones(local)
        return saved
      }
      throw new DisenoSyncError('Respuesta inesperada del servidor al guardar la decisión')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const errDetail = err.response.data?.error || err.response.data?.detail?.error || {}
          throw new ConcurrencyConflictError(
            errDetail.message || `Conflicto: la categoría "${decision.categoryId}" fue modificada por otro administrador.`,
            errDetail.currentData
          )
        }
        if (err.response?.status === 403) {
          throw new DisenoSyncError('No posees permisos de administrador para guardar cambios en el backend.', 403)
        }
        if (err.response?.status === 401) {
          throw new DisenoSyncError('Tu sesión ha expirado o no estás autenticado como administrador.', 401)
        }
      }
      // Si el backend no está disponible en entorno local, persistir en local pero advertir
      const local = getLocalDecisiones()
      const fallbackEntry: DesignDecision = {
        ...decision,
        version: (decision.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: 'local_admin@argentum.dev (offline)',
      }
      local[decision.categoryId] = fallbackEntry
      setLocalDecisiones(local)
      return fallbackEntry
    }
  },

  getEspecificaciones: async (): Promise<{ data: Record<string, DesignSpecification>; source: 'backend' | 'local' }> => {
    try {
      const response = await api.get<{ success: boolean; data: Record<string, DesignSpecification> }>(
        '/v1/admin/diseno/especificaciones'
      )
      if (response?.data?.success && response.data.data) {
        setLocalSpecs(response.data.data)
        return { data: response.data.data, source: 'backend' }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        console.warn('[DISENO] Usuario no admin al consultar especificaciones, usando local.')
      }
    }
    return { data: getLocalSpecs(), source: 'local' }
  },

  saveEspecificacion: async (spec: DesignSpecification): Promise<DesignSpecification> => {
    try {
      const response = await api.post<{ success: boolean; data: DesignSpecification }>(
        '/v1/admin/diseno/especificaciones',
        spec
      )
      if (response?.data?.success && response.data.data) {
        const saved = response.data.data
        const local = getLocalSpecs()
        local[spec.familyId] = saved
        setLocalSpecs(local)
        return saved
      }
      throw new DisenoSyncError('Respuesta inesperada al guardar la especificación')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const errDetail = err.response.data?.error || err.response.data?.detail?.error || {}
          throw new ConcurrencyConflictError(
            errDetail.message || `Conflicto: la especificación "${spec.familyId}" fue modificada por otro administrador.`,
            errDetail.currentData
          )
        }
        if (err.response?.status === 403) {
          throw new DisenoSyncError('No posees permisos de administrador para guardar especificaciones.', 403)
        }
        if (err.response?.status === 401) {
          throw new DisenoSyncError('Sesión expirada o no autenticado.', 401)
        }
      }
      // Fallback local
      const local = getLocalSpecs()
      const fallbackEntry: DesignSpecification = {
        ...spec,
        version: (spec.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: 'local_admin@argentum.dev (offline)',
      }
      local[spec.familyId] = fallbackEntry
      setLocalSpecs(local)
      return fallbackEntry
    }
  },
}

export default disenoService

