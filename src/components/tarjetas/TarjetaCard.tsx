import React, { useState } from 'react'
import { Edit2, Archive, Trash2 } from '@/components/ui/icons'
import type { TarjetaCredito, Billetera } from '@/types'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
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
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'toBack' | 'toFront' | null>(null)

  // Extraer últimos 4 dígitos del nombre de la tarjeta
  const ultimos4 = tarjeta.nombre.replace('•••• ', '').slice(-4)
  const titular = tarjeta.nombre
  const billeteraNombre = billetera?.nombre || RED_LABEL[tarjeta.red] || tarjeta.red

  // Background style & adaptative colors for the back of the card
  const color = tarjeta.color || '#0D2045'
  const isComplex = color.startsWith('linear-gradient')
  const backgroundStyle = isComplex ? color : `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color}, black 25%) 100%)`
  
  const isDarkText = color.toUpperCase().includes('E5E4E2') || 
                     color.toUpperCase().includes('B4B4B4') || 
                     color.toUpperCase().includes('D4AF37') || 
                     color.toUpperCase().includes('C5A028') ||
                     color.toLowerCase().includes('gold') ||
                     color.toLowerCase().includes('silver')
  const textColor = isDarkText ? '#0f172a' : '#ffffff'
  const borderLight = isDarkText ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.35)'
  const bgLight = isDarkText ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.18)'
  const btnHoverBg = isDarkText ? 'rgba(0, 0, 0, 0.16)' : 'rgba(255, 255, 255, 0.35)'
  const btnHoverBorder = isDarkText ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.55)'

  const handleCardClick = () => {
    if (isShrunk || isFlipping) return
    setIsFlipping(true)
    if (!isFlipped) {
      setFlipDirection('toBack')
      setIsFlipped(true)
    } else {
      setFlipDirection('toFront')
      setIsFlipped(false)
    }
  }

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target === e.currentTarget) {
      setIsFlipping(false)
      setFlipDirection(null)
    }
  }

  return (
    <div className={`${styles.card} ${isShrunk ? styles.cardShrunk : ''}`}>
      {/* Contenedor 3D Scene */}
      <div className={styles.cardScene} onClick={handleCardClick}>
        <div 
          className={`
            ${styles.cardInner}
            ${isFlipping && flipDirection === 'toBack' ? styles.animatingToBack : ''}
            ${isFlipping && flipDirection === 'toFront' ? styles.animatingToFront : ''}
            ${!isFlipping && isFlipped ? styles.isFlippedFlat : ''}
            ${!isFlipping && !isFlipped ? styles.isFrontFlat : ''}
          `}
          onAnimationEnd={handleAnimationEnd}
        >
          
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
            style={{
              background: backgroundStyle,
              color: textColor,
              '--card-text': textColor,
              '--btn-border': borderLight,
              '--btn-bg': bgLight,
              '--btn-hover-bg': btnHoverBg,
              '--btn-hover-border': btnHoverBorder,
            } as React.CSSProperties}
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
                onClick={(e) => { e.stopPropagation(); onEdit(tarjeta) }} 
                title="Editar"
              >
                <Edit2 size={14} />
                <span>Editar</span>
              </button>
              
              <button 
                className={styles.backActionBtn}
                onClick={(e) => { e.stopPropagation(); onArchive(tarjeta) }} 
                title="Archivar"
              >
                <Archive size={14} />
                <span>Archivar</span>
              </button>
              
              <button 
                className={`${styles.backActionBtn} ${styles.backActionBtnDelete}`}
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
              style={{ color: textColor }}
            >
              <span>Click para volver</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default TarjetaCard
