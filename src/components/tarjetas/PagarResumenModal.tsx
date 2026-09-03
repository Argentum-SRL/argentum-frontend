import React, { useState, useRef } from 'react'
import { X, CreditCard, CheckCircle2, Edit3, AlertTriangle, Info, Check } from 'lucide-react'
import type { TarjetaCredito } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import { formatMonto } from '@/utils/format'
import styles from './PagarResumenModal.module.css'

export interface PagarResumenModalProps {
  isOpen: boolean
  onClose: () => void
  tarjeta: TarjetaCredito
  totalAPagar: number
  cuotasPeriodo: number
  deudaVencidaAnterior: number
  saldoArrastrado: number
  pagoMinimoEstimado: number
  pagoMinimoAclaracion?: string
  onConfirm: (monto?: number) => Promise<void>
  isPaying: boolean
}

export const PagarResumenModal: React.FC<PagarResumenModalProps> = ({
  isOpen,
  onClose,
  tarjeta,
  totalAPagar,
  cuotasPeriodo,
  deudaVencidaAnterior,
  saldoArrastrado,
  pagoMinimoEstimado,
  pagoMinimoAclaracion,
  onConfirm,
  isPaying,
}) => {
  const [tipoPago, setTipoPago] = useState<'total' | 'otro'>('total')
  const [montoCustom, setMontoCustom] = useState<string>('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setTipoPago('total')
      setMontoCustom('')
      setIsInputFocused(false)
    }
  }

  const numMonto = tipoPago === 'total' 
    ? totalAPagar 
    : (parseFloat(montoCustom) || 0)

  const isMenorQueTotal = numMonto < totalAPagar && numMonto > 0
  const isMenorQueMinimo = pagoMinimoEstimado > 0 && numMonto < pagoMinimoEstimado && numMonto > 0
  const isValid = numMonto > 0 && numMonto <= totalAPagar

  const handleSelectTipo = (tipo: 'total' | 'otro') => {
    setTipoPago(tipo)
    if (tipo === 'otro') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }

  const handleQuickChip = (valor: number) => {
    setMontoCustom(valor.toFixed(2))
    inputRef.current?.focus()
  }

  const handleConfirm = async () => {
    if (!isValid || isPaying) return
    const montoFinal = tipoPago === 'total' ? undefined : numMonto
    await onConfirm(montoFinal)
  }

  const aclaracionMinimo = pagoMinimoAclaracion || 'Monto de referencia orientativo. El valor definitivo lo establece la entidad bancaria en el resumen de cuenta.'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      noPadding
      showHeader={false}
      autoHeight
    >
      <div className={styles.modalContainer}>
        {/* Header personalizado igual a TransaccionModal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h2 className={styles.headerTitle}>Pagar Resumen</h2>
              <span className={styles.tarjetaBadge}>
                <CreditCard size={13} />
                {tarjeta.nombre}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isPaying}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Segmented Control / Pills */}
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${tipoPago === 'total' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleSelectTipo('total')}
            >
              <CheckCircle2 size={16} />
              Pagar el total
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${tipoPago === 'otro' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleSelectTipo('otro')}
            >
              <Edit3 size={16} />
              Ingresar otro monto
            </button>
          </div>

          {/* Hero Monto Card */}
          <div className={`${styles.montoHeroCard} ${isInputFocused ? styles.montoHeroCardFocus : ''}`}>
            <span className={styles.montoHeroLabel}>
              {tipoPago === 'total' ? 'Total a liquidar' : 'Monto a pagar'}
            </span>

            {tipoPago === 'total' ? (
              <div className={styles.montoHeroAmountDisplay}>
                {formatMonto(totalAPagar, tarjeta.moneda)}
              </div>
            ) : (
              <div className={styles.montoHeroInputWrapper}>
                <span className={styles.montoHeroPrefix}>$</span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={totalAPagar}
                  placeholder={`Hasta ${totalAPagar}`}
                  value={montoCustom}
                  onChange={(e) => setMontoCustom(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className={styles.montoHeroInput}
                  disabled={isPaying}
                />
              </div>
            )}

            {/* Quick chips si elige otro monto */}
            {tipoPago === 'otro' && totalAPagar > 0 && (
              <div className={styles.quickChipsRow}>
                {pagoMinimoEstimado > 0 && pagoMinimoEstimado < totalAPagar && (
                  <button
                    type="button"
                    className={`${styles.quickChip} ${numMonto === pagoMinimoEstimado ? styles.quickChipActive : ''}`}
                    onClick={() => handleQuickChip(pagoMinimoEstimado)}
                  >
                    Mínimo ({formatMonto(pagoMinimoEstimado, tarjeta.moneda)})
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.quickChip} ${numMonto === Math.round(totalAPagar * 0.5) ? styles.quickChipActive : ''}`}
                  onClick={() => handleQuickChip(Math.round(totalAPagar * 0.5))}
                >
                  50% ({formatMonto(Math.round(totalAPagar * 0.5), tarjeta.moneda)})
                </button>
                <button
                  type="button"
                  className={`${styles.quickChip} ${numMonto === totalAPagar ? styles.quickChipActive : ''}`}
                  onClick={() => handleQuickChip(totalAPagar)}
                >
                  Total ({formatMonto(totalAPagar, tarjeta.moneda)})
                </button>
              </div>
            )}
          </div>

          {/* Desglose previo de la liquidación */}
          <div className={styles.breakdownCard}>
            <span className={styles.breakdownTitle}>Desglose del resumen</span>
            
            <div className={styles.breakdownRow}>
              <span>Cuotas del período</span>
              <span className={styles.breakdownVal}>{formatMonto(cuotasPeriodo, tarjeta.moneda)}</span>
            </div>

            {deudaVencidaAnterior > 0 && (
              <div className={styles.breakdownRow}>
                <span>Deuda vencida anterior</span>
                <span className={styles.breakdownVal}>{formatMonto(deudaVencidaAnterior, tarjeta.moneda)}</span>
              </div>
            )}

            {saldoArrastrado > 0 && (
              <div className={styles.breakdownRow}>
                <span>Saldo financiado anterior</span>
                <span className={`${styles.breakdownVal} ${styles.breakdownValFinanciado}`}>
                  {formatMonto(saldoArrastrado, tarjeta.moneda)}
                </span>
              </div>
            )}

            <div className={styles.breakdownDivider} />

            <div className={styles.breakdownTotalRow}>
              <span>Total a pagar</span>
              <span className={styles.breakdownTotalVal}>{formatMonto(totalAPagar, tarjeta.moneda)}</span>
            </div>
          </div>

          {/* Box de Pago Mínimo Estimado */}
          {pagoMinimoEstimado > 0 && (
            <div className={styles.minimoBox}>
              <div className={styles.minimoTop}>
                <div className={styles.minimoLabelGroup}>
                  <span>Pago mínimo estimado</span>
                  <span className={styles.minimoBadge}>Estimado</span>
                </div>
                <span className={styles.minimoVal}>{formatMonto(pagoMinimoEstimado, tarjeta.moneda)}</span>
              </div>
              <span className={styles.minimoAclaracion}>{aclaracionMinimo}</span>
            </div>
          )}

          {/* Advertencia si monto < total */}
          {isMenorQueTotal && (
            <div className={styles.alertWarning}>
              <Info size={18} className={styles.alertIcon} />
              <span>
                El saldo restante quedará como saldo financiado y pasará al próximo resumen. Tené en cuenta que el banco te cobrará intereses de financiación que deberás registrar manualmente como un gasto en la subcategoría 'Intereses pagados'.
              </span>
            </div>
          )}

          {/* Advertencia si monto < mínimo estimado */}
          {isMenorQueMinimo && (
            <div className={styles.alertDanger}>
              <AlertTriangle size={18} className={styles.alertIcon} />
              <span>
                El monto ingresado es menor al pago mínimo estimado. Pagar menos del mínimo podría generar intereses punitorios y afectar tu historial crediticio según las condiciones de tu banco.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isPaying}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleConfirm}
            disabled={!isValid || isPaying}
          >
            {isPaying ? (
              'Procesando...'
            ) : (
              <>
                <Check size={16} />
                Confirmar pago ({formatMonto(numMonto, tarjeta.moneda)})
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PagarResumenModal
