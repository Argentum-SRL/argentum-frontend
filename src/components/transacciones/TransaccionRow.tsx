import { memo } from 'react'
import { AlertCircle, CreditCard, RefreshCw, Trash2 } from 'lucide-react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionRow.module.css'

interface TransaccionRowProps {
  transaccion: Transaccion
  categoria?: Categoria
  billetera?: Billetera
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const TransaccionRow = memo(({
  transaccion,
  categoria,
  billetera,
  onEdit,
  onDelete
}: TransaccionRowProps) => {
  const isIngreso = transaccion.tipo === 'ingreso'
  const isPendiente = transaccion.estado_verificacion === 'pendiente'

  const formatHora = (fechaStr: string) => {
    if (!fechaStr.includes('T')) return ''
    const d = new Date(fechaStr)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  const hora = formatHora(transaccion.fecha_creacion)
  
  let metodoTxt: string = transaccion.metodo_pago
  if (metodoTxt === 'transferencia') metodoTxt = 'Transferencia'
  if (metodoTxt === 'debito') metodoTxt = 'Débito'
  if (metodoTxt === 'credito') metodoTxt = 'Crédito'
  if (metodoTxt === 'efectivo') metodoTxt = 'Efectivo'

  const categoriaText = transaccion.subcategoria 
    ? `${categoria?.nombre} / ${transaccion.subcategoria.nombre}`
    : (categoria?.nombre || 'General')

  const metaText = [
    categoriaText,
    metodoTxt,
    hora
  ].filter(Boolean).join(' · ')

  return (
    <div 
      onClick={() => onEdit(transaccion.id)}
      className={`${styles.row} ${isPendiente ? styles.pendiente : ''}`}
    >
      <CategoriaIcon nombre={categoria?.nombre} size={40} />

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.description}>
            {transaccion.descripcion || transaccion.subcategoria?.nombre || 'Sin descripción'}
          </span>
          
          <div className={styles.badges}>
            {isPendiente && (
              <span className={`${styles.badge} ${styles.badgePendiente}`}>
                <AlertCircle size={8} strokeWidth={3} /> Pendiente IA
              </span>
            )}
            {transaccion.es_cuota_hija && (
              <span className={`${styles.badge} ${styles.badgeCuota}`}>
                <CreditCard size={8} strokeWidth={3} /> Cuota
              </span>
            )}
            {transaccion.es_recurrente && (
              <span className={`${styles.badge} ${styles.badgeRecurrente}`}>
                <RefreshCw size={8} strokeWidth={3} /> Recurrente
              </span>
            )}
          </div>
        </div>
        <span className={styles.meta}>{metaText}</span>
      </div>

      <div className={styles.amountArea}>
        <span className={`${styles.amount} ${isIngreso ? styles.amountPos : styles.amountNeg}`}>
          {isIngreso ? '+' : '-'}{formatMonto(transaccion.monto, transaccion.moneda)}
        </span>
        <span className={styles.walletName}>
          {billetera?.nombre || 'Billetera eliminada'}
        </span>
      </div>

      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete(transaccion.id) }}
        aria-label="Eliminar transacción"
        title="Eliminar transacción"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
})

TransaccionRow.displayName = 'TransaccionRow'

export default TransaccionRow
