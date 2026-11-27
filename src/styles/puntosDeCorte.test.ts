import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = path.resolve(__dirname, '../..')
const SRC_DIR = path.join(ROOT_DIR, 'src')

// Cortes legados congelados al cierre de F6 (baja de 36 a 20 tras limpiar suscripciones, dashboard, metas, ciclo y lo-que-se-repite): solo puede bajar.
const TOPE_LEGADO = 20

const LEGADO: Record<string, Record<string, number>> = {
  'src/components/auth/AuthLayout/AuthLayout.module.css': {
    'max 480': 1,
    'min 1200': 1,
  },
  'src/components/auth/CrearPasswordBloqueo/CrearPasswordBloqueo.module.css': {
    'max 540': 1,
    'max 640': 1,
  },
  'src/components/notificaciones/NotificacionesConfigModal.module.css': {
    'max 639': 1,
    'min 640': 1,
  },
  'src/components/whatsapp/VinculacionWhatsAppCard.module.css': {
    'min 640': 1,
  },
  'src/pages/TermsPage.module.css': {
    'max 640': 1,
  },
  'src/pages/admin/AnimacionPreviewPage.module.css': {
    'max 640': 1,
  },
  'src/pages/admin/components/MonitorWppPanel.module.css': {
    'max 639': 1,
    'min 1280': 1,
  },
  'src/pages/admin/components/SchedulerPanel.module.css': {
    'max 639': 1,
  },
  'src/pages/admin/diseno/components/DisenoSpecificationView.module.css': {
    'max 900': 1,
  },
  'src/pages/admin/diseno/components/InteractiveDemos.module.css': {
    'max 640': 1,
  },
  'src/pages/admin/registro/RegistroPanel.module.css': {
    'max 639': 1,
  },
  'src/pages/admin/usuarios/UsuariosPanel.module.css': {
    'max 639': 2,
  },
  'src/pages/auth/recuperar-password/RecuperarPassword.module.css': {
    'min 640': 1,
  },
  'src/pages/onboarding/OnboardingPage.module.css': {
    'min 480': 1,
  },
  'src/styles/tokens.css': {
    'max 480': 1,
  },
}

const OFICIALES = new Set([
  'max 767.98',
  'min 768',
  'max 1023.98',
  'min 1024',
])

const TOKENS_EXTRA = new Set([
  'min 1440',
  'min 1920',
  'min 2560',
])

function walkFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, exts, acc)
    else if (exts.some((ext) => entry.name.endsWith(ext))) acc.push(full)
  }
  return acc
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ')
}

function extractMediaConditions(css: string): string[] {
  const clean = stripCssComments(css)
  const out: string[] = []
  const re = /@media\s*([^{]+)\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean)) !== null) {
    out.push(m[1])
  }
  return out
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

