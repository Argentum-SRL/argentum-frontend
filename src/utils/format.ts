export function formatMonto(monto: number, moneda: 'ARS' | 'USD'): string {
  // TODO: implementar
  return moneda === 'ARS' ? `$ ${monto}` : `USD $ ${monto}`
}

export function formatFecha(fecha: string | Date): string {
  // TODO: implementar
  return new Date(fecha).toLocaleDateString('es-AR')
}
