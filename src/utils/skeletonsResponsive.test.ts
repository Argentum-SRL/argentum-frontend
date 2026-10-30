import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Skeletons responsive y mirroring (fase_g3_skeletons_responsive)', () => {
  const rootDir = process.cwd()

  it('Skeleton.module.css define guardrail universal en .skeleton (max-width: 100% y box-sizing: border-box)', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    // Extraer bloque .skeleton
    const skeletonBlockMatch = content.match(/\.skeleton\s*\{([^}]+)\}/)
    expect(skeletonBlockMatch).not.toBeNull()
    const skeletonRules = skeletonBlockMatch![1]
    expect(skeletonRules).toContain('max-width: 100%')
    expect(skeletonRules).toContain('box-sizing: border-box')
  })

  it('Skeleton.module.css oculta cuotasMetricsBar en mobile y usa minmax(0, 1fr) en desktop para evitar desbordes', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    // cuotasMetricsBar debe ser display: none por defecto (mobile) y display: grid solo en min-width: 768px
    const cuotasBlock = content.match(/\.cuotasMetricsBar\s*\{([^}]+)\}/)
    expect(cuotasBlock).not.toBeNull()
    expect(cuotasBlock![1]).toContain('display: none')

    // Desktop media query con repeat(3, minmax(0, 1fr))
    expect(content).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  })

  it('Skeleton.module.css define min-width: 0 y overflow: hidden en cuotasMetricItem', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    const itemBlock = content.match(/\.cuotasMetricItem\s*\{([^}]+)\}/)
    expect(itemBlock).not.toBeNull()
    expect(itemBlock![1]).toContain('min-width: 0')
    expect(itemBlock![1]).toContain('overflow: hidden')
  })

  it('Skeleton.module.css no contiene anchos fijos rígidos en px mayores a 100px', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    const fixedWidthRegex = /(?:^|[^-])\bwidth:\s*(\d+)px/g
    const matches: { full: string; px: number }[] = []
    let match
    while ((match = fixedWidthRegex.exec(content)) !== null) {
      const px = parseInt(match[1], 10)
      if (px > 100) {
        matches.push({ full: match[0], px })
      }
    }

    expect(matches).toHaveLength(0)
  })

  it('Skeleton.module.css define clases para mirroring de las tarjetas principales', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const content = fs.readFileSync(cssPath, 'utf-8')

    expect(content).toContain('.balanceCardSkeleton')
    expect(content).toContain('.dashboardListSkeleton')
    expect(content).toContain('.proyeccionCardSkeleton')
    expect(content).toContain('.wizardSkeletonWrapper')
    expect(content).toContain('.comerciosSkeletonWrapper')
    expect(content).toContain('.seguridadSkeletonWrapper')
  })

  it('Skeleton.tsx exporta todos los componentes de skeleton estructurados', () => {
    const tsxPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.tsx')
    const content = fs.readFileSync(tsxPath, 'utf-8')

    expect(content).toContain('export const Skeleton')
    expect(content).toContain('export const BalanceCardSkeleton')
    expect(content).toContain('export const DashboardListSkeleton')
    expect(content).toContain('export const ProyeccionCardSkeleton')
    expect(content).toContain('export const ConvenienciaWizardSkeleton')
    expect(content).toContain('export const ComerciosRecordadosSkeleton')
    expect(content).toContain('export const PerfilSeguridadSkeleton')
  })

  it('ProyeccionCard.tsx no retorna null durante estado de carga (evita CLS)', () => {
    const cardPath = path.resolve(rootDir, 'src/components/dashboard/ProyeccionCard/ProyeccionCard.tsx')
    const content = fs.readFileSync(cardPath, 'utf-8')

    expect(content).toContain('<ProyeccionCardSkeleton />')
    expect(content).not.toMatch(/if\s*\(\s*loading\s*\)\s*return\s*null/)
  })

  it('ComerciosRecordados.tsx utiliza ComerciosRecordadosSkeleton en lugar de texto plano', () => {
    const filePath = path.resolve(rootDir, 'src/pages/app/perfil/components/ComerciosRecordados.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('<ComerciosRecordadosSkeleton')
    expect(content).not.toContain('<span>Cargando...</span>')
  })

  it('DashboardPage.tsx utiliza BalanceCardSkeleton y DashboardListSkeleton', () => {
    const filePath = path.resolve(rootDir, 'src/pages/app/dashboard/DashboardPage.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('BalanceCardSkeleton')
    expect(content).toContain('DashboardListSkeleton')
    expect(content).not.toContain('const BalanceSkeleton =')
    expect(content).not.toContain('const ListSkeleton =')
  })

  it('BilleterasPage.tsx utiliza CardsGridSkeleton en lugar de SkeletonGrid ad-hoc', () => {
    const filePath = path.resolve(rootDir, 'src/pages/app/billeteras/BilleterasPage.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('CardsGridSkeleton')
    expect(content).not.toContain('const SkeletonGrid =')
  })

  it('ToolsPage.tsx utiliza ConvenienciaWizardSkeleton durante ipcLoading', () => {
    const filePath = path.resolve(rootDir, 'src/pages/app/tools/ToolsPage.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('ConvenienciaWizardSkeleton')
  })

  it('TabSeguridad.tsx expone estado skeleton cuando loadingMetodos es true', () => {
    const filePath = path.resolve(rootDir, 'src/pages/app/perfil/components/TabSeguridad.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')

    expect(content).toContain('loadingMetodos')
    expect(content).toContain('PerfilSeguridadSkeleton')
  })

  it('TransaccionesPage.tsx y VinculacionWhatsAppCard.tsx usan anchos responsivos y relativos', () => {
    const txPath = path.resolve(rootDir, 'src/pages/app/transacciones/TransaccionesPage.tsx')
    const txContent = fs.readFileSync(txPath, 'utf-8')
    expect(txContent).not.toMatch(/<Skeleton\s+variant="text"\s+width=\{110\}/)

    const wppPath = path.resolve(rootDir, 'src/components/whatsapp/VinculacionWhatsAppCard.tsx')
    const wppContent = fs.readFileSync(wppPath, 'utf-8')
    expect(wppContent).not.toMatch(/<Skeleton\s+variant="text"\s+width=\{220\}/)
    expect(wppContent).not.toMatch(/<Skeleton\s+variant="rounded"\s+width=\{200\}/)
  })

  it('Skeleton.module.css y Skeleton.tsx previenen desbordes en Presupuestos y PerfilSeguridad', () => {
    const cssPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.module.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')
    expect(cssContent).toContain('.seguridadGridSkeleton')
    expect(cssContent).toContain('.seguridadCardSkeleton')
    expect(cssContent).toContain('.seguridadRowSkeleton')

    const tsxPath = path.resolve(rootDir, 'src/components/ui/Skeleton/Skeleton.tsx')
    const tsxContent = fs.readFileSync(tsxPath, 'utf-8')
    // No debe haber anidamiento redundante de presupuestosWrapper
    expect(tsxContent).not.toContain('<div className={styles.presupuestosWrapper}>\n        {Array.from({ length: count })')
    expect(tsxContent).not.toContain('<div className={styles.presupuestosWrapper}>\r\n        {Array.from({ length: count })')
    // PerfilSeguridadSkeleton debe renderizar la grilla responsive
    expect(tsxContent).toContain('styles.seguridadGridSkeleton')
  })

  it('Banners y botones de remocion/cierre en toda la app definen contencion y redondez 50%', () => {
    // Importacion de resumen removeFileBtn es redondo (border-radius: 50%)
    const importCss = fs.readFileSync(path.resolve(rootDir, 'src/components/tools/importacion/ImportacionResumenSection.module.css'), 'utf-8')
    expect(importCss).toMatch(/\.removeFileBtn\s*\{[^}]*border-radius:\s*50%/)

    // Banners en transacciones, presupuestos y tarjetas definen box-sizing: border-box
    const txCss = fs.readFileSync(path.resolve(rootDir, 'src/pages/app/transacciones/TransaccionesPage.module.css'), 'utf-8')
    expect(txCss).toMatch(/\.pendientesBanner\s*\{[^}]*box-sizing:\s*border-box/)

    const cardCss = fs.readFileSync(path.resolve(rootDir, 'src/components/tarjetas/TarjetaSummary.module.css'), 'utf-8')
    expect(cardCss).toMatch(/\.resumenImpagoBanner\s*\{[^}]*box-sizing:\s*border-box/)

    const presupuestosCss = fs.readFileSync(path.resolve(rootDir, 'src/pages/app/presupuestos/PresupuestosPage.module.css'), 'utf-8')
    expect(presupuestosCss).toMatch(/\.suggestionBanner\s*\{[^}]*box-sizing:\s*border-box/)
  })
})
