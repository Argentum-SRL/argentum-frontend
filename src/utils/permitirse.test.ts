import { describe, it, expect } from 'vitest';
import { claseResultado, filasAhorros, etiquetaMonto } from './permitirse';
import { formatMonto } from '@/utils/format';

describe('permitirse utils', () => {
  it('claseResultado mapea los resultados correctamente', () => {
    expect(claseResultado('bien')).toBe('bien');
    expect(claseResultado('justo')).toBe('justo');
    expect(claseResultado('ahorros')).toBe('ahorros');
    expect(claseResultado('no_alcanza')).toBe('noAlcanza');
  });

  it('filasAhorros devuelve filas en orden Inversiones, Dólares, Metas y solo las > 0', () => {
    const ahorros = {
      inversiones: 200000,
      dolares_usd: 0,
      dolares_en_pesos: 0,
      metas: 50000,
      total: 250000,
    };
    const filas = filasAhorros(ahorros);
    expect(filas).toHaveLength(2);
    expect(filas[0].nombre).toBe('Inversiones');
    expect(filas[0].monto).toBe(200000);
    expect(filas[1].nombre).toBe('Metas');
    expect(filas[1].monto).toBe(50000);

    expect(filasAhorros(null)).toEqual([]);
  });

  it('filasAhorros con dólares formatea detalle con formatMonto en USD', () => {
    const ahorros = {
      inversiones: 0,
      dolares_usd: 600,
      dolares_en_pesos: 870000,
      metas: 0,
      total: 870000,
    };
    const filas = filasAhorros(ahorros);
    expect(filas).toHaveLength(1);
    expect(filas[0].nombre).toBe('Dólares');
    expect(filas[0].monto).toBe(870000);
    expect(filas[0].detalle).toBe(formatMonto(600, 'USD'));
  });

  it('etiquetaMonto devuelve los textos correspondientes a cada modo', () => {
    expect(etiquetaMonto('contado')).toBe('¿Cuánto sale?');
    expect(etiquetaMonto('cuotas')).toBe('¿Cuánto sale en total?');
    expect(etiquetaMonto('mensual')).toBe('¿Cuánto por mes?');
  });
});
