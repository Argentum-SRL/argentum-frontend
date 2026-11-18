import { describe, expect, it } from 'vitest'
import { problemasTextoWeb } from '@/utils/reglasTextoWeb'
import {
  combinarResultados,
  etiquetaResultado,
  textoParaBuscar,
  type ResultadoBusquedaCategoria,
} from './buscador'

function itemResultado(
  categoriaId: string,
  subcategoriaId: string | null,
  origen: 'memoria' | 'catalogo' | 'ia' = 'catalogo'
): ResultadoBusquedaCategoria {
  return {
    categoria_id: categoriaId,
    subcategoria_id: subcategoriaId,
    categoria: `Cat ${categoriaId}`,
    subcategoria: subcategoriaId ? `Sub ${subcategoriaId}` : null,
    origen,
  }
}

describe('buscador de categorías', () => {
  it('textoParaBuscar recorta y exige al menos 2 caracteres', () => {
    expect(textoParaBuscar('  Pescadería ')).toBe('Pescadería')
    expect(textoParaBuscar('a')).toBe('')
    expect(textoParaBuscar('   ')).toBe('')
  })

  it('etiquetaResultado formatea subcategoría y Otros', () => {
    expect(
      etiquetaResultado({
        categoria: 'Alimentación',
        subcategoria: 'Carnicería',
      })
    ).toEqual({
      titulo: 'Carnicería',
      detalle: 'Alimentación',
    })

    expect(
      etiquetaResultado({
        categoria: 'Alimentación',
        subcategoria: null,
      })
    ).toEqual({
      titulo: 'Otros',
      detalle: 'Alimentación',
    })
  })

  it('combinarResultados prioriza sugeridos, evita repetidos y limita a 8', () => {
    const sug1 = itemResultado('c1', 's1', 'ia')
    const sug2 = itemResultado('c2', null, 'ia')
    const sug3 = itemResultado('c3', 's3', 'ia')

    const busDup = itemResultado('c1', 's1', 'catalogo')
    const busDupNull = itemResultado('c2', null, 'catalogo')
    const buscadosExtra = Array.from({ length: 8 }, (_, idx) =>
      itemResultado(`b${idx}`, `sb${idx}`, 'catalogo')
    )

    const conDuplicados = combinarResultados([sug1, sug2], [busDup, busDupNull, buscadosExtra[0]])
    expect(conDuplicados).toEqual([sug1, sug2, buscadosExtra[0]])

    const conMuchos = combinarResultados([sug1, sug2, sug3], buscadosExtra)
    expect(conMuchos).toHaveLength(8)
    expect(conMuchos.slice(0, 3)).toEqual([sug1, sug2, sug3])

    expect(combinarResultados([], buscadosExtra.slice(0, 4))).toEqual(
      buscadosExtra.slice(0, 4)
    )
  })

  it('los textos del buscador cumplen reglasTextoWeb', () => {
    const frases = [
      'Elegida según la descripción. Podés cambiarla.',
      'No hay categorías con ese nombre.',
      'No se pudo buscar. Probá de nuevo.',
    ]
    for (const frase of frases) {
      expect(problemasTextoWeb(frase)).toEqual([])
    }
  })
})
