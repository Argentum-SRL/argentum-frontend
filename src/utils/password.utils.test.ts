import { describe, it, expect } from 'vitest'
import {
  getPasswordMissingError,
  getPasswordRequirements,
  getUtf8ByteLength,
  validatePassword,
  validatePasswordConfirmation,
} from './password.utils'

describe('password.utils — paridad con reglas del backend', () => {
  it('detecta cada regla faltante en getPasswordRequirements', () => {
    expect(getPasswordRequirements('abc', 'abc')).toMatchObject({
      length: false,
      maxBytes: true,
      maxLength: true,
      upper: false,
      lower: true,
      number: false,
      match: true,
    })
    expect(getPasswordRequirements('Segura123', 'Segura123')).toMatchObject({
      length: true,
      maxBytes: true,
      maxLength: true,
      upper: true,
      lower: true,
      number: true,
      match: true,
    })
  })

  it('valida largo mínimo, mayúscula, minúscula, número y tope de 72 bytes UTF-8', () => {
    expect(validatePassword('')).toBe('Creá una contraseña.')
    expect(validatePassword('Ab1')).toBe('La contraseña tiene que tener al menos 8 caracteres.')
    expect(validatePassword('abcdefgh1')).toBe('Tiene que incluir al menos una mayúscula.')
    expect(validatePassword('ABCDEFGH1')).toBe('Tiene que incluir al menos una minúscula.')
    expect(validatePassword('Abcdefgh')).toBe('Tiene que incluir al menos un número.')
    expect(validatePassword('A'.repeat(71) + 'a1')).toBe('La contraseña es demasiado larga. Probá con una más corta.')
    // Caracteres multi-byte (á = 2 bytes en UTF-8): 37 chars pero > 72 bytes
    const multiByte = 'á'.repeat(36) + 'Aa1'
    expect(getUtf8ByteLength(multiByte)).toBeGreaterThan(72)
    expect(validatePassword(multiByte)).toBe('La contraseña es demasiado larga. Probá con una más corta.')
    expect(validatePassword('Segura123')).toBeNull()
  })

  it('lista exactamente qué falta en getPasswordMissingError al intentar guardar', () => {
    expect(getPasswordMissingError('')).toBe('Creá una contraseña.')
    expect(getPasswordMissingError('abc')).toBe('Tiene que tener al menos 8 caracteres, una mayúscula y un número.')
    expect(getPasswordMissingError('abcdef1')).toBe('Tiene que tener al menos 8 caracteres y una mayúscula.')
    expect(getPasswordMissingError('abcdefgh1')).toBe('Tiene que tener una mayúscula.')
    expect(getPasswordMissingError('Segura123')).toBeNull()
  })

  it('rechaza contraseñas demasiado largas en getPasswordMissingError sin tecnicismos', () => {
    expect(getPasswordMissingError('A'.repeat(71) + 'a1')).toBe('La contraseña es demasiado larga. Probá con una más corta.')
  })

  it('valida la confirmación de contraseña', () => {
    expect(validatePasswordConfirmation('Segura123', '')).toBe('Confirmá tu contraseña.')
    expect(validatePasswordConfirmation('Segura123', 'Otra1234')).toBe('Las contraseñas no coinciden. Revisalas.')
    expect(validatePasswordConfirmation('Segura123', 'Segura123')).toBeNull()
  })
})
