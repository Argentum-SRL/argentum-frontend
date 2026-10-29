import api from './api'

const usoService = {
  registrarVisita: async (signal?: AbortSignal): Promise<void> => {
    await api.post('/uso/visita', null, { signal })
  },
}

export default usoService

