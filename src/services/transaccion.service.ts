import api from './api'
import type { Transaccion } from '@/types'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'
import { invalidatePresupuestos } from './presupuesto.service'

export interface TransaccionFilters {
  billetera_id?: string
  tipo?: 'ingreso' | 'egreso'
  fecha_desde?: string
  fecha_hasta?: string
  categoria_id?: string
  categoria_ids?: string[]
  subcategoria_id?: string
  moneda?: string
  estado_verificacion?: string
  busqueda?: string
  es_cuota_hija?: boolean
  skip?: number
  limit?: number
}

const transaccionService = {
  getTransacciones: async (filters: TransaccionFilters = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'categoria_ids') return // Client-side filtering only
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    const response = await api.get<Transaccion[]>(`/transacciones?${params.toString()}`, { signal })
    return response.data
  },

  getTransaccion: async (id: string) => {
    const response = await api.get<Transaccion>(`/transacciones/${id}`)
    return response.data
  },

  getPendientesIA: async (signal?: AbortSignal) => {
    const response = await api.get<Transaccion[]>('/transacciones/pendientes', { signal })
    return response.data
  },

  createTransaccion: async (data: Partial<Transaccion>) => {
    const response = await api.post<Transaccion>('/transacciones', data)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
    return response.data
  },

  updateTransaccion: async (id: string, data: Partial<Transaccion>) => {
    const response = await api.patch<Transaccion>(`/transacciones/${id}`, data)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
    return response.data
  },

  deleteTransaccion: async (id: string) => {
    await api.delete(`/transacciones/${id}`)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
  },

  confirmarIA: async (id: string) => {
    const response = await api.post<Transaccion>(`/transacciones/${id}/confirmar`)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
    return response.data
  }
}

export default transaccionService
