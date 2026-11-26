import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { SegmentedControlSize, SegmentedControlProps } from './SegmentedControl'

const UI_DIR = path.resolve(__dirname)
const SRC_DIR = path.resolve(__dirname, '../..')
const TOKENS_PATH = path.resolve(__dirname, '../../styles/tokens.css')

function extractMediaBlocks(css: string, mediaRegex: RegExp): string[] {
  const blocks: string[] = []
  let searchFrom = 0
  while (searchFrom < css.length) {
    const slice = css.slice(searchFrom)
    const m = slice.match(mediaRegex)
    if (!m || m.index === undefined) break
    const absStart = searchFrom + m.index
    const openBrace = css.indexOf('{', absStart)
    if (openBrace === -1) break
    let depth = 0
    let endIdx = -1
    for (let i = openBrace; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') {
        depth--
        if (depth === 0) {
          endIdx = i
          break
        }
      }
    }
    if (endIdx === -1) break
    blocks.push(css.slice(openBrace + 1, endIdx))
    searchFrom = endIdx + 1
  }
  return blocks
}

function walkTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const norm = full.replace(/\\/g, '/')
      if (norm.includes('/pages/admin/diseno')) continue
      walkTsxFiles(full, out)
    } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

function extractSegmentedControlTags(content: string): string[] {
  const tags: string[] = []
  let idx = 0
  while (idx < content.length) {
    const pos = content.indexOf('<SegmentedControl', idx)
    if (pos === -1) break
    const nextChar = content[pos + '<SegmentedControl'.length]
    if (nextChar !== '<' && !/\s/.test(nextChar) && nextChar !== '>') {
      idx = pos + '<SegmentedControl'.length
      continue
    }
    let braceDepth = 0
    let quote: string | null = null
    let i = pos + '<SegmentedControl'.length
    while (i < content.length) {
      const ch = content[i]
      if (quote) {
        if (ch === '\\') {
          i += 2
          continue
        }
        if (ch === quote) quote = null
        i++
        continue
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch
        i++
        continue
      }
      if (ch === '{') braceDepth++
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1)
      else if (braceDepth === 0 && ch === '/' && content[i + 1] === '>') {
        tags.push(content.slice(pos, i + 2))
        i += 2
        break
      }
      i++
    }
    idx = i
  }
  return tags
}

describe('FS1 / FS1B / FS1C: Verificación estática de SegmentedControl y sus tamaños', () => {
  it('SegmentedControl.module.css no contiene "flex: 1 1 0" en .pill ni en fullWidth', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    const pillBlock = css.match(/\.pill\s*\{[^}]*\}/)?.[0] ?? ''
    expect(pillBlock).not.toContain('flex: 1 1 0')
    expect(css).not.toContain('flex: 1 1 0')
  })

  it('SegmentedControl.module.css contiene grid-auto-columns y --selector-pill-h-sm', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    expect(css).toContain('grid-auto-columns')
    expect(css).toContain('--selector-pill-h-sm')
  })

  it('T1: tokens.css define --selector-pill-h-sm: 28px, --selector-pill-h: 32px, --selector-pill-h-lg: 36px, --selector-pill-h-stacked: 44px, --selector-touch: 44px y --radius-selector-pill: 8px', () => {
    const tokens = fs.readFileSync(TOKENS_PATH, 'utf-8')
    expect(tokens).toMatch(/--selector-pill-h-sm:\s*28px\s*;/)
    expect(tokens).toMatch(/--selector-pill-h:\s*32px\s*;/)
    expect(tokens).toMatch(/--selector-pill-h-lg:\s*36px\s*;/)
    expect(tokens).toMatch(/--selector-pill-h-stacked:\s*44px\s*;/)
    expect(tokens).toMatch(/--selector-touch:\s*44px\s*;/)
    expect(tokens).toMatch(/--radius-selector-pill:\s*8px\s*;/)
  })

  it('T2: ni tokens.css ni SegmentedControl.module.css reasignan --selector-pill-h* ni min-height dentro de pointer: coarse', () => {
    const tokens = fs.readFileSync(TOKENS_PATH, 'utf-8')
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    for (const block of extractMediaBlocks(tokens, /@media[^{]*pointer:\s*coarse[^{]*\{/)) {
      expect(block).not.toMatch(/--selector-pill-h/)
      expect(block).not.toMatch(/min-height/)
    }
    for (const block of extractMediaBlocks(css, /@media[^{]*pointer:\s*coarse[^{]*\{/)) {
      expect(block).not.toMatch(/--selector-pill-h/)
      expect(block).not.toMatch(/min-height/)
    }
  })

  it('T3: SegmentedControl.module.css contiene .pill::before con --selector-touch y position: relative en .pill', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    const pillBlock = css.match(/\.pill\s*\{[^}]*\}/)?.[0] ?? ''
    const beforeBlock = css.match(/\.pill::before\s*\{[^}]*\}/)?.[0] ?? ''
    expect(pillBlock).toMatch(/position:\s*relative/)
    expect(beforeBlock).toContain('--selector-touch')
  })

  it('T4: .fullWidth .pill no declara padding con valor vertical (solo padding-inline)', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    const fullWidthPill = css.match(/\.fullWidth\s+\.pill\s*\{[^}]*\}/)?.[0] ?? ''
    expect(fullWidthPill).toContain('padding-inline:')
    expect(fullWidthPill).not.toMatch(/(?:^|[;\s])padding\s*:/)
    expect(fullWidthPill).not.toMatch(/padding-block/)
  })

  it('SegmentedControl.tsx exporta el tipo de size con sm, md y lg', () => {
    const tsx = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.tsx'), 'utf-8')
    expect(tsx).toMatch(/export\s+type\s+SegmentedControlSize\s*=\s*'sm'\s*\|\s*'md'\s*\|\s*'lg'/)

    // Verificación de tipos en tiempo de compilación para los tres tamaños permitidos
    const tamanos: SegmentedControlSize[] = ['sm', 'md', 'lg']
    const sizePropCheck: SegmentedControlProps['size'] = tamanos[0]
    expect(tamanos).toEqual(['sm', 'md', 'lg'])
    expect(sizePropCheck).toBe('sm')
  })

  it('SegmentedControl.module.css contiene un bloque @media (max-width: 767.98px) con flex-wrap: wrap para el track inline', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    const blocks = extractMediaBlocks(css, /@media\s*\(max-width:\s*767\.98px\)\s*\{/)
    expect(blocks.length).toBeGreaterThan(0)
    const mediaBlock = blocks[0]
    expect(mediaBlock).toContain('.track')
    expect(mediaBlock).toContain('display: flex')
    expect(mediaBlock).toContain('flex-wrap: wrap')
    expect(mediaBlock).toContain('flex: 1 1 auto')
    expect(mediaBlock).toContain('min-width: min(max-content, 100%)')
  })

  it('T5: todo <SegmentedControl de src (excluyendo tests y admin/diseno) tiene prop size= explícita', () => {
    const files = walkTsxFiles(SRC_DIR)
    const missing: string[] = []
    let totalFound = 0
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(/<SegmentedControl(?=[\s<>])/g) ?? []
      if (matches.length === 0) continue
      const tags = extractSegmentedControlTags(content)
      expect(tags.length).toBe(matches.length)
      for (const tag of tags) {
        totalFound++
        if (!/\bsize=(?:"(?:sm|md|lg)"|'?(?:sm|md|lg)'?|\{)/.test(tag)) {
          missing.push(`${path.relative(SRC_DIR, file)}: ${tag.slice(0, 80)}`)
        }
      }
    }
    expect(totalFound).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})
