import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { calcularColumnasConAsomo } from './useColumnasConAsomo'

const SRC_DIR = path.resolve(__dirname, '..')

describe('useColumnasConAsomo (FS2C)', () => {
  it('C1-C12: calcula ancho de columnas, asomo exacto y mínimo por defecto 86', () => {
    const c1 = calcularColumnasConAsomo(318, 4)
    expect(c1.ancho).toBeCloseTo(103.2, 2)
    expect(c1.asomo).toBe(true)

    const c2 = calcularColumnasConAsomo(333, 4)
    expect(c2.ancho).toBeCloseTo(109.2, 2)
    expect(c2.asomo).toBe(true)

    const c3 = calcularColumnasConAsomo(351, 4)
    expect(c3.ancho).toBeCloseTo(116.4, 2)
    expect(c3.asomo).toBe(true)

    const c4 = calcularColumnasConAsomo(370, 4)
    expect(c4.ancho).toBeCloseTo(124, 2)
    expect(c4.asomo).toBe(true)

    const c5 = calcularColumnasConAsomo(398, 4)
    expect(c5.ancho).toBeCloseTo(92, 2)
    expect(c5.asomo).toBe(true)

    const c6 = calcularColumnasConAsomo(318, 2)
    expect(c6.ancho).toBeCloseTo(86, 2)
    expect(c6.asomo).toBe(false)

    const c7 = calcularColumnasConAsomo(398, 2)
    expect(c7.ancho).toBeCloseTo(86, 2)
    expect(c7.asomo).toBe(false)

    const c8 = calcularColumnasConAsomo(318, 3)
    expect(c8.ancho).toBeCloseTo(103.2, 2)
    expect(c8.asomo).toBe(true)

    const c9 = calcularColumnasConAsomo(700, 12)
    expect(c9.ancho).toBeCloseTo(88.62, 2)
    expect(c9.asomo).toBe(true)

    const c10 = calcularColumnasConAsomo(318, 0)
    expect(c10.ancho).toBeCloseTo(86, 2)
    expect(c10.asomo).toBe(false)

    const c11 = calcularColumnasConAsomo(200, 6)
    expect(c11.ancho).toBeCloseTo(104, 2)
    expect(c11.asomo).toBe(true)

    // C12: el valor por defecto de minimo es 86 (con 72, (398, 4) no asomaba)
    const c12 = calcularColumnasConAsomo(398, 4)
    const c12Explicito = calcularColumnasConAsomo(398, 4, { minimo: 86 })
    expect(c12).toEqual(c12Explicito)
    expect(c12.asomo).toBe(true)
  })

  it('C13: BudgetBarChart.module.css y GoalsBarChart.module.css usan var(--columna-ancho y no tienen min-width: 82px', () => {
    const budgetCss = fs.readFileSync(path.join(SRC_DIR, 'pages/app/presupuestos/BudgetBarChart.module.css'), 'utf-8')
    const goalsCss = fs.readFileSync(path.join(SRC_DIR, 'pages/app/metas/GoalsBarChart.module.css'), 'utf-8')

    for (const [nombre, css] of [
      ['BudgetBarChart.module.css', budgetCss],
      ['GoalsBarChart.module.css', goalsCss],
    ] as const) {
      const colMatch = css.match(/\.columnWrapper\s*\{([^}]*)\}/)?.[1] ?? ''
      expect(colMatch, `${nombre} .columnWrapper debe usar var(--columna-ancho`).toContain('var(--columna-ancho')
      expect(css, `${nombre} no debe tener min-width: 82px`).not.toMatch(/min-width\s*:\s*82px/)
    }
  })
})
