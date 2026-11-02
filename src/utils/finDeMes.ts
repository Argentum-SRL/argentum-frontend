import type { FinDeMesTextos } from '@/types'

/**
 * Retorna las líneas no nulas de FinDeMesTextos en orden:
 * [linea_rango, linea_riesgo, linea_estado, linea_cobertura, linea_saldo].
 */
export function lineasFinDeMes(t: FinDeMesTextos): string[] {
  const lineas = [
    t.linea_rango,
    t.linea_riesgo,
    t.linea_estado,
    t.linea_cobertura,
    t.linea_saldo,
  ]
  return lineas.filter((linea): linea is string => linea !== null)
}

