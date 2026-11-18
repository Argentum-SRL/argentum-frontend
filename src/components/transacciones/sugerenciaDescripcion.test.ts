import { describe, expect, it } from 'vitest'
import { debeSugerirPorDescripcion } from './sugerenciaDescripcion'

describe('debeSugerirPorDescripcion', () => {
  const base = {
    open: true,
    isEdit: false,
    categoriaManual: false,
    descripcion: 'fotocopias',
    tipo: 'egreso',
  }

  it('devuelve false en edición, selección manual, modal cerrado, texto corto o tipo inválido', () => {
    expect(debeSugerirPorDescripcion({ ...base, isEdit: true })).toBe(false)
    expect(debeSugerirPorDescripcion({ ...base, categoriaManual: true })).toBe(false)
    expect(debeSugerirPorDescripcion({ ...base, open: false })).toBe(false)
    expect(debeSugerirPorDescripcion({ ...base, descripcion: 'ab' })).toBe(false)
    expect(debeSugerirPorDescripcion({ ...base, descripcion: '  ab  ' })).toBe(false)
    expect(debeSugerirPorDescripcion({ ...base, tipo: 'transferencia' })).toBe(false)
  })

  it('devuelve true con al menos 3 letras en egreso e ingreso', () => {
    expect(debeSugerirPorDescripcion({ ...base, descripcion: 'fotocopias', tipo: 'egreso' })).toBe(
      true
    )
    expect(debeSugerirPorDescripcion({ ...base, descripcion: 'sueldo', tipo: 'ingreso' })).toBe(
      true
    )
  })
})
