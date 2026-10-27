import api, { encabezadoClave } from './api'
import type { GrupoCuotasResumen, GrupoCuotasUpdate, SimularCuotasResponse } from '@/types'
import { invalidateResumen } from './dashboard.service'
import { invalidateBilleteras } from './billetera.service'
import { invalidatePresupuestos } from './presupuesto.service'

export interface SimularCuotasParams {
  monto_total: number
  cantidades: number[]
  tasa_tna?: number | null
  precio_contado?: number | null
}

const grupoCuotasService = {
  getGruposCuotas: async () => {
    const response = await api.get<GrupoCuotasResumen[]>('/grupos-cuotas')
    return response.data
  },

  simularCuotas: async (params: SimularCuotasParams, signal?: AbortSignal): Promise<SimularCuotasResponse> => {
    const cleanParams: Record<string, unknown> = {
      monto_total: params.monto_total,
      cantidades: params.cantidades,
    }
    if (params.tasa_tna !== undefined && params.tasa_tna !== null) {
      cleanParams.tasa_tna = params.tasa_tna
    }
    if (params.precio_contado !== undefined && params.precio_contado !== null) {
      cleanParams.precio_contado = params.precio_contado
    }
    const response = await api.get<SimularCuotasResponse>('/grupos-cuotas/simular', {
      params: cleanParams,
      paramsSerializer: { indexes: null },
      signal,
    })
    return response.data
  },

  updateGrupoCuotas: async (id: string, data: GrupoCuotasUpdate) => {
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

  prepagarGrupo: async (grupoId: string, billeteraId: string, clave?: string): Promise<GrupoCuotasResumen> => {
    const response = await api.post<GrupoCuotasResumen>(`/grupos-cuotas/${grupoId}/prepagar`, { billetera_id: billeteraId }, encabezadoClave(clave))
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  },

  adelantarGrupo: async (grupoId: string): Promise<GrupoCuotasResumen> => {
    const response = await api.post<GrupoCuotasResumen>(`/grupos-cuotas/${grupoId}/adelantar`)
    invalidateResumen()
    invalidateBilleteras()
    invalidatePresupuestos()
    return response.data
  }
}

export default grupoCuotasService
