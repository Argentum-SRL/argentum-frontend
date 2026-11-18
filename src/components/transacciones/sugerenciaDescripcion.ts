export interface ParamsSugerenciaDescripcion {
  open: boolean
  isEdit: boolean
  categoriaManual: boolean
  descripcion: string
  tipo: string
}

/** Indica si corresponde pedir una sugerencia de categoría según la descripción. */
export function debeSugerirPorDescripcion({
  open,
  isEdit,
  categoriaManual,
  descripcion,
  tipo,
}: ParamsSugerenciaDescripcion): boolean {
  if (!open || isEdit || categoriaManual) return false
  if (tipo !== 'egreso' && tipo !== 'ingreso') return false
  return descripcion.trim().length >= 3
}
