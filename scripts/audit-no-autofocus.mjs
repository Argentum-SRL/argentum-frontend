#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Closed whitelist of files allowed to call .focus(...)
export const ALLOWED_FOCUS_FILES = [
  'SearchModal.tsx',
  'FilterBar.tsx',
  'GruposCuotasTab.tsx',
  'TransferenciasFilterBar.tsx',
  'BankPickerModal.tsx',
  'EditBilleteraModal.tsx',
  'SegmentedControl.tsx',
  'VerificarEmail.tsx',
];

// Prop-forwarding components allowed to have autoFocus={autoFocus} or autoFocus in prop signatures
export const FORWARDING_COMPONENTS = [
  'src/components/ui/Field/Field.tsx',
  'src/components/ui/MontoInput/MontoInput.tsx',
  'src/components/transacciones/DebitoEnDolares.tsx',
];

// Name editing inputs in D.2 allowed fixed autoFocus
export const ALLOWED_NAME_INPUT_FILES = [
  'src/components/billeteras/BankPickerModal.tsx',
  'src/components/billeteras/EditBilleteraModal.tsx',
];

/**
 * Normaliza una ruta a formato relativo con barras inclinadas '/'
 */
export function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
}

/**
 * Audita el contenido de un único archivo o fragmento de código.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<{ linea: number, tipo: 'autofocus' | 'focus', snippet: string, ruta: string }>}
 */
export const auditarContenido = function(content, filePath = '') {
  const normPath = normalizePath(filePath);
  const baseName = path.basename(normPath);
  const lines = content.split('\n');
  const incidencias = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    // 1. Ignorar comentarios
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // 2. Verificar llamada a .focus(
    if (/\.focus\s*\(/.test(trimmed)) {
      const allowedFocus = ALLOWED_FOCUS_FILES.some(
        (f) => baseName === f || normPath.endsWith(f)
      );
      if (!allowedFocus) {
        incidencias.push({
          linea: lineNum,
          tipo: 'focus',
          snippet: trimmed,
          ruta: normPath,
        });
      }
    }

    // 3. Verificar autoFocus
    if (/\b(?:autoFocus|autofocus)\b/i.test(trimmed)) {
      // Ignorar definiciones de tipos y firmas de funciones en props
      // Ej: autoFocus?: boolean; o { autoFocus = false }: Props
      if (
        /autoFocus\??\s*:/.test(trimmed) ||
        /autoFocus\s*=\s*false\s*[,)]/.test(trimmed) ||
        /autoFocus\s*:\s*boolean/.test(trimmed)
      ) {
        continue;
      }

      // Si es autoFocus={false}, está explícitamente desactivado
      if (/autoFocus\s*=\s*\{\s*false\s*\}/.test(trimmed)) {
        continue;
      }

      // Si contiene esPunteroFino(), está condicionado correctamente a puntero fino (desktop)
      if (trimmed.includes('esPunteroFino()')) {
        continue;
      }

      // Si es un archivo de reenvío de props y tiene autoFocus={autoFocus} o reenvía la prop
      const isForwardingFile = FORWARDING_COMPONENTS.some((f) => normPath.endsWith(f));
      if (isForwardingFile && (/autoFocus=\{autoFocus\}/.test(trimmed) || /autoFocus\s*[,}]/.test(trimmed) || /autoFocus\s*\/>/.test(trimmed))) {
        continue;
      }

      // Si es uno de los dos inputs de nombre de D.2 (BankPickerModal o EditBilleteraModal)
      const isNameInputFile = ALLOWED_NAME_INPUT_FILES.some((f) => normPath.endsWith(f));
      if (isNameInputFile) {
        // En estos modales, el input de nombre tiene autoFocus fijo para edición inmediata
        // Revisar contexto inmediato
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join('\n');
        if (
          context.includes('nameInputRef') ||
          context.includes('isEditingName') ||
          context.includes('isCustom') ||
          context.includes('billetera.nombre')
        ) {
          continue;
        }
      }

      // Determinar tag JSX asociado buscando hacia atrás
      let tag = null;
      // Primero chequear si el tag abre en la misma línea antes de autoFocus
      const beforeAf = rawLine.substring(0, rawLine.search(/\b(?:autoFocus|autofocus)\b/i));
      const sameLineTags = [...beforeAf.matchAll(/<([A-Za-z0-9_.-]+)/g)];
      if (sameLineTags.length > 0) {
        tag = sameLineTags[sameLineTags.length - 1][1];
      } else {
        // Buscar hacia atrás hasta 35 líneas
        for (let j = i - 1; j >= Math.max(0, i - 35); j--) {
          const prevLine = lines[j];
          const tagMatches = [...prevLine.matchAll(/<([A-Za-z0-9_.-]+)/g)];
          if (tagMatches.length > 0) {
            // Filtrar tags de cierre </tag>
            const valid = tagMatches.filter((m) => {
              const charBefore = prevLine[Math.max(0, m.index - 1)];
              return charBefore !== '/';
            });
            if (valid.length > 0) {
              tag = valid[valid.length - 1][1];
              break;
            }
          }
        }
      }

      // Si la etiqueta es <button>, autoFocus está permitido (ConfirmModal, MemoriaComercioDialog)
      if (tag && tag.toLowerCase() === 'button') {
        continue;
      }

      // En cualquier otra etiqueta (<input>, <MontoInput>, <Field>, etc.), autoFocus no permitido
      incidencias.push({
        linea: lineNum,
        tipo: 'autofocus',
        snippet: trimmed,
        ruta: normPath,
      });
    }
  }

  return incidencias;
}

/**
 * Escanea recursivamente src buscando archivos .ts, .tsx, .js, .jsx (excluyendo tests).
 */
export function walkSrc(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walkSrc(fullPath));
    } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
      if (!/\.test\.|\.spec\./.test(file)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Ejecuta la auditoría en TODO src.
 * @param {string} rootDir
 * @returns {Array<{ linea: number, tipo: string, snippet: string, ruta: string }>}
 */
export function ejecutarAuditoria(rootDir = ROOT_DIR) {
  const srcDir = path.join(rootDir, 'src');
  const files = walkSrc(srcDir);
  const todasIncidencias = [];

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const inc = auditarContenido(content, relPath);
    todasIncidencias.push(...inc);
  }

  return todasIncidencias;
}

export const detectarAutofocusEnModales = auditarContenido;

// Ejecución directa por CLI
const isDirectCall =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectCall) {
  const incidencias = ejecutarAuditoria();
  if (incidencias.length > 0) {
    console.error(`ERROR: Se encontraron ${incidencias.length} incidencias en auditoría de autofocus/focus:`);
    for (const inc of incidencias) {
      console.error(`  - ${inc.ruta}:${inc.linea} [${inc.tipo}] -> ${inc.snippet}`);
    }
    process.exit(1);
  } else {
    console.log('Auditoría de autofocus: 0 incidencias detectadas en src/.');
    process.exit(0);
  }
}
