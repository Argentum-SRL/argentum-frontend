#!/usr/bin/env node
/**
 * scripts/audit-formulas-plata.mjs
 * Detector de cuentas de plata en el frontend de Argentum (fase_ec2_front_sin_cuentas).
 * Regla: El frontend no hace cuentas de plata; las pide al backend.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const BASE_JSON_PATH = path.resolve(__dirname, 'formulas-plata-base.json');

export const PALABRAS_CLAVE = [
  'monto', 'cotizacion', 'percepcion', 'cuota', 'tasa', 'tna',
  'total', 'saldo', 'precio', 'interes', 'subtotal', 'contado',
  'financiado', 'limite', 'gastado', 'usado', 'ahorro', 'capital'
];

export const KEYWORD_REGEX = new RegExp(PALABRAS_CLAVE.join('|'), 'i');

const TARGET_BINARY_OPERATORS = new Set([
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
]);

export const ARCHIVOS_E5 = [
  'PagarResumenModal',
  'DebitoEnDolares',
  'CalculoCuotasResumen',
  'useTools',
  'ConvenienciaWizard',
  'TransferenciaModal',
  'useReintegro',
];

function collectPlusOperands(node) {
  const result = [];
  function collect(n) {
    if (ts.isParenthesizedExpression(n)) {
      collect(n.expression);
    } else if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      collect(n.left);
      collect(n.right);
    } else if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken) {
      collect(n.right);
    } else {
      result.push(n);
    }
  }
  collect(node);
  return result;
}

function isStringConcat(node) {
  if (!ts.isBinaryExpression(node)) return false;
  if (
    node.operatorToken.kind !== ts.SyntaxKind.PlusToken &&
    node.operatorToken.kind !== ts.SyntaxKind.PlusEqualsToken
  ) {
    return false;
  }
  const operands = collectPlusOperands(node);
  return operands.some(
    (op) =>
      ts.isStringLiteral(op) ||
      ts.isNoSubstitutionTemplateLiteral(op) ||
      ts.isTemplateExpression(op)
  );
}

function hasMoneyKeyword(node) {
  let found = false;
  function visit(child) {
    if (found) return;
    if (ts.isIdentifier(child) || (ts.isPrivateIdentifier && ts.isPrivateIdentifier(child))) {
      if (KEYWORD_REGEX.test(child.text)) {
        found = true;
        return;
      }
    }
    if (
      ts.isElementAccessExpression(child) &&
      child.argumentExpression &&
      ts.isStringLiteral(child.argumentExpression)
    ) {
      if (KEYWORD_REGEX.test(child.argumentExpression.text)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return found;
}

function isMathTargetCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  if (ts.isPropertyAccessExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === 'Math') {
      const name = expr.name.text;
      return name === 'pow' || name === 'round';
    }
  }
  return false;
}

/**
 * Detecta expresiones que realizan fórmulas de plata según AST.
 * @param {string} codigo Código fuente
 * @param {string} archivo Nombre o ruta del archivo
 * @returns {string[]} Lista de expresiones detectadas
 */
