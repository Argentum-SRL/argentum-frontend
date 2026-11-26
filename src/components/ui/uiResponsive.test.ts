import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const UI_DIR = path.resolve(__dirname)
const SRC_DIR = path.resolve(UI_DIR, '..', '..')

interface CerrarSpec {
  css: string
  selector: string
  excepcion?: string
}

const CERRAR: CerrarSpec[] = [
  { css: 'components/billeteras/ActualizarSaldoModal.module.css', selector: '.closeBtn' },
  { css: 'components/billeteras/BankPickerModal.parte1.css', selector: '.closeBtn' },
  { css: 'components/billeteras/CambiarFechaSaldoModal.module.css', selector: '.closeBtn' },
  { css: 'components/billeteras/EditBilleteraModal.module.css', selector: '.closeBtn' },
  {
    css: 'components/dashboard/AvisosConfianza/AvisosConfianza.module.css',
    selector: '.closeBtn',
    excepcion: '28x28 desktop (gap 12px con .mainAction < 2*8=16 -> inset -6px); 26x26 <=640px (gap 8px < 2*9=18 -> inset -4px)',
  },
  { css: 'components/dashboard/ExplicativoFinancieroModal/ExplicativoFinancieroModal.module.css', selector: '.closeButton' },
  { css: 'components/goals/GoalContributionModal.module.css', selector: '.closeBtn' },
  { css: 'components/goals/GoalDetailModal.module.css', selector: '.closeBtn' },
  { css: 'components/goals/GoalModal.module.css', selector: '.closeBtn' },
  { css: 'components/layout/AppLayout/SearchModal.module.css', selector: '.closeBtn' },
  { css: 'components/notificaciones/NotificacionesDrawer.module.css', selector: '.closeBtn' },
  { css: 'components/perfil/FotoCropModal.module.css', selector: '.closeBtn' },
  {
    css: 'components/presupuestos/PresupuestoDetailModal.module.css',
    selector: '.closeBtn',
    excepcion: 'separación 8px con .nextSlideBtn en .headerRightActions < 2*6=12px; N máximo sin superposición = 4',
  },
  { css: 'components/presupuestos/PresupuestoModal.module.css', selector: '.closeBtn' },
  { css: 'components/suscripciones/SuscripcionModal.module.css', selector: '.closeBtn' },
  { css: 'components/tarjetas/PagarResumenModal.module.css', selector: '.closeBtn' },
  { css: 'components/tarjetas/TarjetaModal.module.css', selector: '.closeBtn' },
  { css: 'components/transacciones/FilterBar.parte1.css', selector: '.mobileExpandedSearchClose' },
  { css: 'components/transacciones/GruposCuotasTab.parte1.css', selector: '.mobileExpandedSearchClose' },
  { css: 'components/transacciones/GruposCuotasTab.parte3.css', selector: '.closeBtn' },
  { css: 'components/transacciones/MemoriaComercioDialog.module.css', selector: '.closeBtn' },
  {
    css: 'components/transacciones/TransaccionModal.parte1.css',
    selector: '.closeBtn',
    excepcion: 'separación 8px con .deleteHeaderBtn en ReintegroPaso.tsx .headerRightActions < 2*6=12px; N máximo sin superposición = 4',
  },
  { css: 'components/transferencias/TransferenciaModal.module.css', selector: '.closeBtn' },
  { css: 'components/transferencias/TransferenciasFilterBar.module.css', selector: '.mobileExpandedSearchClose' },
  {
    css: 'components/ui/ErrorBoundary/ModalErrorBoundary.module.css',
    selector: '.closeBtn',
    excepcion: 'botón con texto "Cerrar" (~40px de alto); ya cumple >= 44px con ::before { inset: -2px 0 }',
  },
  { css: 'components/ui/Modal/Modal.module.css', selector: '.closeButton' },
  {
    css: 'pages/admin/AnimacionPreviewPage.module.css',
    selector: '.closeBtn',
    excepcion: 'separación 8px con .minimizeBtn en .dockActions < 2*10=20px; N máximo sin superposición = 4',
  },
  { css: 'pages/admin/usuarios/UsuariosPanel.module.css', selector: '.closeBtn' },
  { css: 'pages/app/analisis/FiltrosAnalisis.module.css', selector: '.sideMenuCloseBtn' },
  {
    css: 'pages/app/dashboard/DashboardPage.parte3.css',
    selector: '.whatsappBannerCloseBtn',
    excepcion: '28x28 desktop (gap 12px con .whatsappBannerActionsDesktop < 2*8=16 -> inset -6px); 26x26 <=640px (gap 8px < 2*9=18 -> inset -4px)',
  },
  { css: 'pages/app/metas/GoalsBarChart.module.css', selector: '.sheetCloseBtn' },
  { css: 'pages/app/perfil/PerfilPage.parte3.css', selector: '.modalCloseBtn' },
  { css: 'pages/app/perfil/PerfilPage.parte3.css', selector: '.closeBtn' },
  { css: 'pages/app/presupuestos/BudgetHistoryModal.module.css', selector: '.closeBtn' },
]

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

