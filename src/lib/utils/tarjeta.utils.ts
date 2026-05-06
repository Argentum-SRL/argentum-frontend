// Próxima fecha de cierre desde hoy
export function calcularProximoCierre(diaCierre: number): Date {
  const hoy = new Date()
  const cierre = new Date(hoy.getFullYear(), hoy.getMonth(), diaCierre)
  if (hoy > cierre) {
    cierre.setMonth(cierre.getMonth() + 1)
  }
  return cierre
}

// Próxima fecha de vencimiento desde hoy
export function calcularProximoVencimiento(diaVencimiento: number): Date {
  const hoy = new Date()
  const venc = new Date(hoy.getFullYear(), hoy.getMonth(), diaVencimiento)
  if (hoy > venc) {
    venc.setMonth(venc.getMonth() + 1)
  }
  return venc
}

// Primer vencimiento de una compra (misma lógica que el backend)
export function calcularPrimerVencimiento(
  fechaCompra: Date,
  diaCierre: number,
  diaVencimiento: number
): Date {
  // mesesAdelante: si la compra es antes o igual al cierre, vence el mes siguiente (1).
  // Si es después del cierre, vence a los dos meses (2).
  const mesesAdelante = fechaCompra.getDate() <= diaCierre ? 1 : 2
  const base = new Date(fechaCompra)
  base.setMonth(base.getMonth() + mesesAdelante)
  
  // Ajustar al último día del mes si el día de vencimiento no existe (ej: 31 de feb)
  const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  base.setDate(Math.min(diaVencimiento, ultimoDia))
  
  return base
}

// Labels de red
export const RED_LABEL: Record<string, string> = {
  visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex',
  naranja: 'Naranja', cabal: 'Cabal'
}

// Colores predefinidos para el picker
export const TARJETA_COLORES = [
  '#EC0000', '#004481', '#009EE3',
  '#1A3D28', '#F7A800', '#0D2045'
]
