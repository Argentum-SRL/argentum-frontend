/**
 * Utilidades puras para textos de avisos de confianza en el dashboard.
 */

export function textoDatosViejos(dias: number): string {
  return `Hace ${dias} días que no cargás nada: estos números pueden no estar al día.`
}

export function textoPreguntaSaldo(nombre: string): string {
  return `¿Cuánto tenés hoy en ${nombre}?`
}

