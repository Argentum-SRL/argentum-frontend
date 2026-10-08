import React, { useState } from 'react'
import { Check, Wallet, Banknote, ChevronDown, Star } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera } from '@/types'
import { getBankById, findBankByNombre, getBankLogoUrl, sortBilleteras } from '@/lib/utils/billeteras.utils'
import { formatMonto } from '@/utils/format'
import type { TipoOperacionFilter } from './TransferenciasFilterBar'
import styles from './TransferenciasFilterBar.module.css'

interface TransferenciasFilterMobileModalProps {
  isOpen: boolean
  onClose: () => void
  tipoOperacion: TipoOperacionFilter
  onTipoOperacionChange: (val: TipoOperacionFilter) => void
  billeteraId: string | undefined
  onBilleteraChange: (id: string | undefined) => void
  billeteras?: Billetera[]
  hasActiveFilters: boolean
  onClear: () => void
}

export const TransferenciasFilterMobileModal: React.FC<TransferenciasFilterMobileModalProps> = ({
  isOpen,
  onClose,
  tipoOperacion,
  onTipoOperacionChange,
  billeteraId,
  onBilleteraChange,
  billeteras = [],
  hasActiveFilters,
  onClear,
}) => {
  const [localTipo, setLocalTipo] = useState<TipoOperacionFilter>(tipoOperacion)
  const [localBilleteraId, setLocalBilleteraId] = useState<string | undefined>(billeteraId)
  const [isAccountsOpen, setIsAccountsOpen] = useState(true)

  // Sincronizar estado local al abrir el modal sin causar renders en cascada
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setLocalTipo(tipoOperacion)
      setLocalBilleteraId(billeteraId)
      setIsAccountsOpen(true)
    }
  }

  const handleApply = () => {
    onTipoOperacionChange(localTipo)
    onBilleteraChange(localBilleteraId)
    onClose()
  }

  const handleClearAll = () => {
    onClear()
    setLocalTipo('todas')
    setLocalBilleteraId(undefined)
    onClose()
  }

  const activeWallets = sortBilleteras(billeteras.filter((b) => b.estado === 'activa'))

  const canClear =
    hasActiveFilters ||
    localTipo !== 'todas' ||
    localBilleteraId !== undefined

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros">
      <div className={styles.mobileDrawerContainer}>
        {/* ── Tipo de Operación ── */}
        <div>
          <div className={styles.drawerSectionTitle}>Tipo de operación</div>
          <div className={styles.pillGroupMobile}>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localTipo === 'todas' ? styles.typePillActiveMobile : ''}`}
              onClick={() => setLocalTipo('todas')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localTipo === 'cuentas' ? styles.typePillActiveMobile : ''}`}
              onClick={() => setLocalTipo('cuentas')}
            >
              Entre cuentas
            </button>
            <button
              type="button"
              className={`${styles.typePillMobile} ${localTipo === 'fx' ? styles.typePillActiveMobile : ''}`}
              onClick={() => setLocalTipo('fx')}
            >
              Compra/Venta Dólares
            </button>
          </div>
        </div>

        {/* ── Cuenta / Billetera (Diseño Dashboard) ── */}
        <div>
          <div className={styles.drawerSectionTitle}>Cuenta / Billetera</div>
          <div className={styles.accountsSection}>
            <button
              type="button"
              className={`${styles.accountsTrigger} ${isAccountsOpen ? styles.triggerActive : ''}`}
              onClick={() => setIsAccountsOpen(!isAccountsOpen)}
              aria-expanded={isAccountsOpen}
              title={isAccountsOpen ? 'Contraer cuentas' : 'Filtrar cuentas'}
            >
              <div className={styles.triggerContent}>
                <div className={styles.triggerLeft}>
                  <span className={styles.triggerDot} />
                  <span className={styles.triggerText}>
                    {!localBilleteraId
                      ? `Todas las cuentas (${activeWallets.length})`
                      : activeWallets.find((b) => b.id === localBilleteraId)?.nombre ?? '1 cuenta'}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${isAccountsOpen ? styles.chevronOpen : ''}`}
                />
              </div>
            </button>

            {/* Panel Desplegable */}
            {isAccountsOpen && (
              <div className={styles.accountsDropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownTitle}>Filtrar cuentas</span>
                  <button
                    type="button"
                    className={`${styles.resetBtn} ${!localBilleteraId ? styles.resetBtnActive : ''}`}
                    onClick={() => setLocalBilleteraId(undefined)}
                  >
                    Todas ({activeWallets.length})
                  </button>
                </div>

                <div className={styles.accountsList} role="listbox">
                  {activeWallets.map((b) => {
                    const isSelected = localBilleteraId === b.id
                    const bank = b.bank_id ? getBankById(b.bank_id) : findBankByNombre(b.nombre)
                    const logoUrl = bank ? getBankLogoUrl(bank.logoPath) : ''

                    return (
                      <button
                        key={b.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.accountRow} ${isSelected ? styles.rowSelected : ''}`}
                        onClick={() => setLocalBilleteraId(isSelected ? undefined : b.id)}
                        title={`Alternar ${b.nombre}`}
                      >
                        <div className={styles.rowLeft}>
                          <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          {b.es_efectivo ? (
                            <Banknote size={15} className={styles.bankIconMini} />
                          ) : logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className={styles.bankIconMini}
                            />
                          ) : (
                            <Wallet size={15} className={styles.bankIconMini} />
                          )}
                          <span className={styles.accountName}>{b.es_efectivo ? `Efectivo ${b.moneda === 'ARS' ? 'Pesos' : 'Dólares'}` : b.nombre}</span>
                          {b.es_principal && (
                            <Star size={10} fill="currentColor" className={styles.starIcon} />
                          )}
                        </div>
                        <span className={styles.accountAmount}>
                          {formatMonto(b.saldo_actual, b.moneda)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Row ── */}
        <div className={styles.drawerActionsRowMobile}>
          <button
            type="button"
            className={`${styles.clearBtnMobileNew} ${!canClear ? styles.clearBtnDisabled : ''}`}
            onClick={handleClearAll}
            disabled={!canClear}
          >
            Limpiar
          </button>
          <button
            type="button"
            className={styles.applyBtnMobileNew}
            onClick={handleApply}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TransferenciasFilterMobileModal
