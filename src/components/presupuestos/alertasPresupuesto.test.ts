import { describe, expect, it } from 'vitest'
import { problemasTextoWeb } from '@/utils/reglasTextoWeb'
import {
  errorFilaAlerta,
  parsearPorcentaje,
  sanitizarDigitosPorcentaje,
  siguienteAviso,
  textoAvisos,
  validarAlertasFormulario,
} from './alertasPresupuesto'

describe('alertasPresupuesto', () => {
  it('textoAvisos arma las frases exactas de 1, 2 y 3 avisos sin problemas de texto', () => {
    const casos: Array<[number[], string]> = [
      [[80], 'Te llega un aviso al 80%.'],
      [[83, 100], 'Te llega un aviso al 83% y al 100%.'],
      [[50, 83, 100], 'Te llega un aviso al 50%, al 83% y al 100%.'],
    ]

    for (const [lista, esperado] of casos) {
      const resultado = textoAvisos(lista)
      expect(resultado).toBe(esperado)
      expect(problemasTextoWeb(resultado)).toEqual([])
    }
  })

  it('sanitizarDigitosPorcentaje y parsearPorcentaje filtran caracteres y respetan vacío', () => {
    expect(sanitizarDigitosPorcentaje('83%')).toBe('83')
    expect(sanitizarDigitosPorcentaje('abc100xyz')).toBe('100')
    expect(sanitizarDigitosPorcentaje('1234')).toBe('123')
    expect(parsearPorcentaje('')).toBeNull()
    expect(parsearPorcentaje('83%')).toBe(83)
    expect(parsearPorcentaje('0')).toBe(0)
  })

  it('errorFilaAlerta valida rango, repetidos y espera blur/envío para incompletos', () => {
    // Vacío o < 10 no marca error mientras se edita, sí al completar/enviar
    expect(errorFilaAlerta([null, 100], 0, false)).toBeNull()
    expect(errorFilaAlerta([null, 100], 0, true)).toBe(
      'Completá el porcentaje del aviso.'
    )
    expect(errorFilaAlerta([8, 100], 0, false)).toBeNull()
    expect(errorFilaAlerta([8, 100], 0, true)).toBe(
      'Elegí un porcentaje entre 10% y 100%.'
    )

    // > 100 y repetidos marcan error inmediato
    expect(errorFilaAlerta([105, 100], 0, false)).toBe(
      'Elegí un porcentaje entre 10% y 100%.'
    )
    expect(errorFilaAlerta([83, 83], 0, false)).toBe(
      'No repitas el mismo porcentaje.'
    )
    expect(errorFilaAlerta([83, 83], 1, false)).toBe(
      'No repitas el mismo porcentaje.'
    )

    // Enteros entre 10 y 100 válidos
    expect(errorFilaAlerta([10, 83, 100], 1, true)).toBeNull()
  })

  it('validarAlertasFormulario cubre vacíos, rango, duplicados y longitud sin errores de texto web', () => {
    const errores = [
      validarAlertasFormulario([]),
      validarAlertasFormulario([10, 20, 30, 40]),
      validarAlertasFormulario([null, 100]),
      validarAlertasFormulario([9, 100]),
      validarAlertasFormulario([101]),
      validarAlertasFormulario([83.5]),
      validarAlertasFormulario([83, 83]),
    ]
    for (const err of errores) {
      expect(err).not.toBeNull()
      expect(problemasTextoWeb(err!)).toEqual([])
    }

    expect(validarAlertasFormulario([83])).toBeNull()
    expect(validarAlertasFormulario([10, 83, 100])).toBeNull()
  })

  it('siguienteAviso elige el mayor libre menor a 100', () => {
    expect(siguienteAviso([80, 100])).toBe(95)
    expect(siguienteAviso([100])).toBe(95)
    expect(siguienteAviso([95, 100])).toBe(90)
    expect(siguienteAviso([83])).toBe(95)
    expect(siguienteAviso([null])).toBe(95)
  })
})
