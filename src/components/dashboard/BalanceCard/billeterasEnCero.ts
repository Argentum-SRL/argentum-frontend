import type { Billetera } from '@/types'

/**
 * Resultado de la separación de billeteras según su saldo y selección.
 */
export interface ResultadoSeparacionBilleteras<T = Billetera> {
  visibles: T[]
  enCero: T[]
}

/**
 * Separa una lista de billeteras entre visibles y en cero.
 *
 * Criterio:
 * - enCero: billeteras con saldo_actual exactamente 0 que NO están en la lista de seleccionadas.
 * - visibles: todas las demás billeteras (saldos distintos de 0, negativos o positivos,
 *   y aquellas billeteras con saldo 0 que estén seleccionadas por el usuario en el filtro).
 *
 * Conserva el orden original en el que fueron recibidas en ambas listas resultantes.
 *
 * @param billeteras Lista de billeteras a clasificar.
 * @param seleccionadas Array con los identificadores (id) de las billeteras seleccionadas.
 * @returns Objeto con las colecciones { visibles, enCero }.
 */
export function separarBilleterasEnCero<T extends { id: string; saldo_actual: number }>(
  billeteras: T[] = [],
  seleccionadas: string[] = []
): ResultadoSeparacionBilleteras<T> {
  const visibles: T[] = []
  const enCero: T[] = []

  for (const b of billeteras) {
    const estaSeleccionada = seleccionadas.includes(b.id)
    if (b.saldo_actual === 0 && !estaSeleccionada) {
      enCero.push(b)
    } else {
      visibles.push(b)
    }
  }

  return { visibles, enCero }
}
