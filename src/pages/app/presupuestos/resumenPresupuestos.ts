import type { Presupuesto } from '@/types'

/**
 * Cuenta los presupuestos activos con período actual cuyo porcentaje usado
 * alcanzó o superó el menor porcentaje configurado en sus avisos.
 */
export function enRiesgo(presupuestos: Presupuesto[]): number {
  return presupuestos.filter((p) => {
    if (p.estado !== 'activo' || !p.periodo_actual) {
      return false
    }
    const limite = Number(p.periodo_actual.monto_limite || 0)
    if (limite <= 0) {
      return false
    }
    const avisos = p.alertas_porcentajes
    const primerAviso = avisos && avisos.length > 0 ? Math.min(...avisos) : 80
    const porcentaje = Number(p.periodo_actual.porcentaje_usado ?? 0)
    return porcentaje >= primerAviso
  }).length
}
