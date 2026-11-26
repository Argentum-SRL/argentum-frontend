import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = path.resolve(__dirname, '../..')
const SRC_DIR = path.join(ROOT_DIR, 'src')

// Áreas cubiertas por este control; cada fase siguiente agrega su carpeta aquí.
const AREAS = [
  'src/components/layout',
  'src/components/tools',
  'src/pages/app/tools',
]

const CORTES_OFICIALES_ANCHO = new Set([
  'max 767.98',
  'min 768',
  'max 1023.98',
  'min 1024',
])

// Excepciones de letra < 11px documentadas con motivo (vacío en F2).
const EXCEPCIONES_LETRA: Record<string, string> = {}

function walkFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, exts, acc)
    else if (exts.some((ext) => entry.name.endsWith(ext))) acc.push(full)
  }
  return acc.sort()
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
}

interface CssBlock {
  selector: string
  rawBody: string
  cleanBody: string
  startLine: number
}

function extractCssBlocks(css: string, baseLine = 1): CssBlock[] {
  const blocks: CssBlock[] = []
  let i = 0
  const n = css.length
  const lineAt = (idx: number) => baseLine + css.slice(0, idx).split('\n').length - 1

  while (i < n) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    const open = css.indexOf('{', i)
    if (open === -1) break
    const selector = css.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()
    let depth = 1
    let j = open + 1
    while (j < n && depth > 0) {
      if (css[j] === '/' && css[j + 1] === '*') {
        const end = css.indexOf('*/', j + 2)
        j = end === -1 ? n : end + 2
        continue
      }
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const rawBody = css.slice(open + 1, j - 1)
    const bodyStartLine = lineAt(open + 1)
    if (selector.startsWith('@media') || selector.startsWith('@supports') || selector.startsWith('@container')) {
      blocks.push(...extractCssBlocks(rawBody, bodyStartLine))
    } else if (!selector.startsWith('@keyframes') && !selector.startsWith('@font-face')) {
      blocks.push({
        selector,
        rawBody,
        cleanBody: stripCssComments(rawBody),
        startLine: lineAt(i),
      })
    }
    i = j
  }
  return blocks
}

function loadTokens(): Map<string, string> {
  const tokens = new Map<string, string>()
  const tokensPath = path.join(SRC_DIR, 'styles', 'tokens.css')
  if (!fs.existsSync(tokensPath)) return tokens
  const clean = stripCssComments(fs.readFileSync(tokensPath, 'utf-8'))
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;}\n]+);/g)) {
    if (!tokens.has(m[1])) tokens.set(m[1], m[2].trim())
  }
  return tokens
}

function resolverTamanoMinPx(val: string, tokens: Map<string, string>): number | null {
  let v = val.trim()
  for (let k = 0; k < 4; k++) {
    v = v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (m, name, fb) => {
      return tokens.get(name) ?? (fb ? fb.trim() : m)
    })
  }
  const clampM = v.match(/^clamp\(\s*([^,]+),/)
  const target = clampM ? clampM[1].trim() : v
  const pxM = target.match(/^(-?[\d.]+)px$/i)
  if (pxM) return parseFloat(pxM[1])
  const remM = target.match(/^(-?[\d.]+)(rem|em)$/i)
  if (remM) return parseFloat(remM[1]) * 16
  return null
}

