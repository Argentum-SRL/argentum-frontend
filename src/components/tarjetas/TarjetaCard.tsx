import React from 'react'
import { Clock, Edit2, Archive, Trash2 } from 'lucide-react'
import type { TarjetaCredito, Billetera } from '@/types'
import { calcularProximoVencimiento, RED_LABEL } from '@/lib/utils/tarjeta.utils'
import RealCardPreview from './RealCardPreview'
import styles from './TarjetaCard.module.css'

interface TarjetaCardProps {
  tarjeta: TarjetaCredito
  billetera?: Billetera
  onEdit: (tarjeta: TarjetaCredito) => void
  onArchive: (tarjeta: TarjetaCredito) => void
  onDelete: (tarjeta: TarjetaCredito) => void
}

const TarjetaCard: React.FC<TarjetaCardProps> = ({ tarjeta, billetera, onEdit, onArchive, onDelete }) => {
  const proximoVencimiento = calcularProximoVencimiento(tarjeta.dia_vencimiento)
  
  const hoy = new Date()
  const diffTime = proximoVencimiento.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const mostrarAlerta = diffDays >= 0 && diffDays <= 5

  // Extraer últimos 4 dígitos del nombre de la tarjeta
  const ultimos4 = tarjeta.nombre.replace('•••• ', '').slice(-4)
  const titular = tarjeta.nombre // Podría extraerse del usuario, pero por ahora usamos el nombre
  const billeteraNombre = billetera?.nombre || RED_LABEL[tarjeta.red] || tarjeta.red

  return (
    <div className={styles.card}>
      {/* Preview de la tarjeta */}
      <div className={styles.cardPreviewContainer}>
        <RealCardPreview
          ultimos4={ultimos4}
          red={tarjeta.red}
          titular={titular}
          diaCierre={tarjeta.dia_cierre}
          diaVencimiento={tarjeta.dia_vencimiento}
          color={tarjeta.color || '#0D2045'}
          billeteraNombre={billeteraNombre}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.divider} />

        {mostrarAlerta && (
          <div className={styles.chipAlerta}>
            <Clock size={12} />
            <span>Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
          </div>
        )}
      </div>

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
