import { memo } from 'react'
import type { MovimientoItem, Categoria, Billetera } from '@/types'
import TransaccionRow from './TransaccionRow'
import {
  ArrowRightLeft,
  TrendingUp,
  SlidersHorizontal,
  Wallet,
} from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import styles from './MovimientoRow.module.css'

interface MovimientoRowProps {
  movimiento: MovimientoItem
  categoria?: Categoria
  billetera?: Billetera
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onOpenCuotasGroup?: (grupoId: string) => void
  hideWallet?: boolean
  modo?: 'general' | 'billetera'
}

const MovimientoRow = memo(({
  movimiento,
  categoria,
  billetera,
  onEdit,
  onDelete,
  onOpenCuotasGroup,
  hideWallet = false,
  modo = 'general',
}: MovimientoRowProps) => {
  if (movimiento.clase === 'transaccion' && movimiento.transaccion) {
    const hasCuotasGroup = Boolean(movimiento.grupo_cuotas_id)
    return (
      <TransaccionRow
        transaccion={movimiento.transaccion}
        titulo={movimiento.cuota_texto ? movimiento.descripcion : undefined}
        categoria={categoria}
        billetera={billetera}
        onEdit={hasCuotasGroup && onOpenCuotasGroup ? () => onOpenCuotasGroup(movimiento.grupo_cuotas_id!) : onEdit}
        onDelete={hasCuotasGroup ? undefined : onDelete}
        hideWallet={hideWallet}
        etiqueta={movimiento.etiqueta}
        aclaracion={movimiento.aclaracion}
        cuentaComo={movimiento.cuenta_como}
        saldoDespues={movimiento.saldo_despues}
        cuotaTexto={movimiento.cuota_texto}
        modo={modo}
      />
    )
  }

  const renderAvatar = () => {
    switch (movimiento.clase) {
      case 'transferencia':
        return (
          <div className={`${styles.avatarContainer} ${styles.avatarTransferencia}`}>
            <ArrowRightLeft size={20} className={styles.avatarIconTransf} />
          </div>
        )
      case 'rendimiento':
        return (
          <div className={`${styles.avatarContainer} ${styles.avatarRendimiento}`}>
            <TrendingUp size={20} className={styles.avatarIconRend} />
          </div>
        )
      case 'ajuste':
        return (
          <div className={`${styles.avatarContainer} ${styles.avatarAjuste}`}>
            <SlidersHorizontal size={20} className={styles.avatarIconAjuste} />
          </div>
        )
      case 'saldo_inicial':
      default:
        return (
          <div className={`${styles.avatarContainer} ${styles.avatarSaldoInicial}`}>
            <Wallet size={20} className={styles.avatarIconSaldo} />
          </div>
        )
    }
  }

  const sign = movimiento.sentido === 'entra' ? '+' : movimiento.sentido === 'sale' ? '-' : ''

  const amountColorClass =
    movimiento.cuenta_como === 'nada'
      ? styles.amountNada
      : movimiento.cuenta_como === 'ingreso'
      ? styles.amountIngreso
      : styles.amountEgreso

  const subtitle =
    movimiento.billetera_nombre && !hideWallet
      ? movimiento.billetera_destino_nombre
        ? `${movimiento.billetera_nombre} → ${movimiento.billetera_destino_nombre}`
        : movimiento.billetera_nombre
      : null

  return (
    <div
      className={`${styles.row} ${styles.rowStatic}`}
      aria-label={`${movimiento.descripcion}, monto ${formatMonto(movimiento.monto, movimiento.moneda)}`}
    >
      {renderAvatar()}

      <div className={styles.infoArea}>
        <div className={styles.titleRow}>
          <span className={styles.title} title={movimiento.descripcion}>
            {movimiento.descripcion}
          </span>

          <div className={styles.badgesWrapper}>
            {movimiento.etiqueta && movimiento.etiqueta !== 'Gasto' && movimiento.etiqueta !== 'Ingreso' && (
              <span className={styles.badgeEtiqueta}>
                {movimiento.etiqueta}
              </span>
            )}
          </div>
        </div>

        {/* Desktop metadata */}
        <div className={`${styles.metaRow} ${styles.desktopOnly}`}>
          {subtitle && (
            <span className={styles.metaText}>{subtitle}</span>
          )}
        </div>

        {/* Mobile metadata */}
        <div className={`${styles.mobileSubtitleRow} ${styles.mobileOnly}`}>
          {subtitle && (
            <span>{subtitle}</span>
          )}
        </div>
      </div>

      <div className={styles.amountArea}>
        <div className={`${styles.amount} ${amountColorClass}`}>
          {sign && <span className={styles.amountSign}>{sign}</span>}
          <span className={styles.amountNumber}>{formatMonto(movimiento.monto, movimiento.moneda)}</span>
        </div>
      </div>
    </div>
  )
})

MovimientoRow.displayName = 'MovimientoRow'

export default MovimientoRow
