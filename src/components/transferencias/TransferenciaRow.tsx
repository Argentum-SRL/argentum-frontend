import { memo } from 'react'
import { ArrowRightLeft, Trash2, CornerDownRight } from 'lucide-react'
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
  
  const origenNombre = billeteraOrigen?.nombre || 'Billetera origen'
  const destinoNombre = billeteraDestino?.nombre || 'Billetera destino'

  return (
    <div className={styles.row}>
      <div className={styles.iconWrapper}>
        <ArrowRightLeft size={18} strokeWidth={2.5} />
      </div>

      <div className={styles.content}>
        <div className={styles.originLine}>
          {origenNombre}
        </div>
        <div className={styles.destinationLine}>
          <CornerDownRight size={14} strokeWidth={2.5} className={styles.arrowIcon} />
          {destinoNombre}
        </div>
        {transferencia.notas && (
          <span className={styles.meta}>
            {transferencia.notas}
          </span>
        )}
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
