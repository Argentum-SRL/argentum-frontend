import api from './api'
import type { 
  Presupuesto, 
  PresupuestoCreate, 
  PresupuestoUpdate, 
  PeriodoPresupuesto 
} from '@/types'
import { createKeyedUserCache } from '@/utils/sessionCleanup'

// Cache storage con validación automática por usuario autenticado
const PRESUPUESTOS_TTL = 30 * 1000 // 30 seconds
const presupuestosCache = createKeyedUserCache<Presupuesto[]>(PRESUPUESTOS_TTL)

export const invalidatePresupuestos = () => {
  presupuestosCache.clear()
}

const presupuestoService = {
  getPresupuestos: async (estado?: string, signal?: AbortSignal): Promise<Presupuesto[]> => {
    const key = estado || 'all'
    const cached = presupuestosCache.get(key)
    
    if (cached) {
      return cached
    }

    const response = await api.get('/presupuestos', { params: { estado }, signal })
    presupuestosCache.set(key, response.data)
    return response.data
  },

  getPresupuesto: async (id: string, signal?: AbortSignal): Promise<Presupuesto> => {
    const response = await api.get(`/presupuestos/${id}`, { signal })
    return response.data
  },

  createPresupuesto: async (data: PresupuestoCreate): Promise<Presupuesto> => {
    const response = await api.post('/presupuestos', data)
    invalidatePresupuestos()
    return response.data
  },

  updatePresupuesto: async (id: string, data: PresupuestoUpdate): Promise<Presupuesto> => {
    const response = await api.put(`/presupuestos/${id}`, data)
    invalidatePresupuestos()
    return response.data
  },

  pausarPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.post(`/presupuestos/${id}/pausar`)
    invalidatePresupuestos()
    return response.data
  },

  reanudarPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.post(`/presupuestos/${id}/reanudar`)
    invalidatePresupuestos()
    return response.data
  },

  eliminarPresupuesto: async (id: string): Promise<void> => {
    await api.delete(`/presupuestos/${id}`)
    invalidatePresupuestos()
  },

  getHistorial: async (id: string, signal?: AbortSignal): Promise<PeriodoPresupuesto[]> => {
    const response = await api.get(`/presupuestos/${id}/historial`, { signal })
    return response.data
  }
}

export default presupuestoService
