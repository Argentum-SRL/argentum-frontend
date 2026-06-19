import api from './api'
import type { GrupoCuotasResumen } from '@/types'
import { invalidateResumen } from './dashboard.service'
import { invalidateBilleteras } from './billetera.service'
import { invalidatePresupuestos } from './presupuesto.service'

const grupoCuotasService = {
  getGruposCuotas: async () => {
    const response = await api.get<GrupoCuotasResumen[]>('/grupos-cuotas')
    return response.data
  },

  updateGrupoCuotas: async (id: string, data: { monto_total_nuevo?: number | null; descripcion?: string | null }) => {
    const response = await api.patch<GrupoCuotasResumen>(`/grupos-cuotas/${id}`, data)
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  },

  deleteGrupoCuotas: async (id: string) => {
    const response = await api.delete<{ detail: string }>(`/grupos-cuotas/${id}`)
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  },

  cancelarGrupo: async (grupoId: string): Promise<GrupoCuotasResumen> => {
    const response = await api.post<GrupoCuotasResumen>(`/grupos-cuotas/${grupoId}/cancelar`)
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  },

  prepagarGrupo: async (grupoId: string, billeteraId: string): Promise<GrupoCuotasResumen> => {
    const response = await api.post<GrupoCuotasResumen>(`/grupos-cuotas/${grupoId}/prepagar`, { billetera_id: billeteraId })
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  }
}

export default grupoCuotasService
