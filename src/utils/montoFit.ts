export type FormatoMontoElegido = 'completo' | 'corto'

/**
 * Decide si un monto se muestra completo o abreviado según el ancho disponible de su caja.
 * Si anchoDisponible <= 0 (aún sin medir u oculto), devuelve 'completo'.
 */
export function elegirFormatoMonto(
  anchoDisponible: number,
  anchoCompleto: number
): FormatoMontoElegido {
  if (anchoDisponible <= 0) return 'completo'
  if (anchoCompleto <= anchoDisponible + 0.5) return 'completo'
  return 'corto'
}
