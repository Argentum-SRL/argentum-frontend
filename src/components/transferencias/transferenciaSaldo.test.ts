import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('TransferenciaModal saldo insuficiente', () => {
  it('no contiene "Saldo insuficiente en" y sigue conteniendo "El monto supera el saldo disponible"', () => {
    const filePath = path.resolve(__dirname, 'TransferenciaModal.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).not.toContain('Saldo insuficiente en')
    expect(content).toContain('El monto supera el saldo disponible')
  })
})
