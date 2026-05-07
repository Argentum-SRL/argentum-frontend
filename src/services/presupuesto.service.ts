import api from './api'
import type { 
  Presupuesto, 
  PresupuestoCreate, 
  PresupuestoUpdate, 
  PeriodoPresupuesto 
} from '@/types'

const presupuestoService = {
  getPresupuestos: async (estado?: string): Promise<Presupuesto[]> => {
    const response = await api.get('/presupuestos', { params: { estado } })
    return response.data
  },

  getPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.get(`/presupuestos/${id}`)
    return response.data
  },

  createPresupuesto: async (data: PresupuestoCreate): Promise<Presupuesto> => {
    const response = await api.post('/presupuestos', data)
    return response.data
  },

  updatePresupuesto: async (id: string, data: PresupuestoUpdate): Promise<Presupuesto> => {
    const response = await api.put(`/presupuestos/${id}`, data)
    return response.data
  },

  pausarPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.post(`/presupuestos/${id}/pausar`)
    return response.data
  },

  reanudarPresupuesto: async (id: string): Promise<Presupuesto> => {
    const response = await api.post(`/presupuestos/${id}/reanudar`)
    return response.data
  },

  eliminarPresupuesto: async (id: string): Promise<void> => {
    await api.delete(`/presupuestos/${id}`)
  },

  getHistorial: async (id: string): Promise<PeriodoPresupuesto[]> => {
    const response = await api.get(`/presupuestos/${id}/historial`)
    return response.data
  }
}

export default presupuestoService
