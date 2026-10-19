import type { Billetera } from '@/types'

interface AvisoSaldoAnteriorProps {
  billetera?: Billetera | null
  fecha?: string | null
  metodoPago?: string | null
}

function formatFechaDDMMAAAA(fechaIso: string): string {
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return clean
}

export default function AvisoSaldoAnterior({
  billetera,
  fecha,
  metodoPago,
}: AvisoSaldoAnteriorProps) {
  if (!billetera || !fecha) return null
  if (metodoPago === 'credito') return null

  // Decisión 9: No se muestra si fecha_saldo_efectiva es null
  if (!billetera.fecha_saldo_efectiva) {
    return null
  }

  const fechaClean = fecha.split('T')[0]
  const fechaEfectiva = billetera.fecha_saldo_efectiva.split('T')[0]

  if (fechaClean >= fechaEfectiva) {
    return null
  }

  const fechaFormateada = formatFechaDDMMAAAA(fechaEfectiva)

  return (
    <p
      style={{
        margin: 0,
        fontSize: '12px',
        lineHeight: '1.45',
        color: 'var(--text-3, #8e8e93)',
        width: '100%',
      }}
    >
      Es anterior al saldo de «{billetera.nombre}» ({fechaFormateada}): cuenta en tus gastos, pero no cambia tu saldo.
    </p>
  )
}
