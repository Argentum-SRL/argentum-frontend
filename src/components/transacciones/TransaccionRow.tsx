import { memo, useMemo } from 'react'
import DebitoAutomaticoBadge from '@/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge'
import { 
  Sparkles, 
  CreditCard, 
  Trash2, 
  Wallet,
  Banknote,
  ChevronRight
} from '@/components/ui/icons'
import { BadgePercent } from 'lucide-react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import MovimientoAvatar from '@/components/ui/MovimientoAvatar'
import { formatMonto } from '@/utils/format'
import { getBankById, findBankByNombre, getBankLogoUrl } from '@/lib/utils/billeteras.utils'
import { esEtiquetaRedundante } from '@/lib/utils/etiquetas.utils'
import styles from './TransaccionRow.module.css'

function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
}

interface TransaccionRowProps {
  transaccion: Transaccion
  titulo?: string
  categoria?: Categoria
  billetera?: Billetera
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  hideWallet?: boolean
  etiqueta?: string
  aclaracion?: string | null
  cuentaComo?: 'gasto' | 'ingreso' | 'nada'
  saldoDespues?: number | null
  cuotaTexto?: string | null
  modo?: 'general' | 'billetera'
}

const METODO_PAGO_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  efectivo: 'Efectivo',
}

const TransaccionRow = memo(({
  transaccion,
  titulo,
  categoria,
  billetera,
  onEdit,
  onDelete,
  hideWallet = false,
  etiqueta,
  cuentaComo,
}: TransaccionRowProps) => {
  const isIngreso = transaccion.tipo === 'ingreso'
  const isPendiente = transaccion.estado_verificacion === 'pendiente'
  const isPendienteIA = isPendiente && ['ia_wpp', 'ia_pdf'].includes(transaccion.origen)

  const isMeta = Boolean(
    transaccion.movimiento_meta_id ||
    transaccion.descripcion?.startsWith('Aporte a la meta:') ||
    transaccion.descripcion?.startsWith('Retiro de la meta:')
  )
  const isAporteMeta = isMeta && transaccion.tipo === 'egreso'
  const isRetiroMeta = isMeta && transaccion.tipo === 'ingreso'

  const metodoLabel = useMemo(() => {
    if (transaccion.tipo === 'ingreso' && (transaccion.metodo_pago === 'debito' || transaccion.metodo_pago === 'credito')) {
      return billetera?.es_efectivo ? 'Efectivo' : 'Transferencia'
    }
    return METODO_PAGO_LABELS[transaccion.metodo_pago] || transaccion.metodo_pago || 'Movimiento'
  }, [transaccion.metodo_pago, transaccion.tipo, billetera?.es_efectivo])

  // Obtener info del banco / logo si aplica
  const bankInfo = useMemo(() => {
    if (!billetera) return null
    if (billetera.es_efectivo) {
      return { isCash: true, name: 'Efectivo', logoUrl: '' }
    }
    const bank = billetera.bank_id
      ? getBankById(billetera.bank_id)
      : findBankByNombre(billetera.nombre)
    
    return {
      isCash: false,
      name: billetera.nombre,
      logoUrl: bank ? getBankLogoUrl(bank.logoPath) : ''
    }
  }, [billetera])

  const title = titulo || transaccion.descripcion || transaccion.subcategoria?.nombre || categoria?.nombre || 'Sin descripción'
  const categoriaNombre = isMeta ? 'Ahorro' : (categoria?.nombre || 'General')
  const subcategoriaNombre = isMeta ? 'Metas' : (transaccion.subcategoria?.nombre || 'General')
  const walletDisplayName = bankInfo?.name || billetera?.nombre || 'Billetera'

  // Limpieza inteligente de categorías para evitar duplicaciones (ej: "Transporte / Transporte") y recortes innecesarios
  const categoryDisplayText = useMemo(() => {
    if (isAporteMeta) return 'Apartado para meta'
    if (isRetiroMeta) return 'Retiro de meta'
    
    const cat = categoriaNombre.trim()
    const sub = subcategoriaNombre.trim()
    
    // Si hay una subcategoría específica distinta de "General" y distinta del nombre de categoría,
    // mostrar directamente la subcategoría para evitar saturar el espacio.
    if (sub && sub.toLowerCase() !== 'general' && sub.toLowerCase() !== cat.toLowerCase()) {
      return sub
    }
    
    return cat
  }, [isAporteMeta, isRetiroMeta, categoriaNombre, subcategoriaNombre])

  const isClickable = typeof onEdit === 'function'

  return (
    <div 
      {...(isClickable ? {
        onClick: () => onEdit(transaccion.id),
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEdit(transaccion.id)
          }
        },
      } : {})}
      className={`${styles.row} ${isClickable ? styles.rowClickable : styles.rowStatic} ${isPendiente ? styles.rowPendiente : ''}`}
      aria-label={`Transacción ${title}, monto ${formatMonto(transaccion.monto, transaccion.moneda)}`}
    >
      {/* ── 1. Category Squircle Avatar ──────────────────────────────────── */}
      <div className={`${styles.avatarContainer} ${
        isAporteMeta ? styles.avatarApartado : isRetiroMeta ? styles.avatarRetiroMeta : isIngreso ? styles.avatarIngreso : styles.avatarEgreso
      }`}>
        <MovimientoAvatar
          movimiento={{
            descripcion: transaccion.descripcion,
            suscripcion_id: transaccion.suscripcion_id,
            movimiento_meta_id: transaccion.movimiento_meta_id,
            subcategoria_nombre: transaccion.subcategoria?.nombre,
            categoria_nombre: categoriaNombre,
            origen: transaccion.origen,
            estado_verificacion: transaccion.estado_verificacion,
            tipo: transaccion.tipo,
          }}
          size={isAporteMeta || isRetiroMeta ? 22 : 24}
          className={isAporteMeta || isRetiroMeta ? styles.avatarIconMeta : styles.avatarIcon}
        />
        {isPendienteIA && (
          <div className={styles.avatarBadge} title="Pendiente IA">
            <Sparkles size={10} className={styles.sparkleIcon} />
          </div>
        )}
      </div>

      {/* ── 2. Central Details Area ──────────────────────────────────────── */}
      <div className={styles.infoArea}>
        {/* Main Title & Badges */}
        <div className={styles.titleRow}>
          <span className={styles.title} title={title}>
            {title}
          </span>

          <div className={styles.badgesWrapper}>
            {isPendiente && (
              <span className={`${styles.badge} ${styles.badgePendiente} ${styles.desktopOnly}`}>
                <Sparkles size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>{isPendienteIA ? 'Pendiente IA' : 'Por confirmar'}</span>
              </span>
            )}
            {transaccion.es_cuota_hija && (
              <span className={`${styles.badge} ${styles.badgeCuota}`}>
                <CreditCard size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>Cuota</span>
              </span>
            )}
            {Boolean(transaccion.suscripcion_id) && (
              <DebitoAutomaticoBadge />
            )}
            {etiqueta && !esEtiquetaRedundante(etiqueta) && (
              <span className={`${styles.badgeEtiqueta} ${styles.desktopOnly}`}>
                {etiqueta}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Metadata Row (Categoría limpia + Chip billetera opcional) */}
        <div className={`${styles.metaRow} ${styles.desktopOnly}`}>
          <span className={styles.categoryPath} title={categoryDisplayText}>
            {categoryDisplayText}
          </span>

          {!hideWallet && (
            <>
              <div className={styles.metaBullet}>•</div>
              <div className={styles.walletChip} title={walletDisplayName}>
                {bankInfo?.isCash ? (
                  <Banknote size={12} className={styles.walletIcon} />
                ) : bankInfo?.logoUrl ? (
                  <img 
                    src={bankInfo.logoUrl} 
                    alt="" 
                    className={styles.bankLogo}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <Wallet size={12} className={styles.walletIcon} />
                )}
                <span className={styles.walletText}>{walletDisplayName}</span>
              </div>
            </>
          )}
        </div>

        {/* Mobile-Only Clean Subtitle */}
        <div className={`${styles.mobileSubtitleRow} ${styles.mobileOnly}`}>
          {isPendiente && (
            <span className={styles.mobilePendingBadge}>
              {isPendienteIA ? 'Pendiente IA' : 'Por confirmar'}
            </span>
          )}
          <span className={styles.mobileCategoryText} title={categoryDisplayText}>
            {categoryDisplayText}
          </span>
        </div>
      </div>

      {/* ── 3. Amount & Secondary Column ─────────────────────────────────── */}
      <div className={styles.amountArea}>
        <div className={`${styles.amount} ${
          transaccion.reintegro_de_id
            ? styles.amountIngreso
            : cuentaComo === 'nada'
            ? styles.amountNada
            : isAporteMeta
            ? styles.amountApartado
            : isRetiroMeta
            ? styles.amountRetiroMeta
            : isIngreso
            ? styles.amountIngreso
            : styles.amountEgreso
        }`}>
          <span className={styles.amountSign}>{transaccion.reintegro_de_id ? '+' : isIngreso ? '+' : '-'}</span>
          <span className={styles.amountNumber}>{formatMonto(transaccion.reintegro_de_id ? Math.abs(transaccion.monto) : transaccion.monto, transaccion.moneda)}</span>
          {transaccion.reintegro && (() => {
            const { monto: rMonto, estado: rEstado, fecha_recibido: rFecha } = transaccion.reintegro
            const label = rEstado === 'recibido'
              ? `Te devolvieron ${formatMonto(rMonto, transaccion.moneda)} el ${formatDDMM(rFecha)}`
              : `Reintegro de ${formatMonto(rMonto, transaccion.moneda)} pendiente`
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
        </div>

        {/* En Desktop: Método de pago o indicador de apartado */}
        <span className={`${styles.paymentMethod} ${styles.desktopOnly}`}>
          {isAporteMeta ? 'Apartado para meta' : isRetiroMeta ? 'Retiro de meta' : metodoLabel}
        </span>

        {/* En Mobile: Solo mostrar billetera si no está en la página de la billetera */}
        {!hideWallet && (
          <span className={`${styles.mobileWalletName} ${styles.mobileOnly}`} title={walletDisplayName}>
            {walletDisplayName}
          </span>
        )}
      </div>

      {/* ── 4. Desktop Actions (Hover Delete opcional & Chevron opcional) ── */}
      {(onDelete || isClickable) && (
        <div className={`${styles.actionsArea} ${styles.desktopOnly}`}>
          {onDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(transaccion.id)
              }}
              aria-label="Eliminar transacción"
              title="Eliminar transacción"
            >
              <Trash2 size={15} strokeWidth={1.8} />
            </button>
          )}

          {isClickable && (
            <div className={styles.chevronAffordance}>
              <ChevronRight size={16} strokeWidth={2} />
            </div>
          )}
        </div>
      )}
    </div>
  )
})

TransaccionRow.displayName = 'TransaccionRow'

export default TransaccionRow
