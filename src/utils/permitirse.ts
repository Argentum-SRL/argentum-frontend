import { formatMonto } from '@/utils/format';
import type { AhorrosDetalle, CanAffordResult } from '@/types/tools';

export type ClaseResultado = 'bien' | 'justo' | 'ahorros' | 'noAlcanza';

export interface FilaAhorro {
  tipo: 'inversiones' | 'dolares' | 'metas';
  nombre: string;
  monto: number;
  detalle?: string;
}

export function claseResultado(resultado: string): ClaseResultado {
  switch (resultado) {
    case 'bien':
      return 'bien';
    case 'justo':
      return 'justo';
    case 'ahorros':
      return 'ahorros';
    case 'no_alcanza':
    case 'noAlcanza':
      return 'noAlcanza';
    default:
      return 'justo';
  }
}

export function etiquetaMonto(modo: string): string {
  switch (modo) {
    case 'contado':
      return '¿Cuánto sale?';
    case 'cuotas':
      return '¿Cuánto sale en total?';
    case 'mensual':
      return '¿Cuánto por mes?';
    default:
      return '¿Cuánto sale?';
  }
}

export function filasAhorros(ahorros: AhorrosDetalle | null | undefined): FilaAhorro[] {
  if (!ahorros) {
    return [];
  }

  const filas: FilaAhorro[] = [];

  // 1. Inversiones
  if (ahorros.inversiones > 0) {
    filas.push({
      tipo: 'inversiones',
      nombre: 'Inversiones',
      monto: ahorros.inversiones,
    });
  }

  // 2. Dólares
  const montoDolares = ahorros.dolares_en_pesos > 0 ? ahorros.dolares_en_pesos : ahorros.dolares_usd;
  if (montoDolares > 0) {
    const detalle = formatMonto(ahorros.dolares_usd, 'USD');
    filas.push({
      tipo: 'dolares',
      nombre: 'Dólares',
      monto: ahorros.dolares_en_pesos,
      detalle,
    });
  }

  // 3. Metas
  if (ahorros.metas > 0) {
    filas.push({
      tipo: 'metas',
      nombre: 'Metas',
      monto: ahorros.metas,
    });
  }

  return filas;
}

export const OPCIONES_MODO_PAGO = ['contado', 'cuotas'] as const;

/**
 * Determina si se muestra el link de gasto fijo debajo del resultado de compra.
 * True únicamente si hay resultado de compra y el bloque de gasto fijo no está abierto.
 */
export function mostrarLinkGastoFijo(hayResultadoCompra: boolean, bloqueAbierto: boolean): boolean {
  return !hayResultadoCompra && !bloqueAbierto;
}

export function mostrarSelectorMoneda(
  usaDolares?: boolean | null,
  monedaPrincipal?: string | null,
): boolean {
  return Boolean(usaDolares) || String(monedaPrincipal ?? '').toUpperCase() === 'USD';
}

export function descripcionImporteMoneda(moneda: 'ARS' | 'USD'): string {
  return moneda === 'USD'
    ? 'El importe en dólares a evaluar'
    : 'El importe en pesos a evaluar';
}

export function lineasSecundariasPermitirse(
  resultado: Partial<CanAffordResult> | null | undefined,
): string[] {
  if (!resultado) {
    return [];
  }
  const candidatas = [
    resultado.linea_liberacion,
    resultado.linea_compensar,
    resultado.linea_reintegro,
    resultado.linea_juntar,
    resultado.linea_frescura,
    resultado.linea_espera,
  ];
  return candidatas.filter((l): l is string => Boolean(l && l.trim()));
}

/**
 * Devuelve todas las líneas textuales de resultado en el orden canónico D-T1.7.
 */
export function lineasOrdenadasPermitirse(
  resultado: Partial<CanAffordResult> | null | undefined,
): string[] {
  if (!resultado) {
    return [];
  }
  const salida: string[] = [];
  if (resultado.titulo) salida.push(resultado.titulo);
  if (resultado.lineas_plan) {
    for (const lp of resultado.lineas_plan) {
      if (lp && lp.trim()) salida.push(lp);
    }
  }
  if (resultado.linea_cotizacion) salida.push(resultado.linea_cotizacion);
  if (resultado.linea_principal) salida.push(resultado.linea_principal);
  if (resultado.linea_cuentas) salida.push(resultado.linea_cuentas);
  if (resultado.linea_ahorros) salida.push(resultado.linea_ahorros);
  salida.push(...lineasSecundariasPermitirse(resultado));
  return salida;
}


