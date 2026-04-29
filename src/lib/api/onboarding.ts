import axios from 'axios'
import type { EstadoOnboarding } from '../../types/index'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
})

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function getEstadoOnboarding(): Promise<EstadoOnboarding> {
  const res = await api.get('/onboarding/estado')
  return res.data
}

export async function postDatosPersonales(nombre: string, apellido: string) {
  const res = await api.post('/onboarding/datos-personales', { nombre, apellido })
  return res.data
}

export async function postCicloFinanciero(ciclo_tipo: string, ciclo_valor: string) {
  const res = await api.post('/onboarding/ciclo-financiero', { ciclo_tipo, ciclo_valor })
  return res.data
}

export async function postMoneda(
  moneda_principal: string, 
  moneda_secundaria_activa: boolean, 
  tipo_dolar: string | null
) {
  const res = await api.post('/onboarding/moneda', { 
    moneda_principal, 
    moneda_secundaria_activa, 
    tipo_dolar 
  })
  return res.data
}

export async function postPrimeraBilletera(
  nombre: string, 
  moneda: string, 
  saldo_inicial: number
) {
  const res = await api.post('/onboarding/primera-billetera', { 
    nombre, 
    moneda, 
    saldo_inicial 
  })
  return res.data
}
