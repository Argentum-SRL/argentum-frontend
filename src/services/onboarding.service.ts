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

export async function guardarCicloFinanciero(params: {
  ciclo_tipo: string
  ciclo_valor: string
  ciclo_ajuste_direccion?: string | null
}) {
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

export async function getPreviewFechaCobro(
  params: {
    tipo: 'dia_fijo' | 'regla'
    valor: string
    direccion?: 'anterior' | 'posterior'
  },
  signal?: AbortSignal
): Promise<{
  tipo: string
  valor: string
  direccion: string
  proxima_fecha_cobro: string
  fecha_nominal: string
  fue_ajustada: boolean
}> {
  const res = await api.get('/onboarding/preview-fecha-cobro', { params, signal })
  return res.data
}
