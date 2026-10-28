import { describe, it, expect } from 'vitest'
import {
  montoDesdePorcentaje,
  totalDesdeCuota,
  cuotaDesdeTotal,
  mitadRedondeada,
  excedente
} from './ayudasEscritura'

describe('ayudasEscritura', () => {
  it('montoDesdePorcentaje calcula correctamente centavos redondeados', () => {
    expect(montoDesdePorcentaje(12345.67, 15)).toBe(1851.85)
    expect(montoDesdePorcentaje(100000, 25)).toBe(25000)
  })

  it('totalDesdeCuota calcula el total redondeado a centavos', () => {
    expect(totalDesdeCuota(10000, 12)).toBe(120000)
    expect(totalDesdeCuota(3333.33, 3)).toBe(9999.99)
  })

  it('cuotaDesdeTotal calcula la cuota redondeada a centavos', () => {
    expect(cuotaDesdeTotal(100000, 3)).toBe(33333.33)
  })

  it('mitadRedondeada calcula el 50% redondeado a enteros', () => {
    expect(mitadRedondeada(12345)).toBe(6173)
  })

  it('excedente calcula la diferencia redondeada a centavos', () => {
    expect(excedente(195000, 188500)).toBe(6500)
    expect(excedente(100.1, 100)).toBe(0.1)
  })
})

