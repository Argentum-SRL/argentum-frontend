import { describe, it, expect } from 'vitest'
import { emailParaVerificar } from './registro'

describe('emailParaVerificar', () => {
  it('normaliza mayúsculas y espacios en blanco', () => {
    expect(emailParaVerificar('  Ana.Perez@Mail.COM ')).toBe('ana.perez@mail.com')
  })

  it('conserva signos + y etiquetas de subdirecciones', () => {
    expect(emailParaVerificar('ana+1@prueba.com')).toBe('ana+1@prueba.com')
  })

  it('maneja strings vacíos de forma segura', () => {
    expect(emailParaVerificar('')).toBe('')
  })
})

