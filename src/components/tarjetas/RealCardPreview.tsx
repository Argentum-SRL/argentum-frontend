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
  let logo = RED_LOGOS[red]
  if (red === 'visa') {
    logo = getCardLogoUrl('visa_tarjeta_negro.svg') || visaLogo
  } else if (red === 'amex') {
    const colorLower = color.toLowerCase()
    const nameLower = titular.toLowerCase()
    const isBlack = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    
    logo = isBlack 
      ? (getCardLogoUrl('amex_tarjeta_black.svg') || amexLogo)
      : (getCardLogoUrl('amex_tarjeta.svg') || amexLogo)
  } else if (red === 'mastercard') {
    logo = getCardLogoUrl('master_tarjeta.svg') || mastercardLogo
  }
  
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

  // Reglas de color para el logo de red (Visa en negro o blanco)
  let shouldInvertNetworkLogo = false
  let shouldApplyGrayscaleFilter = false
  if (red === 'visa') {
    const colorLower = color.toLowerCase()
    const nameLower = titular.toLowerCase()
    const isGold = colorLower.includes('#d4af37') || colorLower.includes('#c5a028') || nameLower.includes('gold')
    const isSilver = colorLower.includes('#e5e4e2') || colorLower.includes('#b4b4b4') || nameLower.includes('silver') || nameLower.includes('platinum') || nameLower.includes('platino')
    const isBlack = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    
    const isGalicia = billeteraNombre.toLowerCase().includes('galicia')
    const isGaliciaNormal = isGalicia && !isGold && !isSilver && !isBlack
    
    if (isGaliciaNormal) {
      shouldInvertNetworkLogo = true // Normal Galicia - blanco
    } else if (isGold || isSilver) {
      shouldInvertNetworkLogo = false // Gold negro, Silver negro
    } else if (isBlack) {
      shouldInvertNetworkLogo = true // black - blanco
    } else {
      // Por defecto
      shouldInvertNetworkLogo = textColor === 'white'
    }
  } else if (red === 'mastercard') {
    const colorLower = color.toLowerCase()
    const nameLower = titular.toLowerCase()
    const isBlack = colorLower.includes('#1a1a1b') || colorLower.includes('#000000') || nameLower.includes('black') || nameLower.includes('signature')
    if (isBlack) {
      shouldApplyGrayscaleFilter = true
    }
  }

  // Reglas de color para el logo de banco (Galicia en negro o blanco)
  let shouldInvertBankLogo = false
  if (bankBrand?.id === 'galicia') {
    const colorLower = color.toLowerCase()
    const nameLower = titular.toLowerCase()
    const isGold = colorLower.includes('#d4af37') || colorLower.includes('#c5a028') || nameLower.includes('gold')
    const isSilver = colorLower.includes('#e5e4e2') || colorLower.includes('#b4b4b4') || nameLower.includes('silver') || nameLower.includes('platinum') || nameLower.includes('platino')
    
    if (isGold || isSilver) {
      shouldInvertBankLogo = true // Invertir a negro en Gold/Silver
    } else {
      shouldInvertBankLogo = false // Blanco en Orange (normal) y Black
    }
  }
  
  return (
    <div 
      className={styles.realCard} 
      ref={el => {
        if (el) {
          el.style.background = backgroundStyle
        }
      }}
    >
      <div className={styles.cardTop}>
        {bankLogoUrl ? (
          <img
            src={bankLogoUrl}
            alt={billeteraNombre}
            ref={el => {
              if (el) {
                el.style.height = '26px'
                el.style.maxWidth = '100px'
                el.style.objectFit = 'contain'
                el.style.filter = shouldInvertBankLogo ? 'invert(1)' : 'none'
              }
            }}
          />
        ) : (
          <div 
            className={styles.walletNamePreview} 
            ref={el => {
              if (el) {
                el.style.color = textColor
              }
            }}
          >
            {billeteraNombre.toUpperCase()}
          </div>
        )}
      </div>
      
      <div className={styles.cardMid}>
        <div className={styles.chipContainer}>
          {/* EMV Chip SVG */}
          <svg viewBox="0 0 100 74" className={styles.chipSvg}>
            <defs>
              <linearGradient id="chipMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f9fafb" />
                <stop offset="20%" stopColor="#e5e7eb" />
                <stop offset="40%" stopColor="#9ca3af" />
                <stop offset="60%" stopColor="#e5e7eb" />
                <stop offset="80%" stopColor="#f3f4f6" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>
            </defs>
            {/* Base plate with rounded corners (No outer black stroke) */}
            <rect x="0" y="0" width="100" height="74" rx="12" fill="url(#chipMetallic)" />
            
            {/* Left horizontal line cuts */}
            <path d="M 0 25 L 34 25" stroke="#000000" strokeWidth="2.2" />
            <path d="M 0 49 L 34 49" stroke="#000000" strokeWidth="2.2" />
            
            {/* Right horizontal line cuts */}
            <path d="M 66 25 L 100 25" stroke="#000000" strokeWidth="2.2" />
            <path d="M 66 49 L 100 49" stroke="#000000" strokeWidth="2.2" />
            
            {/* Center vertical egg-shaped loop */}
            <path d="M 50 10 C 33 18, 33 56, 50 64 C 67 56, 67 18, 50 10 Z" fill="none" stroke="#000000" strokeWidth="2.2" />
            
            {/* Top vertical notch */}
            <path d="M 50 0 L 50 10" stroke="#000000" strokeWidth="2.2" />
            
            {/* Bottom vertical notch */}
            <path d="M 50 64 L 50 74" stroke="#000000" strokeWidth="2.2" />
            
            {/* Circle/dot in upper-middle loop */}
            <circle cx="50" cy="22" r="3" fill="#000000" />
          </svg>
          
          {/* Contactless Waves SVG (4 arcs pointing right) */}
          <div 
            className={styles.contactless} 
            ref={el => {
              if (el) {
                el.style.color = textColor
              }
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.8" 
              strokeLinecap="round" 
              ref={el => {
                if (el) {
                  el.style.width = '18px'
                  el.style.height = '18px'
                  el.style.opacity = '0.85'
                }
              }}
            >
              <path d="M 6 9 Q 8.5 12 6 15" />
              <path d="M 10 6.5 Q 13.5 12 10 17.5" />
              <path d="M 14 4 Q 18.5 12 14 20" />
              <path d="M 18 1.5 Q 23.5 12 18 22.5" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Número de tarjeta alineado a la izquierda, libre de contenedor flex lateral */}
      <div 
        className={styles.cardNumber} 
        ref={el => {
          if (el) {
            el.style.color = textColor
            el.style.textAlign = 'left'
            el.style.fontSize = '17px'
            el.style.letterSpacing = '0.12em'
            el.style.marginBottom = '6px'
            el.style.whiteSpace = 'nowrap'
          }
        }}
      >
        XXXX  XXXX  XXXX  {ultimos4 ? ultimos4.padStart(4, '•') : '••••'}
      </div>

      <div className={styles.cardBottom}>
        <div 
          className={styles.cardInfoRow} 
          ref={el => {
            if (el) {
              el.style.gap = '16px'
            }
          }}
        >
          <div className={styles.cardInfoGroup}>
            <span 
              className={styles.cardInfoLabel} 
              ref={el => {
                if (el) {
                  el.style.color = labelColor
                }
              }}
            >
              Cierra
            </span>
            <span 
              className={styles.cardInfoValue} 
              ref={el => {
                if (el) {
                  el.style.color = textColor
                }
              }}
            >
              día {diaCierre}
            </span>
          </div>
          <div className={styles.cardInfoGroup}>
            <span 
              className={styles.cardInfoLabel} 
              ref={el => {
                if (el) {
                  el.style.color = labelColor
                }
              }}
            >
              Vence
            </span>
            <span 
              className={styles.cardInfoValue} 
              ref={el => {
                if (el) {
                  el.style.color = textColor
                }
              }}
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
              ref={el => {
                if (el) {
                  el.style.height = red === 'amex' ? '40px' : '26px'
                  el.style.filter = shouldInvertNetworkLogo 
                    ? 'invert(1) brightness(2)' 
                    : shouldApplyGrayscaleFilter 
                      ? 'grayscale(1) brightness(2.5) contrast(1.5)' 
                      : 'none'
                }
              }} 
            />
          ) : (
            <span 
              ref={el => {
                if (el) {
                  el.style.fontSize = '10px'
                  el.style.fontWeight = '700'
                  el.style.color = textColor
                }
              }}
            >
              {red.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealCardPreview
