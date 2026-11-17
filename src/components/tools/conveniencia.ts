import { cuotaDesdeTotal, totalDesdeCuota } from '@/utils/ayudasEscritura'

export interface DatosValorCuotaForm {
  precioContado: number | null
  cantidadCuotas: number | null
  sinInteres: boolean
  seLaTasa: boolean
  cuotaManual: number | null
  cuotaSimuladaBackend: number | null
}

/**
 * Resuelve el valor de cada cuota en el formulario de Cuotas vs contado.
 * Para "Sin interés" usa cuotaDesdeTotal y para "Sé la tasa" toma la cuota simulada por el servidor.
 */
export function resolverValorCuotaFormulario(datos: DatosValorCuotaForm): number | null {
  const { precioContado, cantidadCuotas, sinInteres, seLaTasa, cuotaManual, cuotaSimuladaBackend } = datos
  if (!cantidadCuotas || cantidadCuotas <= 0) return null

  if (seLaTasa) {
    return cuotaSimuladaBackend !== null && cuotaSimuladaBackend > 0 ? cuotaSimuladaBackend : null
  }

  if (sinInteres) {
    if (precioContado !== null && precioContado > 0) {
      return cuotaDesdeTotal(precioContado, cantidadCuotas)
    }
    return null
  }

  return cuotaManual !== null && cuotaManual > 0 ? cuotaManual : null
}

/**
 * Resuelve el total nominal en cuotas a partir del valor de cada cuota y la cantidad.
 */
export function resolverTotalCuotasFormulario(
  valorCuota: number | null,
  cantidadCuotas: number | null
): number | null {
  if (valorCuota === null || valorCuota <= 0 || !cantidadCuotas || cantidadCuotas <= 0) {
    return null
  }
  return totalDesdeCuota(valorCuota, cantidadCuotas)
}

export const TEXTO_AYUDA_INFLACION_ESPERADA =
  'Sale de lo que responden cada mes los analistas que consulta el Banco Central.'

declare module '@/types/tools' {
  interface ConvenienciaRequest {
    valor_cuota?: number
    sin_interes?: boolean
  }
  interface ConvenienciaResult {
    valor_cuota?: number
    extra?: number
    extra_pct?: number
    fuente_inflacion?: string
    inflaciones_usadas?: number[]
    titulo?: string
    linea_2?: string
    linea_3?: string
  }
}

