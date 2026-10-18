/**
 * Constantes y funciones de utilidad para etiquetas de movimientos y transacciones.
 */

export const ETIQUETAS_REDUNDANTES = new Set([
  'gasto',
  'ingreso',
  'inversión',
  'inversion',
  'transferencia',
  'aporte a meta',
  'retiro de meta',
  'pago de tarjeta',
  'ahorro',
  'rendimiento',
  'ajuste',
  'saldo inicial',
  'por confirmar',
])

/**
 * Devuelve true si la etiqueta provista coincide (sin espacios y en minúsculas)
 * con alguna de las etiquetas genéricas/redundantes del sistema.
 */
export function esEtiquetaRedundante(etiqueta?: string | null): boolean {
  if (!etiqueta) return false
  return ETIQUETAS_REDUNDANTES.has(etiqueta.trim().toLowerCase())
}
