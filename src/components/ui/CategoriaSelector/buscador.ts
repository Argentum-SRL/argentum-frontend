export type OrigenBusquedaCategoria = 'memoria' | 'catalogo' | 'ia'

export interface ResultadoBusquedaCategoria {
  categoria_id: string
  subcategoria_id: string | null
  categoria: string
  subcategoria: string | null
  origen: OrigenBusquedaCategoria
}

const MAX_RESULTADOS_GRILLA = 8

/** Recorta espacios y devuelve vacío si quedan menos de 2 letras. */
export function textoParaBuscar(texto: string): string {
  const limpio = texto.trim()
  return limpio.length < 2 ? '' : limpio
}

/** Arma título y detalle para mostrar un resultado de categoría. */
export function etiquetaResultado(
  resultado: Pick<ResultadoBusquedaCategoria, 'categoria' | 'subcategoria'>
): { titulo: string; detalle: string } {
  return {
    titulo: resultado.subcategoria || 'Otros',
    detalle: resultado.categoria,
  }
}

/** Une sugeridos de IA y resultados del catálogo sin repetir (máximo 8). */
export function combinarResultados(
  sugeridos: ResultadoBusquedaCategoria[],
  buscados: ResultadoBusquedaCategoria[]
): ResultadoBusquedaCategoria[] {
  const combinados: ResultadoBusquedaCategoria[] = []
  const vistos = new Set<string>()

  for (const lista of [sugeridos, buscados]) {
    for (const item of lista) {
      const clave = `${item.categoria_id}:${item.subcategoria_id ?? ''}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      combinados.push(item)
      if (combinados.length >= MAX_RESULTADOS_GRILLA) {
        return combinados
      }
    }
  }

  return combinados
}
