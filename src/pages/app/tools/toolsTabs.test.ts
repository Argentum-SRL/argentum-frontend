import fs from 'node:fs';
import path from 'node:path';
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

  it('ToolsPage reutiliza SegmentedControl con la cápsula visual del navbar principal', () => {
    const pageTsx = fs.readFileSync(path.resolve(__dirname, 'ToolsPage.tsx'), 'utf-8');
    const pageCss = fs.readFileSync(path.resolve(__dirname, 'ToolsPage.module.css'), 'utf-8');
    const appCss = fs.readFileSync(
      path.resolve(__dirname, '../../../components/layout/AppLayout/AppLayout.module.css'),
      'utf-8'
    );

    expect(pageTsx).toContain('SegmentedControl');
    expect(pageTsx).toContain('navCapsule');
    expect(pageTsx).toContain('controlsRowRef');
    expect(appCss).toContain('border-radius: 26px');
    expect(pageCss).toContain('border-radius: 26px');
    expect(pageCss).toContain('#0b1729');
    expect(pageCss).toContain('var(--elevation-md)');
    expect(pageCss).toContain('backdrop-filter: blur(16px)');
    expect(pageCss).toContain('border-radius: 18px');
    expect(pageCss).toContain('overflow-x: auto');
    expect(pageCss).toContain('max-width: none');
    expect(pageCss).toContain('width: max-content');
    expect(pageCss).toContain('white-space: nowrap');
    expect(pageCss).toContain('prefers-reduced-motion: reduce');
  });
});
