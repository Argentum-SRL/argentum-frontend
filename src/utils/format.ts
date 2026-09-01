export function formatMonto(monto: number, moneda: 'ARS' | 'USD'): string {
  const safeMonto = isNaN(monto) || monto === null || monto === undefined ? 0 : monto
  const tieneDecimales = safeMonto % 1 !== 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: tieneDecimales ? 2 : 0,
    maximumFractionDigits: 2
  }).format(safeMonto)
}

export function formatFecha(fecha: string | Date): string {
  let d: Date
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) {
      d = new Date(fecha)
    } else {
      // Es una fecha ISO pura YYYY-MM-DD
      const [year, month, day] = fecha.split('-').map(Number)
      d = new Date(year, month - 1, day)
    }
  } else {
    d = fecha
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export function formatFechaHora(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d)
}

export function formatHora(fecha: string | Date): string {
  let d: Date
  if (typeof fecha === 'string') {
    if (fecha.includes('T') || fecha.includes(' ') || fecha.includes(':')) {
      d = new Date(fecha)
    } else {
      return ''
    }
  } else {
    d = fecha
  }

  if (isNaN(d.getTime())) return ''

  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d)
}

