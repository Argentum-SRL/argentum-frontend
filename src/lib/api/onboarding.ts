import api from '../axios'
import type { CotizacionesDolarResponse, EstadoOnboarding } from '../../types/index'

export async function getEstadoOnboarding(): Promise<EstadoOnboarding> {
  const res = await api.get('/onboarding/estado')
  return res.data
}

export async function getCotizacionesDolar(): Promise<CotizacionesDolarResponse> {
  const res = await api.get('/onboarding/cotizaciones-dolar')
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
