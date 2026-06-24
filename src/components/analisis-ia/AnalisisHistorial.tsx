import React from 'react'
import type { AnalisisIA } from '@/types'
import styles from './AnalisisHistorial.module.css'

interface AnalisisHistorialProps {
  items: AnalisisIA[]
  seleccionado: string | null
  onSeleccionar: (a: AnalisisIA) => void
}

const getTipoLabel = (tipo: string): string => {
  switch (tipo) {
    case 'completo':
      return 'Completo'
    case 'gastos_hormiga':
      return 'Gastos hormiga'
    case 'suscripciones':
      return 'Suscripciones'
    case 'fondo_emergencia':
      return 'Fondo emergencia'
    default:
      return tipo
  }
}

const formatFechaHora = (dateStr: string): string => {
  if (!dateStr) return '-'
  try {
    const [datePart, timePart] = dateStr.split('T')
    const dParts = datePart.split('-')
    const tParts = timePart ? timePart.split(':') : []
    
    if (dParts.length === 3) {
      const dateStrFormatted = `${dParts[2]}/${dParts[1]}/${dParts[0]}`
      if (tParts.length >= 2) {
        return `${dateStrFormatted} ${tParts[0]}:${tParts[1]}`
      }
      return dateStrFormatted
    }
  } catch (e) {
    console.error('Error formatting date time', e)
  }
  return dateStr
}

export const AnalisisHistorial: React.FC<AnalisisHistorialProps> = ({
  items,
  seleccionado,
  onSeleccionar,
}) => {
  if (items.length === 0) {
    return <div className={styles.empty}>No hay análisis previos</div>
  }

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const isSeleccionado = item.id === seleccionado
        const statusClass = 
          item.estado === 'completado' ? styles.statusCompletado :
          item.estado === 'error' ? styles.statusError : styles.statusPendiente

        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.item} ${isSeleccionado ? styles.itemSeleccionado : ''}`}
            onClick={() => onSeleccionar(item)}
          >
            <div className={styles.itemHeader}>
              <span className={styles.tipo}>{getTipoLabel(item.tipo_analisis)}</span>
              <span className={`${styles.statusDot} ${statusClass}`} />
            </div>
            <div className={styles.itemFooter}>
              <span className={styles.fecha}>{formatFechaHora(item.creado_en)}</span>
              <span className={styles.ciclos}>{item.ciclos_analizados} ciclos</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default AnalisisHistorial
