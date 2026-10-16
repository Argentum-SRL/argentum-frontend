#!/usr/bin/env node
/**
 * scripts/audit-design-rules.mjs
 * Auditoría automática de reglas de diseño unificado en Argentum.
 * Reglas de R01 a R14. Línea base estricta que solo puede bajar.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Escala permitida para R08 (gap en px)
const GAPS_PERMITIDOS = new Set([0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48]);

// Nombres y descripciones de reglas fijas
export const RULE_DEFS = {
  R01: 'z-index con valor literal fuera de escala (-1, 0, 1, 2, 3 o var(--z-*))',
  R02: 'border-radius con 24px en cualquier forma',
  R03: 'Margen negativo (margin o margin-* con valor negativo)',
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
};

// Eliminar comentarios de CSS para análisis limpio
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Analizar archivo CSS
function auditCssFile(filePath, relPath, content) {
  const violations = {
    R01: 0, R02: 0, R03: 0, R04: 0, R05: 0,
    R06: 0, R07: 0, R08: 0, R09: 0, R10: 0,
    R11: 0, R12: 0, R13: 0, R14: 0,
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

  // R13: define .stepDots
  if (/\.stepDots\b/.test(cleanContent)) {
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

      // R01: z-index
      if (prop === 'z-index') {
        const cleanVal = val.replace(/!important/g, '').trim();
        const allowedLiterals = new Set(['0', '1', '2', '3', '-1', 'auto', 'inherit', 'initial', 'unset']);
        const isVarZ = /^var\(--z-[a-z0-9-]+\)$/i.test(cleanVal);
        if (!allowedLiterals.has(cleanVal) && !isVarZ) {
          violations.R01++;
        }
      }

      // R02: border-radius con 24px
      if (prop.startsWith('border-') && prop.includes('radius')) {
        if (/\b24px\b/i.test(val)) {
          violations.R02++;
        }
      }

      // R03: margen negativo
      if (prop === 'margin' || (prop.startsWith('margin-') && !prop.includes('collapse'))) {
        const cleanVal = val.replace(/!important/g, '').trim();
        // Detectar si algun token empieza con signo negativo seguido de digito
        if (/-\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?\b/.test(cleanVal)) {
          violations.R03++;
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

  return violations;
}

// Analizar archivo TSX
function auditTsxFile(filePath, relPath, content) {
  const violations = {
    R01: 0, R02: 0, R03: 0, R04: 0, R05: 0,
    R06: 0, R07: 0, R08: 0, R09: 0, R10: 0,
    R11: 0, R12: 0, R13: 0, R14: 0,
  };

  const fileName = path.basename(filePath);
  const isModalCandidate = /Modal|Dialog|Drawer|Sheet/.test(fileName);
  const isCanonicalModal = relPath.endsWith('ui/Modal/Modal.tsx') || relPath.endsWith('ui\\Modal\\Modal.tsx');

  // R11: Modales propios que no usan Modal canónico
  if (isModalCandidate && !isCanonicalModal) {
    const usesModalTag = content.includes('<Modal');
    const importsModal = content.includes('ui/Modal') || content.includes('@/components/ui/Modal');
    if (!usesModalTag && !importsModal) {
      violations.R11 = 1;
    }
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
          const oldCount = oldFileViolations[rule] || 0;
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
