export function formatMonto(monto: number | string, moneda: 'ARS' | 'USD' | string = 'ARS'): string {
  const num = typeof monto === 'number' ? monto : parseFloat(monto)
  const safeMonto = isNaN(num) || num === null || num === undefined ? 0 : num
  const tieneDecimales = safeMonto % 1 !== 0
  const monedaNormalizada = String(moneda || 'ARS').toUpperCase() === 'USD' ? 'USD' : 'ARS'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: monedaNormalizada,
    minimumFractionDigits: tieneDecimales ? 2 : 0,
    maximumFractionDigits: 2
  }).format(safeMonto)
}

export function formatMoneda(moneda?: string | null): string {
  if (!moneda) return 'Pesos'
  const m = String(moneda).toUpperCase()
  return m === 'USD' || m === 'DOLARES' || m === 'DÓLARES' ? 'Dólares' : 'Pesos'
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

/**
 * Formatea un objeto Date a string ISO 'YYYY-MM-DD' preservando la zona horaria local
 * (evita el desfase de un día producido por toISOString() en zonas horarias UTC negativas).
 */
export function toISODateString(fecha: Date): string {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAxisCompact(val: number): string {
  const num = Number.isFinite(val) ? val : 0
  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}

export function formatPorcentaje(valor: number, opciones?: { signo?: boolean }): string {
  const num = Number.isFinite(valor) ? valor : 0
  const absFormatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Math.abs(num))

  if (absFormatted === '0') {
    return '0%'
  }
  if (num > 0) {
    const prefix = opciones?.signo ? '+' : ''
    return `${prefix}${absFormatted}%`
  }
  return `-${absFormatted}%`
}

export function formatMontoCorto(valor: number, moneda: 'ARS' | 'USD' = 'ARS'): string {
  const num = typeof valor === 'number' ? valor : parseFloat(String(valor))
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num
  const absVal = Math.abs(safeNum)
  const isNegative = safeNum < 0

  let numFormatted: string
  let sufijo = ''

  if (absVal >= 1_000_000) {
    const valM = absVal / 1_000_000
    numFormatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(valM)
    sufijo = ' M'
  } else if (absVal >= 1_000) {
    const valK = absVal / 1_000
    numFormatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(valK)
    sufijo = ' mil'
  } else {
    numFormatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(absVal)
  }

  const baseSymbol = String(moneda).toUpperCase() === 'USD' ? 'US$' : '$'
  // El espacio entre el símbolo y el número es el mismo que usa formatMonto (\u00a0 de Intl es-AR)
  const prefix = isNegative ? `-${baseSymbol}\u00a0` : `${baseSymbol}\u00a0`

  return `${prefix}${numFormatted}${sufijo}`
}


