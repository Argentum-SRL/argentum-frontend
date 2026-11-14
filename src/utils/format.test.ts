import { describe, it, expect } from 'vitest';
import { formatPorcentaje, formatMontoCorto } from './format';

describe('formatPorcentaje', () => {
  it('formatea porcentajes con coma decimal y sin decimales innecesarios', () => {
    expect(formatPorcentaje(10.8)).toBe('10,8%');
    expect(formatPorcentaje(18)).toBe('18%');
    expect(formatPorcentaje(-11.8)).toBe('-11,8%');
  });

  it('soporta la opción de signo explícito', () => {
    expect(formatPorcentaje(12.4, { signo: true })).toBe('+12,4%');
    expect(formatPorcentaje(0, { signo: true })).toBe('0%');
  });
});

describe('formatMontoCorto', () => {
  it('formatea montos cortos en pesos según los ejemplos de C-3', () => {
    expect(formatMontoCorto(1500000, 'ARS')).toBe('$\u00a01,5 M');
    expect(formatMontoCorto(4000000, 'ARS')).toBe('$\u00a04 M');
    expect(formatMontoCorto(750000, 'ARS')).toBe('$\u00a0750 mil');
    expect(formatMontoCorto(950, 'ARS')).toBe('$\u00a0950');
    expect(formatMontoCorto(0, 'ARS')).toBe('$\u00a00');
    expect(formatMontoCorto(-2000000, 'ARS')).toBe('-$\u00a02 M');
    expect(formatMontoCorto(-280000, 'ARS')).toBe('-$\u00a0280 mil');
  });

  it('formatea montos cortos en dólares con prefijo US$', () => {
    expect(formatMontoCorto(1500000, 'USD')).toBe('US$\u00a01,5 M');
    expect(formatMontoCorto(-2000000, 'USD')).toBe('-US$\u00a02 M');
  });
});
