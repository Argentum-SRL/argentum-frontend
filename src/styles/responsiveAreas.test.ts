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
  'src/pages/app/analisis',
  'src/components/transacciones',
  'src/pages/app/transacciones',
  'src/components/transferencias',
  'src/pages/app/perfil',
  'src/components/perfil',
  'src/components/tarjetas',
]

const CORTES_OFICIALES_ANCHO = new Set([
  'max 767.98',
  'min 768',
  'max 1023.98',
  'min 1024',
])

// Excepciones de letra < 11px documentadas con motivo (vacío en F2).
const EXCEPCIONES_LETRA: Record<string, string> = {}

// Excepciones de toque F2/F3 (fuera de permitidas.txt en F4B; no editar F2/F3 desde F4B).
const EXCEPCIONES_TOQUE_F2_F3: Record<string, string> = {
  'src/components/tools/ToolsComponents.parte3.css::.fwDot::before': 'F2 fuera de permitidas en F4B (30x30 border 1.5px inset -7px = 41px)',
  'src/components/tools/ToolsComponents.parte3.css::.fwChip::before': 'F2 fuera de permitidas en F4B (H=40px border 1.5px inset -2px = 41px)',
  'src/components/tools/importacion/ModalesImportacion.module.css::.cancelImportBtn::before': 'F2 fuera de permitidas en F4B (H=38px border 1px inset -3px = 42px)',
  'src/components/tools/importacion/ModalesImportacion.module.css::.radioPill::before': 'F2 fuera de permitidas en F4B (H=38px border 1px inset -3px = 42px)',
  'src/pages/app/analisis/AnalisisPage.module.css::.mobileFilterBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/pages/app/analisis/AnalisisPage.module.css::.mobileActionBtn::before': 'F3 fuera de permitidas en F4B (36x36 border 1px inset -4px = 42px)',
  'src/pages/app/analisis/DesgloseCategoriasCard.module.css::.backBtn::before': 'F3 fuera de permitidas en F4B (38x38 border 1px inset -3px = 42px)',
  'src/pages/app/analisis/EditorSeriesEvolucionModal.module.css::.addWholeCatBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/pages/app/analisis/EditorSeriesEvolucionModal.module.css::.splitSubsBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/pages/app/analisis/EditorSeriesEvolucionModal.module.css::.removeChipBtn::before': 'F3 fuera de permitidas en F4B (26x26 border 1px inset -9px = 42px)',
  'src/pages/app/analisis/EvolucionCiclosCard.module.css::.editSeriesQuickBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/pages/app/analisis/FiltrosAnalisis.module.css::.viewTileBtn::before': 'F3 fuera de permitidas en F4B (H=38px border 1px inset -3px = 42px)',
  'src/pages/app/analisis/MisInformesTab.module.css::.iconActionBtn::before': 'F3 fuera de permitidas en F4B (30x30 border 1px inset -7px -3px = 34x42)',
  'src/pages/app/analisis/MisInformesTab.module.css::.iconActionBtnDanger::before': 'F3 fuera de permitidas en F4B (30x30 border 1px inset -7px -3px = 34x42)',
  'src/pages/app/analisis/MisInformesTab.module.css::.templateBtnSecondary::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/pages/app/analisis/MisInformesTab.module.css::.backBtn::before': 'F3 fuera de permitidas en F4B (@media móvil H=32px border 1px inset -6px = 42px)',
  'src/pages/app/analisis/MisInformesTab.module.css::.viewerBackBtn::before': 'F3 fuera de permitidas en F4B (@media móvil H=32px border 1px inset -6px = 42px)',
  'src/components/transacciones/FilterBar.parte1.css::.mobileFilterBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/components/transacciones/FilterBar.parte1.css::.mobileSearchTriggerBtn::before': 'F3 fuera de permitidas en F4B (36x36 border 1px inset -4px = 42px)',
  'src/components/transacciones/GruposCuotasTab.parte1.css::.mobileSearchTriggerBtn::before': 'F3 fuera de permitidas en F4B (36x36 border 1px inset -4px = 42px)',
  'src/components/transacciones/TransaccionModal.parte1.css::.deleteHeaderBtn::before': 'F3 fuera de permitidas en F4B (32x32 inset -6px -4px = 40x44)',
  'src/components/transacciones/TransaccionModal.parte1.css::.backBtn::before': 'F3 fuera de permitidas en F4B (32x32 inset -6px -4px = 40x44)',
  'src/components/transacciones/TransaccionModal.parte1.css::.closeBtn::before': 'F3 fuera de permitidas en F4B (32x32 inset -4px = 40x40)',
  'src/components/transacciones/TransaccionModal.parte3.css::.stepperBtn::before': 'F3 fuera de permitidas en F4B (32x32 border 1px inset -6px = 42px)',
  'src/components/transferencias/TransferenciasFilterBar.module.css::.mobileFilterBtn::before': 'F3 fuera de permitidas en F4B (H=36px border 1px inset -4px = 42px)',
  'src/components/transferencias/TransferenciasFilterBar.module.css::.mobileSearchTriggerBtn::before': 'F3 fuera de permitidas en F4B (36x36 border 1px inset -4px = 42px)',
}

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
  media: string
}

