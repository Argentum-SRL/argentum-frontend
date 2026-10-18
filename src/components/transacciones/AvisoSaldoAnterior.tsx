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

  const fechaClean = fecha.split('T')[0]
  const fechaEfectiva = billetera.fecha_saldo_efectiva
    ? billetera.fecha_saldo_efectiva.split('T')[0]
    : billetera.fecha_saldo
    ? billetera.fecha_saldo.split('T')[0]
    : billetera.fecha_creacion?.split('T')[0]

  if (!fechaEfectiva || fechaClean >= fechaEfectiva) {
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
      Esta fecha es anterior al saldo de «{billetera.nombre}» ({fechaFormateada}). Va a figurar en tus movimientos y en el mes, pero no cambia lo que tenés hoy en la cuenta.
    </p>
  )
}
