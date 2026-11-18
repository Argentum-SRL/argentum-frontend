import { describe, expect, it } from 'vitest';
import { TOOL_TABS, pestanaInicial } from './toolsTabs';

describe('toolsTabs / pestanaInicial', () => {
  it('resuelve la pestaña inicial según permisos y existencia', () => {
    expect(pestanaInicial(null, false)).toBe('conveniencia');
    expect(pestanaInicial('can-afford', false)).toBe('can-afford');
    expect(pestanaInicial('importar-resumen', false)).toBe('conveniencia');
    expect(pestanaInicial('importar-resumen', true)).toBe('importar-resumen');
    expect(pestanaInicial('cualquiera', true)).toBe('conveniencia');
  });

  it('TOOL_TABS mantiene adminOnly únicamente en importar-resumen', () => {
    const soloAdmin = TOOL_TABS.filter((t) => t.adminOnly).map((t) => t.id);
    expect(soloAdmin).toEqual(['importar-resumen']);
    expect(TOOL_TABS.map((t) => t.id)).toEqual([
      'conveniencia',
      'can-afford',
      'importar-resumen',
    ]);
  });
});
