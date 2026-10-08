import { memo, useMemo } from 'react'
import DebitoAutomaticoBadge from '@/components/ui/DebitoAutomaticoBadge/DebitoAutomaticoBadge'
import { 
  Sparkles, 
  CreditCard, 
  Trash2, 
  Wallet,
  Banknote,
  ChevronRight,
  Target
} from '@/components/ui/icons'
import type { Transaccion, Billetera, Categoria } from '@/types'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { formatMonto, formatHora } from '@/utils/format'
import { getBankById, findBankByNombre, getBankLogoUrl } from '@/lib/utils/billeteras.utils'
import styles from './TransaccionRow.module.css'

interface TransaccionRowProps {
  transaccion: Transaccion
  categoria?: Categoria
  billetera?: Billetera
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  hideWallet?: boolean
}

const METODO_PAGO_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  efectivo: 'Efectivo',
}

const TransaccionRow = memo(({
  transaccion,
  categoria,
  billetera,
  onEdit,
  onDelete,
  hideWallet = false
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

  const hora = useMemo(() => {
    const fecha = transaccion.fecha_creacion || transaccion.fecha
    if (!fecha || !fecha.includes('T')) return ''
    return formatHora(fecha)
  }, [transaccion.fecha_creacion, transaccion.fecha])

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

  const title = transaccion.descripcion || transaccion.subcategoria?.nombre || categoria?.nombre || 'Sin descripción'
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
        {isAporteMeta || isRetiroMeta ? (
          <Target size={22} className={styles.avatarIconMeta} />
        ) : (
          <SubcategoriaIcon 
            nombre={transaccion.subcategoria?.nombre} 
            parentCategory={categoriaNombre} 
            size={24}
            className={styles.avatarIcon}
          />
        )}
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
            {isAporteMeta && (
              <span className={`${styles.badge} ${styles.badgeApartado}`}>
                <Target size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>Apartado</span>
              </span>
            )}
            {isRetiroMeta && (
              <span className={`${styles.badge} ${styles.badgeRetiroMeta}`}>
                <Target size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>Retiro</span>
              </span>
            )}
            {isPendienteIA && (
              <span className={`${styles.badge} ${styles.badgePendiente}`}>
                <Sparkles size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>Pendiente IA</span>
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
          </div>
        </div>

        {/* Desktop Metadata Row (Categoría limpia + Chip billetera opcional + Hora) */}
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

          {hora && (
            <>
              <div className={styles.metaBullet}>•</div>
              <span className={styles.metaTime}>{hora}</span>
            </>
          )}
        </div>

        {/* Mobile-Only Clean Subtitle */}
        <div className={`${styles.mobileSubtitleRow} ${styles.mobileOnly}`}>
          <span className={styles.mobileCategoryText} title={categoryDisplayText}>
            {categoryDisplayText}
            {hora ? ` · ${hora}` : ''}
          </span>
        </div>
      </div>

      {/* ── 3. Amount & Secondary Column ─────────────────────────────────── */}
      <div className={styles.amountArea}>
        <div className={`${styles.amount} ${
          isAporteMeta ? styles.amountApartado : isRetiroMeta ? styles.amountRetiroMeta : isIngreso ? styles.amountIngreso : styles.amountEgreso
        }`}>
          <span className={styles.amountSign}>{isIngreso ? '+' : '-'}</span>
          <span className={styles.amountNumber}>{formatMonto(transaccion.monto, transaccion.moneda)}</span>
        </div>

        {/* En Desktop: Método de pago o indicador de apartado */}
        <span className={`${styles.paymentMethod} ${styles.desktopOnly}`}>
          {isAporteMeta ? 'Apartado para meta' : isRetiroMeta ? 'Retiro de meta' : metodoLabel}
        </span>

        {/* En Mobile: Solo mostrar billetera si no está en la página de la billetera */}
        {!hideWallet && (
          <span className={`${styles.mobileWalletName} ${styles.mobileOnly}`} title={walletDisplayName}>
            {isAporteMeta ? `Apartado · ${walletDisplayName}` : walletDisplayName}
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
