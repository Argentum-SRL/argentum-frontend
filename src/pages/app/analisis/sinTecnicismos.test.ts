import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('sinTecnicismos: verificación estática de textos en Análisis (N-8)', () => {
  const analisisDir = path.resolve(process.cwd(), 'src/pages/app/analisis')
  const files = fs
    .readdirSync(analisisDir)
    .filter((f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.'))

  const FORBIDDEN_RULES: Array<{ nombre: string; regex: RegExp }> = [
    { nombre: 'KPI', regex: /\bkpi\b/i },
    { nombre: 'Delta', regex: /\bdeltas?\b/i },
    { nombre: 'espejo', regex: /\bespejos?\b/i },
    { nombre: 'drill-down', regex: /drill-down/i },
    { nombre: 'Naturaleza', regex: /naturaleza\s+de\s+gasto/i },
    { nombre: 'Auditoría', regex: /auditor[ií]a/i },
    { nombre: 'Ejecutivo', regex: /ejecutivo/i },
    { nombre: 'Panel de Control', regex: /panel\s+de\s+control/i },
    { nombre: 'Ventana de ciclos', regex: /ventana\s+de\s+ciclos/i },
    { nombre: 'Variación Neta', regex: /variaci[oó]n\s+neta/i },
    { nombre: 'Flujo neto', regex: /flujo\s+neto/i },
    { nombre: 'Balance Neto', regex: /balance\s+neto/i },
    { nombre: 'TC ', regex: /\btc\s+/i },
    { nombre: 'mayor alivio', regex: /mayor\s+alivio/i },
  ]

  it('no contiene tecnicismos prohibidos en ningún archivo .tsx o .ts de Análisis', () => {
    const hallazgos: Array<{ archivo: string; regla: string; coincidencia: string }> = []

    for (const file of files) {
      const fullPath = path.join(analisisDir, file)
      const content = fs.readFileSync(fullPath, 'utf-8')

      for (const rule of FORBIDDEN_RULES) {
        const match = content.match(rule.regex)
        if (match) {
          hallazgos.push({
            archivo: file,
            regla: rule.nombre,
            coincidencia: match[0],
          })
        }
      }
    }

    expect(hallazgos).toEqual([])
  })

  it('detecta Tabla de Deltas si se reintroduce (mutación M10)', () => {
    const fakeContent = '<div>Tabla de Deltas</div>'
    const deltaRule = FORBIDDEN_RULES.find((r) => r.nombre === 'Delta')!
    expect(deltaRule.regex.test(fakeContent)).toBe(true)
  })
})
