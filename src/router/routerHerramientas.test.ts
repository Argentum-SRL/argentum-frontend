import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Router /app/herramientas (D-V1.1)', () => {
  it('está dentro del bloque mode="app" y no entre mode="admin" y mode="app"', () => {
    const src = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8');
    const lineas = src.split(/\r?\n/);

    const idxAdmin = lineas.findIndex((ln) => ln.includes('mode="admin"'));
    const idxApp = lineas.findIndex((ln) => ln.includes('mode="app"'));
    expect(idxAdmin).toBeGreaterThanOrEqual(0);
    expect(idxApp).toBeGreaterThan(idxAdmin);

    const entreAdminYApp = lineas
      .slice(idxAdmin, idxApp)
      .filter((ln) => ln.includes("'/app/herramientas'"));
    expect(entreAdminYApp).toEqual([]);

    const idxHerramientas = lineas.findIndex((ln) => ln.includes("'/app/herramientas'"));
    expect(idxHerramientas).toBeGreaterThan(idxApp);
  });
});
