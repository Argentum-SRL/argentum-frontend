/**
 * Utilidades para visualización y formato de presupuestos.
 */

/**
 * Devuelve la etiqueta legible para mostrar el período de un presupuesto.
 * - 'mensual' -> 'De cobro a cobro'
 * - 'semanal' -> 'Semanal'
 * - 'quincenal' -> 'Quincenal'
 *
 * En la base de datos y la API se sigue guardando 'mensual'.
 */
export function etiquetaPeriodoPresupuesto(periodo: string | null | undefined): string {
  if (!periodo) return ''
  const normalizado = periodo.toLowerCase().trim()
  if (normalizado === 'mensual') {
    return 'De cobro a cobro'
  }
  if (normalizado === 'quincenal') {
    return 'Quincenal'
  }
  if (normalizado === 'semanal') {
    return 'Semanal'
  }
  return periodo.charAt(0).toUpperCase() + periodo.slice(1)
}
