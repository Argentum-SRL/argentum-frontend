import api from './api'
import type { Goal, GoalMovement, GoalAnalytics, GoalSummary } from '@/types/goals'
import { invalidateBilleteras } from './billetera.service'
import { invalidateResumen } from './dashboard.service'
import { invalidatePresupuestos } from './presupuesto.service'

const goalsService = {
  getGoals: async (activas_solo?: boolean, signal?: AbortSignal): Promise<Goal[]> => {
    const response = await api.get('/goals', { params: { activas_solo }, signal })
    return response.data
  },

  getGoal: async (id: string, signal?: AbortSignal): Promise<Goal> => {
    const response = await api.get(`/goals/${id}`, { signal })
    return response.data
  },

  createGoal: async (data: Partial<Goal>): Promise<Goal> => {
    const response = await api.post('/goals', data)
    return response.data
  },

  updateGoal: async (id: string, data: Partial<Goal>): Promise<Goal> => {
    const response = await api.patch(`/goals/${id}`, data)
    return response.data
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`)
  },

  addMovement: async (id: string, data: Partial<GoalMovement>): Promise<GoalMovement> => {
    const response = await api.post(`/goals/${id}/movimientos`, data)
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
  },

  getAnalytics: async (id: string, signal?: AbortSignal): Promise<GoalAnalytics> => {
    const response = await api.get(`/goals/${id}/analytics`, { signal })
    return response.data
  },

  getSummary: async (signal?: AbortSignal): Promise<GoalSummary> => {
    const response = await api.get('/goals/summary', { signal })
    return response.data
  }
}

export default goalsService
