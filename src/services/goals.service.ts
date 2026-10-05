import api from './api'
import type { Goal, GoalMovement } from '@/types/goals'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'
import { invalidatePresupuestos } from './presupuesto.service'

const goalsService = {
  getGoals: async (activas_solo?: boolean, signal?: AbortSignal): Promise<Goal[]> => {
    const response = await api.get<Goal[]>('/goals', { params: { activas_solo }, signal })
    return response.data
  },

  getGoal: async (id: string, signal?: AbortSignal): Promise<Goal> => {
    const response = await api.get<Goal>(`/goals/${id}`, { signal })
    return response.data
  },

  createGoal: async (data: Partial<Goal>): Promise<Goal> => {
    const response = await api.post<Goal>('/goals', data)
    return response.data
  },

  updateGoal: async (id: string, data: Partial<Goal>): Promise<Goal> => {
    const response = await api.patch<Goal>(`/goals/${id}`, data)
    return response.data
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`)
  },

  addMovement: async (id: string, data: Partial<GoalMovement>): Promise<GoalMovement> => {
    const response = await api.post<GoalMovement>(`/goals/${id}/movimientos`, data)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
    return response.data
  },

  deleteMovement: async (id: string, movementId: string): Promise<void> => {
    await api.delete(`/goals/${id}/movimientos/${movementId}`)
    invalidateBilleteras()
    invalidateResumen()
    invalidatePresupuestos()
  }
}

export default goalsService
