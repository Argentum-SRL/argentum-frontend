import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ANALISIS_DIR = path.resolve(__dirname)

describe('TF1: Orden, componentes y textos de Análisis', () => {
  it('no contiene tcInlineBadge, promedio_gasto_ciclo ?? 0 ni "no se pudieron pasar"', () => {
    const files = fs.readdirSync(ANALISIS_DIR)
    const targetFiles = files.filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css')) &&
        !f.includes('.test.')
    )

    for (const f of targetFiles) {
      const content = fs.readFileSync(path.join(ANALISIS_DIR, f), 'utf-8')
      expect(content, `Archivo ${f} no debe contener tcInlineBadge`).not.toContain('tcInlineBadge')
      expect(
        content,
        `Archivo ${f} no debe contener promedio_gasto_ciclo ?? 0`
      ).not.toContain('promedio_gasto_ciclo ?? 0')
      expect(
        content,
        `Archivo ${f} no debe armar texto "no se pudieron pasar"`
      ).not.toContain('no se pudieron pasar')
    }
  })

  it('existen NumerosPrincipales.tsx, InformeEditor.tsx e InformeTarjeta.tsx', () => {
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'NumerosPrincipales.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'InformeEditor.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'InformeTarjeta.tsx'))).toBe(true)
  })

  it('src/services/analisis.service.ts no contiene PLANTILLAS_RAPIDAS y existe plantillasInforme.ts', () => {
    const servicePath = path.resolve(ANALISIS_DIR, '../../../services/analisis.service.ts')
    const serviceContent = fs.readFileSync(servicePath, 'utf-8')
    expect(serviceContent).not.toContain('PLANTILLAS_RAPIDAS')

    const plantillasPath = path.join(ANALISIS_DIR, 'plantillasInforme.ts')
    expect(fs.existsSync(plantillasPath)).toBe(true)
    const plantillasContent = fs.readFileSync(plantillasPath, 'utf-8')
    expect(plantillasContent).toContain('PLANTILLAS_RAPIDAS')
  })
})

describe('TF2: Límites de tamaño en Análisis', () => {
  function countLines(filename: string): number {
    const content = fs.readFileSync(path.join(ANALISIS_DIR, filename), 'utf-8')
    return content.split(/\r?\n/).length
  }

  it('MisInformesTab.tsx tiene como máximo 420 líneas', () => {
    const lines = countLines('MisInformesTab.tsx')
    expect(lines).toBeLessThanOrEqual(420)
  })

  it('InformeEditor.tsx tiene como máximo 400 líneas', () => {
    const lines = countLines('InformeEditor.tsx')
    expect(lines).toBeLessThanOrEqual(400)
  })

  it('InformeTarjeta.tsx tiene como máximo 400 líneas', () => {
    const lines = countLines('InformeTarjeta.tsx')
    expect(lines).toBeLessThanOrEqual(400)
  })

  it('AnalisisPage.tsx tiene como máximo 480 líneas', () => {
    const lines = countLines('AnalisisPage.tsx')
    expect(lines).toBeLessThanOrEqual(480)
  })

  it('FiltrosAnalisis.tsx tiene como máximo 320 líneas', () => {
    const lines = countLines('FiltrosAnalisis.tsx')
    expect(lines).toBeLessThanOrEqual(320)
  })

  it('DescargarAnalisisModal.tsx tiene como máximo 200 líneas', () => {
    const lines = countLines('DescargarAnalisisModal.tsx')
    expect(lines).toBeLessThanOrEqual(200)
  })

  it('EvolucionCiclosCard.tsx tiene como máximo 720 líneas', () => {
    const lines = countLines('EvolucionCiclosCard.tsx')
    expect(lines).toBeLessThanOrEqual(720)
  })
})
