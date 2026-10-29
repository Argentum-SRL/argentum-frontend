/**
 * Genera el nombre del archivo ZIP de exportación de datos del usuario con la fecha local.
 * Formato: argentum_mis_datos_AAAAMMDD.zip
 */
export function nombreArchivoMisDatos(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `argentum_mis_datos_${anio}${mes}${dia}.zip`
}

