import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const UI_DIR = path.resolve(__dirname)

const CORTES_OFICIALES_ANCHO = new Set([
  'max 767.98',
  'min 768',
  'max 1023.98',
  'min 1024',
])

// Única excepción de letra < 11px: letra de respaldo dentro de un ícono de 16px (<= 20px), no es texto de lectura.
const EXCEPCIONES_LETRA_CHICA = new Set([
  'CategoriaIcon.module.css::.size16 .fallbackText',
])

function walkCssFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkCssFiles(full, acc)
    else if (entry.name.endsWith('.css')) acc.push(full)
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
    if (selector.startsWith('@media') || selector.startsWith('@supports')) {
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

function extractMediaBlock(css: string, headerRe: RegExp): string {
  const clean = stripCssComments(css)
  const m = headerRe.exec(clean)
  if (!m) return ''
  let depth = 1
  let i = m.index + m[0].length
  while (i < clean.length && depth > 0) {
    if (clean[i] === '{') depth++
    else if (clean[i] === '}') depth--
    i++
  }
  return clean.slice(m.index + m[0].length, i - 1)
}

function resolverTamanoMinPx(val: string): number | null {
  const v = val.trim()
  const clampM = v.match(/^clamp\(\s*([^,]+),/)
  const target = clampM ? clampM[1].trim() : v
  const pxM = target.match(/^(-?[\d.]+)px$/i)
  if (pxM) return parseFloat(pxM[1])
  const remM = target.match(/^(-?[\d.]+)(rem|em)$/i)
  if (remM) return parseFloat(remM[1]) * 16
  return null
}

describe('Reglas responsive de componentes compartidos src/components/ui (F1)', () => {
  const cssFiles = walkCssFiles(UI_DIR)

  it('U1: ningún .css de src/components/ui tiene @media de ancho fuera de los oficiales (767.98 / 768 / 1023.98 / 1024)', () => {
    const ilegales: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(UI_DIR, abs).replace(/\\/g, '/')
      const clean = stripCssComments(fs.readFileSync(abs, 'utf-8'))
      const re = /@media\s*([^{]+)\{/g
      let m: RegExpExecArray | null
      while ((m = re.exec(clean)) !== null) {
        const cond = m[1]
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

  it('U2: ningún font-size menor a 11px en .css de src/components/ui, salvo la excepción documentada', () => {
    const menores: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(UI_DIR, abs).replace(/\\/g, '/')
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'))
      for (const blk of blocks) {
        for (const fm of blk.cleanBody.matchAll(/font-size\s*:\s*([^;!}]+)/gi)) {
          const px = resolverTamanoMinPx(fm[1])
          if (px !== null && px < 11) {
            const key = `${rel}::${blk.selector}`
            if (!EXCEPCIONES_LETRA_CHICA.has(key)) {
              menores.push(`${rel} [${blk.selector}] -> font-size: ${fm[1].trim()} (${px}px)`)
            }
          }
        }
      }
    }
    expect(menores).toEqual([])
  })

  it('U3: todo white-space: nowrap en src/components/ui tiene text-overflow: ellipsis, comentario nowrap-ok:, o pertenece a Modal.module.css/ModalFooter', () => {
    const sinProteccion: string[] = []
    for (const abs of cssFiles) {
      const rel = path.relative(UI_DIR, abs).replace(/\\/g, '/')
      if (rel === 'Modal/Modal.module.css' || rel === 'Modal/ModalFooter.module.css') continue
      const content = fs.readFileSync(abs, 'utf-8')
      const lines = content.split(/\r?\n/)
      const blocks = extractCssBlocks(content)
      for (const blk of blocks) {
        if (!/white-space\s*:\s*nowrap/i.test(blk.cleanBody)) continue
        const hasEllipsis = /text-overflow\s*:\s*ellipsis/i.test(blk.cleanBody)
        if (hasEllipsis) continue

        // Verificar que cada línea con white-space: nowrap dentro del bloque tenga /* nowrap-ok: ... */
        const rawLines = blk.rawBody.split(/\r?\n/)
        const cleanLines = blk.cleanBody.split(/\r?\n/)
        let allMarkedOk = true
        for (let idx = 0; idx < cleanLines.length; idx++) {
          if (/white-space\s*:\s*nowrap/i.test(cleanLines[idx])) {
            const rawLine = rawLines[idx] ?? ''
            if (!/\/\*\s*nowrap-ok\s*:/.test(rawLine)) {
              allMarkedOk = false
              const absLine = blk.startLine + idx
              sinProteccion.push(`${rel}:${absLine} [${blk.selector}] -> ${lines[absLine - 1]?.trim() ?? rawLine.trim()}`)
            }
          }
        }
        if (!allMarkedOk && sinProteccion.length === 0) {
          sinProteccion.push(`${rel} [${blk.selector}]`)
        }
      }
    }
    expect(sinProteccion).toEqual([])
  })

  it('U4: Modal.module.css define .closeButton::before con inset: -6px para alcanzar 44px táctiles', () => {
    const modalCss = stripCssComments(fs.readFileSync(path.join(UI_DIR, 'Modal/Modal.module.css'), 'utf-8'))
    const closeBtnMatch = modalCss.match(/\.closeButton\s*\{([^}]*)\}/)
    expect(closeBtnMatch).not.toBeNull()
    expect(closeBtnMatch![1]).toMatch(/position\s*:\s*relative/)

    const beforeMatch = modalCss.match(/\.closeButton::before\s*\{([^}]*)\}/)
    expect(beforeMatch).not.toBeNull()
    expect(beforeMatch![1]).toMatch(/inset\s*:\s*-6px/)
  })

  it('U5: ConfirmModal.module.css no contiene 100vw', () => {
    const confirmCss = stripCssComments(fs.readFileSync(path.join(UI_DIR, 'ConfirmModal/ConfirmModal.module.css'), 'utf-8'))
    expect(confirmCss).not.toMatch(/100vw/i)
  })

  it('U6: Button.module.css pasa .btn a white-space: normal dentro de @media (max-width: 767.98px)', () => {
    const buttonCss = fs.readFileSync(path.join(UI_DIR, 'Button/Button.module.css'), 'utf-8')
    const mobileBlock = extractMediaBlock(buttonCss, /@media\s*\(\s*max-width\s*:\s*767\.98px\s*\)\s*\{/)
    expect(mobileBlock).not.toBe('')
    expect(mobileBlock).toMatch(/\.btn\s*\{[^}]*white-space\s*:\s*normal/)
  })
})
