#!/usr/bin/env node
/**
 * scripts/audit-design-rules.mjs
 * Auditoría automática de reglas de diseño unificado en Argentum.
 * Reglas de R01 a R14. Línea base estricta que solo puede bajar.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Escala permitida para R08 (gap en px)
const GAPS_PERMITIDOS = new Set([0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48]);

// Escala permitida para R15 (@media min/max-width/height en px)
const BREAKPOINTS_PERMITIDOS = new Set([
  360, 479, 480, 639, 640, 719, 720, 767, 768, 1023, 1024, 1279, 1280, 1439, 1440, 1919, 1920, 2559, 2560,
]);

// Nombres y descripciones de reglas fijas
export const RULE_DEFS = {
  R01: 'z-index con literal >= 100 fuera de var(--z-*) o negativo (0-99 permitido para orden local)',
  R02: 'border-radius con 24px en cualquier forma',
  R03: 'Margen negativo sin comentario r03-ok válido (solapamiento, sangrado, alineación óptica)',
  R04: 'box-shadow con valor propio (distinto de var(--elevation-*), none, inherit o unset)',
  R05: 'box-shadow con !important',
  R06: 'cubic-bezier con rebote (y1 o y2 mayor a 1)',
  R07: 'border-top distinto de none/0 dentro de selector footer',
  R08: 'gap, row-gap o column-gap en px fuera de la escala {0,2,4,6,8,12,16,20,24,32,40,48}',
  R09: 'overflow-x: hidden !important',
  R10: 'Cantidad total de !important',
  R11: 'Componente modal/dialog/drawer/sheet TSX que no usa ni importa ui/Modal',
  R12: 'Definiciones de selectores heredados (.segmented*, .methodGrid, etc.) fuera de SegmentedControl',
  R13: 'Definición de .stepDots en CSS (meta de unificación: 1)',
  R14: 'Infracciones en SegmentedControl.module.css (transform, !important, margen negativo, z-index, etc.)',
  R15: '@media con (min|max)-(width|height) en px fuera de la escala permitida',
  R16: 'text-overflow: ellipsis o overflow: hidden en .label, .description o .pill de SegmentedControl',
  R17: 'width o max-width >= 300px con !important en CSS',
  R18: 'height o min-height en px >= 120 dentro de selectores con Step, slide, slidesContainer, modalRoot o formBody',
  R19: 'unidad vh (no dvh) en height, min-height o max-height en CSS',
  R20: 'en CSS de modales/hojas, clases de formulario/campo/grupo/sección/bloque/fila/body/contenido con margin-top, margin-bottom, gap o row-gap en px distinto de 8, 16 o 24 (o sin var(--modal-*))',
  R21: 'contenedor con overflow que recorta cuyo padding es menor que el alcance de la sombra o levantamiento de lo que contiene (análisis estático best effort)',
  R22: 'TSX que usa el Modal base y contiene elementos de formulario sin ningún data-modal-block',
  R23: 'Selectores de carrusel/card de billetera (.billeterasCarousel*, .billeteraSelectWrap, .tarjetaSelectWrap, :global(.wc, :global(.chip) fuera de Modal base y BilleteraCard/RealCardPreview',
  R24: 'Renderers de movimientos que dibujan SubcategoriaIcon/CategoriaIcon directamente dentro de un .map de transacciones/movimientos/cuotas fuera de MovimientoAvatar',
  R25: 'Renderers de movimientos que dibujan íconos específicos (ArrowDownLeft, etc.) directamente dentro de un .map de transacciones/movimientos/cuotas fuera de MovimientoAvatar',
  R26: 'data-modal-stack en un contenedor que tenga como hijo un header o footer del modal',
  R27: 'estilo inline con margin/padding vertical dentro de un modal',
  R28: 'outline: none o outline: 0 sin :focus-visible equivalente en el mismo módulo CSS (ui/ y layout/)',
  R29: 'transition: all o transition-property: all en componentes ui/ o layout/',
  R30: 'animation o transition en ui/ o layout/ sin cobertura por @media (prefers-reduced-motion: reduce)',
  R31: 'regla :hover con transform/scale/translate fuera de @media (hover: hover) en ui/ o layout/',
};

// Eliminar comentarios de CSS para análisis limpio
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Parser de bloques CSS con contador de llaves (sin retroceso de regex)
function parseCssBlocks(css) {
  const blocks = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const braceOpen = css.indexOf('{', i);
    if (braceOpen === -1) break;
    const selector = css.substring(i, braceOpen).trim();
    let depth = 1;
    let j = braceOpen + 1;
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const body = css.substring(braceOpen + 1, j - 1);
    blocks.push({ selector, body });
    if (body.includes('{')) {
      blocks.push(...parseCssBlocks(body));
    }
    i = j;
  }
  return blocks;
}

// Analizar archivo CSS
function auditCssFile(filePath, relPath, content) {
  const violations = {
    R01: 0, R02: 0, R03: 0, R04: 0, R05: 0,
    R06: 0, R07: 0, R08: 0, R09: 0, R10: 0,
    R11: 0, R12: 0, R13: 0, R14: 0,
    R15: 0, R16: 0, R17: 0, R18: 0, R19: 0,
    R20: 0, R21: 0, R22: 0, R23: 0, R24: 0, R25: 0,
    R26: 0, R27: 0, R28: 0, R29: 0, R30: 0, R31: 0,
  };

  const isSegmentedControl = relPath.endsWith('SegmentedControl.module.css');
  const cleanContent = stripCssComments(content);

  // R10: Total de !important
  const importantMatches = cleanContent.match(/!important/g);
  if (importantMatches) {
    violations.R10 = importantMatches.length;
  }

  // R09: overflow-x: hidden !important
  const r09Matches = cleanContent.match(/overflow-x\s*:\s*hidden\s*!important/gi);
  if (r09Matches) {
    violations.R09 = r09Matches.length;
  }

  // R06: cubic-bezier con y1 o y2 > 1
  const bezierRegex = /cubic-bezier\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g;
  let bMatch;
  while ((bMatch = bezierRegex.exec(cleanContent)) !== null) {
    const y1 = parseFloat(bMatch[2]);
    const y2 = parseFloat(bMatch[4]);
    if (y1 > 1 || y2 > 1) {
      violations.R06++;
    }
  }

  // R13: define .stepDots (excluye la definición canónica de src/components/ui/Modal/Modal.module.css)
  const isModalCanonical = relPath.endsWith('components/ui/Modal/Modal.module.css') || relPath.endsWith('Modal/Modal.module.css');
  if (!isModalCanonical && /\.stepDots\b/.test(cleanContent)) {
    violations.R13 = 1;
  }

  // R12: clases heredadas de selector fuera de SegmentedControl.module.css
  if (!isSegmentedControl) {
    const r12Regex = /\.(segmented[a-zA-Z0-9_-]*|methodGrid|timingGrid|planGrid|networkGrid|catGrid|tabsContainer|tabBtn)\b/g;
    const r12Matches = cleanContent.match(r12Regex);
    if (r12Matches) {
      violations.R12 = r12Matches.length;
    }
  }

  // R03: margen negativo sin comentario r03-ok válido (Decisión 7)
  const lines = content.split('\n');
  let inMultiComment = false;
  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const stripped = rawLine.trim();
    if (stripped.includes('/*') && !stripped.includes('*/')) {
      inMultiComment = true;
      continue;
    }
    if (inMultiComment) {
      if (stripped.includes('*/')) inMultiComment = false;
      continue;
    }
    const lineNoComment = rawLine.replace(/\/\*(?!.*r03-ok)[\s\S]*?\*\//g, '');
    const m = /(?:^|[;\s])(margin(?:-[a-z]+)?)\s*:\s*([^;!}]+)/i.exec(lineNoComment);
    if (m) {
      const prop = m[1].toLowerCase();
      const val = m[2].trim();
      if (!prop.includes('collapse')) {
        const isNeg = /-\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|dvh|cqi)?\b/.test(val) ||
                      val.includes('calc(-1') ||
                      (val.includes('clamp(') && val.includes('-'));
        if (isNeg) {
          let hasValidComment = false;
          const mCurr = /\/\*\s*r03-ok:\s*([^*/]+?)\s*\*\//.exec(rawLine);
          if (mCurr && mCurr[1].trim().length >= 15) {
            hasValidComment = true;
          } else {
            let lookBack = idx - 1;
            while (lookBack >= 0 && !lines[lookBack].trim()) lookBack--;
            if (lookBack >= 0) {
              const mPrev = /\/\*\s*r03-ok:\s*([^*/]+?)\s*\*\//.exec(lines[lookBack]);
              if (mPrev && mPrev[1].trim().length >= 15) {
                hasValidComment = true;
              }
            }
          }
          if (!hasValidComment) {
            violations.R03++;
          }
        }
      }
    }
  }

  // Analizar bloques y reglas CSS
  // Separamos bloques selector { cuerpo }
  const ruleBlockRegex = /([^{}]+)\{([^{}]+)\}/g;
  let blockMatch;
  while ((blockMatch = ruleBlockRegex.exec(cleanContent)) !== null) {
    const selector = blockMatch[1].trim();
    const body = blockMatch[2];

    // R07: border-top distinto de none/0 en selector con 'footer'
    if (/footer/i.test(selector)) {
      const borderTopMatch = body.match(/(?:^|[;\s])border-top\s*:\s*([^;!}]+)/i);
      if (borderTopMatch) {
        const val = borderTopMatch[1].trim().toLowerCase();
        if (val !== 'none' && val !== '0' && val !== '0px') {
          violations.R07++;
        }
      }
    }

    // Declaraciones dentro del cuerpo del bloque
    const declarations = body.split(';');
    for (const rawDecl of declarations) {
      const decl = rawDecl.trim();
      if (!decl) continue;

      const colonIdx = decl.indexOf(':');
      if (colonIdx === -1) continue;

      const prop = decl.substring(0, colonIdx).trim().toLowerCase();
      const val = decl.substring(colonIdx + 1).trim();

      // R01: z-index (Decisión 7: 0-99 permitido para orden local; >= 100 requiere var(--z-*); negativos fuera de escala)
      if (prop === 'z-index') {
        const cleanVal = val.replace(/!important/g, '').trim();
        const isVarZ = /^var\(--z-[a-z0-9-]+\)$/i.test(cleanVal);
        const standardKeywords = new Set(['auto', 'inherit', 'initial', 'unset']);
        if (!isVarZ && !standardKeywords.has(cleanVal)) {
          const num = Number(cleanVal);
          if (Number.isInteger(num) && num >= -1 && num <= 99) {
            // Válido: entero -1 a 99 para orden local
          } else {
            violations.R01++;
          }
        }
      }

      // R02: border-radius con 24px
      if (prop.startsWith('border-') && prop.includes('radius')) {
        if (/\b24px\b/i.test(val)) {
          violations.R02++;
        }
      }

      // R04 & R05: box-shadow
      if (prop === 'box-shadow') {
        // R05: con !important
        if (/!important/i.test(decl)) {
          violations.R05++;
        }
        // R04: valor propio
        const cleanVal = val.replace(/!important/g, '').trim();
        const isAllowed = cleanVal.includes('var(--elevation-') ||
                          cleanVal.includes('var(--focus-ring') ||
                          ['none', 'inherit', 'initial', 'unset'].includes(cleanVal);
        if (!isAllowed) {
          violations.R04++;
        }
      }

      // R08: gap, row-gap, column-gap en px fuera de escala
      if (prop === 'gap' || prop === 'row-gap' || prop === 'column-gap') {
        const cleanVal = val.replace(/!important/g, '').trim();
        const pxMatches = cleanVal.match(/(\d+)px/g);
        if (pxMatches) {
          let hasInvalidGap = false;
          for (const pxStr of pxMatches) {
            const num = parseInt(pxStr.replace('px', ''), 10);
            if (!GAPS_PERMITIDOS.has(num)) {
              hasInvalidGap = true;
              break;
            }
          }
          if (hasInvalidGap) {
            violations.R08++;
          }
        }
      }
    }
  }

  // R14: Reglas específicas para SegmentedControl.module.css
  if (isSegmentedControl) {
    let r14Count = 0;
    // transform
    if (/(?:^|[;\s])transform\s*:/i.test(cleanContent)) r14Count++;
    // !important
    if (/!important/i.test(cleanContent)) r14Count++;
    // margen negativo
    if (/(?:^|[;\s])margin(?:-[a-z]+)?\s*:[^;}]*-\d/i.test(cleanContent)) r14Count++;
    // z-index
    if (/(?:^|[;\s])z-index\s*:/i.test(cleanContent)) r14Count++;
    // box-shadow que no sea var(--elevation-pill)
    const bsMatches = cleanContent.match(/(?:^|[;\s])box-shadow\s*:\s*([^;!}]+)/gi);
    if (bsMatches) {
      for (const bs of bsMatches) {
        const val = bs.replace(/box-shadow\s*:\s*/i, '').trim();
        if (val !== 'var(--elevation-pill)' && val !== 'none') {
          r14Count++;
        }
      }
    }
    violations.R14 = r14Count;
  }

  // R15: @media con (min|max)-(width|height) cuyo valor en px no está en la escala permitida
  const mediaCondRegex = /@media\s+([^{]+)\{/g;
  let mMatch;
  while ((mMatch = mediaCondRegex.exec(cleanContent)) !== null) {
    const cond = mMatch[1];
    const pxRegex = /(?:min|max)-(?:width|height)\s*:\s*(\d+)px/gi;
    let pMatch;
    while ((pMatch = pxRegex.exec(cond)) !== null) {
      const val = parseInt(pMatch[1], 10);
      if (!BREAKPOINTS_PERMITIDOS.has(val)) {
        violations.R15++;
      }
    }
  }

  // R16: text-overflow: ellipsis o overflow: hidden dentro de .label, .description o .pill en SegmentedControl.module.css
  if (isSegmentedControl) {
    const blocks = parseCssBlocks(cleanContent);
    for (const b of blocks) {
      if (/(?:^|[,\s])\.(?:label|description|pill)\b/.test(b.selector)) {
        const toMatches = b.body.match(/text-overflow\s*:\s*ellipsis/gi);
        if (toMatches) violations.R16 += toMatches.length;
        const ovMatches = b.body.match(/overflow(?:-[xy])?\s*:\s*hidden/gi);
        if (ovMatches) violations.R16 += ovMatches.length;
      }
    }
  }

  // R17: width: <N>px !important o max-width: <N>px !important con N >= 300 en cualquier CSS
  const r17Regex = /(?:^|[;\s])(?:width|max-width)\s*:\s*(\d+)px\s*!important/gi;
  let r17Match;
  while ((r17Match = r17Regex.exec(cleanContent)) !== null) {
    const pxVal = parseInt(r17Match[1], 10);
    if (pxVal >= 300) {
      violations.R17++;
    }
  }

  // R18 & R19 con contador de llaves (parseCssBlocks)
  const cssBlocks = parseCssBlocks(cleanContent);
  for (const block of cssBlocks) {
    const sel = block.selector;
    if (sel.startsWith('@keyframes') || sel.startsWith('@font-face')) continue;

    // Declaraciones dentro del cuerpo del bloque
    const declarations = block.body.split(';');
    for (const rawDecl of declarations) {
      const decl = rawDecl.trim();
      if (!decl) continue;
      const colonIdx = decl.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = decl.substring(0, colonIdx).trim().toLowerCase();
      const val = decl.substring(colonIdx + 1).trim();

      // R18: height o min-height en px >= 120 dentro de selectores con Step, slide, slidesContainer, modalRoot o formBody
      // Excluir billeteraSelectWrap, tarjetaSelectWrap, cropArea y cropCanvas con comprobación por nombre de clase
      if (prop === 'height' || prop === 'min-height') {
        const matchesSelector = /(?:Step|slide|slidesContainer|modalRoot|formBody)/i.test(sel);
        const isExcluded = /(?:billeteraSelectWrap|tarjetaSelectWrap|cropArea|cropCanvas)/.test(sel);
        if (matchesSelector && !isExcluded) {
          const pxMatches = val.match(/\b(\d+)px\b/g);
          if (pxMatches) {
            for (const pxStr of pxMatches) {
              const num = parseInt(pxStr.replace('px', ''), 10);
              if (num >= 120) {
                violations.R18++;
              }
            }
          }
        }
      }

      // R19: unidad vh (no dvh) en height, min-height o max-height de cualquier CSS
      if (prop === 'height' || prop === 'min-height' || prop === 'max-height') {
        if (/(?<![dsl])vh\b/i.test(val)) {
          violations.R19++;
        }
      }
    }
  }


  // R20: Espaciado no canónico en CSS de modales/hojas
  const isModalCss = /(?:Modal|Dialog|Sheet|Drawer)/i.test(relPath);
  if (isModalCss && !relPath.endsWith('Modal.module.css')) {
    const modalBlocks = parseCssBlocks(cleanContent);
    const targetSelectorRegex = /(?:form|field|group|seccion|section|block|bloque|fila|body|content|contenido)/i;
    for (const b of modalBlocks) {
      if (targetSelectorRegex.test(b.selector)) {
        const decls = b.body.split(';');
        for (const rawDecl of decls) {
          const decl = rawDecl.trim();
          if (!decl) continue;
          const colonIdx = decl.indexOf(':');
          if (colonIdx === -1) continue;
          const prop = decl.substring(0, colonIdx).trim().toLowerCase();
          const val = decl.substring(colonIdx + 1).trim();
          if (['margin-top', 'margin-bottom', 'gap', 'row-gap'].includes(prop)) {
            // Permitir vars oficiales y 0
            if (val.includes('var(--modal-') || val.includes('var(--space-') || val === '0' || val === '0px' || val === 'none') {
              continue;
            }
            const pxMatches = val.match(/(\d+)px/g);
            if (pxMatches) {
              for (const pxStr of pxMatches) {
                const num = parseInt(pxStr.replace('px', ''), 10);
                if (![0, 8, 16, 24].includes(num)) {
                  violations.R20++;
                }
              }
            }
          }
        }
      }
    }
  }

  // R21: Contenedor con overflow que recorta cuyo padding es menor al alcance de sombra/levantamiento
  const overflowBlocks = parseCssBlocks(cleanContent);
  for (const b of overflowBlocks) {
    const hasOverflowClip = /(?:^|[;\s])overflow(?:-[xy])?\s*:\s*(?:hidden|auto|scroll|clip)/i.test(b.body);
    if (hasOverflowClip) {
      const hasShadowOrLift = /(?:box-shadow|--elevation-|transform\s*:|scale\()/i.test(b.body);
      const hasPadding = /(?:^|[;\s])(?:padding|scroll-padding|padding-inline|padding-block)\s*:/i.test(b.body);
      // Si el mismo contenedor tiene desborde que recorta y tiene sombra/levantamiento interno sin padding/scroll-padding suficiente
      if (hasShadowOrLift && !hasPadding) {
        // Excluir resets y utilitarios globales
        if (!b.selector.includes('html') && !b.selector.includes('body') && !b.selector.includes(':root')) {
          violations.R21++;
        }
      }
    }
  }

  // R23: Selectores de carrusel / card de billetera fuera de Modal base y BilleteraCard/RealCardPreview
  const isAllowedR23 = relPath.endsWith('Modal.module.css') ||
                       relPath.endsWith('BilleteraCard.module.css') ||
                       relPath.endsWith('RealCardPreview.module.css') ||
                       relPath.endsWith('RealCardPreview.css');
  if (!isAllowedR23) {
    const r23Matches = cleanContent.match(/\.billeterasCarousel|\.billeteraSelectWrap|\.tarjetaSelectWrap|:global\(\.wc|:global\(\.chip/g);
    if (r23Matches) {
      violations.R23 = r23Matches.length;
    }
  }

  // Reglas de Fase fv3n (componentes base ui/ y layout/)
  const isUiOrLayout = relPath.startsWith('components/ui/') || relPath.startsWith('components/layout/') || relPath.startsWith('components\\ui\\') || relPath.startsWith('components\\layout\\');
  const isExemptFv3n = relPath.includes('SegmentedControl');

  if (isUiOrLayout && !isExemptFv3n) {
    // R28: outline: none o 0 sin :focus-visible en el mismo módulo
    const hasOutlineNone = /(?:^|[;\s])outline\s*:\s*(?:none|0)(?:[;\s]|$)/i.test(cleanContent);
    if (hasOutlineNone) {
      const hasFocusVisible = cleanContent.includes(':focus-visible');
      if (!hasFocusVisible) {
        violations.R28++;
      }
    }

    // R29: transition: all o transition-property: all en ui/ o layout/
    const r29Matches = cleanContent.match(/(?:transition|transition-property)\s*:\s*all\b/gi);
    if (r29Matches) {
      violations.R29 += r29Matches.length;
    }

    // R30: animation o transition sin prefers-reduced-motion
    const strippedMotion = cleanContent
      .replace(/animation\s*:\s*none(?:\s*!important)?/gi, '')
      .replace(/transition\s*:\s*none(?:\s*!important)?/gi, '');
    const hasActiveMotion = /(?:transition\s*:\s*(?!0s\b|0ms\b)[^;]+|animation\s*:\s*[^;]+)/i.test(strippedMotion);
    if (hasActiveMotion) {
      const hasReducedMotion = /@media[^{]*prefers-reduced-motion/i.test(cleanContent);
      if (!hasReducedMotion) {
        violations.R30++;
      }
    }

    // R31: regla :hover con transform/scale/translate fuera de @media (hover: hover)
    violations.R31 += checkHoverTransformOutsideMedia(cleanContent);
  }

  return violations;
}

// Helper para R31: verifica si existen reglas :hover con transform/scale/translate fuera de @media (hover: hover)
function checkHoverTransformOutsideMedia(css) {
  let violationsCount = 0;
  let i = 0;
  const n = css.length;
  while (i < n) {
    const braceOpen = css.indexOf('{', i);
    if (braceOpen === -1) break;
    const header = css.substring(i, braceOpen).trim();
    let depth = 1;
    let j = braceOpen + 1;
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const body = css.substring(braceOpen + 1, j - 1);
    if (header.startsWith('@media')) {
      const isHoverMedia = /hover\s*:\s*hover/i.test(header);
      if (!isHoverMedia) {
        violationsCount += checkHoverTransformOutsideMedia(body);
      }
    } else {
      if (header.includes(':hover')) {
        const hasTransform = /(?:^|[;\s])(?:transform\s*:|scale\(|translate)/i.test(body);
        if (hasTransform) {
          violationsCount++;
        }
      }
    }
    i = j;
  }
  return violationsCount;
}

// Analizar archivo TSX
function auditTsxFile(filePath, relPath, content) {
  const violations = {
    R01: 0, R02: 0, R03: 0, R04: 0, R05: 0,
    R06: 0, R07: 0, R08: 0, R09: 0, R10: 0,
    R11: 0, R12: 0, R13: 0, R14: 0,
    R15: 0, R16: 0, R17: 0, R18: 0, R19: 0,
    R20: 0, R21: 0, R22: 0, R23: 0, R24: 0, R25: 0,
    R26: 0, R27: 0, R28: 0, R29: 0, R30: 0, R31: 0,
  };

  const fileName = path.basename(filePath);
  const isModalCandidate = /Modal|Dialog|Drawer|Sheet/.test(fileName);
  const isCanonicalModal = relPath.endsWith('ui/Modal/Modal.tsx') || relPath.endsWith('ui\\Modal\\Modal.tsx');
  const usesModal = content.includes('<Modal') || content.includes('ui/Modal') || content.includes('@/components/ui/Modal');

  // R11: Modales y hojas propios que no usan Modal canónico (endurecido)
  if (!isCanonicalModal) {
    if (isModalCandidate && !usesModal) {
      violations.R11 = 1;
    } else if (content.includes('createPortal(') && !usesModal) {
      const hasInteractiveContent = /<form|<input|<button|<select|<textarea|role="dialog"/i.test(content);
      if (hasInteractiveContent) {
        violations.R11 = 1;
      }
    }
  }

  // R22: TSX que usa el Modal base y contiene elementos de formulario sin ningún data-modal-block
  if (usesModal && !isCanonicalModal) {
    const hasFormElements = /<(?:input|select|textarea|MontoInput|DateInput|TimeInput|SelectInput|PhoneCountrySelect|ColorPicker|SegmentedControl)\b/.test(content);
    if (hasFormElements && !content.includes('data-modal-block')) {
      violations.R22 = 1;
    }
  }

  // R24: Renderers de movimientos con SubcategoriaIcon/CategoriaIcon directamente en .map fuera de MovimientoAvatar
  const isExemptR24 = relPath.includes('MovimientoAvatar') ||
                      relPath.includes('GrupoCuotasAvatar') ||
                      relPath.includes('SubcategoriaIcon') ||
                      relPath.includes('CategoriaIcon') ||
                      relPath.includes('Chart') ||
                      relPath.includes('Selector') ||
                      relPath.includes('importacion');
  if (!isExemptR24) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('.map(') && /(?:transaccion|movimiento|cuota|grupo)/i.test(line)) {
        const nextLines = lines.slice(i, Math.min(i + 35, lines.length)).join('\n');
        if ((nextLines.includes('<SubcategoriaIcon') || nextLines.includes('<CategoriaIcon')) && !nextLines.includes('<MovimientoAvatar')) {
          violations.R24++;
        }
      }
    }
  }

  // R25: Renderers de movimientos con íconos directos (ArrowDownLeft, etc.) en .map fuera de MovimientoAvatar
  const isExemptR25 = relPath.includes('MovimientoAvatar') ||
                      relPath.includes('GrupoCuotasAvatar') ||
                      relPath.includes('TransaccionRow') ||
                      relPath.includes('MovimientoRow') ||
                      relPath.includes('Chart') ||
                      relPath.includes('Selector') ||
                      relPath.includes('importacion');
  if (!isExemptR25) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('.map(') && /(?:transaccion|movimiento|cuota|grupo)/i.test(line)) {
        const nextLines = lines.slice(i, Math.min(i + 35, lines.length)).join('\n');
        const hasDirectIcon = /<(?:ArrowDownLeft|ArrowUpRight|ArrowDown|ArrowUp|CreditCard|TrendingUp|TrendingDown|Trophy|DollarSign)\b/.test(nextLines);
        if (hasDirectIcon && !nextLines.includes('<MovimientoAvatar') && !nextLines.includes('<GrupoCuotasAvatar')) {
          violations.R25++;
        }
      }
    }
  }

  // R26: data-modal-stack en un contenedor que tenga como hijo un header o footer del modal
  if (content.includes('data-modal-stack')) {
    const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function checkR26(node) {
      if (ts.isJsxElement(node)) {
        let hasStack = false;
        for (const attr of node.openingElement.attributes.properties) {
          if (ts.isJsxAttribute(attr) && attr.name && attr.name.getText(sf) === 'data-modal-stack') {
            hasStack = true;
            break;
          }
        }
        if (hasStack) {
          for (const child of node.children) {
            if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
              const open = ts.isJsxElement(child) ? child.openingElement : child;
              const tag = open.tagName.getText(sf);
              let cls = '';
              for (const ca of open.attributes.properties) {
                if (ts.isJsxAttribute(ca) && ca.name && ca.name.getText(sf) === 'className' && ca.initializer) {
                  cls = ca.initializer.getText(sf).toLowerCase();
                }
              }
              const isHeader = tag === 'ModalHeader' || /(?:modal|form|step|sheet|picker|dialog)header/i.test(cls) || (tag === 'h2');
              const isFooter = tag === 'ModalFooter' || /(?:modal|form|step|sheet|picker|dialog)footer/i.test(cls) || /(?:actionsrow|draweractions)/i.test(cls);
              if (isHeader || isFooter) {
                violations.R26++;
              }
            }
          }
        }
      }
      ts.forEachChild(node, checkR26);
    }
    checkR26(sf);
  }

  // R27: estilo inline con margin/padding vertical dentro de un modal
  const isExcludedR27 = /Page|Layout|Provider|Chart/.test(fileName);
  if (isModalCandidate && !isCanonicalModal && !isExcludedR27) {
    const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function checkR27(node) {
      if (ts.isJsxAttribute(node) && node.name && node.name.getText(sf) === 'style' && node.initializer) {
        const text = node.initializer.getText(sf);
        if (/(?:margin(?:Top|Bottom)?|padding(?:Top|Bottom)?)\s*:/i.test(text)) {
          violations.R27++;
        }
      }
      ts.forEachChild(node, checkR27);
    }
    checkR27(sf);
  }

  return violations;
}

