import { addMonths, setDate, lastDayOfMonth } from 'date-fns';

/**
 * Calcula la fecha de primer vencimiento de una compra con tarjeta de crédito.
 * Espejo de la lógica del backend.
 */
export const calcularPrimerVencimiento = (
  fechaCompra: Date,
  diaCierre: number,
  diaVencimiento: number
): Date => {
  let base: Date;
  
  if (fechaCompra.getDate() <= diaCierre) {
    // Entra en resumen del mes actual -> vence el mes siguiente
    base = addMonths(fechaCompra, 1);
  } else {
    // Entra en resumen del mes siguiente -> vence dos meses adelante
    base = addMonths(fechaCompra, 2);
  }

  const ultimoDia = lastDayOfMonth(base).getDate();
  const diaReal = Math.min(diaVencimiento, ultimoDia);
  
  return setDate(base, diaReal);
};
