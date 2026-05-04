import { getCategoriaVisual } from '@/lib/utils/categoria.utils'

interface CategoriaIconProps {
  nombre?: string | null
  size?: number     // default 28
  className?: string
}

export function CategoriaIcon({ nombre, size = 28, className }: CategoriaIconProps) {
  const visual = getCategoriaVisual(nombre)

  if (visual.iconSrc) {
    return (
      <img
        src={visual.iconSrc}
        alt={visual.label}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: '#F0F0F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{
        fontSize: Math.max(10, size * 0.4) + 'px',
        fontWeight: 700,
        color: '#8E9198',
      }}>
        {nombre?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}
