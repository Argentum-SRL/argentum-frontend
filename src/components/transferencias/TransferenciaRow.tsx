import { memo } from 'react'
import { Trash2 } from 'lucide-react'
import type { TransferenciaInterna, Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import styles from './TransferenciaRow.module.css'

interface TransferenciaRowProps {
  transferencia: TransferenciaInterna
  billeteraOrigen?: Billetera
  billeteraDestino?: Billetera
  onDelete: (id: string) => void
}

function getBankVisuals(billetera?: Billetera, fallbackName = 'Cuenta') {
  if (!billetera) {
    return {
      nombre: fallbackName,
      bg: '#0D2045',
      logoUrl: '',
      initials: getInitials(fallbackName),
    }
  }

  if (billetera.es_efectivo) {
    return {
      nombre: `Efectivo ${billetera.moneda}`,
      bg: billetera.moneda === 'ARS' ? '#1A3D28' : '#0C3D48',
      logoUrl: '',
      initials: 'EF',
    }
  }

  const bank = billetera.bank_id
    ? getBankById(billetera.bank_id)
    : findBankByNombre(billetera.nombre)

  return {
    nombre: bank?.nombre || billetera.nombre,
    bg: bank?.colorPrimario || '#0D2045',
    logoUrl: bank ? getBankLogoUrl(bank.logoPath) : '',
    initials: getInitials(bank?.nombre || billetera.nombre),
  }
}

export const TransferenciaRow = memo(({
  transferencia,
  billeteraOrigen,
  billeteraDestino,
  onDelete,
}: TransferenciaRowProps) => {
  const visOrigen = getBankVisuals(billeteraOrigen, 'Origen')
  const visDestino = getBankVisuals(billeteraDestino, 'Destino')

  const formatHora = (fechaStr: string) => {
    if (!fechaStr || !fechaStr.includes('T')) return ''
    const d = new Date(fechaStr)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  const hora = formatHora(transferencia.fecha_creacion)

  return (
    <div className={styles.row}>
      {/* ── Dual Overlapping Bank Avatar (38px Compact) ── */}
      <div className={styles.dualAvatar}>
        <div 
          className={styles.avatarOrigen} 
          style={{ background: visOrigen.bg }} 
          title={`Origen: ${visOrigen.nombre}`}
        >
          {visOrigen.logoUrl ? (
            <img src={visOrigen.logoUrl} alt={visOrigen.nombre} className={styles.avatarImg} />
          ) : (
            <span>{visOrigen.initials}</span>
          )}
        </div>
        <div 
          className={styles.avatarDestino} 
          style={{ background: visDestino.bg }} 
          title={`Destino: ${visDestino.nombre}`}
        >
          {visDestino.logoUrl ? (
            <img src={visDestino.logoUrl} alt={visDestino.nombre} className={styles.avatarImg} />
          ) : (
            <span>{visDestino.initials}</span>
          )}
        </div>
      </div>

      {/* ── Content (Origen ➔ Destino + Notas/Hora) ── */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.accountsTitle} title={`${visOrigen.nombre} → ${visDestino.nombre}`}>
            <span className={styles.bankName}>{visOrigen.nombre}</span>
            <span className={styles.arrowIcon}>→</span>
            <span className={styles.bankName}>{visDestino.nombre}</span>
          </span>
        </div>

        {(transferencia.notas || hora) && (
          <div className={styles.meta}>
            {transferencia.notas && (
              <span className={styles.metaDesc}>
                {transferencia.notas}
              </span>
            )}
            {transferencia.notas && hora && (
              <span className={styles.metaDivider}> · </span>
            )}
            {hora && (
              <span className={styles.metaHora}>{hora}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Amount Area ── */}
      <div className={styles.amountArea}>
        <span className={styles.amount}>
          {formatMonto(transferencia.monto, transferencia.moneda)}
        </span>
        <span className={styles.currencyMeta}>
          {transferencia.moneda}
        </span>
      </div>

      {/* ── Delete Button ── */}
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(transferencia.id)
        }}
        aria-label="Eliminar transferencia"
        title="Eliminar transferencia"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
})

TransferenciaRow.displayName = 'TransferenciaRow'
export default TransferenciaRow
