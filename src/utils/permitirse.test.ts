import { describe, it, expect } from 'vitest';
import {
  claseResultado,
  filasAhorros,
  etiquetaMonto,
  mostrarLinkGastoFijo,
  OPCIONES_MODO_PAGO,
  mostrarSelectorMoneda,
  descripcionImporteMoneda,
  lineasSecundariasPermitirse,
  lineasOrdenadasPermitirse,
} from './permitirse';
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
  it('mostrarLinkGastoFijo devuelve true solo si no hay compra y el bloque no esta abierto', () => {
    expect(mostrarLinkGastoFijo(false, false)).toBe(true);
    expect(mostrarLinkGastoFijo(false, true)).toBe(false);
    expect(mostrarLinkGastoFijo(true, false)).toBe(false);
    expect(mostrarLinkGastoFijo(true, true)).toBe(false);
  });

  it('OPCIONES_MODO_PAGO contiene contado y cuotas y no incluye mensual', () => {
    expect(OPCIONES_MODO_PAGO).toEqual(['contado', 'cuotas']);
    expect(OPCIONES_MODO_PAGO).not.toContain('mensual');
  });

  it('mostrarSelectorMoneda muestra selector solo si usa_dolares o moneda_principal es USD', () => {
    expect(mostrarSelectorMoneda(false, 'ARS')).toBe(false);
    expect(mostrarSelectorMoneda(undefined, 'ARS')).toBe(false);
    expect(mostrarSelectorMoneda(true, 'ARS')).toBe(true);
    expect(mostrarSelectorMoneda(false, 'USD')).toBe(true);
    expect(mostrarSelectorMoneda(true, 'USD')).toBe(true);
  });

  it('descripcionImporteMoneda diferencia Pesos y Dólares sin siglas en UI', () => {
    expect(descripcionImporteMoneda('ARS')).toBe('Lo que sale, en pesos');
    expect(descripcionImporteMoneda('USD')).toBe('Lo que sale, en dólares');
  });

  it('lineasSecundariasPermitirse y lineasOrdenadasPermitirse respetan orden D-T1.7', () => {
    const res = {
      titulo: 'Te entra, pero vas a tocar tus ahorros',
      lineas_plan: ['3 cuotas de $120.000'],
      linea_cotizacion: 'Cotización actual: $1.450 por dólar.',
      linea_principal: 'Te queda un margen libre.',
      linea_cuentas: 'En tu caja en pesos tenés $200.000.',
      linea_ahorros: 'Te faltan $100.000 de tus ahorros.',
      linea_liberacion: 'En mayo se liberan cuotas.',
      linea_reintegro: 'El descuento ya quedó considerado.',
      linea_juntar: 'Tendrías que juntar $50.000.',
      linea_frescura: 'Falta registrar tu último sueldo.',
      linea_espera: 'Si esperás al mes que viene te alcanza sin tocar ahorros.',
    };
    expect(lineasSecundariasPermitirse(res)).toEqual([
      res.linea_liberacion,
      res.linea_reintegro,
      res.linea_juntar,
      res.linea_frescura,
      res.linea_espera,
    ]);
    expect(lineasOrdenadasPermitirse(res)).toEqual([
      res.titulo,
      res.lineas_plan[0],
      res.linea_cotizacion,
      res.linea_principal,
      res.linea_cuentas,
      res.linea_ahorros,
      res.linea_liberacion,
      res.linea_reintegro,
      res.linea_juntar,
      res.linea_frescura,
      res.linea_espera,
    ]);
  });
});
