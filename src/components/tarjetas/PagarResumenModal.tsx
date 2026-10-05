import React, { useState, useMemo } from 'react'
import { X, CreditCard, CheckCircle2, Edit3, AlertTriangle, Info, Check, DollarSign, ArrowRightLeft } from '@/components/ui/icons'
import type { TarjetaCredito, Billetera, PagarTarjetaPayload } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { formatMonto } from '@/utils/format'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
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
  const [montoCustom, setMontoCustom] = useState<number | null>(null)

  // Multimoneda USD options
  const [modoUSD, setModoUSD] = useState<'dolares' | 'pesificar'>('dolares')
  const [billeteraUSDId, setBilleteraUSDId] = useState<string>('')
  const [billeteraARSId, setBilleteraARSId] = useState<string>('')
  
  // Pesificación custom inputs
  const [cotizacionCustom, setCotizacionCustom] = useState<string | null>(null)
  const [montoPesosCustom, setMontoPesosCustom] = useState<string>('')
  const [montoPercepcionCustom, setMontoPercepcionCustom] = useState<string>('')

  const billeterasUSD: Billetera[] = useMemo(() => {
    return billeteras
      .filter((b: Billetera) => b.moneda === 'USD' && b.estado === 'activa')
      .sort((a: Billetera, b: Billetera) => {
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        return (Number(b.saldo_actual) || 0) - (Number(a.saldo_actual) || 0)
      })
  }, [billeteras])

  const billeterasARS: Billetera[] = useMemo(() => {
    return billeteras
      .filter((b: Billetera) => b.moneda === 'ARS' && b.estado === 'activa')
      .sort((a: Billetera, b: Billetera) => {
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        return (Number(b.saldo_actual) || 0) - (Number(a.saldo_actual) || 0)
      })
  }, [billeteras])

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setTipoPago('total')
      setMontoCustom(null)
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
    : (montoCustom ?? 0)

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
    if (tipo === 'otro' && (montoCustom === null || montoCustom === 0)) {
      setMontoCustom(totalAPagar)
    }
  }

  const handleQuickChip = (valor: number) => {
    setMontoCustom(valor)
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

  const hasPriorDebt = deudaVencidaAnterior > 0
  const hasRefinanced = saldoArrastrado > 0
  const hasBreakdown = hasPriorDebt || hasRefinanced

  const {
    headerRef,
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    containerStyle,
  } = useAdaptiveModalHeight({
    enabled: isOpen && !!tarjeta,
    deps: [
      tipoPago,
      montoCustom,
      modoUSD,
      billeteraUSDId,
      billeteraARSId,
      cotizacionCustom,
      montoPesosCustom,
      montoPercepcionCustom,
      totalAPagar,
      hasBreakdown,
      hasPriorDebt,
      hasRefinanced,
    ],
    extraPadding: 8,
    maxHeightRatio: 0.90,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={styles.modalPagarResumen}
      noPadding
      showHeader={false}
      autoHeight
    >
      <div className={styles.modalContainer} style={containerStyle}>
        {/* Header */}
        <div ref={headerRef} className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>
              Pagar Resumen
            </h2>
            <div className={styles.headerSubtitleRow}>
              <span className={styles.tarjetaBadge}>
                <CreditCard size={12} />
                <span>{tarjeta.nombre}</span>
              </span>
              <span className={styles.monedaBadge}>
                {monedaAPagar === 'USD' ? 'Dólares' : 'Pesos'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isPaying}
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={formBodyRef} className={styles.modalBody}>
          {/* Si es USD, Selector de Modo: Dólares vs Pesificar */}
          {monedaAPagar === 'USD' && (
            <div className={styles.segmentedBar} role="radiogroup" aria-label="Modo de pago en dólares">
              <button
                type="button"
                role="radio"
                aria-checked={modoUSD === 'dolares'}
                className={`${styles.segmentedPill} ${modoUSD === 'dolares' ? styles.segmentedPillActive : ''}`}
                onClick={() => setModoUSD('dolares')}
              >
                <DollarSign size={14} strokeWidth={2.2} />
                <span>Pagar en dólares</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={modoUSD === 'pesificar'}
                className={`${styles.segmentedPill} ${modoUSD === 'pesificar' ? styles.segmentedPillActive : ''}`}
                onClick={() => setModoUSD('pesificar')}
              >
                <ArrowRightLeft size={14} strokeWidth={2} />
                <span>Pesificar a pesos</span>
              </button>
            </div>
          )}

          {/* Alerta si elige pagar en USD pero no tiene billetera USD */}
          {monedaAPagar === 'USD' && modoUSD === 'dolares' && billeterasUSD.length === 0 && (
            <div className={styles.walletMissingAlert}>
              <div className={styles.alertHeaderRow}>
                <AlertTriangle size={16} />
                <span>No tenés una cuenta en dólares activa</span>
              </div>
              <p className={styles.alertDesc}>
                Podés pesificar tus consumos en dólares para pagarlos en pesos desde tu cuenta bancaria habitual con cotización oficial y percepciones.
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
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Billetera en dólares a debitar
              </label>
              <select
                className={styles.fieldSelect}
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
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                Cuenta en pesos a debitar
              </label>
              <select
                className={styles.fieldSelect}
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
          <div className={styles.segmentedBar} role="radiogroup" aria-label="Tipo de pago">
            <button
              type="button"
              role="radio"
              aria-checked={tipoPago === 'total'}
              className={`${styles.segmentedPill} ${tipoPago === 'total' ? styles.segmentedPillActive : ''}`}
              onClick={() => handleSelectTipo('total')}
            >
              <CheckCircle2 size={14} strokeWidth={2.2} />
              <span>Pagar el total</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={tipoPago === 'otro'}
              className={`${styles.segmentedPill} ${tipoPago === 'otro' ? styles.segmentedPillActive : ''}`}
              onClick={() => handleSelectTipo('otro')}
            >
              <Edit3 size={14} strokeWidth={2} />
              <span>Ingresar otro monto</span>
            </button>
          </div>

          {/* Hero Monto Card / MontoInput */}
          {tipoPago === 'total' ? (
            <div className={styles.montoHeroCard}>
              <span className={styles.montoHeroLabel}>Total a liquidar</span>
              <div className={styles.montoHeroAmountDisplay}>
                {formatMonto(totalAPagar, monedaAPagar)}
              </div>
            </div>
          ) : (
            <div className={styles.montoCustomSection}>
              <MontoInput
                label="Monto a abonar"
                value={montoCustom}
                onChange={setMontoCustom}
                moneda={monedaAPagar}
                hideCurrency
                allowDecimals
                placeholder={`Hasta ${formatMonto(totalAPagar, monedaAPagar)}`}
                max={totalAPagar}
                autoFocus
                disabled={isPaying}
              />

              {/* Quick chips si elige otro monto */}
              {totalAPagar > 0 && (
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
                </div>
              )}
            </div>
          )}

          {/* Desglose: solo si hay conceptos adicionales (deuda anterior o saldo financiado) */}
          {hasBreakdown && (
            <div className={styles.breakdownCard}>
              <span className={styles.breakdownTitle}>
                Desglose del resumen
              </span>
              
              <div className={styles.breakdownRow}>
                <span>Cuotas del período</span>
                <span className={styles.breakdownVal}>{formatMonto(cuotasPeriodo, monedaAPagar)}</span>
              </div>

              {hasPriorDebt && (
                <div className={styles.breakdownRow}>
                  <span>Deuda vencida anterior</span>
                  <span className={styles.debtValue}>+{formatMonto(deudaVencidaAnterior, monedaAPagar)}</span>
                </div>
              )}

              {hasRefinanced && (
                <div className={styles.breakdownRow}>
                  <span>Saldo financiado anterior</span>
                  <span className={styles.debtValue}>+{formatMonto(saldoArrastrado, monedaAPagar)}</span>
                </div>
              )}

              <div className={styles.breakdownDivider} />

              <div className={styles.breakdownTotalRow}>
                <span>Total del resumen</span>
                <span className={styles.breakdownTotalVal}>{formatMonto(totalAPagar, monedaAPagar)}</span>
              </div>
            </div>
          )}

          {/* Tarjeta especial de Pesificación con campos editables */}
          {monedaAPagar === 'USD' && modoUSD === 'pesificar' && (
            <div className={styles.pesificacionCard}>
              <div className={styles.pesificacionHeader}>
                <span className={styles.pesificacionTitle}>
                  Conversión oficial y percepción
                </span>
              </div>

              {(!cotizacionOficialPropuesta && !cotizacionCustom) && (
                <div className={styles.cotizacionAlert}>
                  <AlertTriangle size={15} />
                  <span>Ingresá la cotización oficial del día de cierre del resumen.</span>
                </div>
              )}

              <div className={styles.pesificacionRow}>
                <span>Monto en dólares</span>
                <span className={styles.pesificacionVal}>{formatMonto(numMonto, 'USD')}</span>
              </div>

              <div className={styles.pesificacionRow}>
                <span className={styles.pesificacionLabelWithHelp}>
                  Cotización oficial aplicada
                  <span title="Dólar oficial vendedor al cierre del resumen" className={styles.helpIcon}>
                    <Info size={13} />
                  </span>
                </span>
                <div className={styles.inlineInputWrapper}>
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

              <div className={styles.pesificacionRow}>
                <span>Monto convertido</span>
                <div className={styles.inlineInputWrapper}>
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

              <div className={styles.pesificacionRow}>
                <span>Percepción impositiva ({percPercent}%)</span>
                <div className={styles.inlineInputWrapper}>
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

              <div className={styles.pesificacionTotalRow}>
                <span className={styles.pesificacionTotalLabel}>Total final a debitar</span>
                <span className={styles.pesificacionTotalVal}>
                  {formatMonto(totalPesosFinal, 'ARS')}
                </span>
              </div>
            </div>
          )}

          {/* Box de Pago Mínimo Estimado */}
          {pagoMinimoEstimado > 0 && (
            <div className={styles.minimoBox} title={pagoMinimoAclaracion || 'Monto de referencia orientativo bancario'}>
              <div className={styles.minimoTop}>
                <div className={styles.minimoLabelGroup}>
                  <span>Pago mínimo</span>
                  <span className={styles.minimoBadge}>Estimado</span>
                </div>
                <span className={styles.minimoVal}>{formatMonto(pagoMinimoEstimado, monedaAPagar)}</span>
              </div>
            </div>
          )}

          {/* Advertencia si monto < total */}
          {isMenorQueTotal && (
            <div className={styles.alertWarning}>
              <Info size={16} className={styles.alertIcon} />
              <span>
                El saldo restante quedará como saldo financiado y pasará al próximo resumen generando intereses bancarios.
              </span>
            </div>
          )}

          {/* Advertencia si monto < mínimo estimado */}
          {isMenorQueMinimo && (
            <div className={styles.alertDanger}>
              <AlertTriangle size={16} className={styles.alertIcon} />
              <span>
                El monto es menor al pago mínimo estimado. Esto podría generar intereses punitorios en tu cuenta.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div ref={formFooterRef} className={styles.modalFooter}>
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
                <Check size={16} strokeWidth={2.5} />
                <span>
                  {monedaAPagar === 'USD' && modoUSD === 'pesificar'
                    ? `Confirmar (${formatMonto(totalPesosFinal, 'ARS')})`
                    : `Confirmar pago (${formatMonto(numMonto, monedaAPagar)})`
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PagarResumenModal
