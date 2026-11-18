export const MIN_PORCENTAJE_AVISO = 10
export const MAX_PORCENTAJE_AVISO = 100
export const MAX_AVISOS_PRESUPUESTO = 3

const SUGERENCIAS_AVISO: number[] = Array.from(
  { length: 19 },
  (_, i) => 10 + i * 5
)

// Conserva solo dígitos (hasta 3) al escribir o pegar en el campo de porcentaje
export function sanitizarDigitosPorcentaje(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 3)
}

// Convierte una entrada de porcentaje a entero o null si está vacía
export function parsearPorcentaje(raw: string): number | null {
  const digits = sanitizarDigitosPorcentaje(raw)
  if (!digits) return null
  const parsed = parseInt(digits, 10)
  return Number.isNaN(parsed) ? null : parsed
}

// Devuelve el mensaje de error de una fila; los valores incompletos (< 10 o vacío) esperan blur/envío
export function errorFilaAlerta(
  lista: Array<number | null>,
  indice: number,
  mostrarIncompletos = false
): string | null {
  const val = lista[indice]
  if (val === null) {
    return mostrarIncompletos ? 'Completá el porcentaje del aviso.' : null
  }
  if (!Number.isInteger(val) || val > MAX_PORCENTAJE_AVISO) {
    return 'Elegí un porcentaje entre 10% y 100%.'
  }
  if (val < MIN_PORCENTAJE_AVISO) {
    return mostrarIncompletos ? 'Elegí un porcentaje entre 10% y 100%.' : null
  }
  const repetido = lista.some((otro, j) => j !== indice && otro === val)
  if (repetido) {
    return 'No repitas el mismo porcentaje.'
  }
  return null
}

// Valida la lista completa antes de avanzar de paso o enviar al backend
export function validarAlertasFormulario(
  lista: Array<number | null>
): string | null {
  if (lista.length < 1 || lista.length > MAX_AVISOS_PRESUPUESTO) {
    return 'Elegí de 1 a 3 avisos, de 10% a 100% y sin repetir.'
  }
  if (lista.some((v) => v === null)) {
    return 'Completá todos los porcentajes de aviso.'
  }
  if (
    lista.some(
      (v) =>
        v === null ||
        !Number.isInteger(v) ||
        v < MIN_PORCENTAJE_AVISO ||
        v > MAX_PORCENTAJE_AVISO
    )
  ) {
    return 'Elegí porcentajes entre 10% y 100%.'
  }
  if (new Set(lista).size !== lista.length) {
    return 'No repitas el mismo porcentaje de aviso.'
  }
  return null
}

// Elige el mayor porcentaje libre menor a 100, o el mayor libre si no queda ninguno menor
export function siguienteAviso(lista: Array<number | null>): number | null {
  const usados = new Set(lista.filter((v): v is number => v !== null))
  const libresMenores100 = SUGERENCIAS_AVISO.filter(
    (pct) => pct < 100 && !usados.has(pct)
  )
  if (libresMenores100.length > 0) {
    return libresMenores100[libresMenores100.length - 1]
  }
  const libres = SUGERENCIAS_AVISO.filter((pct) => !usados.has(pct))
  return libres.length > 0 ? libres[libres.length - 1] : null
}

// Arma la frase legible de avisos configurados para el detalle del presupuesto
export function textoAvisos(lista: number[]): string {
  const ordenados = [...lista].sort((a, b) => a - b)
  if (ordenados.length === 0) return ''
  if (ordenados.length === 1) {
    return `Te llega un aviso al ${ordenados[0]}%.`
  }
  if (ordenados.length === 2) {
    return `Te llega un aviso al ${ordenados[0]}% y al ${ordenados[1]}%.`
  }
  const anteriores = ordenados
    .slice(0, -1)
    .map((pct) => `${pct}%`)
    .join(', al ')
  const ultimo = ordenados[ordenados.length - 1]
  return `Te llega un aviso al ${anteriores} y al ${ultimo}%.`
}
