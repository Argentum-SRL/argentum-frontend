import React from 'react'
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

interface MiniCardProps {
  color?: string
  red?: string
}

export const MiniCard: React.FC<MiniCardProps> = ({ color = '#333', red = 'visa' }) => {
  const logo = RED_LOGOS[red.toLowerCase()]
  
  const isComplex = color.startsWith('linear-gradient')
  const backgroundStyle = isComplex ? color : `linear-gradient(145deg, ${color} 0%, color-mix(in srgb, ${color}, black 20%) 100%)`

  return (
    <div style={{
      width: 44,
      height: 28,
      borderRadius: 5,
      background: backgroundStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1)',
      border: '0.5px solid rgba(0,0,0,0.1)'
    }}>
      {/* Glossy Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Shine Line */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
        animation: 'shine 3s infinite',
        pointerEvents: 'none'
      }} />

      {/* Metallic Chip */}
      <div style={{
        position: 'absolute',
        left: 5,
        top: 8,
        width: 8,
        height: 6,
        borderRadius: 1.5,
        background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
        boxShadow: 'inset 0 0 1px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '0.5px'
      }}>
        <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.1)', width: '100%' }} />
        <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.1)', width: '100%' }} />
      </div>

      {/* Network Logo */}
      <div style={{
        position: 'absolute',
        right: 4,
        bottom: 3,
        height: 12,
        width: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {logo ? (
          <img 
            src={logo} 
            alt={red} 
            style={{ 
              maxHeight: '100%', 
              maxWidth: '100%', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
            }} 
          />
        ) : (
          <span style={{ fontSize: 6, color: 'white', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {red.toUpperCase()}
          </span>
        )}
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-30%) translateY(-30%); }
          100% { transform: translateX(30%) translateY(30%); }
        }
      `}</style>
    </div>
  )
}
