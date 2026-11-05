import { describe, it, expect } from 'vitest'
import { PRIORIDADES, alternarPrioridad, mismasPrioridades } from './prioridades'

describe('PRIORIDADES', () => {
  it('tiene exactamente 8 opciones con ids 1 a 8 y los textos correspondientes', () => {
    expect(PRIORIDADES).toHaveLength(8)
    expect(PRIORIDADES.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(PRIORIDADES[0]).toEqual({ id: 1, texto: 'Control de mi plata, aunque sea poca' })
    expect(PRIORIDADES[1]).toEqual({ id: 2, texto: 'Respaldo ante imprevistos' })
    expect(PRIORIDADES[2]).toEqual({ id: 3, texto: 'Aprender a invertir y que mi plata crezca' })
    expect(PRIORIDADES[3]).toEqual({ id: 4, texto: 'Usar mi plata para estudiar o formarme' })
    expect(PRIORIDADES[4]).toEqual({ id: 5, texto: 'Vivir con lo justo sin deberle a nadie' })
    expect(PRIORIDADES[5]).toEqual({ id: 6, texto: 'Ayudar a mi familia o a quien lo necesita' })
    expect(PRIORIDADES[6]).toEqual({ id: 7, texto: 'Darme gustos sin culpas' })
    expect(PRIORIDADES[7]).toEqual({ id: 8, texto: 'Menos estrés económico, sentirme libre' })
  })

  it('alternarPrioridad agrega o quita respetando el límite de 3', () => {
    expect(alternarPrioridad([], 1)).toEqual([1])
    expect(alternarPrioridad([1, 3, 7], 3)).toEqual([1, 7])
    expect(alternarPrioridad([1, 3, 7], 2)).toEqual([1, 3, 7])
    expect(alternarPrioridad([1], 1)).toEqual([])
  })

  it('mismasPrioridades compara conjuntos de prioridades', () => {
    expect(mismasPrioridades([3, 1], [1, 3])).toBe(true)
    expect(mismasPrioridades([1], [1, 2])).toBe(false)
  })
})

