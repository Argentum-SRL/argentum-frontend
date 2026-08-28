const REGLA_MAP: Record<string, string> = {
  primer_lunes:    'Primer lunes',
  primer_martes:   'Primer martes',
  primer_miercoles:'Primer miércoles',
  primer_jueves:   'Primer jueves',
  primer_viernes:  'Primer viernes',
  ultimo_lunes:    'Último lunes',
  ultimo_martes:   'Último martes',
  ultimo_miercoles:'Último miércoles',
  ultimo_jueves:   'Último jueves',
  ultimo_viernes:  'Último viernes',
}

export function getCicloLabel(ciclo_tipo: string | null, ciclo_valor: string | null): string {
  if (!ciclo_tipo || !ciclo_valor) return ''
  if (ciclo_tipo === 'dia_fijo') return `Ciclo: día ${ciclo_valor}`
  return `Ciclo: ${REGLA_MAP[ciclo_valor] ?? ciclo_valor}`
}
