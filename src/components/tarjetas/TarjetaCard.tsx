import React from 'react'
import { CreditCard, Clock, Edit2, Archive, Trash2 } from 'lucide-react'
import type { TarjetaCredito } from '@/types'
import { calcularProximoCierre, calcularProximoVencimiento, RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { formatMonto } from '@/utils/format'
import styles from './TarjetaCard.module.css'

interface TarjetaCardProps {
  tarjeta: TarjetaCredito
  onEdit: (tarjeta: TarjetaCredito) => void
  onArchive: (tarjeta: TarjetaCredito) => void
  onDelete: (tarjeta: TarjetaCredito) => void
}

const TarjetaCard: React.FC<TarjetaCardProps> = ({ tarjeta, onEdit, onArchive, onDelete }) => {
  const proximoCierre = calcularProximoCierre(tarjeta.dia_cierre)
  const proximoVencimiento = calcularProximoVencimiento(tarjeta.dia_vencimiento)
  
  const hoy = new Date()
  const diffTime = proximoVencimiento.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const mostrarAlerta = diffDays >= 0 && diffDays <= 5

  const color = tarjeta.color || 'var(--primary)'

  return (
    <div className={styles.card}>
      <div className={styles.colorBar} style={{ background: color }} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <CreditCard size={32} style={{ color }} />
          </div>
          <div className={styles.info}>
            <span className={styles.nombre}>{tarjeta.nombre}</span>
            <span className={styles.banco}>{RED_LABEL[tarjeta.red] || 'Tarjeta'}</span>
            <span className={styles.dias}>
              Cierre: día {tarjeta.dia_cierre} · Vence: día {tarjeta.dia_vencimiento}
            </span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.dates}>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Próximo cierre:</span>
            <span>{proximoCierre.toLocaleDateString()}</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Próximo vencimiento:</span>
            <span>{proximoVencimiento.toLocaleDateString()}</span>
          </div>
        </div>

        {tarjeta.limite_credito && (
          <div className={styles.limite}>
            <span className={styles.dateLabel}>Límite:</span>
            <span>{formatMonto(tarjeta.limite_credito, tarjeta.moneda)}</span>
          </div>
        )}
      </div>

      {mostrarAlerta && (
        <div className={styles.chipAlerta}>
          <Clock size={12} />
          <span>Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => onEdit(tarjeta)} title="Editar">
          <Edit2 size={14} />
        </button>
        <button className={styles.actionBtn} onClick={() => onArchive(tarjeta)} title="Archivar">
          <Archive size={14} />
        </button>
        <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => onDelete(tarjeta)} title="Eliminar">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default TarjetaCard
