import React from 'react'
import { Edit2, Play, Pause, Trash2, CreditCard, Wallet, Bell, Calendar, TrendingUp, MoreVertical } from 'lucide-react'
import type { Suscripcion, Billetera, TarjetaCredito } from '@/types'
import { CATALOGO_SUSCRIPCIONES } from '@/lib/constants/suscripciones'
import { formatMonto } from '@/utils/format'
import styles from './SuscripcionCard.module.css'

interface SuscripcionCardProps {
  suscripcion: Suscripcion
  billeteras: Billetera[]
  tarjetas: TarjetaCredito[]
  onEdit: (s: Suscripcion) => void
  onUpdatePrecio: (s: Suscripcion) => void
  onToggleEstado: (s: Suscripcion) => void
  onDelete: (s: Suscripcion) => void
}

const SuscripcionCard: React.FC<SuscripcionCardProps> = ({ 
  suscripcion, 
  billeteras, 
  tarjetas, 
  onEdit, 
  onUpdatePrecio, 
  onToggleEstado, 
  onDelete 
}) => {
  const catalogoItem = CATALOGO_SUSCRIPCIONES.find(c => c.nombre === suscripcion.nombre)
  
  const hoy = new Date()
  const fechaCobro = new Date(suscripcion.proximo_cobro)
  const diffTime = fechaCobro.getTime() - hoy.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const urgenciaClass = diffDays === 0 ? styles.chipRojo : diffDays <= 7 ? styles.chipNaranja : ''
  const urgenciaText = diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : `En ${diffDays} días`

  const billetera = billeteras.find(b => b.id === suscripcion.billetera_id)
  const tarjeta = tarjetas.find(t => t.id === suscripcion.tarjeta_id)

  const cardStatusClass = 
    suscripcion.estado === 'pausada' ? styles.cardPausada : 
    suscripcion.estado === 'cancelada' ? styles.cardCancelada : ''

  return (
    <div className={`${styles.card} ${cardStatusClass}`}>
      {suscripcion.estado !== 'activa' && (
        <span className={`${styles.estadoBadge} ${suscripcion.estado === 'pausada' ? styles.badgePausada : styles.badgeCancelada}`}>
          {suscripcion.estado}
        </span>
      )}

      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          {catalogoItem?.logoPath ? (
            <img 
              src={catalogoItem.logoPath} 
              alt={suscripcion.nombre} 
              className={styles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const parent = e.currentTarget.parentElement
                if (parent) {
                  const fallback = document.createElement('div')
                  fallback.className = styles.logoFallback
                  fallback.innerText = suscripcion.nombre[0]
                  parent.appendChild(fallback)
                }
              }}
            />
          ) : (
            <div className={styles.logoFallback}>{suscripcion.nombre[0]}</div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{suscripcion.nombre}</h3>
            <span className={styles.frecuencia}>{suscripcion.frecuencia}</span>
          </div>
          <div className={styles.proximoCobro}>
            <Calendar size={12} />
            <span>{new Date(suscripcion.proximo_cobro).toLocaleDateString()}</span>
            {urgenciaClass && <span className={`${styles.chipUrgencia} ${urgenciaClass}`}>{urgenciaText}</span>}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.footer}>
        <div className={styles.montoGroup}>
          <span className={styles.montoReal}>
            {formatMonto(suscripcion.precio_actual?.monto || 0, suscripcion.precio_actual?.moneda || 'ARS')}
          </span>
          {suscripcion.frecuencia !== 'mensual' && suscripcion.costo_mensual_equivalente && (
            <span className={styles.montoEquiv}>
              = {formatMonto(suscripcion.costo_mensual_equivalente, suscripcion.precio_actual?.moneda || 'ARS')}/mes
            </span>
          )}
        </div>

        <div className={styles.vinculacion}>
          {tarjeta ? (
            <><CreditCard size={14} /> <span>{tarjeta.nombre}</span></>
          ) : billetera ? (
            <><Wallet size={14} /> <span>{billetera.nombre}</span></>
          ) : (
            <><Bell size={14} /> <span>Recordatorio</span></>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => onEdit(suscripcion)} title="Editar">
          <Edit2 size={14} />
        </button>
        <button className={styles.actionBtn} onClick={() => onUpdatePrecio(suscripcion)} title="Actualizar precio">
          <TrendingUp size={14} />
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={() => onToggleEstado(suscripcion)} 
          title={suscripcion.estado === 'activa' ? 'Pausar' : 'Reactivar'}
          disabled={suscripcion.estado === 'cancelada'}
        >
          {suscripcion.estado === 'activa' ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button 
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`} 
          onClick={() => onDelete(suscripcion)} 
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default SuscripcionCard
