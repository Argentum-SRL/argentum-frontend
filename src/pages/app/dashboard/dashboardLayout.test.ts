import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('DashboardPage topRow y BalanceCard layout consistente entre usuarios', () => {
  const rootDir = process.cwd()
  const parte1Path = path.resolve(rootDir, 'src/pages/app/dashboard/DashboardPage.parte1.css')
  const parte2Path = path.resolve(rootDir, 'src/pages/app/dashboard/DashboardPage.parte2.css')
  const parte3Path = path.resolve(rootDir, 'src/pages/app/dashboard/DashboardPage.parte3.css')
  const balanceCssPath = path.resolve(rootDir, 'src/components/dashboard/BalanceCard/BalanceCard.module.css')

  it('permite que BalanceCard determine el alto de .topRow sin recortar .trendsBar en usuarios con dólar', () => {
    const css = fs.readFileSync(parte1Path, 'utf-8')

    expect(css).toContain('grid-template-rows: minmax(230px, auto)')
    expect(css).not.toMatch(/\.topRowCompact\s*\{[^}]*max-height:\s*230px/)
    expect(css).not.toMatch(/\.topRowExpanded\s*\{[^}]*max-height:\s*425px/)

    const balanceOverrideMatch = css.match(/\.topRowCompact\s+\.balanceCardTopRow,\s*\.topRowExpanded\s+\.balanceCardTopRow\s*\{([^}]+)\}/)
    expect(balanceOverrideMatch).not.toBeNull()
    const balanceRules = balanceOverrideMatch![1]
    expect(balanceRules).toContain('height: auto')
    expect(balanceRules).toContain('min-height: 100%')
    expect(balanceRules).toContain('max-height: none')
    expect(balanceRules).not.toMatch(/transition:[^;]*\bheight\b/)
  })

  it('aísla las tarjetas adyacentes con contain: size para que no estiren la fila ni abran huecos en BalanceCard', () => {
    const css = fs.readFileSync(parte1Path, 'utf-8')

    const cardsMatch = css.match(/\.topRowCompact\s+\.card,\s*\.topRowExpanded\s+\.card\s*\{([^}]+)\}/)
    expect(cardsMatch).not.toBeNull()
    const cardRules = cardsMatch![1]
    expect(cardRules).toContain('contain: size')
    expect(cardRules).toContain('height: 100%')
    expect(cardRules).toContain('min-height: 0')
    expect(cardRules).toContain('overflow: hidden')

    const contentMatch = css.match(/\.topRowCompact\s+\.chartCardContent[\s\S]*?\.topRowExpanded\s+\.cardContent\s*\{([^}]+)\}/)
    expect(contentMatch).not.toBeNull()
    expect(contentMatch![1]).toContain('overflow: hidden')
    expect(contentMatch![1]).toContain('min-height: 0')
    expect(contentMatch![1]).toContain('flex: 1')

    expect(css).toMatch(/\.cardHeader\s*\{[^}]*flex-shrink:\s*0/)
    expect(css).toMatch(/\.cardHeaderWithToggle\s*\{[^}]*flex-shrink:\s*0/)
  })

  it('mantiene compactación interna de .saldosHero y .trendsBar al pie en BalanceCard', () => {
    const balanceCss = fs.readFileSync(balanceCssPath, 'utf-8')
    const heroMatch = balanceCss.match(/\.saldosHero\s*\{([^}]+)\}/)
    expect(heroMatch).not.toBeNull()
    expect(heroMatch![1]).toContain('justify-content: flex-start')
    expect(heroMatch![1]).not.toContain('space-between')

    const trendsMatch = balanceCss.match(/\.trendsBar\s*\{([^}]+)\}/)
    expect(trendsMatch).not.toBeNull()
    expect(trendsMatch![1]).toContain('margin-top: auto')
  })

  it('garantiza min-width: 0 y flex-shrink en cabeceras/barras para evitar desbordes horizontales', () => {
    const parte2 = fs.readFileSync(parte2Path, 'utf-8')
    const parte3 = fs.readFileSync(parte3Path, 'utf-8')

    expect(parte2).toMatch(/\.barContent\s*\{[^}]*min-width:\s*0/)
    expect(parte2).toMatch(/\.barAmount\s*\{[^}]*flex-shrink:\s*0/)
    expect(parte3).toMatch(/\.cardTitleContainer\s*\{[^}]*min-width:\s*0/)
  })
})

