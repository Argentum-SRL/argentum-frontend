import { formatMonto } from '@/utils/format';
import type { AhorrosDetalle } from '@/types/tools';

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

