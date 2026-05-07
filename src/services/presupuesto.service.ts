import api from './api'
import type { 
  Presupuesto, 
  PresupuestoCreate, 
  PresupuestoUpdate, 
  PeriodoPresupuesto 
} from '@/types'

// Cache storage
let presupuestosCache: Record<string, { data: Presupuesto[]; timestamp: number }> = {}
const PRESUPUESTOS_TTL = 30 * 1000 // 30 seconds

export const invalidatePresupuestos = () => {
  presupuestosCache = {}
}

const presupuestoService = {
  getPresupuestos: async (estado?: string): Promise<Presupuesto[]> => {
    const key = estado || 'all'
    const cached = presupuestosCache[key]
    
    if (cached && Date.now() - cached.timestamp < PRESUPUESTOS_TTL) {
      return cached.data
    }

    const response = await api.get('/presupuestos', { params: { estado } })
    presupuestosCache[key] = { data: response.data, timestamp: Date.now() }
    return response.data
  },

  getPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.get(`/presupuestos/${id}`)
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

  getHistorial: async (id: string): Promise<PeriodoPresupuesto[]> => {
    const response = await api.get(`/presupuestos/${id}/historial`)
    return response.data
  }
}

export default presupuestoService
