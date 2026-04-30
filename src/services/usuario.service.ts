import api from './api'
import type {
  Usuario,
  EditarDatosPersonalesRequest,
  EditarEmailRequest,
  EditarPasswordRequest,
  EditarTelefonoRequest,
  EditarCicloFinancieroRequest,
  EditarMonedaRequest
} from '../types'

const usuarioService = {
  getMe: async () => {
    const { data } = await api.get<Usuario>('/usuarios/me')
    return data
  },

  actualizarDatosPersonales: async (datos: EditarDatosPersonalesRequest) => {
    const { data } = await api.put<Usuario>('/usuarios/me/datos-personales', datos)
    return data
  },

  actualizarEmail: async (datos: EditarEmailRequest) => {
    const { data } = await api.put<{ confirmacion: string; requiere_verificacion_email: boolean }>(
      '/usuarios/me/email',
      datos
    )
    return data
  },

  actualizarPassword: async (datos: EditarPasswordRequest) => {
    const { data } = await api.put<{ confirmacion: string }>('/usuarios/me/password', datos)
    return data
  },

  actualizarTelefono: async (datos: EditarTelefonoRequest) => {
    const { data } = await api.put<{ confirmacion: string; requiere_verificacion_telefono: boolean }>(
      '/usuarios/me/telefono',
      datos
    )
    return data
  },

  actualizarCicloFinanciero: async (datos: EditarCicloFinancieroRequest) => {
    const { data } = await api.put<Usuario>('/usuarios/me/ciclo-financiero', datos)
    return data
  },

  actualizarMoneda: async (datos: EditarMonedaRequest) => {
    const { data } = await api.put<Usuario>('/usuarios/me/moneda', datos)
    return data
  },

  subirFoto: async (archivo: File) => {
    const formData = new FormData()
    formData.append('archivo', archivo)
    const { data } = await api.post<{ foto_url: string }>('/usuarios/me/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return data
  },

  eliminarFoto: async () => {
    const { data } = await api.delete<{ confirmacion: string }>('/usuarios/me/foto')
    return data
  },

  eliminarCuenta: async () => {
    const { data } = await api.delete<{ confirmacion: string }>('/usuarios/me')
    return data
  }
}

export default usuarioService
