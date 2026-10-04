import React from 'react'
import styles from './TarjetaModal.module.css'
import { getCardLogoUrl, findCardBrandByNombre, resolveModernCardBackground } from '@/lib/utils/tarjetas.utils'

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
  let logo = RED_LOGOS[red]
  if (red === 'visa') {
    logo = getCardLogoUrl('visa_tarjeta_negro.svg') || visaLogo
  } else if (red === 'amex') {
    const colorLower = (color || '').toLowerCase()
    const nameLower = (titular || '').toLowerCase()
    const isBlack = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    
    logo = isBlack 
      ? (getCardLogoUrl('amex_tarjeta_black.svg') || amexLogo)
      : (getCardLogoUrl('amex_tarjeta.svg') || amexLogo)
  } else if (red === 'mastercard') {
    logo = getCardLogoUrl('master_tarjeta.svg') || mastercardLogo
  }
  
  // Logo del banco emisor
  const bankBrand = findCardBrandByNombre(billeteraNombre)
  const bankLogoUrl = bankBrand ? getCardLogoUrl(bankBrand.logoPath) : ''
  
  // Resolver degradé refinado con iluminación ambiental sutil
  const { background, isDarkText, isGoldOrLight } = resolveModernCardBackground(color, billeteraNombre)
  const textColor = isDarkText ? '#0F172A' : '#FFFFFF'
  const labelColor = isDarkText ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.7)'

  // Reglas de color para el logo de red
  let shouldInvertNetworkLogo = false
  let shouldApplyGrayscaleFilter = false
  if (red === 'visa') {
    const colorLower = (color || '').toLowerCase()
    const nameLower = (titular || '').toLowerCase()
    const isGoldCard = colorLower.includes('#d4af37') || colorLower.includes('#c5a028') || colorLower.includes('#dfb756') || nameLower.includes('gold')
    const isSilverCard = colorLower.includes('#e5e4e2') || colorLower.includes('#b4b4b4') || colorLower.includes('#e2e8f0') || nameLower.includes('silver') || nameLower.includes('platinum') || nameLower.includes('platino')
    const isBlackCard = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    
    const isGalicia = (billeteraNombre || '').toLowerCase().includes('galicia')
    const isGaliciaNormal = isGalicia && !isGoldCard && !isSilverCard && !isBlackCard
    
    if (isGaliciaNormal) {
      shouldInvertNetworkLogo = true
    } else if (isGoldCard || isSilverCard) {
      shouldInvertNetworkLogo = false
    } else if (isBlackCard) {
      shouldInvertNetworkLogo = true
    } else {
      shouldInvertNetworkLogo = !isDarkText
    }
  } else if (red === 'mastercard') {
    const colorLower = (color || '').toLowerCase()
    const nameLower = (titular || '').toLowerCase()
    const isBlackCard = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    if (isBlackCard) {
      shouldApplyGrayscaleFilter = true
    }
  }

  // Reglas de color para el logo de banco
  let shouldInvertBankLogo = false
  if (bankBrand?.id === 'galicia') {
    const colorLower = (color || '').toLowerCase()
    const nameLower = (titular || '').toLowerCase()
    const isGoldCard = colorLower.includes('#d4af37') || colorLower.includes('#c5a028') || colorLower.includes('#dfb756') || nameLower.includes('gold')
    const isSilverCard = colorLower.includes('#e5e4e2') || colorLower.includes('#b4b4b4') || colorLower.includes('#e2e8f0') || nameLower.includes('silver') || nameLower.includes('platinum') || nameLower.includes('platino')
    
    if (isGoldCard || isSilverCard) {
      shouldInvertBankLogo = true
    } else {
      shouldInvertBankLogo = false
    }
  }

  // Fondo con iluminación ambiental fina
  const compositeBackground = `radial-gradient(ellipse at 25% 0%, rgba(255, 255, 255, 0.16) 0%, transparent 65%), ${background}`
  
  return (
    <div 
      className={styles.realCard} 
      style={{ background: compositeBackground }}
    >
      {/* ── Contenido de la Tarjeta ── */}
      <div className={styles.cardTop}>
        {bankLogoUrl ? (
          <img
            src={bankLogoUrl}
            alt={billeteraNombre}
            className={styles.bankLogoImg}
            style={{
              filter: shouldInvertBankLogo ? 'invert(1)' : 'none'
            }}
          />
        ) : (
          <div 
            className={styles.walletNamePreview} 
            style={{ color: textColor }}
          >
            {(billeteraNombre || 'ARGENTUM').toUpperCase()}
          </div>
        )}
      </div>
      
      <div className={styles.cardMid}>
        <div className={styles.chipContainer}>
          {/* Chip EMV limpio y fino */}
          <svg viewBox="0 0 100 74" className={styles.chipSvg}>
            <defs>
              <linearGradient id={isGoldOrLight ? 'chipGoldGradient' : 'chipSilverGradient'} x1="0%" y1="0%" x2="100%" y2="100%">
                {isGoldOrLight ? (
                  <>
                    <stop offset="0%" stopColor="#F5E6A3" />
                    <stop offset="100%" stopColor="#C49E46" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </>
                )}
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="74" rx="10" fill={`url(#${isGoldOrLight ? 'chipGoldGradient' : 'chipSilverGradient'})`} />
            
            <g stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round">
              <path d="M 0 25 L 34 25" />
              <path d="M 0 49 L 34 49" />
              <path d="M 66 25 L 100 25" />
              <path d="M 66 49 L 100 49" />
              <path d="M 50 10 C 33 18, 33 56, 50 64 C 67 56, 67 18, 50 10 Z" fill="none" />
              <path d="M 50 0 L 50 10" />
              <path d="M 50 64 L 50 74" />
              <circle cx="50" cy="22" r="2.5" fill="rgba(0,0,0,0.35)" />
            </g>
          </svg>
          
          {/* Ondas Contactless */}
          <div className={styles.contactless} style={{ color: textColor }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              className={styles.contactlessSvg}
            >
              <path d="M 6 9 Q 8.5 12 6 15" />
              <path d="M 10 6.5 Q 13.5 12 10 17.5" />
              <path d="M 14 4 Q 18.5 12 14 20" />
              <path d="M 18 1.5 Q 23.5 12 18 22.5" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Número de tarjeta */}
      <div 
        className={styles.cardNumber}
        style={{ color: textColor }}
      >
        XXXX  XXXX  XXXX  {ultimos4 ? ultimos4.padStart(4, '•') : '••••'}
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardInfoRow}>
          <div className={styles.cardInfoGroup}>
            <span 
              className={styles.cardInfoLabel} 
              style={{ color: labelColor }}
            >
              Cierra
            </span>
            <span 
              className={styles.cardInfoValue} 
              style={{ color: textColor }}
            >
              día {diaCierre}
            </span>
          </div>
          <div className={styles.cardInfoGroup}>
            <span 
              className={styles.cardInfoLabel} 
              style={{ color: labelColor }}
            >
              Vence
            </span>
            <span 
              className={styles.cardInfoValue} 
              style={{ color: textColor }}
            >
              día {diaVencimiento}
            </span>
          </div>
        </div>
 
        <div className={styles.networkLogoWrap}>
          {logo ? (
            <img 
              src={logo} 
              alt={red} 
              className={styles.networkLogo} 
              style={{
                height: red === 'amex' ? '36px' : '26px',
                filter: shouldInvertNetworkLogo 
                  ? 'invert(1) brightness(2)' 
                  : shouldApplyGrayscaleFilter 
                    ? 'grayscale(1) brightness(2.2) contrast(1.4)' 
                    : 'none'
              }} 
            />
          ) : (
            <span 
              style={{
                fontSize: '10px',
                fontWeight: '800',
                color: textColor
              }}
            >
              {(red || '').toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealCardPreview
