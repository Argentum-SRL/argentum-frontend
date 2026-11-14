import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ANALISIS_DIR = path.resolve(__dirname)
const UI_DIR = path.resolve(__dirname, '../../../components/ui')

const CLASES_BORRADAS_B1 = [
  'studioLayout',
  'leftStage',
  'stageViewport',
  'controlPanel',
  'panelHeader',
  'panelHeaderLeft',
  'panelIconBox',
  'panelTitle',
  'reportsChipBtn',
  'reportsChipBtnActive',
  'panelSection',
  'sectionLabelRow',
  'sectionLabel',
  'controlTrack',
  'controlTrackHalf',
  'viewGrid',
  'viewGridBtn',
  'viewGridBtnActive',
  'twoColRow',
  'chartEditorRow',
  'chartModeBtn',
  'chartEditorTriggerBtn',
  'chartModeBtnActive',
  'resetSeriesLink',
  'selectsGrid',
  'panelExportSection',
  'exportBtnsGrid',
  'exportBtn',
]

function getAnalisisFiles(): { name: string; content: string }[] {
  const fileNames = fs.readdirSync(ANALISIS_DIR)
  return fileNames
    .filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css')) &&
        !f.includes('.test.')
    )
    .map((name) => ({
      name,
      content: fs.readFileSync(path.join(ANALISIS_DIR, name), 'utf-8'),
    }))
}

describe('TF3: Verificación estática visual y de estructura en Análisis', () => {
  it('existen FiltrosAnalisis.tsx, DescargarAnalisisModal.tsx y filtrosAnalisis.ts', () => {
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'FiltrosAnalisis.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'DescargarAnalisisModal.tsx'))).toBe(true)
    expect(fs.existsSync(path.join(ANALISIS_DIR, 'filtrosAnalisis.ts'))).toBe(true)
  })

  it('ningún archivo de Análisis contiene las clases borradas en B-1', () => {
    const files = getAnalisisFiles()
    for (const f of files) {
      for (const cls of CLASES_BORRADAS_B1) {
        expect(
          f.content,
          `El archivo ${f.name} no debe contener la clase eliminada '${cls}'`
        ).not.toContain(cls)
      }
    }
  })

  it('ningún archivo de Análisis contiene max-width: 768px, 0.65rem, --selector-pill-h:, word-break, abbreviateAxisValue ni formatAxisCompact', () => {
    const files = getAnalisisFiles()
    for (const f of files) {
      expect(f.content, `${f.name} no debe contener 'max-width: 768px'`).not.toContain('max-width: 768px')
      expect(f.content, `${f.name} no debe contener '0.65rem'`).not.toContain('0.65rem')
      expect(f.content, `${f.name} no debe contener '--selector-pill-h:'`).not.toContain('--selector-pill-h:')
      expect(f.content, `${f.name} no debe contener 'word-break'`).not.toContain('word-break')
      expect(f.content, `${f.name} no debe contener 'abbreviateAxisValue'`).not.toContain('abbreviateAxisValue')
      expect(f.content, `${f.name} no debe contener 'formatAxisCompact'`).not.toContain('formatAxisCompact')
    }
  })

  it('ningún .tsx de Análisis contiene tasa_ahorro_texto ni variacion_texto', () => {
    const files = getAnalisisFiles().filter((f) => f.name.endsWith('.tsx'))
    for (const f of files) {
      expect(f.content, `${f.name} no debe contener 'tasa_ahorro_texto'`).not.toContain('tasa_ahorro_texto')
      expect(f.content, `${f.name} no debe contener 'variacion_texto'`).not.toContain('variacion_texto')
    }
  })

  it('ningún bloque .card ni la raíz de ningún .module.css de Análisis tiene height: 100% ni overflow-y: auto', () => {
    const cssFiles = getAnalisisFiles().filter((f) => f.name.endsWith('.module.css'))
    for (const f of cssFiles) {
      // Extraer bloques .card y raíces (.page, .wrapper, etc.)
      const cardMatch = f.content.match(/\.card\s*\{[^}]*\}/g)
      if (cardMatch) {
        for (const block of cardMatch) {
          expect(block, `${f.name} en .card no debe tener height: 100%`).not.toContain('height: 100%')
          expect(block, `${f.name} en .card no debe tener overflow-y: auto`).not.toContain('overflow-y: auto')
        }
      }
      const pageMatch = f.content.match(/\.page\s*\{[^}]*\}/g)
      if (pageMatch) {
        for (const block of pageMatch) {
          expect(block, `${f.name} en .page no debe tener height: 100%`).not.toContain('height: 100%')
          expect(block, `${f.name} en .page no debe tener overflow-y: auto`).not.toContain('overflow-y: auto')
        }
      }
    }
  })

  it('ningún .tsx de Análisis arma un porcentaje con "}%" (todo pasa por formatPorcentaje)', () => {
    const tsxFiles = getAnalisisFiles().filter((f) => f.name.endsWith('.tsx'))
    for (const f of tsxFiles) {
      expect(f.content, `${f.name} no debe contener '}%'`).not.toContain('}%')
    }
  })

  it('PageSummaryBar.module.css no contiene word-break y contiene container-type', () => {
    const psbCssPath = path.join(UI_DIR, 'PageSummaryBar/PageSummaryBar.module.css')
    const content = fs.readFileSync(psbCssPath, 'utf-8')
    expect(content).not.toContain('word-break')
    expect(content).toContain('container-type')
  })
})
