import React, { useState, useRef } from 'react'
import { X, CreditCard, CheckCircle2, Edit3, AlertTriangle, Info, Check, DollarSign, ArrowRightLeft } from 'lucide-react'
import type { TarjetaCredito, Billetera, PagarTarjetaPayload } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import { formatMonto } from '@/utils/format'
import styles from './PagarResumenModal.module.css'

export interface PagarResumenModalProps {
  isOpen: boolean
  onClose: () => void
  tarjeta: TarjetaCredito
  monedaAPagar?: 'ARS' | 'USD'
  billeteras?: Billetera[]
  totalAPagar: number
  cuotasPeriodo: number
  deudaVencidaAnterior: number
  saldoArrastrado: number
  pagoMinimoEstimado: number
  pagoMinimoAclaracion?: string
  cotizacionOficialPropuesta?: number | null
  porcentajePercepcion?: number | null
  onConfirm: (payload: PagarTarjetaPayload) => Promise<void>
  isPaying: boolean
}

export const PagarResumenModal: React.FC<PagarResumenModalProps> = ({
  isOpen,
  onClose,
  tarjeta,
  monedaAPagar = 'ARS',
  billeteras = [],
  totalAPagar,
  cuotasPeriodo,
  deudaVencidaAnterior,
  saldoArrastrado,
  pagoMinimoEstimado,
  pagoMinimoAclaracion,
  cotizacionOficialPropuesta,
  porcentajePercepcion = 30,
  onConfirm,
  isPaying,
}) => {
  const [tipoPago, setTipoPago] = useState<'total' | 'otro'>('total')
  const [montoCustom, setMontoCustom] = useState<string>('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Multimoneda USD options
  const [modoUSD, setModoUSD] = useState<'dolares' | 'pesificar'>('dolares')
  const [billeteraUSDId, setBilleteraUSDId] = useState<string>('')
  const [billeteraARSId, setBilleteraARSId] = useState<string>('')
  
  // Pesificación custom inputs
  const [cotizacionCustom, setCotizacionCustom] = useState<string | null>(null)
  const [montoPesosCustom, setMontoPesosCustom] = useState<string>('')
  const [montoPercepcionCustom, setMontoPercepcionCustom] = useState<string>('')

  const billeterasUSD = billeteras.filter(b => b.moneda === 'USD' && b.estado === 'activa')
  const billeterasARS = billeteras.filter(b => b.moneda === 'ARS' && b.estado === 'activa')

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setTipoPago('total')
      setMontoCustom('')
      setIsInputFocused(false)
      const defaultUSD = billeterasUSD[0]?.id || ''
      setBilleteraUSDId(defaultUSD)
      const defaultARS = billeterasARS.find(b => b.id === tarjeta.billetera_id)?.id || billeterasARS[0]?.id || ''
      setBilleteraARSId(defaultARS)
      if (billeterasUSD.length === 0 && monedaAPagar === 'USD') {
        setModoUSD('pesificar')
      } else {
        setModoUSD('dolares')
      }
      setCotizacionCustom(null)
      setMontoPesosCustom('')
      setMontoPercepcionCustom('')
    }
  }

  const cotizacionEfectiva = cotizacionCustom ?? (cotizacionOficialPropuesta ? String(cotizacionOficialPropuesta) : '')

  const numMonto = tipoPago === 'total' 
    ? totalAPagar 
    : (parseFloat(montoCustom) || 0)

  const isMenorQueTotal = numMonto < totalAPagar && numMonto > 0
  const isMenorQueMinimo = pagoMinimoEstimado > 0 && numMonto < pagoMinimoEstimado && numMonto > 0
  const isValidMonto = numMonto > 0 && numMonto <= totalAPagar

  // Calculations for Pesification
  const cotizacionNum = parseFloat(cotizacionEfectiva) || 0
  const percPercent = porcentajePercepcion ?? 30

  const subtotalPesosCalculado = cotizacionNum > 0 ? Number((numMonto * cotizacionNum).toFixed(2)) : 0
  const subtotalPesosFinal = montoPesosCustom !== '' ? (parseFloat(montoPesosCustom) || 0) : subtotalPesosCalculado

  const percepcionCalculada = Number((subtotalPesosFinal * (percPercent / 100)).toFixed(2))
  const percepcionFinal = montoPercepcionCustom !== '' ? (parseFloat(montoPercepcionCustom) || 0) : percepcionCalculada

  const totalPesosFinal = Number((subtotalPesosFinal + percepcionFinal).toFixed(2))

  const isPesificacionValid = monedaAPagar === 'USD' && modoUSD === 'pesificar' 
    ? (cotizacionNum > 0 && subtotalPesosFinal > 0 && billeteraARSId !== '')
    : true

  const isDolaresDirectoValid = monedaAPagar === 'USD' && modoUSD === 'dolares'
    ? (billeteraUSDId !== '')
    : true

  const isFormValid = isValidMonto && isPesificacionValid && isDolaresDirectoValid

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
    if (!isFormValid || isPaying) return
    const montoFinal = tipoPago === 'total' ? undefined : numMonto

    if (monedaAPagar === 'ARS') {
      await onConfirm({
        moneda: 'ARS',
        monto: montoFinal
      })
    } else {
      if (modoUSD === 'dolares') {
        await onConfirm({
          moneda: 'USD',
          pesificar: false,
          billetera_id: billeteraUSDId,
          monto: montoFinal
        })
      } else {
        await onConfirm({
          moneda: 'USD',
          pesificar: true,
          billetera_id: billeteraARSId,
          monto: montoFinal,
          cotizacion_personalizada: cotizacionNum > 0 ? cotizacionNum : undefined,
          monto_pesos_personalizado: montoPesosCustom !== '' ? parseFloat(montoPesosCustom) : undefined,
          monto_percepcion_personalizado: montoPercepcionCustom !== '' ? parseFloat(montoPercepcionCustom) : undefined
        })
      }
    }
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
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h2 className={styles.headerTitle}>
                Pagar Resumen {monedaAPagar === 'USD' ? '(Dólares)' : '(Pesos)'}
              </h2>
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
          {/* Si es USD, Selector de Modo: Dólares vs Pesificar */}
          {monedaAPagar === 'USD' && (
            <div className={styles.segmentedControl}>
              <button
                type="button"
                className={`${styles.segmentBtn} ${modoUSD === 'dolares' ? styles.segmentBtnActive : ''}`}
                onClick={() => setModoUSD('dolares')}
              >
                <DollarSign size={16} />
                Pagar en dólares
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${modoUSD === 'pesificar' ? styles.segmentBtnActive : ''}`}
                onClick={() => setModoUSD('pesificar')}
              >
                <ArrowRightLeft size={16} />
                Pesificar a pesos
              </button>
            </div>
          )}

          {/* Alerta si elige pagar en USD pero no tiene billetera USD */}
          {monedaAPagar === 'USD' && modoUSD === 'dolares' && billeterasUSD.length === 0 && (
            <div className={styles.walletMissingAlert}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <span>No tenés ninguna billetera en dólares activa.</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)' }}>
                Podés pesificar tus consumos en dólares para pagarlos en pesos desde tu cuenta bancaria habitual con la cotización oficial y percepción.
              </p>
              <button
                type="button"
                className={styles.pesificarSwitchBtn}
                onClick={() => setModoUSD('pesificar')}
              >
                Cambiar a pesificar
              </button>
            </div>
          )}

          {/* Selector de billetera para pago en USD */}
          {monedaAPagar === 'USD' && modoUSD === 'dolares' && billeterasUSD.length > 0 && (
            <div>
              <label className={styles.breakdownTitle} style={{ display: 'block', marginBottom: '6px' }}>
                Billetera en dólares para debitar
              </label>
              <select
                className={styles.walletSelect}
                value={billeteraUSDId}
                onChange={(e) => setBilleteraUSDId(e.target.value)}
              >
                {billeterasUSD.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} — Saldo: {formatMonto(b.saldo_actual, b.moneda)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de billetera para pago Pesificado */}
          {monedaAPagar === 'USD' && modoUSD === 'pesificar' && (
            <div>
              <label className={styles.breakdownTitle} style={{ display: 'block', marginBottom: '6px' }}>
                Cuenta en pesos para debitar
              </label>
              <select
                className={styles.walletSelect}
                value={billeteraARSId}
                onChange={(e) => setBilleteraARSId(e.target.value)}
              >
                {billeterasARS.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} — Saldo: {formatMonto(b.saldo_actual, b.moneda)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Segmented Control: Pagar Total vs Otro Monto */}
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
              {tipoPago === 'total' ? `Total a liquidar (${monedaAPagar})` : `Monto a pagar (${monedaAPagar})`}
            </span>

            {tipoPago === 'total' ? (
              <div className={styles.montoHeroAmountDisplay}>
                {formatMonto(totalAPagar, monedaAPagar)}
              </div>
            ) : (
              <div className={styles.montoHeroInputWrapper}>
                <span className={styles.montoHeroPrefix}>{monedaAPagar === 'USD' ? 'u$s' : '$'}</span>
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
                    Mínimo ({formatMonto(pagoMinimoEstimado, monedaAPagar)})
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.quickChip} ${numMonto === Math.round(totalAPagar * 0.5) ? styles.quickChipActive : ''}`}
                  onClick={() => handleQuickChip(Math.round(totalAPagar * 0.5))}
                >
                  50% ({formatMonto(Math.round(totalAPagar * 0.5), monedaAPagar)})
                </button>
                <button
                  type="button"
                  className={`${styles.quickChip} ${numMonto === totalAPagar ? styles.quickChipActive : ''}`}
                  onClick={() => handleQuickChip(totalAPagar)}
                >
                  Total ({formatMonto(totalAPagar, monedaAPagar)})
                </button>
              </div>
            )}
          </div>

          {/* Desglose previo de la liquidación en moneda original */}
          <div className={styles.breakdownCard}>
            <span className={styles.breakdownTitle}>Desglose del resumen ({monedaAPagar})</span>
            
            <div className={styles.breakdownRow}>
              <span>Cuotas del período</span>
              <span className={styles.breakdownVal}>{formatMonto(cuotasPeriodo, monedaAPagar)}</span>
            </div>

            {deudaVencidaAnterior > 0 && (
              <div className={styles.breakdownRow}>
                <span>Deuda vencida anterior</span>
                <span className={styles.breakdownVal}>{formatMonto(deudaVencidaAnterior, monedaAPagar)}</span>
              </div>
            )}

            {saldoArrastrado > 0 && (
              <div className={styles.breakdownRow}>
                <span>Saldo financiado anterior</span>
                <span className={`${styles.breakdownVal} ${styles.breakdownValFinanciado}`}>
                  {formatMonto(saldoArrastrado, monedaAPagar)}
                </span>
              </div>
            )}

            <div className={styles.breakdownDivider} />

            <div className={styles.breakdownTotalRow}>
              <span>Total en {monedaAPagar}</span>
              <span className={styles.breakdownTotalVal}>{formatMonto(totalAPagar, monedaAPagar)}</span>
            </div>
          </div>

          {/* Tarjeta especial de Pesificación con campos editables (Tarea 3.5) */}
          {monedaAPagar === 'USD' && modoUSD === 'pesificar' && (
            <div className={styles.breakdownCard} style={{ borderColor: 'var(--primary)' }}>
              <span className={styles.breakdownTitle} style={{ color: 'var(--primary)' }}>
                Conversión y Percepción Impositiva
              </span>

              {(!cotizacionOficialPropuesta && !cotizacionCustom) && (
                <div className={styles.cotizacionAlert}>
                  <AlertTriangle size={16} />
                  <span>No hay cotización automática para la fecha de cierre. Ingresá la cotización oficial del día de cierre.</span>
                </div>
              )}

              <div className={styles.breakdownRow}>
                <span>Monto en dólares</span>
                <span className={styles.breakdownVal}>{formatMonto(numMonto, 'USD')}</span>
              </div>

              <div className={styles.breakdownRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Cotización oficial aplicada
                  <span title="Dólar oficial vendedor al cierre del resumen" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                    <Info size={13} />
                  </span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 1050.00"
                    value={cotizacionEfectiva}
                    onChange={(e) => setCotizacionCustom(e.target.value)}
                    className={styles.inlineInput}
                  />
                </div>
              </div>

              <div className={styles.breakdownRow}>
                <span>Monto convertido en pesos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPesosCustom !== '' ? montoPesosCustom : (subtotalPesosCalculado > 0 ? subtotalPesosCalculado.toFixed(2) : '')}
                    onChange={(e) => setMontoPesosCustom(e.target.value)}
                    placeholder={subtotalPesosCalculado.toFixed(2)}
                    className={styles.inlineInput}
                  />
                </div>
              </div>

              <div className={styles.breakdownRow}>
                <span>Percepción impositiva ({percPercent}%)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPercepcionCustom !== '' ? montoPercepcionCustom : (percepcionCalculada > 0 ? percepcionCalculada.toFixed(2) : '')}
                    onChange={(e) => setMontoPercepcionCustom(e.target.value)}
                    placeholder={percepcionCalculada.toFixed(2)}
                    className={styles.inlineInput}
                  />
                </div>
              </div>

              <div className={styles.breakdownDivider} />

              <div className={styles.breakdownTotalRow}>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Total final a debitar en pesos</span>
                <span style={{ color: 'var(--primary)', fontSize: '16px', fontWeight: 800 }}>
                  {formatMonto(totalPesosFinal, 'ARS')}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.3 }}>
                Se debitarán {formatMonto(totalPesosFinal, 'ARS')} de tu billetera: {formatMonto(subtotalPesosFinal, 'ARS')} de pago de tarjeta y {formatMonto(percepcionFinal, 'ARS')} como gasto impositivo (Banco / Impuestos).
              </span>
            </div>
          )}

          {/* Box de Pago Mínimo Estimado */}
          {pagoMinimoEstimado > 0 && (
            <div className={styles.minimoBox}>
              <div className={styles.minimoTop}>
                <div className={styles.minimoLabelGroup}>
                  <span>Pago mínimo estimado ({monedaAPagar})</span>
                  <span className={styles.minimoBadge}>Estimado</span>
                </div>
                <span className={styles.minimoVal}>{formatMonto(pagoMinimoEstimado, monedaAPagar)}</span>
              </div>
              <span className={styles.minimoAclaracion}>{aclaracionMinimo}</span>
            </div>
          )}

          {/* Advertencia si monto < total */}
          {isMenorQueTotal && (
            <div className={styles.alertWarning}>
              <Info size={18} className={styles.alertIcon} />
              <span>
                El saldo restante quedará como saldo financiado en {monedaAPagar} y pasará al próximo resumen. El banco cobrará intereses según las condiciones de la tarjeta.
              </span>
            </div>
          )}

          {/* Advertencia si monto < mínimo estimado */}
          {isMenorQueMinimo && (
            <div className={styles.alertDanger}>
              <AlertTriangle size={18} className={styles.alertIcon} />
              <span>
                El monto ingresado es menor al pago mínimo estimado. Pagar menos del mínimo podría generar intereses punitorios.
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
            disabled={!isFormValid || isPaying}
          >
            {isPaying ? (
              'Procesando...'
            ) : (
              <>
                <Check size={16} />
                {monedaAPagar === 'USD' && modoUSD === 'pesificar'
                  ? `Confirmar pago (${formatMonto(totalPesosFinal, 'ARS')})`
                  : `Confirmar pago (${formatMonto(numMonto, monedaAPagar)})`
                }
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PagarResumenModal
