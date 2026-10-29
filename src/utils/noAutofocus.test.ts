import { describe, it, expect, beforeAll } from 'vitest';

let auditarContenido: (code: string, path?: string) => Array<unknown>;
let ejecutarAuditoria: () => Array<unknown>;

describe('Regla de foco y teclado (fase_g2_modal_sin_autofocus)', () => {
  beforeAll(async () => {
    // Dynamic import para interoperabilidad ESM script con TypeScript
    // @ts-expect-error TS7016: módulo sin archivo .d.ts
    const mod = await import('../../scripts/audit-no-autofocus.mjs');
    auditarContenido = mod.auditarContenido;
    ejecutarAuditoria = mod.ejecutarAuditoria;
  });

  it('auditoría completa → 0', () => {
    const incidencias = ejecutarAuditoria();
    expect(incidencias).toHaveLength(0);
  });

  it('<input type="text" autoFocus /> en la ruta src/components/transacciones/FilterBar.tsx → 1', () => {
    const code = '<input type="text" autoFocus />';
    const incidencias = auditarContenido(code, 'src/components/transacciones/FilterBar.tsx');
    expect(incidencias).toHaveLength(1);
  });

  it('<input autoFocus={esPunteroFino()} /> → 0', () => {
    const code = '<input autoFocus={esPunteroFino()} />';
    const incidencias = auditarContenido(code, 'src/components/transacciones/FilterBar.tsx');
    expect(incidencias).toHaveLength(0);
  });

  it('<button autoFocus>Aceptar</button> → 0', () => {
    const code = '<button autoFocus>Aceptar</button>';
    const incidencias = auditarContenido(code, 'src/components/ui/ConfirmModal/ConfirmModal.tsx');
    expect(incidencias).toHaveLength(0);
  });

  it('<MontoInput autoFocus /> → 1', () => {
    const code = '<MontoInput autoFocus />';
    const incidencias = auditarContenido(code, 'src/components/billeteras/ActualizarSaldoModal.tsx');
    expect(incidencias).toHaveLength(1);
  });

  it('inputRef.current?.focus() en la ruta src/components/tarjetas/PagarResumenModal.tsx → 1', () => {
    const code = 'inputRef.current?.focus()';
    const incidencias = auditarContenido(code, 'src/components/tarjetas/PagarResumenModal.tsx');
    expect(incidencias).toHaveLength(1);
  });

  it('el mismo texto en src/components/layout/AppLayout/SearchModal.tsx → 0', () => {
    const code = 'inputRef.current?.focus()';
    const incidencias = auditarContenido(code, 'src/components/layout/AppLayout/SearchModal.tsx');
    expect(incidencias).toHaveLength(0);
  });
});
