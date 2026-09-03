import { memo } from 'react'
import { Trash2 } from 'lucide-react'
import type { TransferenciaInterna, Billetera } from '@/types'
import { formatMonto, formatHora } from '@/utils/format'
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

  const hora = transferencia.fecha_creacion && transferencia.fecha_creacion.includes('T')
    ? formatHora(transferencia.fecha_creacion)
    : ''

  const monedaOrigen = transferencia.moneda_origen || billeteraOrigen?.moneda || transferencia.moneda
  const monedaDestino = transferencia.moneda_destino || billeteraDestino?.moneda || transferencia.moneda
  const esCrossCurrency = monedaOrigen !== monedaDestino
  const montoOrigen = transferencia.monto_origen ?? transferencia.monto
  const montoDestino = transferencia.monto_destino ?? transferencia.monto

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
          {esCrossCurrency && (
            <span className={styles.exchangeBadge}>
              {monedaOrigen === 'ARS' ? 'Compra USD' : 'Venta USD'}
            </span>
          )}
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
        {esCrossCurrency ? (
          <>
            <div className={styles.crossCurrencyAmounts}>
              <span className={styles.amountSale}>-{formatMonto(montoOrigen, monedaOrigen)}</span>
              <span className={styles.amountArrow}>→</span>
              <span className={styles.amountEntry}>+{formatMonto(montoDestino, monedaDestino)}</span>
            </div>
            <div className={styles.rateMetaRow}>
              {transferencia.cotizacion ? (
                <span className={styles.rateBadge}>
                  1 USD = {formatMonto(transferencia.cotizacion, 'ARS')}
                </span>
              ) : (
                <span className={styles.cambioMonedaBadge}>Cambio de moneda</span>
              )}
              {transferencia.monto_comision ? (
                <span className={styles.comisionBadge}>
                  Comisión: {formatMonto(transferencia.monto_comision, transferencia.moneda_comision || monedaOrigen)}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <span className={styles.amount}>
              {formatMonto(transferencia.monto, transferencia.moneda)}
            </span>
            <span className={styles.currencyMeta}>
              {transferencia.moneda}
            </span>
          </>
        )}
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
