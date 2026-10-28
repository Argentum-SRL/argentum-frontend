import { describe, it, expect } from 'vitest';
import { detectarFormulasPlata } from './audit-formulas-plata.mjs';

describe('TE.11e - Detector de cuentas de plata', () => {
  it('detecta multiplicacion con variables de dinero', () => {
    expect(detectarFormulasPlata('const a = monto * cotizacion', 'test.ts')).toEqual(['monto * cotizacion']);
  });

  it('detecta formula de reintegro compleja con Math.round y division mas externa', () => {
    expect(
      detectarFormulasPlata(
        'const b = Math.round((montoCompra * porcentaje / 100) * 100) / 100',
        'test.ts'
      )
    ).toEqual(['Math.round((montoCompra * porcentaje / 100) * 100) / 100']);
  });

  it('ignora concatenacion de texto con +', () => {
    expect(detectarFormulasPlata("const c = 'Total: ' + total", 'test.ts')).toEqual([]);
  });

  it('ignora template literal con interpolacion de dinero', () => {
    expect(detectarFormulasPlata('const d = `${monto} pesos`', 'test.ts')).toEqual([]);
  });

  it('ignora expresiones sin identificadores de dinero', () => {
    expect(detectarFormulasPlata('const e = width * 2', 'test.ts')).toEqual([]);
  });

  it('detecta llamada a Math.pow con identificador de dinero', () => {
    expect(detectarFormulasPlata('const f = Math.pow(1 + tasa, n)', 'test.ts')).toEqual(['Math.pow(1 + tasa, n)']);
  });

  it('detecta asignacion compuesta con identificador de dinero', () => {
    expect(detectarFormulasPlata('let g = 0; g += saldo', 'test.ts')).toEqual(['g += saldo']);
  });

  it('detecta operacion dentro de callback de reduce', () => {
    expect(
      detectarFormulasPlata('const h = items.reduce((acc, x) => acc + x.monto, 0)', 'test.ts')
    ).toEqual(['acc + x.monto']);
  });
});

