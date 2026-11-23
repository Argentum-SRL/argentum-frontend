import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Modal base (portal a document.body)', () => {
  const modalTsx = fs.readFileSync(path.join(__dirname, 'Modal.tsx'), 'utf-8');
  const toolsCss = fs.readFileSync(
    path.resolve(__dirname, '../../../pages/app/tools/ToolsPage.module.css'),
    'utf-8'
  );

  it('renderiza el overlay en document.body vía createPortal para no quedar atrapado en ancestros con transform', () => {
    expect(modalTsx).toContain("import { createPortal } from 'react-dom'");
    expect(modalTsx).toContain('createPortal(modalNode, document.body)');
  });

  it('ToolsPage.module.css no deja animation-fill-mode: both con transform permanente en .page', () => {
    expect(toolsCss).not.toMatch(/animation:\s*pageFadeIn[^;]*\bboth\b/);
  });
});
