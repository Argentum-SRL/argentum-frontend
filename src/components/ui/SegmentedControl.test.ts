import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import type { SegmentedControlSize, SegmentedControlProps } from './SegmentedControl'

const UI_DIR = path.resolve(__dirname)
const TOKENS_PATH = path.resolve(__dirname, '../../styles/tokens.css')

describe('FS1: Verificación estática de SegmentedControl y sus tamaños', () => {
  it('SegmentedControl.module.css no contiene "flex: 1 1 0" en .pill ni en fullWidth', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    const pillBlock = css.match(/\.pill\s*\{[^}]*\}/)?.[0] ?? ''
    expect(pillBlock).not.toContain('flex: 1 1 0')
    expect(css).not.toContain('flex: 1 1 0')
  })

  it('SegmentedControl.module.css contiene grid-auto-columns, --selector-pill-h-sm y pointer: coarse', () => {
    const css = fs.readFileSync(path.join(UI_DIR, 'SegmentedControl.module.css'), 'utf-8')
    expect(css).toContain('grid-auto-columns')
    expect(css).toContain('--selector-pill-h-sm')
    expect(css).toContain('pointer: coarse')
  })

  it('tokens.css contiene --selector-pill-h-sm y --selector-pill-h-lg', () => {
    const tokens = fs.readFileSync(TOKENS_PATH, 'utf-8')
    expect(tokens).toContain('--selector-pill-h-sm')
    expect(tokens).toContain('--selector-pill-h-lg')
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
})