function extractCssBlocks(css: string, baseLine = 1, skipReducedMotion = false): CssBlock[] {
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
      if (!(skipReducedMotion && /prefers-reduced-motion/i.test(selector))) {
        blocks.push(...extractCssBlocks(rawBody, bodyStartLine, skipReducedMotion))
      }
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

  it('U7: todo botón de cerrar en CERRAR tiene ::before/::after con inset >= 6px (o excepción documentada) y no hay .closeBtn/.closeButton fuera de CERRAR', () => {
    const fallos: string[] = []
    const cerrarKeys = new Set(CERRAR.map((item) => `${item.css}::${item.selector}`))

    for (const item of CERRAR) {
      const abs = path.join(SRC_DIR, item.css)
      if (!fs.existsSync(abs)) {
        fallos.push(`Falta archivo: ${item.css}`)
        continue
      }
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'), 1, true)
      const splitSel = (s: string) => s.split(',').map((p) => p.trim())

      const baseBlocks = blocks.filter((b) => splitSel(b.selector).includes(item.selector))
      const hasNonStaticPos = baseBlocks.some((b) =>
        /position\s*:\s*(relative|absolute|fixed|sticky)\b/i.test(b.cleanBody)
      )
      if (!hasNonStaticPos) {
        fallos.push(`${item.css} [${item.selector}]: falta position no-static`)
      }

      const pseudoBlocks = blocks.filter((b) =>
        splitSel(b.selector).some(
          (p) => p === `${item.selector}::before` || p === `${item.selector}::after`
        )
      )
      if (pseudoBlocks.length === 0) {
        fallos.push(`${item.css} [${item.selector}]: falta ::before o ::after`)
        continue
      }

      const hasContentAbs = pseudoBlocks.some(
        (b) => /content\s*:\s*['"]['"]/i.test(b.cleanBody) && /position\s*:\s*absolute\b/i.test(b.cleanBody)
      )
      if (!hasContentAbs) {
        fallos.push(`${item.css} [${item.selector}]: el pseudo-elemento debe definir content: '' y position: absolute`)
      }

      const insetMatch = pseudoBlocks
        .map((b) => b.cleanBody.match(/inset\s*:\s*([^;!}]+)/i))
        .find((m) => m !== null)
      if (!insetMatch) {
        fallos.push(`${item.css} [${item.selector}]: falta inset negativo en pseudo-elemento`)
        continue
      }

      const insetVal = insetMatch[1].trim()
      if (!item.excepcion) {
        const singleNeg = insetVal.match(/^-(\d+)px$/i)
        if (!singleNeg || parseInt(singleNeg[1], 10) < 6) {
          fallos.push(`${item.css} [${item.selector}]: inset=${insetVal} (se esperaba -Npx con N >= 6)`)
        }
      } else {
        if (!/-\d+px/i.test(insetVal)) {
          fallos.push(`${item.css} [${item.selector}]: excepción sin inset negativo válido (${insetVal})`)
        }
      }
    }

    const todosCssSrc = walkCssFiles(SRC_DIR)
    for (const abs of todosCssSrc) {
      const rel = path.relative(SRC_DIR, abs).replace(/\\/g, '/')
      const blocks = extractCssBlocks(fs.readFileSync(abs, 'utf-8'), 1, true)
      for (const blk of blocks) {
        for (const part of blk.selector.split(',').map((s) => s.trim())) {
          if (/::?(hover|active|focus|disabled|before|after)/i.test(part)) continue
          const m = part.match(/(\.closeBtn|\.closeButton)(?=$|[\s>+~,.[])/)
          if (m) {
            const key = `${rel}::${m[1]}`
            if (!cerrarKeys.has(key)) {
              fallos.push(`Fuera de CERRAR: ${key} (selector "${part}")`)
            }
          }
        }
      }
    }

    expect(fallos).toEqual([])
  })

  it('U8: CategoriaSelector.module.css .catGrid define grid-auto-rows: 1fr', () => {
    const catCss = stripCssComments(
      fs.readFileSync(path.join(UI_DIR, 'CategoriaSelector/CategoriaSelector.module.css'), 'utf-8')
    )
    const gridMatch = catCss.match(/\.catGrid\s*\{([^}]*)\}/)
    expect(gridMatch).not.toBeNull()
    expect(gridMatch![1]).toMatch(/grid-auto-rows\s*:\s*1fr\b/)
  })
})
