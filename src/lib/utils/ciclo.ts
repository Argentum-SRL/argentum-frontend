// Definición de tipo para opciones de regla de ciclo financiero
export interface ReglaCicloOpcion {
  id: string
  label: string
  title: string
  subtitle?: string
  badge?: string
  destacada?: boolean
}

// Lista única de reglas de ciclo financiero vigentes y sus textos visibles
export const REGLAS_CICLO: ReglaCicloOpcion[] = [
  // Reglas principales (destacadas en el selector)
  {
    id: 'dia_habil_4',
    title: '4° día hábil del mes',
    label: '4° día hábil del mes',
    subtitle: 'Estándar Ley de Contrato de Trabajo (Comercio, Estatales)',
    badge: 'Más común',
    destacada: true,
  },
  {
    id: 'ultimo_dia_habil',
    title: 'Último día hábil del mes',
    label: 'Último día hábil del mes',
    subtitle: 'Liquidación a fin de mes (Bancos, Empresas privadas)',
    badge: 'Popular',
    destacada: true,
  },
  {
    id: 'primer_dia_habil',
    title: '1° día hábil del mes',
    label: '1° día hábil del mes',
    subtitle: 'Cobro el primer día laborable bancario',
    destacada: true,
  },
  // Opciones adicionales dentro de "Otro día" (días hábiles específicos y regla de último viernes del mes)
  { id: 'dia_habil_2', label: '2° día hábil', title: '2° día hábil' },
  { id: 'dia_habil_3', label: '3° día hábil', title: '3° día hábil' },
  { id: 'dia_habil_5', label: '5° día hábil', title: '5° día hábil' },
  { id: 'dia_habil_6', label: '6° día hábil', title: '6° día hábil' },
  { id: 'dia_habil_7', label: '7° día hábil', title: '7° día hábil' },
  { id: 'dia_habil_8', label: '8° día hábil', title: '8° día hábil' },
  { id: 'dia_habil_9', label: '9° día hábil', title: '9° día hábil' },
  { id: 'dia_habil_10', label: '10° día hábil', title: '10° día hábil' },
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

