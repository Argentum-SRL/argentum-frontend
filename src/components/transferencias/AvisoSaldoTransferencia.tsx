import type { Billetera } from '@/types'

interface AvisoSaldoTransferenciaProps {
  origen?: Billetera | null
  destino?: Billetera | null
  fecha?: string | null
}

function formatFechaDDMMAAAA(fechaIso: string): string {
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return clean
}

export default function AvisoSaldoTransferencia({
  origen,
  destino,
  fecha,
}: AvisoSaldoTransferenciaProps) {
  if (!fecha) return null

  const fechaClean = fecha.split('T')[0]

  const origenAnt = Boolean(
    origen?.fecha_saldo_efectiva && fechaClean < origen.fecha_saldo_efectiva.split('T')[0]
  )
  const destinoAnt = Boolean(
    destino?.fecha_saldo_efectiva && fechaClean < destino.fecha_saldo_efectiva.split('T')[0]
  )

  if (!origenAnt && !destinoAnt) {
    return null
  }

  let texto: string
  if (origenAnt && destinoAnt) {
    texto = 'Es anterior al saldo de las dos billeteras: no los cambia.'
  } else {
    const b = origenAnt ? origen! : destino!
    const fechaFormateada = formatFechaDDMMAAAA(b.fecha_saldo_efectiva!)
    texto = `Es anterior al saldo de «${b.nombre}» (${fechaFormateada}): no lo cambia.`
  }

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
      {texto}
    </p>
  )
}
