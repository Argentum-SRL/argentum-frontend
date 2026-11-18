import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const COMP_DIR = __dirname;

describe('AyudaBoton (verificación estática sin @testing-library/react)', () => {
  const tsx = fs.readFileSync(path.join(COMP_DIR, 'AyudaBoton.tsx'), 'utf-8');
  const css = fs.readFileSync(path.join(COMP_DIR, 'AyudaBoton.module.css'), 'utf-8');

  it('expone aria-label "Ayuda: ${titulo}", renderiza titulo y texto e importa Modal base', () => {
    expect(tsx).toContain("import Modal from '../Modal/Modal'");
    expect(tsx).toContain('aria-label={`Ayuda: ${titulo}`}');
    expect(tsx).toContain('title={titulo}');
    expect(tsx).toContain('{texto}');
    expect(tsx).toContain('<Modal');
  });

  it('no incluye footer con botones, no usa autoFocus y no llama a .focus(', () => {
    expect(tsx).not.toContain('footer=');
    expect(tsx).not.toMatch(/\bautoFocus\b/i);
    expect(tsx).not.toContain('.focus(');
  });

  it('botón redondo en CSS con border-radius 50%', () => {
    expect(css).toContain('border-radius: 50%');
  });
});
