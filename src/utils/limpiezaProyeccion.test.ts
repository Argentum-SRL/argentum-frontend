import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Limpieza de Proyección vieja (Fase H3)', () => {
  const rootDir = process.cwd()

  it('(1) No existen carpetas ni componentes de proyeccion vieja', () => {
    const cardDir = path.resolve(rootDir, 'src/components/dashboard', ['Proyeccion', 'Card'].join(''))
    const modalDir = path.resolve(rootDir, 'src/components/dashboard', ['Proyeccion', 'Modal'].join(''))

    expect(fs.existsSync(cardDir)).toBe(false)
    expect(fs.existsSync(modalDir)).toBe(false)
  })

  it('(2) src/services/dashboard.service.ts no contiene /dashboard/proyeccion', () => {
    const servicePath = path.resolve(rootDir, 'src/services/dashboard.service.ts')
    const content = fs.readFileSync(servicePath, 'utf-8')

    expect(content).not.toContain('/dashboard/proyeccion')
  })

  it('(3) ExplicativoFinancieroModal.tsx contiene textos de fin de mes y no contiene conceptos de proyección vieja', () => {
    const modalPath = path.resolve(
      rootDir,
      'src/components/dashboard/ExplicativoFinancieroModal/ExplicativoFinancieroModal.tsx'
    )
    const content = fs.readFileSync(modalPath, 'utf-8')

    // Textos requeridos
    expect(content).toContain('Fin de mes')
    expect(content).toContain('¿Cómo llegás a fin de mes?')
    expect(content).toContain('El número grande')
    expect(content).toContain('Las líneas de abajo')
    expect(content).toContain('Aparece cuando tenés al menos 3 meses con movimientos y la app ya sabe cuándo cobrás.')

    // Textos que no deben existir
    expect(content).not.toContain('Rango 80%')
    expect(content).not.toContain('Proyección calibrada')
    expect(content).not.toContain('Apertura')
    expect(content).not.toContain('Cierre esperado')
    expect(content).not.toContain('\\u00')
  })
})
