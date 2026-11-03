import type { FinDeMesTarjeta, FinDeMesResponse } from '@/types'

/**
 * Retorna las líneas no nulas de FinDeMesTarjeta en orden:
 * [linea_riesgo, linea_cobro, linea_cobertura].
 */
export function lineasFinDeMes(t: FinDeMesTarjeta): string[] {
  const lineas = [
    t.linea_riesgo,
    t.linea_cobro,
    t.linea_cobertura,
  ]
  return lineas.filter((linea): linea is string => linea !== null)
}

/**
 * Determina si se debe mostrar la línea de saldo en la tarjeta de balance.
 */
export function debeMostrarLineaSaldo(
  moneda: 'ARS' | 'USD',
  customRange: unknown,
  cantidadBilleterasFiltradas: number
): boolean {
  return moneda === 'ARS' && !customRange && cantidadBilleterasFiltradas === 0
}

/**
 * Determina si se debe mostrar la tarjeta de proyección de fin de mes.
 */
export function debeMostrarTarjetaFinDeMes(
  moneda: 'ARS' | 'USD',
  customRange: unknown,
  data: FinDeMesResponse | null
): boolean {
  return moneda === 'ARS' && !customRange && data !== null && data.tarjeta !== null
}
