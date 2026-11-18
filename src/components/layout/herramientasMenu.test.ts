import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const FRONT_ROOT = path.resolve(__dirname, '../../..');

function leerArchivo(relPath: string): string {
  return fs.readFileSync(path.join(FRONT_ROOT, relPath), 'utf-8');
}

describe('Menú Herramientas visible para todos y pestaña inicial segura', () => {
  it('AppLayout, SearchModal y MobileMoreSheet muestran /app/herramientas sin condición admin', () => {
    const archivos = [
      'src/components/layout/AppLayout/AppLayout.tsx',
      'src/components/layout/AppLayout/SearchModal.tsx',
      'src/components/layout/MobileBottomNav/MobileMoreSheet.tsx',
    ];

    for (const rel of archivos) {
      const lineas = leerArchivo(rel).split(/\r?\n/);
      const lineaHerramientas = lineas.find((l) => l.includes('/app/herramientas'));
      expect(lineaHerramientas, `Falta /app/herramientas en ${rel}`).toBeDefined();
      expect(lineaHerramientas).not.toContain('is_admin');
      expect(lineaHerramientas).not.toContain('isAdmin');
    }
  });

  it('ToolsPage.tsx usa pestanaInicial y no monta ImportacionResumenSection sin verificar', () => {
    const contenido = leerArchivo('src/pages/app/tools/ToolsPage.tsx');
    expect(contenido).toContain('pestanaInicial');
    expect(contenido).toContain("from './toolsTabs'");
  });
});
