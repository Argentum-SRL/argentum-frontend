/**
 * Ayudas de escritura para formularios del frontend.
 * Estas funciones son exclusivamente para facilitar el ingreso y edición de datos en la interfaz;
 * los números definitivos y oficiales siempre son calculados y validados por el backend.
 */

/**
 * Calcula un monto a partir de un porcentaje.
 * Solo ayuda a escribir en la interfaz; el número que vale lo calcula el backend.
 */
export function montoDesdePorcentaje(monto: number, porcentaje: number): number {
  return Math.round((monto * porcentaje / 100) * 100) / 100
}

/**
 * Estima el total sumando las cuotas.
 * Solo ayuda a escribir en la interfaz; el número que vale lo calcula el backend.
 */
export function totalDesdeCuota(cuota: number, cantidad: number): number {
  return Math.round(cuota * cantidad * 100) / 100
}

/**
 * Estima el valor de cada cuota dividiendo el total.
 * Solo ayuda a escribir en la interfaz; el número que vale lo calcula el backend.
 */
export function cuotaDesdeTotal(total: number, cantidad: number): number {
  return Math.round((total / cantidad) * 100) / 100
}

/**
 * Calcula la mitad redondeada a pesos enteros (por ejemplo, para el chip del 50%).
 * Solo ayuda a escribir en la interfaz; el número que vale lo calcula el backend.
 */
export function mitadRedondeada(monto: number): number {
  return Math.round(monto * 0.5)
}

/**
 * Calcula la diferencia o excedente entre un monto ingresado y el total.
 * Solo ayuda a escribir en la interfaz; el número que vale lo calcula el backend.
 */
export function excedente(montoIngresado: number, total: number): number {
  return Math.round((montoIngresado - total) * 100) / 100
}