function extractCssBlocks(css: string, baseLine = 1, media = 'base'): CssBlock[] {
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
      const childMedia = media === 'base' ? selector : `${media} | ${selector}`
      blocks.push(...extractCssBlocks(rawBody, bodyStartLine, childMedia))
    } else if (!selector.startsWith('@keyframes') && !selector.startsWith('@font-face')) {
      blocks.push({
        selector,
        rawBody,
        cleanBody: stripCssComments(rawBody),
        startLine: lineAt(i),
        media,
      })
    }
    i = j
  }
  return blocks
}

function parsePxProp(body: string, propName: string): number | null {
  const re = new RegExp(`(?:^|[;\\s])${propName}\\s*:\\s*([^;!}]+)`, 'gi')
  let last: number | null = null
  for (const m of body.matchAll(re)) {
    const val = m[1].trim()
    const px = val.match(/^(-?[\d.]+)px$/i)
    last = px ? parseFloat(px[1]) : (/^0$/.test(val) ? 0 : null)
  }
  return last
}

function parseBorderPx(body: string): { h: number; v: number } {
  let b = 0
  for (const m of body.matchAll(/(?:^|[;\s])border\s*:\s*([^;!}]+)/gi)) {
    const val = m[1].trim()
    if (/^(none|0)$/i.test(val)) b = 0
    else {
      const px = val.match(/(?:^|\s)([\d.]+)px(?:\s|$)/i)
      if (px) b = parseFloat(px[1])
    }
  }
  for (const m of body.matchAll(/(?:^|[;\s])border-width\s*:\s*([^;!}]+)/gi)) {
    const px = m[1].trim().match(/^([\d.]+)px$/i)
    if (px) b = parseFloat(px[1])
  }
  return { h: b * 2, v: b * 2 }
}

