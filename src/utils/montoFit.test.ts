import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { elegirFormatoMonto } from './montoFit'

const SRC_DIR = path.resolve(__dirname, '..')

describe('MontoFit y elegirFormatoMonto (FS2B)', () => {
  it('M1: elegirFormatoMonto decide completo o corto con tolerancia de 0.5px', () => {
    expect(elegirFormatoMonto(100, 99)).toBe('completo')
    expect(elegirFormatoMonto(100, 100)).toBe('completo')
    expect(elegirFormatoMonto(100, 100.4)).toBe('completo')
    expect(elegirFormatoMonto(100, 101)).toBe('corto')
    expect(elegirFormatoMonto(0, 50)).toBe('completo')
    expect(elegirFormatoMonto(-1, 50)).toBe('completo')
  })

  it('M2: MontoFit.tsx usa title y aria-label con completo, un único ResizeObserver y base sin ellipsis', () => {
    const tsx = fs.readFileSync(path.join(SRC_DIR, 'components/ui/MontoFit/MontoFit.tsx'), 'utf-8')
    const css = fs.readFileSync(path.join(SRC_DIR, 'components/ui/MontoFit/MontoFit.module.css'), 'utf-8')

    expect(tsx).toMatch(/title=\{completo\}/)
    expect(tsx).toMatch(/aria-label=\{completo\}/)

    const observerMatches = tsx.match(/new\s+ResizeObserver/g) ?? []
    expect(observerMatches).toHaveLength(1)

    const baseBlock = css.match(/\.contenedor\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(baseBlock).not.toMatch(/text-overflow\s*:\s*ellipsis/i)
  })

  it('M3: BudgetBarChart, GoalsBarChart, NumerosPrincipales, ViewerKpisBlock y EvolucionCiclosCard usan MontoFit sin formatCompact', () => {
    const budgetTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/app/presupuestos/BudgetBarChart.tsx'), 'utf-8')
    const goalsTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/app/metas/GoalsBarChart.tsx'), 'utf-8')
    const numerosTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/app/analisis/NumerosPrincipales.tsx'), 'utf-8')
    const viewerTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/app/analisis/ViewerKpisBlock.tsx'), 'utf-8')
    const evolucionTsx = fs.readFileSync(path.join(SRC_DIR, 'pages/app/analisis/EvolucionCiclosCard.tsx'), 'utf-8')

    expect(budgetTsx).not.toMatch(/function\s+formatCompact\b/)
    expect(goalsTsx).not.toMatch(/function\s+formatCompact\b/)
    expect(budgetTsx).toContain('MontoFit')
    expect(goalsTsx).toContain('MontoFit')
    expect(numerosTsx).toContain('MontoFit')
    expect(viewerTsx).toContain('MontoFit')
    expect(evolucionTsx).toContain('MontoFit')
  })

  it('M4: PageSummaryBar.tsx declara valorCorto y usa MontoFit; PageSummaryBar.module.css no tiene ellipsis en .value ni .stripValue', () => {
    const tsx = fs.readFileSync(path.join(SRC_DIR, 'components/ui/PageSummaryBar/PageSummaryBar.tsx'), 'utf-8')
    const css = fs.readFileSync(path.join(SRC_DIR, 'components/ui/PageSummaryBar/PageSummaryBar.module.css'), 'utf-8')

    expect(tsx).toMatch(/valorCorto\?\s*:\s*string/)
    expect(tsx).toContain('MontoFit')

    const valueBlock = css.match(/\.value\s*\{([^}]*)\}/)?.[1] ?? ''
    const valueHighlightBlock = css.match(/\.valueHighlight\s*\{([^}]*)\}/)?.[1] ?? ''
    const stripValueBlock = css.match(/\.stripValue\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(valueBlock).not.toMatch(/text-overflow\s*:\s*ellipsis/i)
    expect(valueHighlightBlock).not.toMatch(/text-overflow\s*:\s*ellipsis/i)
    expect(stripValueBlock).not.toMatch(/text-overflow\s*:\s*ellipsis/i)
  })

  it('M5: Todas las pantallas de resumen pasan valorCorto y formatMontoCorto a PageSummaryBar', () => {
    const pantallas = [
      'pages/app/analisis/NumerosPrincipales.tsx',
      'pages/app/analisis/ViewerKpisBlock.tsx',
      'pages/app/billeteras/BilleterasPage.tsx',
      'pages/app/presupuestos/PresupuestosPage.tsx',
      'pages/app/metas/MetasPage.tsx',
      'pages/app/suscripciones/SuscripcionesPage.tsx',
      'pages/app/transacciones/TransaccionesPage.tsx',
    ]

    for (const rel of pantallas) {
      const content = fs.readFileSync(path.join(SRC_DIR, rel), 'utf-8')
      expect(content, `${rel} debe contener valorCorto`).toContain('valorCorto')
      expect(content, `${rel} debe contener formatMontoCorto`).toContain('formatMontoCorto')
    }
  })

  it('M6: SuscripcionModal.tsx usa MontoFit para equivalenteMonto', () => {
    const tsx = fs.readFileSync(path.join(SRC_DIR, 'components/suscripciones/SuscripcionModal.tsx'), 'utf-8')
    expect(tsx).toContain('MontoFit')
    expect(tsx).toContain('formatMontoCorto')
    expect(tsx).toMatch(/equivalenteMonto[\s\S]{0,200}MontoFit/)
  })

  it('M7: BudgetBarChart.module.css y GoalsBarChart.module.css usan line-clamp 2 sin white-space: nowrap en .budgetName', () => {
    const budgetCss = fs.readFileSync(path.join(SRC_DIR, 'pages/app/presupuestos/BudgetBarChart.module.css'), 'utf-8')
    const goalsCss = fs.readFileSync(path.join(SRC_DIR, 'pages/app/metas/GoalsBarChart.module.css'), 'utf-8')

    for (const [nombre, css] of [
      ['BudgetBarChart.module.css', budgetCss],
      ['GoalsBarChart.module.css', goalsCss],
    ] as const) {
      const block = css.match(/\.budgetName\s*\{([^}]*)\}/)?.[1] ?? ''
      expect(block, `${nombre} .budgetName debe usar line-clamp: 2`).toMatch(/line-clamp\s*:\s*2/i)
      expect(block, `${nombre} .budgetName no debe tener white-space: nowrap`).not.toMatch(/white-space\s*:\s*nowrap/i)
    }
  })
})
