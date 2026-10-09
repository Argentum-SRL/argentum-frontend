import { formatMonto } from '@/utils/format'

// ── Textos constantes de la página ──────────────────────────────────────────

export const TEXTOS = {
  TITULO_PAGINA: 'Lo que se repite',
  PREFIX_ENCABEZADO: 'Esto es lo que se repite en tus movimientos de ',
  SUFFIX_ENCABEZADO: '. Decinos si está bien.',

  // Títulos y descripciones de las secciones (en orden estricto)
  SECCIONES: {
    ingresos: {
      id: 'ingresos',
      titulo: 'Ingresos habituales',
      descripcion: 'Lo que te entra seguido, como el sueldo.',
    },
    fijos: {
      id: 'fijos',
      titulo: 'Gastos fijos',
      descripcion:
        'Se pagan una vez por mes, cada dos meses o una vez por año, con un monto parecido. Por ejemplo, el alquiler.',
    },
    costumbre: {
      id: 'costumbre',
      titulo: 'Gastos de costumbre',
      descripcion: 'Gustos que se repiten, como delivery, café o salidas.',
    },
    dia_a_dia: {
      id: 'dia_a_dia',
      titulo: 'Gastos del día a día',
      descripcion:
        'Lo necesario que se repite, como el súper, la verdulería o el transporte.',
    },
  },

  // Botones
  BOTONES: {
    CONFIRMAR: 'Es así',
    DESCARTAR: 'No es así',
    MOVER: 'Moverlo',
    DESHACER: 'Deshacer',
  },

  // Avisos
  AVISOS: {
    DESCARTADO: 'Listo, no lo vamos a mostrar más.',
    ERROR_DEFAULT: 'No pudimos guardar el cambio. Probá de nuevo.',
    PREFIX_MOVIDO: 'Lo pasaste a ',
  },

  // Notas y etiquetas
  NOTAS: {
    DEBIL: 'Lo vimos pocas veces. Si es un gasto fijo, confirmalo.',
    CONFIRMADO: 'Confirmado',
    PREFIX_MOVIDO: 'Lo moviste desde ',
  },

  // Estados vacíos
  ESTADOS: {
    TODO_VACIO:
      'Todavía no encontramos nada que se repita. A medida que cargues movimientos, va a aparecer acá.',
    SECCION_VACIA: 'Por ahora no hay nada acá.',
  },
} as const

// ── Funciones puras para armado de textos ───────────────────────────────────

const NOMBRES_MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/**
 * Obtiene los meses ventana completos anteriores al mes de fecha_calculo,
 * en minúscula y unidos con comas e "y".
 * Ejemplo: con "2026-10-09" y 3 -> "julio, agosto y septiembre".
 * Ejemplo: con "2026-01-15" y 3 -> "octubre, noviembre y diciembre".
 */
export function armarTextoMeses(fechaCalculoStr: string, mesesVentana: number): string {
  if (!fechaCalculoStr) return ''
  const partes = fechaCalculoStr.split('-')
  if (partes.length < 2) return ''
  const month = parseInt(partes[1], 10) // 1 a 12

  const meses: string[] = []
  for (let i = mesesVentana; i >= 1; i--) {
    let m = month - i
    while (m <= 0) {
      m += 12
    }
    meses.push(NOMBRES_MESES[m - 1])
  }

  if (meses.length === 0) return ''
  if (meses.length === 1) return meses[0]
  if (meses.length === 2) return `${meses[0]} y ${meses[1]}`
  return `${meses.slice(0, -1).join(', ')} y ${meses[meses.length - 1]}`
}

/**
 * Arma la línea de descripción del encabezado:
 * "Esto es lo que se repite en tus movimientos de {meses}. Decinos si está bien."
 */
export function armarEncabezadoDescripcion(fechaCalculoStr: string, mesesVentana: number): string {
  const meses = armarTextoMeses(fechaCalculoStr, mesesVentana)
  return `${TEXTOS.PREFIX_ENCABEZADO}${meses}${TEXTOS.SUFFIX_ENCABEZADO}`
}

/**
 * Suma de monto_mensual de la sección.
 * Si hay una moneda: "Unos {total} por mes".
 * Si hay dos monedas: "Unos $X y US$Y por mes".
 */
export function armarTotalSeccion(
  items: Array<{ monto_mensual: number | string; moneda: string }>
): string {
  const sumasPorMoneda: Record<string, number> = {}

  for (const it of items) {
    const monedaNorm = (it.moneda || 'ARS').toUpperCase()
    const monto = typeof it.monto_mensual === 'number' ? it.monto_mensual : Number(it.monto_mensual) || 0
    sumasPorMoneda[monedaNorm] = (sumasPorMoneda[monedaNorm] || 0) + monto
  }

  const monedas = Object.keys(sumasPorMoneda).filter((m) => sumasPorMoneda[m] > 0)

  if (monedas.length === 0) {
    return `Unos ${formatMonto(0, 'ARS')} por mes`
  }

  if (monedas.length === 1) {
    const m = monedas[0]
    return `Unos ${formatMonto(sumasPorMoneda[m], m)} por mes`
  }

  // Si hay dos monedas (por ejemplo ARS y USD)
  // Ordenar para mostrar primero ARS luego USD
  const ordenadas = [...monedas].sort((a, b) => (a === 'ARS' ? -1 : b === 'ARS' ? 1 : a.localeCompare(b)))
  const formatted0 = formatMonto(sumasPorMoneda[ordenadas[0]], ordenadas[0])
  const formatted1 = formatMonto(sumasPorMoneda[ordenadas[1]], ordenadas[1])

  return `Unos ${formatted0} y ${formatted1} por mes`
}

