import { memo } from 'react'
import type { MovimientoItem, Categoria, Billetera } from '@/types'
import TransaccionRow from './TransaccionRow'
import {
  ArrowRightLeft,
  TrendingUp,
  SlidersHorizontal,
  Wallet,
} from '@/components/ui/icons'
import { BadgePercent } from 'lucide-react'
import MovimientoIconos from './MovimientoIconos'
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

function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
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
    const hasCuotasGroup = Boolean(movimiento.grupo_cuotas_id) && !movimiento.transaccion.reintegro_de_id
    return (
      <TransaccionRow
        transaccion={movimiento.transaccion}
        titulo={movimiento.titulo}
        iconos={movimiento.iconos}
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

  const isEspejoReintegro = Boolean(
    (movimiento.transaccion?.reintegro_de_id && movimiento.transaccion?.tipo_espejo !== 'parte') ||
    movimiento.iconos?.includes('reintegro') ||
    (movimiento.descripcion && movimiento.descripcion.toLowerCase().startsWith('reintegro'))
  )

  const sign = isEspejoReintegro
    ? '+'
    : movimiento.sentido === 'entra'
    ? '+'
    : movimiento.sentido === 'sale'
    ? '-'
    : ''

  const amountColorClass = isEspejoReintegro
    ? styles.amountIngreso
    : movimiento.cuenta_como === 'nada'
    ? styles.amountNada
    : movimiento.cuenta_como === 'ingreso'
    ? styles.amountIngreso
    : styles.amountEgreso

  const isTransferencia = movimiento.clase === 'transferencia'
  const title = movimiento.titulo || (isTransferencia ? 'Transferencia' : movimiento.descripcion)

  const recorridoTransferencia =
    movimiento.billetera_nombre && movimiento.billetera_destino_nombre
      ? `${movimiento.billetera_nombre} → ${movimiento.billetera_destino_nombre}`
      : movimiento.descripcion && movimiento.descripcion.includes('→')
      ? movimiento.descripcion
      : movimiento.descripcion || movimiento.billetera_nombre

  const subtitle = isTransferencia
    ? recorridoTransferencia
    : (movimiento.billetera_nombre && !hideWallet
        ? (movimiento.billetera_destino_nombre
            ? `${movimiento.billetera_nombre} → ${movimiento.billetera_destino_nombre}`
            : movimiento.billetera_nombre)
        : null)

  return (
    <div
      className={`${styles.row} ${styles.rowStatic}`}
      aria-label={`${title}, monto ${formatMonto(movimiento.monto, movimiento.moneda)}`}
    >
      {renderAvatar()}

      <div className={styles.infoArea}>
        <div className={styles.titleRow}>
          <span className={styles.title} title={title}>
            {title}
          </span>
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
          <span className={styles.amountValue}>
            {sign && <span className={styles.amountSign}>{sign}</span>}
            <span className={styles.amountNumber}>
              {formatMonto(Math.abs(movimiento.monto), movimiento.moneda)}
            </span>
          </span>
          {!isEspejoReintegro && movimiento.reintegro && (() => {
            const { monto: rMonto, estado: rEstado, fecha_recibido: rFecha } = movimiento.reintegro
            const label = rEstado === 'recibido'
              ? `Te devolvieron ${formatMonto(rMonto, movimiento.moneda)} el ${formatDDMM(rFecha)}`
              : `Reintegro de ${formatMonto(rMonto, movimiento.moneda)} pendiente`
            return (
              <span
                className={
                  rEstado === 'recibido'
                    ? styles.reintegroIconRecibido
                    : styles.reintegroIconPendiente
                }
                title={label}
                aria-label={label}
              >
                <BadgePercent size={14} />
              </span>
            )
          })()}
          <MovimientoIconos iconos={movimiento.iconos} />
        </div>
      </div>
    </div>
  )
})

MovimientoRow.displayName = 'MovimientoRow'

export default MovimientoRow
