import { cuotaDesdeTotal, totalDesdeCuota } from '@/utils/ayudasEscritura'
import type { ConvenienciaRequest } from '@/types/tools'

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

export const TEXTO_AYUDA_CUOTAS_CONTADO =
  'Compara lo que pagás en cuotas con el precio de contado, teniendo en cuenta la inflación que se espera para los próximos meses. Si las cuotas pierden valor más rápido de lo que te cobran de más, te conviene en cuotas.'

export interface DatosPedidoConveniencia {
  precio_contado: number | null;
  precio_total_cuotas: number | null;
  valor_cuota: number | null;
  sin_interes: boolean;
  cantidad_cuotas: number | null;
  inflacion_mensual: string;
  usar_inflacion_propia: boolean;
  tiene_interes: boolean;
  tna: string;
  hasCapitalToInvest: boolean;
  investmentTna: string;
  moneda_contado: 'ARS' | 'USD';
  moneda_cuotas: 'ARS' | 'USD';
  ipcError?: boolean;
}

/**
 * Arma el pedido de Cuotas vs contado aplicando las reglas de dólares (D-V1.2 / D-V1.7).
 */
export function armarPedidoConveniencia(formData: DatosPedidoConveniencia): ConvenienciaRequest {
  const monedaContado: 'ARS' | 'USD' = formData.moneda_contado === 'USD' ? 'USD' : 'ARS';
  const monedaCuotas: 'ARS' | 'USD' = formData.sin_interes
    ? monedaContado
    : (formData.moneda_cuotas === 'USD' ? 'USD' : 'ARS');

  const usarInflacionPropia = formData.usar_inflacion_propia || Boolean(formData.ipcError);
  const cuotasEnDolares = monedaCuotas === 'USD';
  const tieneInteres = Boolean(formData.tiene_interes);
  const sinInteres = Boolean(formData.sin_interes);
  const cuotasTotal = formData.precio_total_cuotas;
  const valorCuota = formData.valor_cuota;

  const pedido: ConvenienciaRequest = {
    precio_contado: Number(formData.precio_contado),
    cantidad_cuotas: Number(formData.cantidad_cuotas),
    tiene_interes: tieneInteres,
    moneda_contado: monedaContado,
    moneda_cuotas: monedaCuotas,
  };

  if (!tieneInteres && !sinInteres && valorCuota === null && cuotasTotal !== null) {
    pedido.precio_total_cuotas = cuotasTotal;
  }
  if (!tieneInteres && !sinInteres && valorCuota !== null) {
    pedido.valor_cuota = valorCuota;
  }
  if (!tieneInteres && sinInteres) {
    pedido.sin_interes = true;
  }
  if (tieneInteres && formData.tna) {
    pedido.tna = parseFloat(formData.tna);
  }
  if (!cuotasEnDolares) {
    if (usarInflacionPropia && formData.inflacion_mensual !== '') {
      pedido.inflacion_mensual = parseFloat(formData.inflacion_mensual);
    }
    if (formData.hasCapitalToInvest && formData.investmentTna) {
      pedido.tna_billetera_inversion = parseFloat(formData.investmentTna);
    }
  }

  return pedido;
}

declare module '@/types/tools' {
  interface ConvenienciaRequest {
    valor_cuota?: number
    sin_interes?: boolean
    moneda_contado?: 'ARS' | 'USD'
    moneda_cuotas?: 'ARS' | 'USD'
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
    moneda?: 'ARS' | 'USD'
    contado_usado?: number
    cotizacion?: number | null
    linea_cotizacion?: string | null
    linea_billetera?: string | null
  }
}