// Recorrer directorio recursivamente
function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        results.push(...collectFiles(fullPath));
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.css') || entry.name.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// Función principal
export function runAudit(options = {}) {
  const rootDir = options.root ? path.resolve(options.root) : path.join(REPO_ROOT, 'src');
  const baselinePath = options.baseline
    ? path.resolve(options.baseline)
    : (options.root
        ? path.join(rootDir, 'design-rules-baseline.json')
        : path.join(REPO_ROOT, 'scripts', 'design-rules-baseline.json'));

  const files = collectFiles(rootDir);
  const auditResults = {};
  const totalViolations = {};
  for (const rule of Object.keys(RULE_DEFS)) {
    totalViolations[rule] = 0;
  }

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    let content;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    let fileViolations;
    if (file.endsWith('.css')) {
      fileViolations = auditCssFile(file, relPath, content);
    } else if (file.endsWith('.tsx')) {
      fileViolations = auditTsxFile(file, relPath, content);
    } else {
      continue;
    }

    let hasAnyViolation = false;
    for (const [rule, count] of Object.entries(fileViolations)) {
      if (count > 0) {
        hasAnyViolation = true;
        totalViolations[rule] += count;
      }
    }

    if (hasAnyViolation) {
      auditResults[relPath] = fileViolations;
    }
  }

  return {
    rootDir,
    baselinePath,
    filesCount: files.length,
    totalViolations,
    auditResults,
  };
}

