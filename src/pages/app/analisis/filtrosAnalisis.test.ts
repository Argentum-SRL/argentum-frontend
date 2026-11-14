import { describe, it, expect } from 'vitest';
import {
  etiquetaBilletera,
  filtrosVisibles,
  contarFiltrosActivos,
} from './filtrosAnalisis.ts';

describe('etiquetaBilletera', () => {
  it('respeta las reglas de C-10 / TF5', () => {
    expect(etiquetaBilletera('Galicia', 'ARS')).toBe('Galicia');
    expect(etiquetaBilletera({ nombre: 'Galicia', moneda: 'ARS' })).toBe('Galicia');

    expect(etiquetaBilletera('Efectivo Dólares', 'USD')).toBe('Efectivo Dólares');
    expect(etiquetaBilletera({ nombre: 'Efectivo Dólares', moneda: 'USD' })).toBe('Efectivo Dólares');

    expect(etiquetaBilletera('Ahorro', 'USD')).toBe('Ahorro (Dólares)');
    expect(etiquetaBilletera({ nombre: 'Ahorro', moneda: 'USD' })).toBe('Ahorro (Dólares)');

    expect(etiquetaBilletera('Caja dolares', 'USD')).toBe('Caja dolares');
    expect(etiquetaBilletera({ nombre: 'Caja dolares', moneda: 'USD' })).toBe('Caja dolares');
  });
});

describe('filtrosVisibles', () => {
  it('devuelve los filtros correspondientes a cada vista', () => {
    expect(filtrosVisibles('evolucion')).toEqual(['periodo', 'moneda', 'billetera', 'tarjeta']);
    expect(filtrosVisibles('categorias')).toEqual(['periodo', 'moneda', 'billetera', 'tarjeta']);
    expect(filtrosVisibles('comparativa')).toEqual(['moneda', 'billetera', 'tarjeta']);
    expect(filtrosVisibles('proyeccion')).toEqual(['moneda', 'billetera', 'tarjeta']);
    expect(filtrosVisibles('informes')).toEqual([]);
  });
});

describe('contarFiltrosActivos', () => {
  it('cuenta correctamente los filtros activos vs valores de fábrica', () => {
    expect(
      contarFiltrosActivos({
        periodo: 6,
        moneda: 'ARS',
        billetera_id: null,
        tarjeta_id: null,
      })
    ).toBe(0);

    expect(
      contarFiltrosActivos({
        periodo: 12,
        moneda: 'USD',
      })
    ).toBe(2);
  });
});
