/**
 * scripts/install-hooks.mjs — Instalador del hook pre-push para el candado de diseño unificado.
 *
 * Se ejecuta automáticamente en "prepare", "predev" y "predev:clean".
 * Verifica reglas de diseño con npm run audit:rules antes de cada git push.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// 1. En entornos de CI (como GitHub Actions), no instalar hooks locales
if (process.env.CI) {
  process.exit(0);
}

// 2. Determinar el directorio git (soporta --git-dir para pruebas o git rev-parse por defecto)
let gitDir = null;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--git-dir' && i + 1 < args.length) {
    gitDir = args[i + 1];
    i++;
  } else if (args[i].startsWith('--git-dir=')) {
    gitDir = args[i].slice('--git-dir='.length);
  }
}

// Si se especificó --git-dir explícitamente y no existe la carpeta, salir limpiamente con código 0
if (gitDir !== null) {
  if (!fs.existsSync(gitDir)) {
    process.exit(0);
  }
} else {
  // Obtener directorio git mediante rev-parse
  try {
    const raw = execFileSync('git', ['rev-parse', '--git-dir'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    gitDir = path.resolve(process.cwd(), raw);
  } catch {
    // Si no es un repo git o falla el comando, salir con código 0 sin escribir nada
    process.exit(0);
  }

  if (!gitDir || !fs.existsSync(gitDir)) {
    process.exit(0);
  }
}

// 3. Rutas de la carpeta hooks y del archivo pre-push
const hooksDir = path.join(gitDir, 'hooks');
const hookPath = path.join(hooksDir, 'pre-push');

// 4. Si ya existe un pre-push que NO contiene la marca de este script, preservarlo sin pisar
if (fs.existsSync(hookPath)) {
  const existing = fs.readFileSync(hookPath, 'utf8');
  if (!existing.includes('install-hooks.mjs')) {
    console.log('Aviso: Ya existe un hook pre-push personalizado ajeno a install-hooks.mjs. Se conserva sin modificar.');
    process.exit(0);
  }
}

// 5. Crear la carpeta hooks si no existe
if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

// 6. Escribir el script pre-push con saltos de línea LF explícitos (\n, nunca CRLF)
const hookLines = [
  '#!/bin/sh',
  '# Candado de diseño unificado de Argentum (generado por scripts/install-hooks.mjs; no editar)',
  'echo "Argentum: verificando reglas de diseño antes de subir..."',
  'npm run audit:rules || { echo "Push cancelado: hay cambios que rompen las reglas de DISENO_UNIFICADO.md. Corregilos y volvé a intentar."; exit 1; }'
];
const hookContent = hookLines.join('\n') + '\n';

fs.writeFileSync(hookPath, hookContent, { encoding: 'utf8' });

// 7. Intentar otorgar permisos de ejecución (0o755) ignorando fallos en plataformas sin soporte
try {
  fs.chmodSync(hookPath, 0o755);
} catch {
  // Ignorar error intencionalmente
}

process.exit(0);
