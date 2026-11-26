import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  CONSULTA_CELULAR,
  CONSULTA_ESCRITORIO,
  clasificarViewport,
} from './useViewport'

const SRC_DIR = path.resolve(__dirname, '..')

const ARCHIVOS_C2 = [
  'components/billeteras/BilleteraCard.tsx',
  'components/ciclo/CicloFinancieroSelector.tsx',
  'components/ui/ColorPicker/ColorPicker.tsx',
  'components/ui/PhoneCountrySelect/PhoneCountrySelect.tsx',
  'components/ui/SelectInput/SelectInput.tsx',
  'pages/app/analisis/ComparativaCiclosCard.tsx',
  'pages/app/analisis/FiltrosAnalisis.tsx',
  'pages/app/analisis/InformeEditor.tsx',
  'pages/AdminPage.tsx',
  'components/ui/AtmosphericBackground/ConstellationCanvas.tsx',
  'components/ui/AtmosphericBackground/LunarLoading.tsx',
  'components/ui/DateInput/DateInput.tsx',
  'components/ui/TimeInput/TimeInput.tsx',
  'components/ui/SileoToaster/SileoToaster.tsx',
  'pages/app/analisis/AnalisisPage.tsx',
  'pages/admin/usuarios/UsuariosPanel.tsx',
  'pages/app/perfil/components/TabFinanzas.tsx',
]

describe('useViewport (FS2B)', () => {
  it('V1: clasificarViewport resuelve celular, tablet, escritorio y empate', () => {
    expect(clasificarViewport(true, false)).toBe('celular')
    expect(clasificarViewport(false, false)).toBe('tablet')
    expect(clasificarViewport(false, true)).toBe('escritorio')
    expect(clasificarViewport(true, true)).toBe('celular')
  })

  it('V2: exporta las consultas oficiales de celular y escritorio', () => {
    expect(CONSULTA_CELULAR).toBe('(max-width: 767.98px)')
    expect(CONSULTA_ESCRITORIO).toBe('(min-width: 1024px)')
  })

  it('V3: los 17 archivos de C2 importan useViewport sin decisiones de ancho sueltas ni 1024 en DateInput/TimeInput', () => {
    const innerWidthCmpRe = /innerWidth\s*(<=|>=|<|>)/
    const matchMediaWidthRe = /matchMedia\(\s*['"`]\s*\(\s*(min|max)-width/

    for (const rel of ARCHIVOS_C2) {
      const code = fs.readFileSync(path.join(SRC_DIR, rel), 'utf-8')
      expect(code, `${rel} debe importar useViewport`).toContain('useViewport')
      expect(code, `${rel} no debe comparar innerWidth`).not.toMatch(innerWidthCmpRe)
      expect(code, `${rel} no debe usar matchMedia de ancho`).not.toMatch(matchMediaWidthRe)
    }

    const dateCode = fs.readFileSync(path.join(SRC_DIR, 'components/ui/DateInput/DateInput.tsx'), 'utf-8')
    const timeCode = fs.readFileSync(path.join(SRC_DIR, 'components/ui/TimeInput/TimeInput.tsx'), 'utf-8')
    expect(dateCode).not.toContain('1024')
    expect(timeCode).not.toContain('1024')
  })
})
