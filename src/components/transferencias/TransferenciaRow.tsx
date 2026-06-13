import { memo } from 'react'
import { ArrowRightLeft, Trash2 } from 'lucide-react'
import type { TransferenciaInterna, Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import styles from './TransferenciaRow.module.css'

interface TransferenciaRowProps {
  transferencia: TransferenciaInterna
  billeteraOrigen?: Billetera
  billeteraDestino?: Billetera
  onDelete: (id: string) => void
}

export const TransferenciaRow = memo(({
  transferencia,
  billeteraOrigen,
  billeteraDestino,
  onDelete
}: TransferenciaRowProps) => {
  
  const formatHora = (fechaStr: string) => {
    if (!fechaStr.includes('T')) return ''
    const d = new Date(fechaStr)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  const hora = formatHora(transferencia.fecha_creacion)

  const origenNombre = billeteraOrigen?.nombre || 'Billetera origen'
  const destinoNombre = billeteraDestino?.nombre || 'Billetera destino'

  return (
    <div className={styles.row}>
      <div className={styles.iconWrapper}>
        <ArrowRightLeft size={18} strokeWidth={2.5} />
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.description}>
            {origenNombre} &rarr; {destinoNombre}
          </span>
        </div>
        <span className={styles.meta}>
          {transferencia.notas ? (
            <span>{transferencia.notas}</span>
          ) : (
            <span>Transferencia interna de fondos</span>
          )}
          {hora && (
            <>
              <span className={styles.metaHoraDivider}> · </span>
              <span className={styles.metaHora}>{hora}</span>
            </>
          )}
        </span>
      </div>

      <div className={styles.amountArea}>
        <span className={styles.amount}>
          {formatMonto(transferencia.monto, transferencia.moneda)}
        </span>
        <span className={styles.walletName}>
          {transferencia.moneda}
        </span>
      </div>

      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete(transferencia.id) }}
        aria-label="Eliminar transferencia"
        title="Eliminar transferencia"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
})

TransferenciaRow.displayName = 'TransferenciaRow'
export default TransferenciaRow
