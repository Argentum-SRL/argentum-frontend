import { memo, useMemo } from 'react'
import { 
  Sparkles, 
  CreditCard, 
  RefreshCw, 
  Trash2, 
  Wallet,
  Banknote,
  ChevronRight,
  Target
} from 'lucide-react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { formatMonto, formatHora } from '@/utils/format'
import { getBankById, findBankByNombre, getBankLogoUrl } from '@/lib/utils/billeteras.utils'
import styles from './TransaccionRow.module.css'

interface TransaccionRowProps {
  transaccion: Transaccion
  categoria?: Categoria
  billetera?: Billetera
  onEdit: (id: string) => void
  onDelete: (id: string) => void
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
  onDelete
}: TransaccionRowProps) => {
  const isIngreso = transaccion.tipo === 'ingreso'
  const isPendiente = transaccion.estado_verificacion === 'pendiente'
  const isPendienteIA = isPendiente && ['ia_wpp', 'ia_chat', 'ia_pdf'].includes(transaccion.origen)

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
    return METODO_PAGO_LABELS[transaccion.metodo_pago] || transaccion.metodo_pago || 'Movimiento'
  }, [transaccion.metodo_pago])

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

  return (
    <div 
      onClick={() => onEdit(transaccion.id)}
      className={`${styles.row} ${isPendiente ? styles.rowPendiente : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(transaccion.id)
        }
      }}
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
            {transaccion.es_recurrente && (
              <span className={`${styles.badge} ${styles.badgeRecurrente}`}>
                <RefreshCw size={10} strokeWidth={2.5} />
                <span className={styles.badgeText}>Recurrente</span>
              </span>
            )}
          </div>
        </div>

        {/* Desktop Metadata Row (Ruta categoría + Chip billetera + Hora) */}
        <div className={`${styles.metaRow} ${styles.desktopOnly}`}>
          <div className={styles.categoryPath}>
            <span className={styles.categoryMain}>{categoriaNombre}</span>
            <span className={styles.categorySeparator}>/</span>
            <span className={styles.categorySub}>{subcategoriaNombre}</span>
          </div>

          <div className={styles.metaBullet}>•</div>

          {/* Wallet Chip with mini logo */}
          <div className={styles.walletChip}>
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

          {hora && (
            <>
              <div className={styles.metaBullet}>•</div>
              <span className={styles.metaTime}>{hora}</span>
            </>
          )}
        </div>

        {/* Mobile-Only Clean Subtitle (Solo categoría sin aglomeración) */}
        <div className={`${styles.mobileSubtitleRow} ${styles.mobileOnly}`}>
          <span className={styles.mobileCategoryText}>
            {isAporteMeta ? 'Apartado para meta' : isRetiroMeta ? 'Retiro de meta' : (subcategoriaNombre !== title ? `${categoriaNombre} · ${subcategoriaNombre}` : categoriaNombre)}
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

        {/* En Mobile: Nombre de la billetera limpio y claro */}
        <span className={`${styles.mobileWalletName} ${styles.mobileOnly}`} title={walletDisplayName}>
          {isAporteMeta ? `Apartado · ${walletDisplayName}` : walletDisplayName}
        </span>
      </div>

      {/* ── 4. Desktop Actions (Hover Delete & Chevron) ───────────────────── */}
      <div className={`${styles.actionsArea} ${styles.desktopOnly}`}>
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

        <div className={styles.chevronAffordance}>
          <ChevronRight size={16} strokeWidth={2} />
        </div>
      </div>
    </div>
  )
})

TransaccionRow.displayName = 'TransaccionRow'

export default TransaccionRow