/**
 * Montos de ítems individuales:
 * - ingresos, costumbre y día a día: "Unos {monto_mensual} por mes"
 * - fijos según frecuencia:
 *     mensual "Unos {monto_tipico} por mes"
 *     bimestral "Unos {monto_tipico} cada dos meses"
 *     anual "Unos {monto_tipico} por año"
 */
export function armarMontoItem(item: {
  monto_mensual: number | string
  monto_tipico?: number | string | null
  frecuencia?: string | null
  moneda: string
}): string {
  const moneda = item.moneda || 'ARS'
  const montoMensual = typeof item.monto_mensual === 'number' ? item.monto_mensual : Number(item.monto_mensual) || 0
  const montoTipico =
    item.monto_tipico !== undefined && item.monto_tipico !== null
      ? typeof item.monto_tipico === 'number'
        ? item.monto_tipico
        : Number(item.monto_tipico) || 0
      : montoMensual

  if (item.frecuencia === 'mensual') {
    return `Unos ${formatMonto(montoTipico, moneda)} por mes`
  }
  if (item.frecuencia === 'bimestral') {
    return `Unos ${formatMonto(montoTipico, moneda)} cada dos meses`
  }
  if (item.frecuencia === 'anual') {
    return `Unos ${formatMonto(montoTipico, moneda)} por año`
  }

  return `Unos ${formatMonto(montoMensual, moneda)} por mes`
}

/**
 * Detalle para ingresos según su tipo:
 * - regular: "Llega todos los meses"
 * - variable: "El monto cambia de un mes a otro"
 * - intermitente: "No llega todos los meses"
 * - errático / erratico: "Llega de forma irregular"
 * - Cualquier otro valor: null (no se muestra línea de detalle)
 */
export function armarDetalleIngreso(tipo: string | null | undefined): string | null {
  if (!tipo) return null
  const t = tipo.toLowerCase().trim()
  if (t === 'regular') return 'Llega todos los meses'
  if (t === 'variable') return 'El monto cambia de un mes a otro'
  if (t === 'intermitente') return 'No llega todos los meses'
  if (t === 'erratico' || t === 'errático') return 'Llega de forma irregular'
  return null
}

/**
 * Formatea la fecha próxima de un gasto fijo:
 * DD/MM para mensual/bimestral, DD/MM/AAAA para anual.
 */
export function formatProximaFechaFijo(
  proximaFechaStr: string | null | undefined,
  frecuencia: string | null | undefined
): string {
  if (!proximaFechaStr) return ''
  const partes = proximaFechaStr.split('-')
  if (partes.length < 3) return proximaFechaStr
  const [yyyy, mm, dd] = partes
  if (frecuencia === 'anual') {
    return `${dd}/${mm}/${yyyy}`
  }
  return `${dd}/${mm}`
}

/**
 * Detalle para gastos fijos:
 * "{rubro} · Suele salir alrededor del día {dia_tipico} · Próximo: {proxima_fecha DD/MM}".
 * Para anuales: fecha como DD/MM/AAAA.
 * Si rubro es null o igual al nombre, sin la primera parte.
 */
export function armarDetalleFijo(item: {
  rubro?: string | null
  nombre: string
  dia_tipico?: number | null
  proxima_fecha?: string | null
  frecuencia?: string | null
}): string {
  const tieneDia = item.dia_tipico !== undefined && item.dia_tipico !== null
  const tieneFecha = Boolean(item.proxima_fecha)
  const fechaFormateada = tieneFecha ? formatProximaFechaFijo(item.proxima_fecha, item.frecuencia) : ''

  const partesInfo: string[] = []
  if (tieneDia) {
    partesInfo.push(`Suele salir alrededor del día ${item.dia_tipico}`)
  }
  if (tieneFecha) {
    partesInfo.push(`Próximo: ${fechaFormateada}`)
  }

  const baseTexto = partesInfo.join(' · ')

  const rubroValido =
    Boolean(item.rubro) &&
    item.rubro!.trim().toLowerCase() !== item.nombre.trim().toLowerCase()

  if (rubroValido) {
    return baseTexto ? `${item.rubro} · ${baseTexto}` : (item.rubro as string)
  }

  return baseTexto
}

/**
 * Detalle para costumbre y día a día:
 * "{ocurrencias} veces en los últimos {meses_ventana} meses"
 */
export function armarDetalleCostumbreDiaADia(ocurrencias: number, mesesVentana: number): string {
  return `${ocurrencias} veces en los últimos ${mesesVentana} meses`
}

/**
 * Mapeo de nombre de sección para el texto de caja_detectada cuando un ítem fue movido.
 */
export function obtenerNombreSeccion(caja: string): string {
  switch (caja) {
    case 'fijo':
      return TEXTOS.SECCIONES.fijos.titulo
    case 'costumbre':
      return TEXTOS.SECCIONES.costumbre.titulo
    case 'dia_a_dia':
      return TEXTOS.SECCIONES.dia_a_dia.titulo
    default:
      return caja
  }
}

/**
 * Nota cuando un ítem fue movido:
 * "Lo moviste desde {nombre de la sección de caja_detectada}"
 */
export function armarNotaMovido(cajaDetectada: string): string {
  return `${TEXTOS.NOTAS.PREFIX_MOVIDO}${obtenerNombreSeccion(cajaDetectada)}`
}

/**
 * Mensaje de aviso al mover un ítem:
 * "Lo pasaste a {sección}."
 */
export function armarAvisoMovido(cajaDestino: string): string {
  return `${TEXTOS.AVISOS.PREFIX_MOVIDO}${obtenerNombreSeccion(cajaDestino)}.`
}
