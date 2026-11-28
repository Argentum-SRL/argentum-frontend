import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const ROOT_DIR = path.resolve(__dirname, '../..')
const SRC_DIR = path.join(ROOT_DIR, 'src')

// Lista cerrada de excepciones de cascada con motivo (esperada vacía).
const EXCEPCIONES_CASCADA: Record<string, string> = {}

function walkCssFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkCssFiles(full, acc)
    else if (entry.name.endsWith('.css')) acc.push(full)
  }
  return acc.sort()
}

interface LineOrigin {
  file: string
  line: number
}

/**
 * Une un archivo .css con los .parteN.css importados mediante @import en su orden real,
 * conservando el mapa línea combinada -> archivo y línea original.
 */
function cargarCssUnido(absPath: string, partesUsadas: Set<string>): { css: string; lineMap: LineOrigin[] } {
  const relMain = path.relative(ROOT_DIR, absPath).replace(/\\/g, '/')
  const mainLines = fs.readFileSync(absPath, 'utf-8').split(/\r?\n/)
  const mergedLines: string[] = []
  const lineMap: LineOrigin[] = []
  const importRe = /^\s*@import\s+['"](\.\/[^'"]+\.parte\d+\.css)['"]\s*;?\s*$/

  for (let i = 0; i < mainLines.length; i++) {
    const ln = mainLines[i]
    const match = ln.match(importRe)
    if (match) {
      const partRel = path.posix.join(path.posix.dirname(relMain), match[1])
      const partAbs = path.join(ROOT_DIR, partRel)
      if (fs.existsSync(partAbs)) {
        partesUsadas.add(partRel)
        const partLines = fs.readFileSync(partAbs, 'utf-8').split(/\r?\n/)
        for (let j = 0; j < partLines.length; j++) {
          mergedLines.push(partLines[j])
          lineMap.push({ file: partRel, line: j + 1 })
        }
        continue
      }
    }
    mergedLines.push(ln)
    lineMap.push({ file: relMain, line: i + 1 })
  }

  return { css: mergedLines.join('\n'), lineMap }
}

interface DeclItem {
  idx: number
  sel: string
  prop: string
  val: string
  important: boolean
  ctx: string
  file: string
  line: number
}

function detectarPisadasEnCss(css: string, fromRel: string, lineMap: LineOrigin[]): string[] {
  const root = postcss.parse(css, { from: fromRel })
  const decls: DeclItem[] = []
  let idx = 0

  root.walkDecls((decl) => {
    const rule = decl.parent
    if (!rule || rule.type !== 'rule') return
    const ctx: string[] = []
    let p = rule.parent
    while (p && p.type !== 'root') {
      if (p.type === 'atrule') ctx.unshift(`@${p.name} ${p.params}`)
      p = p.parent
    }
    if (ctx.some((c) => /^@(?:-webkit-)?keyframes\b/i.test(c))) return

    const mergedLine = decl.source?.start?.line ?? 1
    const origin = lineMap[mergedLine - 1] ?? { file: fromRel, line: mergedLine }
    for (const rawSel of rule.selectors) {
      decls.push({
        idx: idx++,
        sel: rawSel.replace(/\s+/g, ' ').trim(),
        prop: decl.prop.toLowerCase(),
        val: decl.value.trim(),
        important: Boolean(decl.important),
        ctx: ctx.join(' > '),
        file: origin.file,
        line: origin.line,
      })
    }
  })

  const hallazgos: string[] = []
  for (const a of decls) {
    if (!a.ctx || a.important || !/^@media\b/i.test(a.ctx)) continue
    const b = decls.find(
      (x) => x.idx > a.idx && x.sel === a.sel && x.prop === a.prop && x.ctx === ''
    )
    if (b && b.val !== a.val) {
      const clave = `${a.file}::${a.sel}::${a.prop}`
      if (clave in EXCEPCIONES_CASCADA) continue
      hallazgos.push(
        `${a.file}:${a.line} [${a.sel}] ${a.prop}: ${a.val} (${a.ctx}) pisada por ${b.file}:${b.line} (${b.val})`
      )
    }
  }

  return hallazgos
}

describe('Cascada de @media en CSS (FC1)', () => {
  it('ninguna declaración dentro de @media queda pisada por una declaración posterior fuera de @media del mismo selector y propiedad', () => {
    const todosCss = walkCssFiles(SRC_DIR)
    const partesUsadas = new Set<string>()
    const hallazgos: string[] = []

    // Primero analizar los archivos principales (uniendo sus .parteN.css en orden de @import)
    for (const absPath of todosCss) {
      const rel = path.relative(ROOT_DIR, absPath).replace(/\\/g, '/')
      if (/\.parte\d+\.css$/.test(rel)) continue
      const { css, lineMap } = cargarCssUnido(absPath, partesUsadas)
      hallazgos.push(...detectarPisadasEnCss(css, rel, lineMap))
    }

    // Respaldo: si quedara algún .parteN.css no importado, analizarlo también por separado
    for (const absPath of todosCss) {
      const rel = path.relative(ROOT_DIR, absPath).replace(/\\/g, '/')
      if (!/\.parte\d+\.css$/.test(rel) || partesUsadas.has(rel)) continue
      const lines = fs.readFileSync(absPath, 'utf-8').split(/\r?\n/)
      const lineMap = lines.map((_, i) => ({ file: rel, line: i + 1 }))
      hallazgos.push(...detectarPisadasEnCss(lines.join('\n'), rel, lineMap))
    }

    expect(hallazgos).toEqual([])
  })

  it('EXCEPCIONES_CASCADA se mantiene vacía', () => {
    expect(Object.keys(EXCEPCIONES_CASCADA)).toEqual([])
  })
})
