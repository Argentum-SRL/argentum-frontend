import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Modal base (portal a document.body)', () => {
  const modalTsx = fs.readFileSync(path.join(__dirname, 'Modal.tsx'), 'utf-8');
  const toolsCss = fs.readFileSync(
    path.resolve(__dirname, '../../../pages/app/tools/ToolsPage.module.css'),
    'utf-8'
  );

  it('renderiza el overlay en document.body vía createPortal para no quedar atrapado en ancestros con transform', () => {
    expect(modalTsx).toContain("import { createPortal } from 'react-dom'");
    expect(modalTsx).toContain('createPortal(modalNode, document.body)');
  });

  it('ToolsPage.module.css no deja animation-fill-mode: both con transform permanente en .page', () => {
    expect(toolsCss).not.toMatch(/animation:\s*pageFadeIn[^;]*\bboth\b/);
  });
});

describe('FS1D: margen inferior del pie de modales en mobile', () => {
  const srcRoot = path.resolve(__dirname, '../../..');
  const tokensCss = fs.readFileSync(path.join(srcRoot, 'styles/tokens.css'), 'utf-8');
  const modalCss = fs.readFileSync(path.join(__dirname, 'Modal.module.css'), 'utf-8');

  function walkCss(dir: string): string[] {
    let out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walkCss(full));
      else if (entry.name.endsWith('.css')) out.push(full);
    }
    return out;
  }

  function extractCssBlocks(css: string): Array<{ selector: string; body: string }> {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const blocks: Array<{ selector: string; body: string }> = [];
    let i = 0;
    const n = clean.length;
    while (i < n) {
      const open = clean.indexOf('{', i);
      if (open === -1) break;
      const selector = clean.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < n && depth > 0) {
        if (clean[j] === '{') depth++;
        else if (clean[j] === '}') depth--;
        j++;
      }
      const body = clean.slice(open + 1, j - 1);
      if (selector.startsWith('@media') || selector.startsWith('@supports')) {
        blocks.push(...extractCssBlocks(body));
      } else {
        blocks.push({ selector, body });
      }
      i = j;
    }
    return blocks;
  }

  function getBottomPaddingValue(body: string): string | null {
    const decls = body
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean);
    let bottom: string | null = null;
    for (const decl of decls) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      const val = decl.slice(colon + 1).trim();
      if (prop === 'padding-bottom') {
        bottom = val;
      } else if (prop === 'padding') {
        // Split top-level space-separated tokens (respecting parentheses)
        const parts: string[] = [];
        let cur = '';
        let paren = 0;
        for (const ch of val) {
          if (ch === '(') paren++;
          else if (ch === ')') paren = Math.max(0, paren - 1);
          if (/\s/.test(ch) && paren === 0) {
            if (cur) {
              parts.push(cur);
              cur = '';
            }
          } else {
            cur += ch;
          }
        }
        if (cur) parts.push(cur);
        if (parts.length === 1) bottom = parts[0];
        else if (parts.length === 2) bottom = parts[0];
        else if (parts.length >= 3) bottom = parts[2];
      }
    }
    return bottom;
  }

  it('tokens.css define --modal-footer-pad-bottom con env(safe-area-inset-bottom) + 16px (mínimo 24px) en mobile y 20px en >=768px', () => {
    const rootMobileMatch = tokensCss.match(/:root\s*\{[^}]*--modal-footer-pad-bottom\s*:\s*([^;]+);/s);
    expect(rootMobileMatch).not.toBeNull();
    const mobileVal = rootMobileMatch![1].trim();
    expect(mobileVal).toContain('env(safe-area-inset-bottom');
    expect(mobileVal).toContain('24px');
    expect(mobileVal).toContain('16px');

    const spaceXlMatch = tokensCss.match(/--space-xl\s*:\s*20px\s*;/);
    expect(spaceXlMatch).not.toBeNull();

    const desktopMediaMatch = tokensCss.match(
      /@media\s*\(min-width:\s*768px\)\s*\{\s*:root\s*\{[^}]*--modal-footer-pad-bottom\s*:\s*([^;]+);/s
    );
    expect(desktopMediaMatch).not.toBeNull();
    const desktopVal = desktopMediaMatch![1].trim();
    expect(desktopVal === 'var(--space-xl)' || desktopVal === '20px').toBe(true);
  });

  it('ningún pie de modal en src/**/*.css usa padding-bottom literal en px ni --modal-footer-gap como padding inferior del pie', () => {
    const cssFiles = walkCss(srcRoot);
    const footerSelectorRe = /(?:^|[\s,])\.(?:modalFormFooter|detailFormFooter|formFooter|modalFooter|footer|actions|botonera)(?:\s|$|,)/;
    const nonModalExclusions = new Set([
      'pages/TermsPage.module.css',
      'components/tools/importacion/ImportacionResumenSection.module.css',
    ]);

    const offenders: string[] = [];

    for (const file of cssFiles) {
      const rel = path.relative(srcRoot, file).replace(/\\/g, '/');
      if (nonModalExclusions.has(rel)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = extractCssBlocks(content);
      for (const b of blocks) {
        if (!footerSelectorRe.test(b.selector)) continue;
        const bottom = getBottomPaddingValue(b.body);
        if (!bottom) continue;

        const isLiteralPx = /^\d+(?:\.\d+)?px$/i.test(bottom);
        const isOnlyFooterGap = /^var\(\s*--modal-footer-gap\s*\)$/i.test(bottom);
        if (isLiteralPx || isOnlyFooterGap) {
          offenders.push(`${rel} [${b.selector}] -> padding-bottom: ${bottom}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('Modal.module.css no usa max(var(--modal-footer-pad-bottom), env(...)) para no duplicar la fórmula', () => {
    expect(modalCss).not.toMatch(/max\(\s*var\(--modal-footer-pad-bottom\)\s*,\s*env\(/);
    expect(modalCss).not.toMatch(/max\(\s*var\(--modal-content-pad-bottom\)\s*,\s*env\(/);
  });
});

describe('FS1E: exclusión de noPadding en mobile y botones Confirmar sin monto', () => {
  const srcRoot = path.resolve(__dirname, '../../..');
  const modalCss = fs.readFileSync(path.join(__dirname, 'Modal.module.css'), 'utf-8');
  const pagarTsx = fs.readFileSync(path.join(srcRoot, 'components/tarjetas/PagarResumenModal.tsx'), 'utf-8');
  const pagarCss = fs.readFileSync(path.join(srcRoot, 'components/tarjetas/PagarResumenModal.module.css'), 'utf-8');
  const cuotasTsx = fs.readFileSync(path.join(srcRoot, 'components/transacciones/GrupoCuotasDetalleModal.tsx'), 'utf-8');
  const cuotasCss = fs.readFileSync(path.join(srcRoot, 'components/transacciones/GruposCuotasTab.parte3.css'), 'utf-8');

  function extractMobileMediaBlocks(css: string): Array<{ selector: string; body: string }> {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const out: Array<{ selector: string; body: string }> = [];
    const mediaRe = /@media\s*\([^)]*max-width\s*:\s*767\.98px[^)]*\)\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = mediaRe.exec(clean)) !== null) {
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < clean.length && depth > 0) {
        if (clean[i] === '{') depth++;
        else if (clean[i] === '}') depth--;
        i++;
      }
      const mediaInner = clean.slice(m.index + m[0].length, i - 1);
      const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
      let rm: RegExpExecArray | null;
      while ((rm = ruleRe.exec(mediaInner)) !== null) {
        out.push({ selector: rm[1].trim(), body: rm[2].trim() });
      }
    }
    return out;
  }

  function findRuleBody(css: string, exactSelector: RegExp): string {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let rm: RegExpExecArray | null;
    const bodies: string[] = [];
    while ((rm = ruleRe.exec(clean)) !== null) {
      if (exactSelector.test(rm[1].trim())) {
        bodies.push(rm[2]);
      }
    }
    return bodies.join('\n');
  }

  it('T1: en Modal.module.css ninguna regla .content:last-child queda sin excluir .noPadding dentro del @media mobile', () => {
    const mobileBlocks = extractMobileMediaBlocks(modalCss);
    const contentLastChildBlocks = mobileBlocks.filter((b) => /\.content:last-child\b/.test(b.selector));
    for (const blk of contentLastChildBlocks) {
      const selectors = blk.selector.split(',').map((s) => s.trim());
      for (const sel of selectors) {
        if (/\.content:last-child\b/.test(sel)) {
          expect(sel).toMatch(/:not\(\.noPadding\)/);
        }
      }
    }
  });

  it('T2: PagarResumenModal.module.css define padding-inline en .submitBtn y .cancelBtn y el TSX no incluye formatMonto en la etiqueta Confirmar', () => {
    const cancelBody = findRuleBody(pagarCss, /(?:^|,)\s*\.cancelBtn\s*(?:,|$)/);
    const submitBody = findRuleBody(pagarCss, /(?:^|,)\s*\.submitBtn\s*(?:,|$)/);
    expect(cancelBody).toMatch(/padding-inline\s*:/);
    expect(submitBody).toMatch(/padding-inline\s*:/);
    expect(cancelBody).toMatch(/white-space\s*:\s*nowrap/);
    expect(submitBody).toMatch(/white-space\s*:\s*nowrap/);

    const confirmBtnMatch = pagarTsx.match(/onClick=\{handleConfirm\}[\s\S]*?<\/button>/);
    expect(confirmBtnMatch).not.toBeNull();
    expect(confirmBtnMatch![0]).not.toContain('formatMonto');
    expect(confirmBtnMatch![0]).toContain("'Confirmar'");
    expect(confirmBtnMatch![0]).toContain("'Confirmar pago'");
  });

  it('T3: GruposCuotasTab.parte3.css define padding-inline en .submitBtn y .cancelBtn y GrupoCuotasDetalleModal.tsx no incluye formatMonto en Confirmar pago', () => {
    const sharedBody = findRuleBody(cuotasCss, /\.cancelBtn\s*,\s*\.submitBtn/);
    const cancelBody = findRuleBody(cuotasCss, /(?:^|,)\s*\.cancelBtn\s*(?:,|$)/) + '\n' + sharedBody;
    const submitBody = findRuleBody(cuotasCss, /(?:^|,)\s*\.submitBtn\s*(?:,|$)/) + '\n' + sharedBody;
    expect(cancelBody).toMatch(/padding-inline\s*:/);
    expect(submitBody).toMatch(/padding-inline\s*:/);
    expect(cancelBody).toMatch(/white-space\s*:\s*nowrap/);
    expect(submitBody).toMatch(/white-space\s*:\s*nowrap/);

    const confirmBtnMatch = cuotasTsx.match(/Confirmar pago[\s\S]{0,120}<\/button>/);
    expect(confirmBtnMatch).not.toBeNull();
    expect(confirmBtnMatch![0]).not.toContain('formatMonto');
  });
});

describe('FS1F: margen inferior único en modales restantes y etiqueta Otro monto', () => {
  const srcRoot = path.resolve(__dirname, '../../..');
  const importCss = fs.readFileSync(path.join(srcRoot, 'components/tools/importacion/ModalesImportacion.module.css'), 'utf-8');
  const notifCss = fs.readFileSync(path.join(srcRoot, 'components/notificaciones/NotificacionesConfigModal.module.css'), 'utf-8');
  const txFilterCss = fs.readFileSync(path.join(srcRoot, 'components/transacciones/FilterBar.parte2.css'), 'utf-8');
  const trFilterCss = fs.readFileSync(path.join(srcRoot, 'components/transferencias/TransferenciasFilterBar.module.css'), 'utf-8');
  const anFilterCss = fs.readFileSync(path.join(srcRoot, 'pages/app/analisis/FiltrosAnalisis.module.css'), 'utf-8');
  const dateCss = fs.readFileSync(path.join(srcRoot, 'components/ui/DateInput/DateInput.module.css'), 'utf-8');
  const dateTsx = fs.readFileSync(path.join(srcRoot, 'components/ui/DateInput/DateInput.tsx'), 'utf-8');
  const timeCss = fs.readFileSync(path.join(srcRoot, 'components/ui/TimeInput/TimeInput.module.css'), 'utf-8');
  const pagarTsx = fs.readFileSync(path.join(srcRoot, 'components/tarjetas/PagarResumenModal.tsx'), 'utf-8');

  function extractMobileMediaBlocks(css: string): Array<{ selector: string; body: string }> {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const out: Array<{ selector: string; body: string }> = [];
    const mediaRe = /@media\s*\([^)]*max-width\s*:\s*767\.98px[^)]*\)\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = mediaRe.exec(clean)) !== null) {
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < clean.length && depth > 0) {
        if (clean[i] === '{') depth++;
        else if (clean[i] === '}') depth--;
        i++;
      }
      const mediaInner = clean.slice(m.index + m[0].length, i - 1);
      const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
      let rm: RegExpExecArray | null;
      while ((rm = ruleRe.exec(mediaInner)) !== null) {
        out.push({ selector: rm[1].trim(), body: rm[2].trim() });
      }
    }
    return out;
  }

  function findRuleBodies(css: string, selectorRe: RegExp): string[] {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let rm: RegExpExecArray | null;
    const bodies: string[] = [];
    while ((rm = ruleRe.exec(clean)) !== null) {
      if (selectorRe.test(rm[1].trim())) {
        bodies.push(rm[2]);
      }
    }
    return bodies;
  }

  function getBottomPadding(body: string): string | null {
    const decls = body.split(';').map((d) => d.trim()).filter(Boolean);
    let bottom: string | null = null;
    for (const decl of decls) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      const val = decl.slice(colon + 1).trim();
      if (prop === 'padding-bottom') {
        bottom = val;
      } else if (prop === 'padding') {
        const parts = val.split(/\s+/);
        if (parts.length === 1 || parts.length === 2) bottom = parts[0];
        else if (parts.length >= 3) bottom = parts[2];
      }
    }
    return bottom;
  }

  it('T1: ModalesImportacion.module.css define padding-bottom: 0 en .formFooter dentro de @media (max-width: 767.98px)', () => {
    const mobileBlocks = extractMobileMediaBlocks(importCss);
    const footerBlock = mobileBlocks.find((b) => /\.formFooter\b/.test(b.selector));
    expect(footerBlock).toBeDefined();
    expect(getBottomPadding(footerBlock!.body)).toMatch(/^0(?:px)?$/);
  });

  it('T2: NotificacionesConfigModal.module.css en @media mobile no usa -20px abajo en .footer ni en margin-bottom ni en bottom', () => {
    const mobileBlocks = extractMobileMediaBlocks(notifCss);
    const footerBlock = mobileBlocks.find((b) => /\.footer\b/.test(b.selector));
    expect(footerBlock).toBeDefined();
    expect(footerBlock!.body).toMatch(/margin-bottom\s*:[^;]*var\(--modal-footer-pad-bottom\)/);
    expect(footerBlock!.body).not.toMatch(/margin-bottom\s*:\s*-20px/);
    expect(footerBlock!.body).not.toMatch(/\bbottom\s*:\s*-20px/);
  });

  it('T3: los tres .mobileDrawerContainer no tienen padding inferior distinto de 0 en mobile', () => {
    for (const css of [txFilterCss, trFilterCss, anFilterCss]) {
      const baseBodies = findRuleBodies(css, /^\.mobileDrawerContainer$/);
      const mobileBlocks = extractMobileMediaBlocks(css).filter((b) => /\.mobileDrawerContainer\b/.test(b.selector));
      const allBodies = [...baseBodies, ...mobileBlocks.map((b) => b.body)];
      expect(allBodies.length).toBeGreaterThan(0);
      let resolvedBottom: string | null = null;
      for (const body of allBodies) {
        const b = getBottomPadding(body);
        if (b !== null) resolvedBottom = b;
      }
      expect(resolvedBottom).toMatch(/^0(?:px)?$/);
    }
  });

  it('T4: DateInput y TimeInput usan var(--modal-footer-pad-bottom) solo en el pie de la hoja mobile y no en el popover', () => {
    const datePopoverFooter = findRuleBodies(dateCss, /^\.calendarFooter$/).join('\n');
    const dateSheetFooter = findRuleBodies(dateCss, /\.calendarFooterSheet/).join('\n');
    expect(datePopoverFooter).not.toContain('--modal-footer-pad-bottom');
    expect(dateSheetFooter).toMatch(/padding-bottom\s*:\s*var\(--modal-footer-pad-bottom\)/);
    expect(dateTsx).toContain('renderFooter(true)');
    expect(dateTsx).toContain('renderFooter(false)');

    const timePopoverFooter = findRuleBodies(timeCss, /^\.pickerFooter$/).join('\n');
    const timeSheetFooter = findRuleBodies(timeCss, /\.bottomSheetContent\s+\.pickerFooter/).join('\n');
    const timeSheetContainer = findRuleBodies(timeCss, /\.bottomSheetContent\s+\.wheelPickerContainer/).join('\n');
    expect(timePopoverFooter).not.toContain('--modal-footer-pad-bottom');
    expect(timeSheetFooter).toMatch(/padding-bottom\s*:\s*var\(--modal-footer-pad-bottom\)/);
    expect(getBottomPadding(timeSheetContainer)).toMatch(/^0(?:px)?$/);
  });

  it('T5: PagarResumenModal.tsx usa "Otro monto" y no "Ingresar otro monto"', () => {
    expect(pagarTsx).toContain("'Otro monto'");
    expect(pagarTsx).not.toContain('Ingresar otro monto');
  });
});

describe('FS1G: pie pegajoso (position: sticky) en modal de notificaciones y modales en general', () => {
  const srcRoot = path.resolve(__dirname, '../../..');
  const notifCss = fs.readFileSync(
    path.join(srcRoot, 'components/notificaciones/NotificacionesConfigModal.module.css'),
    'utf-8'
  );

  function walkCss(dir: string): string[] {
    let out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(walkCss(full));
      else if (entry.name.endsWith('.css')) out.push(full);
    }
    return out;
  }

  function extractRawRuleBlocks(css: string): Array<{ selector: string; rawBody: string; cleanBody: string }> {
    const blocks: Array<{ selector: string; rawBody: string; cleanBody: string }> = [];
    let i = 0;
    const n = css.length;
    while (i < n) {
      if (css[i] === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2);
        i = end === -1 ? n : end + 2;
        continue;
      }
      const open = css.indexOf('{', i);
      if (open === -1) break;
      const selector = css.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      let depth = 1;
      let j = open + 1;
      while (j < n && depth > 0) {
        if (css[j] === '/' && css[j + 1] === '*') {
          const end = css.indexOf('*/', j + 2);
          j = end === -1 ? n : end + 2;
          continue;
        }
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const rawBody = css.slice(open + 1, j - 1);
      if (selector.startsWith('@media') || selector.startsWith('@supports')) {
        blocks.push(...extractRawRuleBlocks(rawBody));
      } else {
        blocks.push({
          selector,
          rawBody,
          cleanBody: rawBody.replace(/\/\*[\s\S]*?\*\//g, ''),
        });
      }
      i = j;
    }
    return blocks;
  }

  function extractMobileMediaBlocks(css: string): Array<{ selector: string; body: string }> {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const out: Array<{ selector: string; body: string }> = [];
    const mediaRe = /@media\s*\([^)]*max-width\s*:\s*767\.98px[^)]*\)\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = mediaRe.exec(clean)) !== null) {
      let depth = 1;
      let i = m.index + m[0].length;
      while (i < clean.length && depth > 0) {
        if (clean[i] === '{') depth++;
        else if (clean[i] === '}') depth--;
        i++;
      }
      const mediaInner = clean.slice(m.index + m[0].length, i - 1);
      const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
      let rm: RegExpExecArray | null;
      while ((rm = ruleRe.exec(mediaInner)) !== null) {
        out.push({ selector: rm[1].trim(), body: rm[2].trim() });
      }
    }
    return out;
  }

  function getDeclValue(body: string, targetProp: string): string | null {
    const decls = body.split(';').map((d) => d.trim()).filter(Boolean);
    let found: string | null = null;
    for (const decl of decls) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      if (prop === targetProp) {
        found = decl.slice(colon + 1).replace(/!important/gi, '').trim();
      }
    }
    return found;
  }

  it('T1: NotificacionesConfigModal.module.css en @media mobile compensa bottom y margin-bottom con calc(-1 * var(--modal-footer-pad-bottom)) y no usa bottom: 0', () => {
    const baseBlocks = extractRawRuleBlocks(notifCss);
    const baseFooter = baseBlocks.find((b) => /^\.footer$/.test(b.selector));
    expect(baseFooter).toBeDefined();
    expect(getDeclValue(baseFooter!.cleanBody, 'position')).toBe('sticky');

    const mobileBlocks = extractMobileMediaBlocks(notifCss);
    const mobileFooter = mobileBlocks.find((b) => /^\.footer$/.test(b.selector));
    expect(mobileFooter).toBeDefined();

    const normalizeExpr = (v: string | null) => (v ?? '').replace(/\s+/g, ' ').trim();
    const expected = 'calc(-1 * var(--modal-footer-pad-bottom))';
    expect(normalizeExpr(getDeclValue(mobileFooter!.body, 'bottom'))).toBe(expected);
    expect(normalizeExpr(getDeclValue(mobileFooter!.body, 'margin-bottom'))).toBe(expected);
    expect(mobileFooter!.body).not.toMatch(/\bbottom\s*:\s*0(?:px)?\s*(?:;|$)/i);
  });

  it('T2: en todos los .css de modales en src/, ninguna regla con position: sticky tiene bottom literal distinto de 0 o en px negativos fijos sin r03-ok', () => {
    const cssFiles = walkCss(srcRoot);
    const offenders: string[] = [];

    for (const file of cssFiles) {
      const rel = path.relative(srcRoot, file).replace(/\\/g, '/');
      if (!/(?:Modal|Dialog|Sheet|Drawer)/i.test(rel)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const blocks = extractRawRuleBlocks(content);
      for (const blk of blocks) {
        const pos = getDeclValue(blk.cleanBody, 'position');
        if (pos !== 'sticky') continue;

        const bottom = getDeclValue(blk.cleanBody, 'bottom');
        if (!bottom) continue;

        const isZero = /^0(?:px|em|rem|%)?$/i.test(bottom);
        const usesVarOrEnv = /\b(?:var|env)\s*\(/i.test(bottom);
        const hasNegativeFixedPx = /-\d+(?:\.\d+)?px\b/i.test(bottom);
        const isLiteralNonZero = !isZero && !usesVarOrEnv;

        if ((isLiteralNonZero || hasNegativeFixedPx) && !/\br03-ok\b/.test(blk.rawBody)) {
          offenders.push(`${rel} [${blk.selector}] -> bottom: ${bottom}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('Handle único y márgenes en bottom sheets (variant="sheet")', () => {
  const srcRoot = path.resolve(__dirname, '../../..');
  const modalTsx = fs.readFileSync(path.join(__dirname, 'Modal.tsx'), 'utf-8');
  const moreTsx = fs.readFileSync(path.join(srcRoot, 'components/layout/MobileBottomNav/MobileMoreSheet.tsx'), 'utf-8');
  const moreCss = fs.readFileSync(path.join(srcRoot, 'components/layout/MobileBottomNav/MobileMoreSheet.module.css'), 'utf-8');
  const dashTsx = fs.readFileSync(path.join(srcRoot, 'pages/app/dashboard/DashboardPage.tsx'), 'utf-8');
  const dashCss = fs.readFileSync(path.join(srcRoot, 'pages/app/dashboard/DashboardPage.parte3.css'), 'utf-8');

  it('Modal.tsx centraliza el sheetHandle único y MobileMoreSheet no duplica handle propio', () => {
    expect(modalTsx).toContain('styles.sheetHandle');
    expect(moreTsx).toContain('variant="sheet"');
    expect(moreTsx).not.toContain('handleContainer');
    expect(moreTsx).not.toContain('styles.handle');
    expect(moreCss).not.toMatch(/\.handle(?:Container)?\b/);
  });

  it('MobileMoreSheet delega padding y scroll único al Modal base (sin noPadding)', () => {
    expect(moreTsx).not.toContain('noPadding');
    expect(moreCss).not.toMatch(/\.sheetInner\s*\{[^}]*padding\s*:/);
  });

  it('Mi Cuenta (DashboardPage) agrupa sus opciones con data-modal-options y :focus-visible', () => {
    expect(dashTsx).toContain('title="Mi Cuenta"');
    expect(dashTsx).toContain('<div data-modal-options>');
    expect(dashCss).toMatch(/\.profileSheetItem:focus-visible/);
  });
});