// CLI Execution
function cli() {
  const args = process.argv.slice(2);
  const updateBaseline = args.includes('--update-baseline');
  const showReport = args.includes('--report');

  let customRoot = null;
  const rootIdx = args.indexOf('--root');
  if (rootIdx !== -1 && args[rootIdx + 1]) {
    customRoot = args[rootIdx + 1];
  }

  let customBaseline = null;
  const baseIdx = args.indexOf('--baseline');
  if (baseIdx !== -1 && args[baseIdx + 1]) {
    customBaseline = args[baseIdx + 1];
  }

  const { rootDir, baselinePath, filesCount, totalViolations, auditResults } = runAudit({
    root: customRoot,
    baseline: customBaseline,
  });

  console.log('='.repeat(80));
  console.log('🛡️  AUDITORÍA DE REGLAS DE DISEÑO UNIFICADO — ARGENTUM');
  console.log('='.repeat(80));
  console.log(`Raíz escaneada: ${rootDir}`);
  console.log(`Archivos analizados (.css, .tsx): ${filesCount}`);
  console.log('-'.repeat(80));

  // Imprimir conteos totales
  console.log('CONTEOS TOTALES POR REGLA:');
  for (const [rule, count] of Object.entries(totalViolations)) {
    console.log(`  ${rule}: ${String(count).padStart(5, ' ')} | ${RULE_DEFS[rule]}`);
  }
  console.log('-'.repeat(80));

  if (showReport) {
    console.log('TOP ARCHIVOS POR REGLA:');
    for (const [rule, def] of Object.entries(RULE_DEFS)) {
      const topFiles = Object.entries(auditResults)
        .filter(([, v]) => (v[rule] || 0) > 0)
        .map(([f, v]) => ({ file: f, count: v[rule] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (topFiles.length > 0) {
        console.log(`\n  [${rule}] ${def} (Total: ${totalViolations[rule]}):`);
        for (const item of topFiles) {
          console.log(`    - ${item.file}: ${item.count}`);
        }
      }
    }
    console.log('-'.repeat(80));
  }

  // Manejo de Línea Base
  const baselineExists = fs.existsSync(baselinePath);

  if (updateBaseline) {
    if (!baselineExists) {
      // Escribir primera línea base
      const baselineData = {
        totalViolations,
        files: auditResults,
      };
      fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2), 'utf-8');
      console.log(`✅ Línea base creada exitosamente en: ${baselinePath}`);
      process.exit(0);
    } else {
      // Cargar línea base previa y verificar que NO haya aumentos
      let oldBaseline;
      try {
        oldBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      } catch (err) {
        console.error(`❌ Error al leer línea base previa: ${err.message}`);
        process.exit(1);
      }

      const regressions = [];
      for (const [file, violations] of Object.entries(auditResults)) {
        const oldFileViolations = oldBaseline.files?.[file] || {};
        for (const [rule, count] of Object.entries(violations)) {
          // Solo controlar aumentos para reglas existentes en la línea base previa (R01 a R14)
          // Las reglas nuevas que se agregan en este paso se inicializan en la línea base
          const isNewRule = oldBaseline.totalViolations?.[rule] === undefined;
          if (isNewRule) continue;

          const oldCount = oldFileViolations[rule] || 0;
          // R10 es la cantidad total de !important del repositorio, se evalúa a nivel global
          if (rule === 'R10') continue;

          if (count > oldCount) {
            regressions.push({
              file,
              rule,
              oldCount,
              newCount: count,
              diff: count - oldCount,
            });
          }
        }
      }

      if (totalViolations.R10 > (oldBaseline.totalViolations?.R10 ?? 828)) {
        regressions.push({
          file: 'TOTAL_REPOSITORIO',
          rule: 'R10',
          oldCount: oldBaseline.totalViolations?.R10 ?? 828,
          newCount: totalViolations.R10,
          diff: totalViolations.R10 - (oldBaseline.totalViolations?.R10 ?? 828),
        });
      }

      if (regressions.length > 0) {
        console.error('❌ NO SE PUEDE ACTUALIZAR LA LÍNEA BASE: Se detectaron aumentos/regresiones:');
        for (const r of regressions) {
          console.error(`  - ${r.file} [${r.rule}]: subió de ${r.oldCount} a ${r.newCount} (+${r.diff})`);
        }
        process.exit(1);
      }

      // No hay aumentos: se puede actualizar la línea base (bajada o mantenimiento)
      const baselineData = {
        totalViolations,
        files: auditResults,
      };
      fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2), 'utf-8');
      console.log(`✅ Línea base actualizada exitosamente (sin aumentos) en: ${baselinePath}`);
      process.exit(0);
    }
  }

  // Verificación contra línea base (modo normal)
  if (!baselineExists) {
    // Si no hay línea base, la base es 0 para todo
    const hasAny = Object.values(totalViolations).some((c) => c > 0);
    if (hasAny) {
      console.error(`❌ Fallo: no existe línea base en ${baselinePath} y se encontraron infracciones sobre base 0.`);
      process.exit(1);
    } else {
      console.log('✅ Cero infracciones encontradas (base 0).');
      process.exit(0);
    }
  }

  // Existe línea base: comparar
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  } catch (err) {
    console.error(`❌ Error al leer ${baselinePath}: ${err.message}`);
    process.exit(1);
  }

  const regressions = [];
  for (const [file, violations] of Object.entries(auditResults)) {
    const baseViolations = baseline.files?.[file] || {};
    for (const [rule, count] of Object.entries(violations)) {
      if (rule === 'R10') continue; // R10 se controla a nivel de conteo total de repositorio
      const baseCount = baseViolations[rule] || 0;
      if (count > baseCount) {
        regressions.push({
          file,
          rule,
          baseCount,
          count,
          diff: count - baseCount,
        });
      }
    }
  }

  if (totalViolations.R10 > (baseline.totalViolations?.R10 ?? 828)) {
    regressions.push({
      file: 'TOTAL_REPOSITORIO',
      rule: 'R10',
      baseCount: baseline.totalViolations?.R10 ?? 828,
      count: totalViolations.R10,
      diff: totalViolations.R10 - (baseline.totalViolations?.R10 ?? 828),
    });
  }

  if (regressions.length > 0) {
    console.error(`❌ REGRESIÓN DE REGLAS DE DISEÑO: ${regressions.length} superación(es) detectada(s):`);
    for (const r of regressions) {
      console.error(`  - ${r.file} [${r.rule}]: ${r.count} (línea base permitida: ${r.baseCount}, aumento: +${r.diff})`);
    }
    process.exit(1);
  }

  console.log('✅ Auditoría superada: ningún archivo supera su límite de línea base.');
  process.exit(0);
}

// Ejecutar si es llamado directamente por Node
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  cli();
}