function parseInsetSides(val: string): { top: number; right: number; bottom: number; left: number } | null {
  const parts = val.trim().split(/\s+/).map((p) => {
    const m = p.match(/^(-?[\d.]+)px$/i)
    if (m) return parseFloat(m[1])
    if (/^0$/.test(p)) return 0
    return null
  })
  if (parts.some((p) => p === null)) return null
  const nums = parts as number[]
  if (nums.length === 1) return { top: nums[0], right: nums[0], bottom: nums[0], left: nums[0] }
  if (nums.length === 2) return { top: nums[0], right: nums[1], bottom: nums[0], left: nums[1] }
  if (nums.length === 3) return { top: nums[0], right: nums[1], bottom: nums[2], left: nums[1] }
  if (nums.length === 4) return { top: nums[0], right: nums[1], bottom: nums[2], left: nums[3] }
  return null
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

  it('R5: áreas de toque con ::before/::after alcanzan >= 44px considerando borde', () => {
    const insuficientes: string[] = []

    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'))

      const baseBySel = new Map<string, CssBlock[]>()
      const touchBySelMedia = new Map<string, CssBlock>()
      const mediaList = new Set<string>(['base'])

      for (const blk of blocks) {
        mediaList.add(blk.media)
        for (const rawSel of blk.selector.split(',')) {
          const sel = rawSel.trim()
          if (sel.includes('::before') || sel.includes('::after')) {
            const insM = blk.cleanBody.match(/inset\s*:\s*([^;!}]+)/i)
            if (insM && /-\d/.test(insM[1])) {
              touchBySelMedia.set(`${sel}@@${blk.media}`, { ...blk, selector: sel })
            }
          } else {
            const list = baseBySel.get(sel) ?? []
            list.push(blk)
            baseBySel.set(sel, list)
          }
        }
      }

      const checked = new Set<string>()
      for (const [key, tBlk] of touchBySelMedia.entries()) {
        const sepIdx = key.lastIndexOf('@@')
        const sel = key.slice(0, sepIdx)
        const baseSel = sel.replace(/::(?:before|after).*$/, '').trim()
        const baseBlocks = baseBySel.get(baseSel) ?? []
        const evalMedias = tBlk.media === 'base' ? Array.from(mediaList) : [tBlk.media]

        for (const m of evalMedias) {
          const overrideKey = `${sel}@@${m}`
          if (m !== tBlk.media && touchBySelMedia.has(overrideKey)) continue
          let combinedBody = ''
          for (const bb of baseBlocks) {
            if (bb.media === 'base') combinedBody += `${bb.cleanBody}\n`
          }
          if (m !== 'base') {
            let hasInMedia = false
            for (const bb of baseBlocks) {
              if (bb.media === m) {
                combinedBody += `${bb.cleanBody}\n`
                hasInMedia = true
              }
            }
            if (!hasInMedia && tBlk.media === 'base') continue
          }

          const insM = tBlk.cleanBody.match(/inset\s*:\s*([^;!}]+)/i)
          if (!insM) continue
          const ins = parseInsetSides(insM[1])
          if (!ins) continue

          const w = parsePxProp(combinedBody, 'width')
          const h = parsePxProp(combinedBody, 'height')
          const bw = parseBorderPx(combinedBody)
          const hasToqueOk = /toque-ok\s*:/.test(tBlk.rawBody)
          const exKey = `${rel}::${sel}`
          if (exKey in EXCEPCIONES_TOQUE_F2_F3) continue

          const effW = w !== null ? w - bw.h + -ins.left + -ins.right : null
          const effH = h !== null ? h - bw.v + -ins.top + -ins.bottom : null
          const badW = effW !== null && effW < 44 && !hasToqueOk
          const badH = effH !== null && effH < 44
          if (badW || badH) {
            const dup = `${rel}:${tBlk.startLine}:${sel}:${m}`
            if (!checked.has(dup)) {
              checked.add(dup)
              insuficientes.push(
                `${rel}:${tBlk.startLine} [${sel}] (${m}) -> W=${effW ?? '?'} H=${effH ?? '?'}`
              )
            }
          }
        }
      }
    }

    expect(insuficientes).toEqual([])
  })

  it('R6: en celular (max-width: 767.98px), ninguna cabecera de modal/sección borra padding horizontal', () => {
    const hallados: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'))
      for (const blk of blocks) {
        if (!/max-width\s*:\s*767\.98px/i.test(blk.media)) continue
        const esHeader = blk.selector
          .split(',')
          .some((s) => /\.(formHeader|modalHeader|header)\b/.test(s.trim()))
        if (!esHeader) continue

        for (const m of blk.cleanBody.matchAll(/(?:^|[;\s])(padding|padding-left|padding-right|padding-inline)\s*:\s*([^;!}]+)/gi)) {
          const prop = m[1].toLowerCase()
          const val = m[2].trim()
          let zeroH = false
          if (prop === 'padding-left' || prop === 'padding-right' || prop === 'padding-inline') {
            if (/^0(?:px|rem|em)?$/i.test(val)) zeroH = true
          } else {
            const parts = val.split(/\s+/)
            if ((parts.length === 2 || parts.length === 3) && /^0(?:px|rem|em)?$/i.test(parts[1])) zeroH = true
            if (parts.length === 4 && (/^0(?:px|rem|em)?$/i.test(parts[1]) || /^0(?:px|rem|em)?$/i.test(parts[3]))) zeroH = true
          }
          if (zeroH) {
            hallados.push(`${rel}:${blk.startLine} [${blk.selector}] -> ${prop}: ${val}`)
          }
        }
      }
    }
    expect(hallados).toEqual([])
  })
})
