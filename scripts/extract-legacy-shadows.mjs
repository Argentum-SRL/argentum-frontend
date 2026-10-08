import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const EXEMPT_FILES = new Set(['styles/elevation.css']);

const occurrences = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(SRC_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && /\.(css|scss|tsx|ts|jsx|js)$/.test(entry.name)) {
      if (EXEMPT_FILES.has(relPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      let currentSelector = '';
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.includes('{') && !trimmed.startsWith('@')) {
          currentSelector = trimmed.split('{')[0].trim();
        } else if (trimmed.includes('}')) {
          // keep rough track
        }

        if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return;

        const match = trimmed.match(/(?:box-shadow|boxShadow)\s*:\s*([^;]+);?/);
        if (match) {
          const val = match[1].trim();
          const usesToken = /var\(--(?:elevation|shadow)-[a-zA-Z0-9_-]+\)/.test(val);
          const isNone = val === 'none' || val === 'none !important';
          const isAutofill = val.includes('1000px') && val.includes('inset');

          if (!usesToken && !isNone && !isAutofill) {
            // Find surrounding 5 lines
            const start = Math.max(0, idx - 4);
            const end = Math.min(lines.length, idx + 4);
            const snippet = lines.slice(start, end).join('\n');

            occurrences.push({
              file: relPath,
              line: idx + 1,
              val,
              selector: currentSelector,
              snippet,
            });
          }
        }
      });
    }
  }
}

scanDir(SRC_DIR);

fs.writeFileSync(path.resolve(__dirname, 'legacy-shadows-dump.json'), JSON.stringify(occurrences, null, 2));
console.log(`Extracted ${occurrences.length} occurrences across ${new Set(occurrences.map(o => o.file)).size} files.`);
