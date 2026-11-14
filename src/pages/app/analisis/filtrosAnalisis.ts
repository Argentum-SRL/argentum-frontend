export type VistaActivaAnalisis =
  | 'evolucion'
  | 'categorias'
  | 'comparativa'
  | 'proyeccion'
  | 'informes'

export type FiltroId = 'periodo' | 'moneda' | 'billetera' | 'tarjeta'

export interface BilleteraFiltro {
  nombre: string
  moneda?: string
}

export interface FiltrosAnalisisEstado {
  periodo?: number | string
  cantidad_ciclos?: number | string
  moneda?: string
  billetera_id?: string | null
  tarjeta_id?: string | null
}

/**
 * C-10 / B-6: Devuelve la etiqueta para una billetera en el filtro.
 * En pesos devuelve el nombre solo; en dólares agrega " (Dólares)"
 * salvo que el nombre ya contenga "dólar" o "dolar" (sin importar mayúsculas ni acentos).
 */
export function etiquetaBilletera(
  billeteraOrNombre: BilleteraFiltro | string,
  monedaParam?: string
): string {
  let nombre: string
  let moneda: string
  if (typeof billeteraOrNombre === 'string') {
    nombre = billeteraOrNombre
    moneda = monedaParam || 'ARS'
  } else {
    nombre = billeteraOrNombre.nombre
    moneda = billeteraOrNombre.moneda || monedaParam || 'ARS'
  }

  const esUsd = String(moneda).toUpperCase() === 'USD'
  if (!esUsd) {
    return nombre
  }

  const normalizado = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (normalizado.includes('dolar')) {
    return nombre
  }

  return `${nombre} (Dólares)`
}

/**
 * Devuelve la lista de filtros que aplican a la vista seleccionada.
 */
export function filtrosVisibles(vista: VistaActivaAnalisis | string): FiltroId[] {
  switch (vista) {
    case 'evolucion':
    case 'categorias':
      return ['periodo', 'moneda', 'billetera', 'tarjeta']
    case 'comparativa':
    case 'proyeccion':
      return ['moneda', 'billetera', 'tarjeta']
    case 'informes':
    default:
      return []
  }
}

/**
 * Cuenta cuántos filtros activos difieren de los valores de fábrica:
 * (6 ciclos, Pesos, todas las billeteras, todas las tarjetas).
 */
export function contarFiltrosActivos(filtros: FiltrosAnalisisEstado): number {
  let activos = 0
  const periodoVal = filtros.periodo ?? filtros.cantidad_ciclos
  if (periodoVal !== undefined && periodoVal !== null && String(periodoVal) !== '6') {
    activos++
  }
  if (
    filtros.moneda &&
    filtros.moneda !== 'solo_ars' &&
    String(filtros.moneda).toUpperCase() !== 'ARS' &&
    String(filtros.moneda).toLowerCase() !== 'pesos'
  ) {
    activos++
  }
  if (
    filtros.billetera_id &&
    filtros.billetera_id !== 'todos' &&
    filtros.billetera_id !== 'todas'
  ) {
    activos++
  }
  if (
    filtros.tarjeta_id &&
    filtros.tarjeta_id !== 'todos' &&
    filtros.tarjeta_id !== 'todas'
  ) {
    activos++
  }
  return activos
}
