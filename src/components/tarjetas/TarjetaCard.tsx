import React, { useState } from 'react'
import { Clock, Edit2, Archive, Trash2 } from 'lucide-react'
import type { TarjetaCredito, Billetera } from '@/types'
import { calcularProximoVencimiento, RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { formatMonto } from '@/utils/format'
import RealCardPreview from './RealCardPreview'
import styles from './TarjetaCard.module.css'

interface TarjetaCardProps {
  tarjeta: TarjetaCredito
  billetera?: Billetera
  onEdit: (tarjeta: TarjetaCredito) => void
  onArchive: (tarjeta: TarjetaCredito) => void
  onDelete: (tarjeta: TarjetaCredito) => void
  isShrunk?: boolean
}

const TarjetaCard: React.FC<TarjetaCardProps> = ({ tarjeta, billetera, onEdit, onArchive, onDelete, isShrunk }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const proximoVencimiento = calcularProximoVencimiento(tarjeta.dia_vencimiento)
  
  const hoy = new Date()
  const diffTime = proximoVencimiento.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const mostrarAlerta = diffDays >= 0 && diffDays <= 5

  // Extraer últimos 4 dígitos del nombre de la tarjeta
  const ultimos4 = tarjeta.nombre.replace('•••• ', '').slice(-4)
  const titular = tarjeta.nombre
  const billeteraNombre = billetera?.nombre || RED_LABEL[tarjeta.red] || tarjeta.red

  // Background style & adaptative colors for the back of the card
  const color = tarjeta.color || '#0D2045'
  const isComplex = color.startsWith('linear-gradient')
  const backgroundStyle = isComplex ? color : `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color}, black 25%) 100%)`
  
  const isDarkText = color.includes('E5E4E2') || color.includes('B4B4B4') || color.includes('D4AF37') || color.includes('C5A028')
  const textColor = isDarkText ? '#000000' : 'white'
  const borderLight = isDarkText ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)'
  const bgLight = isDarkText ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.15)'

  const handleCardClick = () => {
    if (isShrunk) return
    setIsFlipped(!isFlipped)
  }

  return (
    <div className={`${styles.card} ${isShrunk ? styles.cardShrunk : ''}`}>
      {/* Contenedor 3D Scene */}
      <div className={styles.cardScene} onClick={handleCardClick}>
        <div className={`${styles.cardInner} ${isFlipped ? styles.isFlipped : ''}`}>
          
          {/* Cara Frontal */}
          <div className={styles.cardFront}>
            <RealCardPreview
              ultimos4={ultimos4}
              red={tarjeta.red}
              titular={titular}
              diaCierre={tarjeta.dia_cierre}
              diaVencimiento={tarjeta.dia_vencimiento}
              color={color}
              billeteraNombre={billeteraNombre}
            />
          </div>

          {/* Cara Posterior */}
          <div 
            className={styles.cardBack} 
            ref={el => {
              if (el) {
                el.style.background = backgroundStyle
                el.style.color = textColor
              }
            }}
          >
            {/* Banda magnética */}
            <div className={styles.magneticStripe} />
            
            {/* Panel de firma y código de seguridad */}
            <div className={styles.signatureStripRow}>
              <div className={styles.signatureStrip}>
                <span className={styles.signatureText}>{titular.toUpperCase()}</span>
              </div>
              <div className={styles.cvvBox}>
                <span className={styles.cvvLabel}>CVV</span>
                <span className={styles.cvvCode}>***</span>
              </div>
            </div>

            {/* Botones de acción elegantes */}
            <div className={styles.backActions}>
              <button 
                className={styles.backActionBtn}
                ref={el => {
                  if (el) {
                    el.style.color = textColor
                    el.style.borderColor = borderLight
                    el.style.background = bgLight
                  }
                }}
                onClick={(e) => { e.stopPropagation(); onEdit(tarjeta) }} 
                title="Editar"
              >
                <Edit2 size={14} />
                <span>Editar</span>
              </button>
              
              <button 
                className={styles.backActionBtn}
                ref={el => {
                  if (el) {
                    el.style.color = textColor
                    el.style.borderColor = borderLight
                    el.style.background = bgLight
                  }
                }}
                onClick={(e) => { e.stopPropagation(); onArchive(tarjeta) }} 
                title="Archivar"
              >
                <Archive size={14} />
                <span>Archivar</span>
              </button>
              
              <button 
                className={`${styles.backActionBtn} ${styles.backActionBtnDelete}`}
                ref={el => {
                  if (el) {
                    el.style.color = textColor
                    el.style.borderColor = borderLight
                    el.style.background = bgLight
                  }
                }}
                onClick={(e) => { e.stopPropagation(); onDelete(tarjeta) }} 
                title="Eliminar"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </button>
            </div>

            {/* Pista de giro */}
            <div 
              className={styles.flipBackHint} 
              ref={el => {
                if (el) {
                  el.style.color = isDarkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
                }
              }}
            >
              <span>Click para volver</span>
            </div>
          </div>

        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.divider} />

        <div className="flex justify-between items-center">
          {mostrarAlerta && !isFlipped && (
            <div className={styles.chipAlerta}>
              <Clock size={12} />
              <span>Vence en {diffDays} {diffDays === 1 ? 'día' : 'días'}</span>
            </div>
          )}
          
          {tarjeta.resumen_actual && tarjeta.resumen_actual.total_comprometido_resumen_actual > 0 && (
            <span 
              ref={el => {
                if (el) {
                  el.style.fontSize = '12px'
                  el.style.fontWeight = '600'
                  el.style.color = 'var(--text-3)'
                  el.style.marginLeft = 'auto'
                }
              }}
            >
              Resumen: {formatMonto(tarjeta.resumen_actual.total_comprometido_resumen_actual, tarjeta.moneda)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TarjetaCard
