#!/usr/bin/env node

/**
 * ============================================================================
 * Argentum Elevation Guardrail: Audit Hardcoded Box-Shadows
 * ============================================================================
 *
 * Scans `src/` for any CSS, SCSS, or TSX files containing raw, hardcoded
 * box-shadow or drop-shadow declarations instead of semantic tokens
 * (`var(--elevation-*)` or `var(--shadow-*)`).
 *
 * Usage:
 *   node scripts/audit-hardcoded-shadows.mjs
 *   node scripts/audit-hardcoded-shadows.mjs --strict (exits with code 1 if hardcoded shadows found)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

// Files exempted (e.g. definition of the tokens themselves or third-party resets)
const EXEMPT_FILES = new Set([
  'styles/elevation.css', // Defines the tokens
]);

const isStrict = process.argv.includes('--strict');

let totalFilesScanned = 0;
let filesWithHardcodedShadows = 0;
let totalHardcodedShadows = 0;
let totalTokenizedShadows = 0;

const hardcodedMatches = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(SRC_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(css|scss|tsx|ts|jsx|js)$/.test(entry.name)) {
      if (EXEMPT_FILES.has(relPath)) continue;

      totalFilesScanned++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      let fileHasHardcoded = false;

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Skip comment lines
        if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
          return;
        }

        // Match box-shadow or boxShadow in style objects
        const match = trimmed.match(/(?:box-shadow|boxShadow)\s*:\s*([^;]+);?/);
        if (match) {
          const val = match[1].trim();

          // Check if tokenized (strictly var(--elevation-*))
          const usesToken = /var\(--elevation-[a-zA-Z0-9_-]+\)/.test(val);
          const isNone = val === 'none' || val === 'none !important';
          const isAutofill = val.includes('1000px') && val.includes('inset'); // autofill browser reset hack

          if (usesToken) {
            totalTokenizedShadows++;
          } else if (!isNone && !isAutofill) {
            totalHardcodedShadows++;
            fileHasHardcoded = true;
            hardcodedMatches.push({
              file: relPath,
              line: index + 1,
              val,
            });
          }
        }
      });

      if (fileHasHardcoded) {
        filesWithHardcodedShadows++;
      }
    }
  }
}

scanDirectory(SRC_DIR);

console.log('\n============================================================');
console.log('🛡️  ARGENTUM ELEVATION GUARDRAIL AUDIT REPORT');
console.log('============================================================');
console.log(`Files scanned:              ${totalFilesScanned}`);
console.log(`Tokenized shadows:          ${totalTokenizedShadows}`);
console.log(`Hardcoded legacy shadows:   ${totalHardcodedShadows} in ${filesWithHardcodedShadows} files`);
console.log('------------------------------------------------------------\n');

if (totalHardcodedShadows > 0) {
  console.log('Top 15 files with hardcoded shadows:');
  const fileCounts = {};
  for (const m of hardcodedMatches) {
    fileCounts[m.file] = (fileCounts[m.file] || 0) + 1;
  }

  const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
  sortedFiles.slice(0, 15).forEach(([f, count]) => {
    console.log(`  - ${f.padEnd(55)}: ${count} legacy occurrences`);
  });

  console.log('\nRule for new or refactored components:');
  console.log('  ❌ DO NOT USE: box-shadow: 0 4px 12px rgba(...);');
  console.log('  ✅ ALWAYS USE: box-shadow: var(--elevation-sm); (or appropriate token)');
  console.log('============================================================\n');

  if (isStrict) {
    console.error('❌ Failed: Hardcoded box-shadows detected under --strict mode.\n');
    process.exit(1);
  }
} else {
  console.log('🎉 Clean! No hardcoded shadows detected.\n');
}