describe('Reglas responsive por área (AREAS)', () => {
  const tokens = loadTokens()
  const cssFiles = AREAS.flatMap((a) => walkFiles(path.join(ROOT_DIR, a), ['.css'])).sort()
  const tsxFiles = AREAS.flatMap((a) => walkFiles(path.join(ROOT_DIR, a), ['.tsx']))
    .filter((f) => !f.endsWith('.test.tsx') && !f.endsWith('.spec.tsx'))
    .sort()

  it('R1: ningún .css de AREAS tiene @media de ancho fuera de los oficiales (767.98 / 768 / 1023.98 / 1024)', () => {
    const ilegales: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const clean = stripCssComments(fs.readFileSync(abs, 'utf-8'))
      const re = /@media\s*([^{]+)\{/g
      let m: RegExpExecArray | null
      while ((m = re.exec(clean)) !== null) {
        const cond = m[1]
        if (/\bwidth\s*[<>]/.test(cond)) {
          ilegales.push(`${rel}: sintaxis de rango en @media ${cond.trim()}`)
        }
        for (const wm of cond.matchAll(/\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/gi)) {
          const key = `${wm[1].toLowerCase()} ${wm[2]}`
          if (!CORTES_OFICIALES_ANCHO.has(key)) {
            ilegales.push(`${rel}: @media ${cond.trim()}`)
          }
        }
      }
    }
    expect(ilegales).toEqual([])
  })

  it('R2: ninguna letra < 11px en .css ni en .tsx de AREAS, salvo EXCEPCIONES_LETRA con motivo', () => {
    const menores: string[] = []

    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'))
      for (const blk of blocks) {
        for (const fm of blk.cleanBody.matchAll(/font-size\s*:\s*([^;!}]+)/gi)) {
          const px = resolverTamanoMinPx(fm[1], tokens)
          if (px !== null && px < 11) {
            const key = `${rel}::${blk.selector}`
            if (!(key in EXCEPCIONES_LETRA)) {
              menores.push(`${rel} [${blk.selector}] -> font-size: ${fm[1].trim()} (${px}px)`)
            }
          }
        }
      }
    }

    for (const abs of tsxFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const lines = fs.readFileSync(abs, 'utf-8').split(/\r?\n/)
      lines.forEach((lineText, idx) => {
        const ln = idx + 1
        for (const m of lineText.matchAll(/\btext-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g)) {
          const val = parseFloat(m[1])
          const px = m[2] === 'px' ? val : val * 16
          if (px < 11) {
            const key = `${rel}:${ln}:${m[0]}`
            if (!(key in EXCEPCIONES_LETRA)) {
              menores.push(`${rel}:${ln} -> ${m[0]} (${px}px)`)
            }
          }
        }
        for (const m of lineText.matchAll(/fontSize\s*:\s*(?:['"](\d+(?:\.\d+)?)(px|rem|em)['"]|(\d+(?:\.\d+)?))/g)) {
          const val = parseFloat(m[1] ?? m[3])
          const unit = m[2] || 'px'
          const px = unit === 'px' ? val : val * 16
          if (px < 11) {
            const key = `${rel}:${ln}:${m[0]}`
            if (!(key in EXCEPCIONES_LETRA)) {
              menores.push(`${rel}:${ln} -> ${m[0]} (${px}px)`)
            }
          }
        }
      })
    }

    expect(menores).toEqual([])
  })

  it('R3: todo white-space: nowrap en .css y whitespace-nowrap en .tsx de AREAS cumple la regla', () => {
    const sinProteccion: string[] = []

    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const content = fs.readFileSync(abs, 'utf-8')
      const lines = content.split(/\r?\n/)
      const blocks = extractCssBlocks(content)
      for (const blk of blocks) {
        if (!/white-space\s*:\s*nowrap/i.test(blk.cleanBody)) continue
        if (/text-overflow\s*:\s*ellipsis/i.test(blk.cleanBody)) continue
        if (
          rel === 'src/pages/app/tools/ToolsPage.module.css' &&
          blk.selector === '.controlsRow .navCapsule [role="radio"]'
        ) {
          continue
        }

        const rawLines = blk.rawBody.split(/\r?\n/)
        const cleanLines = blk.cleanBody.split(/\r?\n/)
        for (let idx = 0; idx < cleanLines.length; idx++) {
          if (/white-space\s*:\s*nowrap/i.test(cleanLines[idx])) {
            const rawLine = rawLines[idx] ?? ''
            if (!/\/\*\s*nowrap-ok\s*:/.test(rawLine)) {
              const absLine = blk.startLine + idx
              sinProteccion.push(`${rel}:${absLine} [${blk.selector}] -> ${lines[absLine - 1]?.trim() ?? rawLine.trim()}`)
            }
          }
        }
      }
    }

    for (const abs of tsxFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const lines = fs.readFileSync(abs, 'utf-8').split(/\r?\n/)
      lines.forEach((lineText, idx) => {
        if (!/\bwhitespace-nowrap\b/.test(lineText)) return
        if (/\b(truncate|text-ellipsis)\b/.test(lineText)) return
        const prevLine = idx > 0 ? lines[idx - 1] : ''
        if (/\{\/\*\s*nowrap-ok\s*:/.test(prevLine)) return
        sinProteccion.push(`${rel}:${idx + 1} -> ${lineText.trim()}`)
      })
    }

    expect(sinProteccion).toEqual([])
  })

  it('R4: ningún 100vw en .css de AREAS', () => {
    const hallados: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const clean = stripCssComments(fs.readFileSync(abs, 'utf-8'))
      if (/\b100vw\b/i.test(clean)) {
        hallados.push(rel)
      }
    }
    expect(hallados).toEqual([])
  })
})
