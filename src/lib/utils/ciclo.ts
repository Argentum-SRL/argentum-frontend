import type { Usuario } from '@/types'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

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

function fmt(d: Date): string {
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function calcularPeriodoActual(
  usuario: Pick<Usuario, 'ciclo_tipo' | 'ciclo_valor'> | null,
): { inicio: Date; fin: Date; label: string } {
  const hoy = new Date()

  if (usuario?.ciclo_tipo === 'dia_fijo' && usuario.ciclo_valor) {
    const dia = parseInt(usuario.ciclo_valor, 10)
    if (!isNaN(dia) && dia >= 1 && dia <= 28) {
      let y = hoy.getFullYear()
      let m = hoy.getMonth()
      if (hoy.getDate() < dia) {
        if (m === 0) { m = 11; y-- } else { m-- }
      }
      const inicio = new Date(y, m, dia)
      const mFin = (m + 1) % 12
      const yFin = m + 1 > 11 ? y + 1 : y
      const fin = new Date(yFin, mFin, dia - 1)
      return { inicio, fin, label: `${fmt(inicio)} — ${fmt(fin)}` }
    }
  }

  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return { inicio, fin, label: `${fmt(inicio)} — ${fmt(fin)}` }
}

export function getCicloLabel(ciclo_tipo: string | null, ciclo_valor: string | null): string {
  if (!ciclo_tipo || !ciclo_valor) return ''
  if (ciclo_tipo === 'dia_fijo') return `Ciclo: día ${ciclo_valor}`
  return `Ciclo: ${REGLA_MAP[ciclo_valor] ?? ciclo_valor}`
}
