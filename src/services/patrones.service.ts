import api from './api'
import type {
  PatronesResumen,
  DecisionPatronPayload,
  DeshacerDecisionPayload,
} from '../types'

const patronesService = {
  getPatrones: async (signal?: AbortSignal): Promise<PatronesResumen> => {
    const { data } = await api.get<PatronesResumen>('/patrones', { signal })
    return data
  },

  registrarDecision: async (payload: DecisionPatronPayload): Promise<PatronesResumen> => {
    const { data } = await api.post<PatronesResumen>('/patrones/decisiones', payload)
    return data
  },

  deshacerDecision: async (payload: DeshacerDecisionPayload): Promise<PatronesResumen> => {
    const { data } = await api.post<PatronesResumen>('/patrones/decisiones/deshacer', payload)
    return data
  },
}

export default patronesService
