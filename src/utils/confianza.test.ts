import { describe, it, expect } from 'vitest'
import { textoDatosViejos, textoPreguntaSaldo } from './confianza'

describe('Utilidades de confianza (textos exactos)', () => {
  it('genera texto para datos viejos con cantidad de días', () => {
    expect(textoDatosViejos(13)).toBe('Hace 13 días que no cargás nada: estos números pueden no estar al día.')
  })

  it('genera texto para pregunta de saldo con nombre de billetera', () => {
    expect(textoPreguntaSaldo('Mercado Pago')).toBe('¿Cuánto tenés hoy en Mercado Pago?')
  })
})