export function detectarFormulasPlata(codigo, archivo) {
  const isTsx = archivo.endsWith('.tsx') || archivo.endsWith('.jsx');
  const sf = ts.createSourceFile(
    archivo,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const resultados = [];

  function visit(node) {
    let isFormula = false;

    if (ts.isBinaryExpression(node)) {
      if (TARGET_BINARY_OPERATORS.has(node.operatorToken.kind)) {
        if (!isStringConcat(node)) {
          if (hasMoneyKeyword(node)) {
            isFormula = true;
          }
        }
      }
    } else if (isMathTargetCall(node)) {
      if (hasMoneyKeyword(node)) {
        isFormula = true;
      }
    }

    if (isFormula) {
      const text = node.getText(sf).replace(/\s+/g, ' ').trim();
      resultados.push(text);
      // No descender a hijos para tomar solo la expresión más externa
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return resultados;
}

export function recorrerArchivosSrc(dir = path.join(REPO_ROOT, 'src')) {
  const archivos = [];
  function recorrer(actual) {
    if (!fs.existsSync(actual)) return;
    const items = fs.readdirSync(actual, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(actual, item.name);
      if (item.isDirectory()) {
        recorrer(fullPath);
      } else if (item.isFile()) {
        if (
          (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) &&
          !item.name.endsWith('.test.ts') &&
          !item.name.endsWith('.test.tsx')
        ) {
          archivos.push(fullPath);
        }
      }
    }
  }
  recorrer(dir);
  return archivos;
}

export function esArchivoE5(archivoRel) {
  return ARCHIVOS_E5.some((nombre) => archivoRel.includes(nombre));
}

export function ejecutarAuditoria({ crearBase = false } = {}) {
  const archivos = recorrerArchivosSrc();
  // Mapa de huella -> { archivo, expresion, cantidad }
  const formulasPorHuella = new Map();

  for (const absPath of archivos) {
    const relPath = path.relative(REPO_ROOT, absPath).replace(/\\/g, '/');
    const codigo = fs.readFileSync(absPath, 'utf-8');
    const formulas = detectarFormulasPlata(codigo, relPath);
    for (const expr of formulas) {
      const huella = `${relPath}::${expr}`;
      if (!formulasPorHuella.has(huella)) {
        formulasPorHuella.set(huella, {
          archivo: relPath,
          expresion: expr,
          cantidad: 1,
        });
      } else {
        formulasPorHuella.get(huella).cantidad++;
      }
    }
  }

  const formulasActuales = Array.from(formulasPorHuella.values()).sort((a, b) => {
    if (a.archivo !== b.archivo) return a.archivo.localeCompare(b.archivo);
    return a.expresion.localeCompare(b.expresion);
  });

  const totalSrc = formulasActuales.reduce((acc, f) => acc + f.cantidad, 0);

  if (crearBase) {
    // Si ya existe base, preservar categoria y motivo si coincide la huella
    let basePrevia = new Map();
    if (fs.existsSync(BASE_JSON_PATH)) {
      try {
        const datosPrevios = JSON.parse(fs.readFileSync(BASE_JSON_PATH, 'utf-8'));
        for (const item of datosPrevios) {
          basePrevia.set(`${item.archivo}::${item.expresion}`, item);
        }
      } catch {
        // ignorar
      }
    }

    const nuevaBase = formulasActuales.map((item) => {
      const previa = basePrevia.get(`${item.archivo}::${item.expresion}`);
      return {
        archivo: item.archivo,
        expresion: item.expresion,
        cantidad: item.cantidad,
        categoria: previa?.categoria || (esArchivoE5(item.archivo) ? 'ayuda_escritura' : 'pendiente'),
        motivo: previa?.motivo || (esArchivoE5(item.archivo) ? 'Ayuda de escritura / dibujo' : 'Bloque H / Bloque J'),
      };
    });

    fs.writeFileSync(BASE_JSON_PATH, JSON.stringify(nuevaBase, null, 2) + '\n', 'utf-8');
    console.log(`Línea base creada en ${BASE_JSON_PATH} con ${nuevaBase.length} entradas (${totalSrc} fórmulas).`);
    return { codigo: 0, totalSrc, totalBase: nuevaBase.length, problemas: 0 };
  }

  // Modo verificación contra línea base
  if (!fs.existsSync(BASE_JSON_PATH)) {
    console.error(`ERROR: No existe la línea base en ${BASE_JSON_PATH}. Creala con --crear-base.`);
    return { codigo: 1, totalSrc, totalBase: 0, problemas: 1 };
  }

  let baseDatos;
  try {
    baseDatos = JSON.parse(fs.readFileSync(BASE_JSON_PATH, 'utf-8'));
  } catch (err) {
    console.error(`ERROR: Error parseando ${BASE_JSON_PATH}: ${err.message}`);
    return { codigo: 1, totalSrc, totalBase: 0, problemas: 1 };
  }

  const baseMap = new Map();
  for (const item of baseDatos) {
    const huella = `${item.archivo}::${item.expresion}`;
    baseMap.set(huella, item);
  }

  const problemas = [];
  const categoriasValidas = new Set(['ayuda_escritura', 'dibujo', 'pendiente']);

  // 1. Validar integridad de la base
  for (const item of baseDatos) {
    const huella = `${item.archivo}::${item.expresion}`;
    if (!categoriasValidas.has(item.categoria)) {
      problemas.push(`Base: categoría inválida '${item.categoria}' en ${huella}`);
    }
    if (!item.motivo || typeof item.motivo !== 'string' || !item.motivo.trim()) {
      problemas.push(`Base: falta motivo en ${huella}`);
    }
    if (item.categoria === 'pendiente' && esArchivoE5(item.archivo)) {
      problemas.push(`E5: ${item.archivo} tiene entrada clasificada como 'pendiente' (${item.expresion})`);
    }
  }

  // 2. Validar que ninguna huella actual no esté en base y que las cantidades no suban
  for (const actual of formulasActuales) {
    const huella = `${actual.archivo}::${actual.expresion}`;
    const enBase = baseMap.get(huella);
    if (!enBase) {
      problemas.push(`Nueva fórmula no registrada en base: ${huella} (${actual.cantidad})`);
    } else if (actual.cantidad > enBase.cantidad) {
      problemas.push(`Cantidad subió para ${huella}: actual ${actual.cantidad} > base ${enBase.cantidad}`);
    }
  }

  for (const p of problemas) {
    console.log(`[PROBLEMA] ${p}`);
  }

  console.log(`Cuentas de plata: ${totalSrc} en src, ${baseDatos.length} en la base, problemas: ${problemas.length}`);

  return {
    codigo: problemas.length > 0 ? 1 : 0,
    totalSrc,
    totalBase: baseDatos.length,
    problemas: problemas.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const crearBase = process.argv.includes('--crear-base');
  const res = ejecutarAuditoria({ crearBase });
  process.exit(res.codigo);
}