describe('Trinquete de puntos de corte y defectos (FS2B)', () => {
  const cssFiles = walkFiles(SRC_DIR, ['.css']).sort()

  it('T-A1: ninguna @media de ancho usa sintaxis de rango', () => {
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const conds = extractMediaConditions(fs.readFileSync(abs, 'utf-8'))
      for (const c of conds) {
        expect(c, `${rel} tiene sintaxis de rango: ${c}`).not.toMatch(/\bwidth\s*[<>]/)
      }
    }
  })

  it('T-A2: ningún max-width 767, 768, 1023 ni 1024 en @media', () => {
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const conds = extractMediaConditions(fs.readFileSync(abs, 'utf-8'))
      for (const c of conds) {
        expect(c, `${rel} tiene corte viejo en @media: ${c}`).not.toMatch(
          /max-width\s*:\s*(?:767|768|1023|1024)px\b/
        )
      }
    }
  })

  it('T-A3: ningún archivo tiene a la vez max-width y min-width para 768 o 1024', () => {
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const conds = extractMediaConditions(fs.readFileSync(abs, 'utf-8'))
      const maxVals = new Set<string>()
      const minVals = new Set<string>()
      for (const c of conds) {
        for (const m of c.matchAll(/(min|max)-width\s*:\s*([\d.]+)px/gi)) {
          if (m[1].toLowerCase() === 'max') maxVals.add(m[2])
          else minVals.add(m[2])
        }
      }
      for (const n of ['768', '1024']) {
        expect(maxVals.has(n) && minVals.has(n), `${rel} solapa N=${n}`).toBe(false)
      }
    }
  })

  it('T-A4: todo corte fuera de los oficiales coincide exactamente con LEGADO', () => {
    const actual: Record<string, Record<string, number>> = {}
    for (const abs of cssFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      const conds = extractMediaConditions(fs.readFileSync(abs, 'utf-8'))
      const counts: Record<string, number> = {}
      for (const c of conds) {
        for (const m of c.matchAll(/\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/gi)) {
          const key = `${m[1].toLowerCase()} ${m[2]}`
          if (OFICIALES.has(key)) continue
          if (rel === 'src/styles/tokens.css' && TOKENS_EXTRA.has(key)) continue
          counts[key] = (counts[key] || 0) + 1
        }
      }
      if (Object.keys(counts).length > 0) {
        const sorted: Record<string, number> = {}
        for (const k of Object.keys(counts).sort()) sorted[k] = counts[k]
        actual[rel] = sorted
      }
    }
    expect(actual).toEqual(LEGADO)
  })

  it('T-A5: el total de cortes legados es <= TOPE_LEGADO', () => {
    let total = 0
    for (const counts of Object.values(LEGADO)) {
      for (const v of Object.values(counts)) total += v
    }
    expect(total).toBeLessThanOrEqual(TOPE_LEGADO)
  })

  it('T-A6: en TS/TSX fuera de useViewport.ts no hay innerWidth comparativo ni matchMedia de ancho', () => {
    const tsFiles = walkFiles(SRC_DIR, ['.ts', '.tsx'])
      .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
      .sort()
    const innerWidthRe = /innerWidth\s*(<=|>=|<|>)/
    const matchMediaWidthRe = /matchMedia\(\s*['"`]\s*\(\s*(min|max)-width/g

    for (const abs of tsFiles) {
      const rel = path.relative(ROOT_DIR, abs).replace(/\\/g, '/')
      if (rel === 'src/hooks/useViewport.ts') continue
      const content = fs.readFileSync(abs, 'utf-8')
      expect(content, `${rel} usa innerWidth para decidir`).not.toMatch(innerWidthRe)
      const mmMatches = [...content.matchAll(matchMediaWidthRe)]
      if (rel === 'src/pages/admin/usuarios/UsuariosLista.tsx') {
        expect(mmMatches).toHaveLength(1)
        expect(content).toContain("'(max-width: 479px)'")
      } else {
        expect(mmMatches, `${rel} usa matchMedia de ancho fuera de useViewport`).toHaveLength(0)
      }
    }
  })

  it('P1: PerfilFinancieroCard.module.css alinea las columnas en tablet y celular sin 640 ni 1023', () => {
    const css = fs.readFileSync(
      path.join(SRC_DIR, 'components/perfil/PerfilFinancieroCard.module.css'),
      'utf-8'
    )
    expect(css).not.toMatch(/max-width\s*:\s*640px/)
    expect(css).not.toMatch(/max-width\s*:\s*1023px/)

    const tabletBlock = extractMediaBlock(
      css,
      /@media\s*\(\s*min-width\s*:\s*768px\s*\)\s*and\s*\(\s*max-width\s*:\s*1023\.98px\s*\)\s*\{/
    )
    expect(tabletBlock).toMatch(/\.pfKpiCell:nth-child\(3n\+1\)\s*\{[^}]*padding-left\s*:\s*0/)

    const mobileBlock = extractMediaBlock(css, /@media\s*\(\s*max-width\s*:\s*767\.98px\s*\)\s*\{/)
    expect(mobileBlock).toMatch(/\.pfKpiCell:nth-child\(2n\+1\)\s*\{[^}]*padding-left\s*:\s*0/)
  })

  it('P2: UsuariosPanel.module.css tiene overflow-x: auto en .desktopTableWrap', () => {
    const css = fs.readFileSync(
      path.join(SRC_DIR, 'pages/admin/usuarios/UsuariosPanel.module.css'),
      'utf-8'
    )
    const wrapBlock = css.match(/\.desktopTableWrap\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(wrapBlock).toMatch(/overflow-x\s*:\s*auto/)
  })

  it('P3: FiltrosAnalisis, FotoCropModal, DateInput y TimeInput usan min() en sus anchos de E', () => {
    const filtrosCss = fs.readFileSync(path.join(SRC_DIR, 'pages/app/analisis/FiltrosAnalisis.module.css'), 'utf-8')
    const fotoCss = fs.readFileSync(path.join(SRC_DIR, 'components/perfil/FotoCropModal.module.css'), 'utf-8')
    const dateCss = fs.readFileSync(path.join(SRC_DIR, 'components/ui/DateInput/DateInput.module.css'), 'utf-8')
    const timeCss = fs.readFileSync(path.join(SRC_DIR, 'components/ui/TimeInput/TimeInput.module.css'), 'utf-8')

    expect(filtrosCss.match(/\.sideMenuCard\s*\{[^}]*\}/)?.[0] ?? '').not.toMatch(/\bwidth\s*:\s*\d{3}px/)
    for (const sel of ['.cropArea', '.cropCanvas', '.zoomRow']) {
      const blk = fotoCss.match(new RegExp(`\\${sel}[^{]*\\{[^}]*\\}`))?.[0] ?? ''
      expect(blk, `FotoCropModal ${sel}`).not.toMatch(/\bwidth\s*:\s*\d{3}px/)
    }
    const datePopover = dateCss.match(/\.popover\s*\{[^}]*\}/)?.[0] ?? ''
    expect(datePopover).not.toMatch(/(?:min-)?width\s*:\s*\d{3}px/)
    const timePopover = timeCss.match(/\.popover\s*\{[^}]*\}/)?.[0] ?? ''
    expect(timePopover).not.toMatch(/\bwidth\s*:\s*\d{3}px/)
  })
})
