// Definición de tipo para opciones de regla de ciclo financiero
export interface ReglaCicloOpcion {
  id: string
  label: string
  title: string
  subtitle?: string
  destacada?: boolean
}

// Lista única de reglas de ciclo financiero vigentes y sus textos visibles
export const REGLAS_CICLO: ReglaCicloOpcion[] = [
  {
    id: 'primer_dia_habil',
    title: '1° día hábil del mes',
    label: '1° día hábil del mes',
    destacada: true,
  },
  {
    id: 'ultimo_dia_habil',
    title: 'Último día hábil del mes',
    label: 'Último día hábil del mes',
    destacada: true,
  },
  // Resto de opciones para el selector desplegable
  { id: 'dia_habil_2', label: '2° día hábil del mes', title: '2° día hábil del mes' },
  { id: 'dia_habil_3', label: '3° día hábil del mes', title: '3° día hábil del mes' },
  { id: 'dia_habil_4', label: '4° día hábil del mes', title: '4° día hábil del mes' },
  { id: 'dia_habil_5', label: '5° día hábil del mes', title: '5° día hábil del mes' },
  { id: 'dia_habil_6', label: '6° día hábil del mes', title: '6° día hábil del mes' },
  { id: 'dia_habil_7', label: '7° día hábil del mes', title: '7° día hábil del mes' },
  { id: 'dia_habil_8', label: '8° día hábil del mes', title: '8° día hábil del mes' },
  { id: 'dia_habil_9', label: '9° día hábil del mes', title: '9° día hábil del mes' },
  { id: 'dia_habil_10', label: '10° día hábil del mes', title: '10° día hábil del mes' },
  { id: 'ultimo_viernes', label: 'Último viernes del mes', title: 'Último viernes del mes' },
]

// Mapeo id -> etiqueta para búsqueda rápida
export const REGLA_MAP: Record<string, string> = Object.fromEntries(
  REGLAS_CICLO.map((r) => [r.id, r.label])
)

export function getCicloLabel(ciclo_tipo: string | null, ciclo_valor: string | null): string {
  if (!ciclo_tipo || !ciclo_valor) return ''
  if (ciclo_tipo === 'dia_fijo') return `Ciclo: día ${ciclo_valor}`
  return `Ciclo: ${REGLA_MAP[ciclo_valor] ?? ciclo_valor}`
}

