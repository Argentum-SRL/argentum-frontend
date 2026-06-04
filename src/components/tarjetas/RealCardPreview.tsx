import React from 'react'
import styles from './TarjetaModal.module.css'
import { getCardLogoUrl, findCardBrandByNombre } from '@/lib/utils/tarjetas.utils'

// Logos de redes
import visaLogo from '@/assets/redes/visa.png'
import mastercardLogo from '@/assets/redes/mastercard.png'
import amexLogo from '@/assets/redes/amex.png'
import cabalLogo from '@/assets/redes/cabal.png'
import naranjaLogo from '@/assets/redes/naranjax.png'

const RED_LOGOS: Record<string, string> = {
  visa: visaLogo,
  mastercard: mastercardLogo,
  amex: amexLogo,
  cabal: cabalLogo,
  naranja: naranjaLogo
}

interface RealCardPreviewProps {
  ultimos4: string
  red: string
  titular: string
  diaCierre: number
  diaVencimiento: number
  color: string
  billeteraNombre: string
}

export const RealCardPreview: React.FC<RealCardPreviewProps> = ({
  ultimos4,
  red,
  titular,
  diaCierre,
  diaVencimiento,
  color,
  billeteraNombre
}) => {
  const logo = RED_LOGOS[red]
  
  // Logo del banco emisor (desde assets/cards/)
  const bankBrand = findCardBrandByNombre(billeteraNombre)
  const bankLogoUrl = bankBrand ? getCardLogoUrl(bankBrand.logoPath) : ''
  
  // Si el color es uno de los premium o ya es un gradiente complejo, lo usamos directo
  const isComplex = color.startsWith('linear-gradient')
  const backgroundStyle = isComplex ? color : `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color}, black 25%) 100%)`
  
  // Detectar si es platino o gold para usar texto negro
  const isDarkText = color.includes('E5E4E2') || color.includes('B4B4B4') || color.includes('D4AF37') || color.includes('C5A028')
  const textColor = isDarkText ? '#000000' : 'white'
  const labelColor = isDarkText ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'
  
  return (
    <div className={styles.realCard} style={{ background: backgroundStyle }}>
      <div className={styles.cardTop}>
        {bankLogoUrl ? (
          <img
            src={bankLogoUrl}
            alt={billeteraNombre}
            style={{ height: 22, maxWidth: 90, objectFit: 'contain' }}
          />
        ) : (
          <div className={styles.walletNamePreview} style={{ color: textColor }}>{billeteraNombre.toUpperCase()}</div>
        )}
      </div>
      
      <div className={styles.cardMid}>
        <div className={styles.cardNumber} style={{ color: textColor }}>
          XXXX  XXXX  XXXX  {ultimos4 ? ultimos4.padStart(4, '•') : '••••'}
        </div>
      </div>
      
      <div className={styles.cardBottom}>
        <div className={styles.cardInfoCol}>
          <div className={styles.cardInfoGroup}>
            <span className={styles.cardInfoLabel} style={{ color: labelColor }}>Titular</span>
            <span className={styles.cardInfoValue} style={{ fontSize: 13, color: textColor }}>{titular || 'TITULAR'}</span>
          </div>
          
          <div className={styles.cardInfoRow} style={{ gap: 16, marginTop: 4 }}>
            <div className={styles.cardInfoGroup}>
              <span className={styles.cardInfoLabel} style={{ color: labelColor }}>Cierra</span>
              <span className={styles.cardInfoValue} style={{ color: textColor }}>día {diaCierre}</span>
            </div>
            <div className={styles.cardInfoGroup}>
              <span className={styles.cardInfoLabel} style={{ color: labelColor }}>Vence</span>
              <span className={styles.cardInfoValue} style={{ color: textColor }}>día {diaVencimiento}</span>
            </div>
          </div>
        </div>

        <div className={styles.networkLogoWrap}>
          {logo ? (
            <img src={logo} alt={red} className={styles.networkLogo} style={{ height: 42 }} />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: textColor }}>{red.toUpperCase()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealCardPreview
