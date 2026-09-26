// Mapeo de reglas de ciclo financiero para etiquetas legibles (Fase 1c)
const REGLA_MAP: Record<string, string> = {
  ultimo_viernes:  'Último viernes del mes',
}

export function getCicloLabel(ciclo_tipo: string | null, ciclo_valor: string | null): string {
  if (!ciclo_tipo || !ciclo_valor) return ''
  if (ciclo_tipo === 'dia_fijo') return `Ciclo: día ${ciclo_valor}`
  return `Ciclo: ${REGLA_MAP[ciclo_valor] ?? ciclo_valor}`
}
