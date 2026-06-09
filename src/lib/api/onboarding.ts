import api from '@/services/api'
import type { CotizacionesDolarResponse, EstadoOnboarding } from '@/types/index'

export async function getEstadoOnboarding(signal?: AbortSignal): Promise<EstadoOnboarding> {
  const res = await api.get('/onboarding/estado', { signal })
  return res.data
}

export async function getCotizaciones(signal?: AbortSignal): Promise<CotizacionesDolarResponse> {
  const res = await api.get('/onboarding/cotizaciones-dolar', { signal })
  return res.data
}

export async function guardarDatosPersonales(params: {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  sexo: string
}) {
  const res = await api.post('/onboarding/datos-personales', params)
  return res.data
}

export async function guardarCicloFinanciero(params: { ciclo_tipo: string; ciclo_valor: string }) {
  const res = await api.post('/onboarding/ciclo-financiero', params)
  return res.data
}

export async function guardarMoneda(params: {
  moneda_principal: string
  moneda_secundaria_activa: boolean
  tipo_dolar: string | null
}) {
  const res = await api.post('/onboarding/moneda', params)
  return res.data
}

export async function crearPrimeraBilletera(params: {
  nombre: string
  moneda: string
  saldo_inicial: number
}) {
  const res = await api.post('/onboarding/primera-billetera', params)
  return res.data
}
