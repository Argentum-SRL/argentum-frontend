import React, { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera } from '@/types'
import styles from './ModalesImportacion.module.css'

interface ModalBilleteraUSDProps {
  isOpen: boolean
  onClose: () => void
  billeteras: Billetera[]
  selectedBilleteraUsdId: string | null
  onChange: (id: string | null) => void
  onConfirm: () => void
  onBack: () => void
  onCancelImport: () => void
  currentStep: number
  totalSteps: number
}

export const ModalBilleteraUSD: React.FC<ModalBilleteraUSDProps> = ({
  isOpen,
  onClose,
  billeteras,
  selectedBilleteraUsdId,
  onChange,
  onConfirm,
  onBack,
  onCancelImport,
  currentStep,
  totalSteps,
}) => {
  // Filtrar billeteras USD activas
  const usdWallets = billeteras.filter(
    b => b.moneda === 'USD' && b.estado === 'activa'
  )

  const hasUsdWallets = usdWallets.length > 0

  // Estado local para manejar si se importa o se ignora
  const [option, setOption] = useState<'import' | 'ignore'>(
    selectedBilleteraUsdId && hasUsdWallets ? 'import' : 'ignore'
  )

  // Billetera seleccionada localmente si se elije importar
  const [localBilleteraId, setLocalBilleteraId] = useState<string>(() => {
    if (selectedBilleteraUsdId && hasUsdWallets) {
      return selectedBilleteraUsdId
    }
    // Buscar la principal USD, o la primera
    const principalUsd = usdWallets.find(b => b.es_principal)
    return principalUsd?.id || usdWallets[0]?.id || ''
  })

  // Sincronizar cambios en los controles con la propiedad de cambio superior
  useEffect(() => {
    if (option === 'ignore') {
      onChange(null)
    } else {
      onChange(localBilleteraId)
    }
  }, [option, localBilleteraId, onChange])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={true}
      title="Tenés gastos en dólares"
      size="md"
    >
      <div className={styles.formContainer}>
        {/* Step Indicator Dots */}
        {totalSteps > 1 && (
          <div className={styles.stepDots}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`${styles.stepDot} ${
                  idx === currentStep ? styles.stepDotActive : styles.stepDotInactive
                }`}
              />
            ))}
          </div>
        )}

        <div className={styles.formBody}>
          <p className={styles.modalText}>
            Detectamos transacciones en dólares en tu resumen. ¿Cómo querés gestionarlas?
          </p>

          {!hasUsdWallets ? (
            /* Caso sin billeteras USD */
            <div className={styles.alertBox}>
              <div className={styles.alertTitle}>
                <AlertCircle size={16} />
                No tenés billeteras en dólares
              </div>
              <p className={styles.alertDesc}>
                Para importar gastos en USD, necesitás tener creada al menos una billetera en dólares. Se pre-seleccionará la opción de ignorar estas transacciones.
              </p>
            </div>
          ) : (
            /* Caso con billeteras USD */
            <div className={styles.radioGroup}>
              {/* Opción Importar */}
              <div
                className={`${styles.checkboxItem} ${
                  option === 'import' ? styles.checkboxItemActive : ''
                }`}
                onClick={() => setOption('import')}
              >
                <input
                  id="usd-opt-import"
                  type="radio"
                  name="usd_option"
                  className={styles.checkboxInput}
                  checked={option === 'import'}
                  onChange={() => setOption('import')}
                />
                <div className={styles.optionContent}>
                  <label htmlFor="usd-opt-import" className={styles.checkboxLabel}>Importar los gastos en dólares</label>
                  {option === 'import' && (
                    <div className={styles.walletDropdownSelectContainer} onClick={e => e.stopPropagation()}>
                      <label htmlFor="usd-wallet-select" className={styles.label}>Seleccionar Billetera USD</label>
                      <select
                        id="usd-wallet-select"
                        className={styles.selectField}
                        value={localBilleteraId}
                        onChange={e => setLocalBilleteraId(e.target.value)}
                      >
                        {usdWallets.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.nombre} (USD)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Opción Ignorar */}
              <div
                className={`${styles.checkboxItem} ${
                  option === 'ignore' ? styles.checkboxItemActive : ''
                }`}
                onClick={() => setOption('ignore')}
              >
                <input
                  id="usd-opt-ignore"
                  type="radio"
                  name="usd_option"
                  className={styles.checkboxInput}
                  checked={option === 'ignore'}
                  onChange={() => setOption('ignore')}
                />
                <label htmlFor="usd-opt-ignore" className={styles.checkboxLabel}>Ignorar transacciones en dólares</label>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formFooter}>
          <div className={styles.actionRow}>
            <button type="button" className={styles.cancelBtn} onClick={onBack}>
              Atrás
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={onConfirm}
              disabled={option === 'import' && !localBilleteraId}
            >
              Continuar
            </button>
          </div>
          <button
            type="button"
            className={styles.cancelImportBtn}
            onClick={onCancelImport}
          >
            Cancelar importación completa
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ModalBilleteraUSD
