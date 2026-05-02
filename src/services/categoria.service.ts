import api from './api'
import type { Categoria, Subcategoria } from '@/types'

const categoriaService = {
  getCategorias: async () => {
    const response = await api.get<Categoria[]>('/categorias')
    return response.data
  },

  getSubcategorias: async (categoriaId: string) => {
    const response = await api.get<Subcategoria[]>(`/categorias/${categoriaId}/subcategorias`)
    return response.data
  }
}

export default categoriaService
