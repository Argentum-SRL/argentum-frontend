import React, { useState, useMemo, useEffect, useRef } from 'react'
import { X, CreditCard, CheckCircle2, Edit3, AlertTriangle, Info, Check, DollarSign, ArrowRightLeft, ChevronLeft, ArrowRight } from '@/components/ui/icons'
import type { TarjetaCredito, Billetera, PagarTarjetaPayload, Categoria, ResultadoPagoTarjeta } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import categoriaService from '@/services/categoria.service'
import { formatMonto } from '@/utils/format'
import { sortBilleteras } from '@/lib/utils/billeteras.utils'
import SegmentedControl from '@/components/ui/SegmentedControl'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import SelectableSurface from '@/components/ui/SelectableSurface'
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
  onConfirm: (payload: PagarTarjetaPayload) => Promise<ResultadoPagoTarjeta | void>
  isPaying: boolean
  fechaResumen?: string
  initialTipoPago?: 'total' | 'otro'
  initialMonto?: number | null
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
  fechaResumen,
  initialTipoPago,
  initialMonto,
}) => {
  const [tipoPago, setTipoPago] = useState<'total' | 'otro'>('total')
  const [montoCustom, setMontoCustom] = useState<number | null>(null)

  // Diferencia / Excedente opciones
  const [diferenciaTipo, setDiferenciaTipo] = useState<'cargos_banco' | 'intereses' | 'compras_no_cargadas'>('cargos_banco')
  const [diferenciaCategoriaId, setDiferenciaCategoriaId] = useState<string | null>(null)
  const [diferenciaSubcategoriaId, setDiferenciaSubcategoriaId] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])

  // Multimoneda USD options
  const [step, setStep] = useState<1 | 2>(1)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [modoUSD, setModoUSD] = useState<'dolares' | 'pesificar'>('dolares')
  const [billeteraUSDId, setBilleteraUSDId] = useState<string>('')
  const [billeteraARSId, setBilleteraARSId] = useState<string>('')
  
  // Pesificación custom inputs
  const [cotizacionCustom, setCotizacionCustom] = useState<string | null>(null)
  const [montoPesosCustom, setMontoPesosCustom] = useState<string>('')
  const [montoPercepcionCustom, setMontoPercepcionCustom] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      categoriaService.getCategorias().then(setCategorias).catch(() => {})
    }
  }, [isOpen])

  const billeterasUSD: Billetera[] = useMemo(() => {
    return sortBilleteras(
      (billeteras || []).filter((b: Billetera) => b.moneda === 'USD' && b.estado === 'activa'),
      'USD'
    )
  }, [billeteras])

  const billeterasARS: Billetera[] = useMemo(() => {
    return sortBilleteras(
      (billeteras || []).filter((b: Billetera) => b.moneda === 'ARS' && b.estado === 'activa'),
      'ARS'
    )
  }, [billeteras])

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setTipoPago(initialTipoPago ?? 'total')
      setMontoCustom(initialMonto !== undefined ? initialMonto : null)
      setDiferenciaTipo('cargos_banco')
      setDiferenciaCategoriaId(null)
      setDiferenciaSubcategoriaId(null)
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

  // Scroll automático centrado en la billetera seleccionada en el carrusel
  useEffect(() => {
    if (!isOpen || (monedaAPagar === 'USD' && step !== 1)) return
    const activeId = modoUSD === 'dolares' ? billeteraUSDId : billeteraARSId
    if (!activeId) return

    const card = cardRefs.current.get(activeId)
    if (card) {
      const scroller = card.closest('[data-modal-carousel]') as HTMLElement | null
      if (scroller) {
        const cardLeft = card.offsetLeft
        const cardWidth = card.offsetWidth
        const scrollerWidth = scroller.offsetWidth
        const targetScroll = cardLeft - (scrollerWidth / 2) + (cardWidth / 2)
        scroller.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' })
      }
    }
  }, [isOpen, billeteraUSDId, billeteraARSId, modoUSD, step, monedaAPagar])

  const handleModoUSDChange = (val: 'dolares' | 'pesificar') => {
    setModoUSD(val)
    if (val === 'dolares' && !billeteraUSDId && billeterasUSD.length > 0) {
      setBilleteraUSDId(billeterasUSD[0].id)
    } else if (val === 'pesificar' && !billeteraARSId && billeterasARS.length > 0) {
      setBilleteraARSId(billeterasARS.find(b => b.id === tarjeta.billetera_id)?.id || billeterasARS[0].id)
    }
  }

  const cotizacionEfectiva = cotizacionCustom ?? (cotizacionOficialPropuesta ? String(cotizacionOficialPropuesta) : '')

  const numMonto = tipoPago === 'total' 
    ? totalAPagar 
    : (montoCustom ?? 0)

  const isPesificacion = monedaAPagar === 'USD' && modoUSD === 'pesificar'
  const isExcedente = tipoPago === 'otro' && (montoCustom ?? 0) > totalAPagar
  const diferencia = isExcedente ? ((montoCustom ?? 0) - totalAPagar) : 0

  const isMenorQueTotal = !isExcedente && tipoPago === 'otro' && numMonto < totalAPagar && numMonto > 0
  const isMenorQueMinimo = !isExcedente && tipoPago === 'otro' && pagoMinimoEstimado > 0 && numMonto < pagoMinimoEstimado && numMonto > 0

  const isValidMonto = isPesificacion
    ? (numMonto > 0 && numMonto <= totalAPagar)
    : (numMonto > 0)

  const isExcedenteValid = !isExcedente || diferenciaTipo === 'cargos_banco' || diferenciaTipo === 'intereses' || (diferenciaTipo === 'compras_no_cargadas' && Boolean(diferenciaCategoriaId))

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

  const isFormValid = isValidMonto && isPesificacionValid && isDolaresDirectoValid && isExcedenteValid

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

    const diferenciaPayload = isExcedente ? {
      diferencia_tipo: diferenciaTipo,
      ...(diferenciaTipo === 'compras_no_cargadas' ? {
        diferencia_categoria_id: diferenciaCategoriaId || undefined,
        diferencia_subcategoria_id: diferenciaSubcategoriaId || undefined,
      } : {})
    } : {}

    if (monedaAPagar === 'ARS') {
      await onConfirm({
        moneda: 'ARS',
        monto: montoFinal,
        fecha_resumen: fechaResumen,
        ...diferenciaPayload,
      })
    } else {
      if (modoUSD === 'dolares') {
        await onConfirm({
          moneda: 'USD',
          pesificar: false,
          billetera_id: billeteraUSDId,
          monto: montoFinal,
          fecha_resumen: fechaResumen,
          ...diferenciaPayload,
        })
      } else {
        await onConfirm({
          moneda: 'USD',
          pesificar: true,
          billetera_id: billeteraARSId,
          monto: montoFinal,
          fecha_resumen: fechaResumen,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={styles.modalPagarResumen}
      noPadding
      showHeader={false}
      autoHeight
      stepDots={monedaAPagar === 'USD' ? { total: 2, current: step - 1 } : undefined}
    >
      <div className={styles.modalContainer} data-modal-frame>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeftRow}>
            {monedaAPagar === 'USD' && step === 2 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
                title="Volver"
                aria-label="Volver al paso anterior"
                disabled={isPaying}
              >
                <ChevronLeft size={18} strokeWidth={2.2} />
              </button>
            )}
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
        <div className={styles.modalBody}>
          {/* ═══════════ ETAPA 1 (USD): Modo de pago y Billetera a debitar ═══════════ */}
          {monedaAPagar === 'USD' && step === 1 && (
            <div className={styles.stepContainer} data-modal-stack>
              {/* Selector de Modo: Dólares vs Pesificar */}
              <div data-modal-block>
                <SegmentedControl<'dolares' | 'pesificar'>
                  options={[
                    {
                      value: 'dolares',
                      label: 'Pagar en dólares',
                      icon: <DollarSign size={15} strokeWidth={2.2} />,
                    },
                    {
                      value: 'pesificar',
                      label: 'Pesificar',
                      icon: <ArrowRightLeft size={15} strokeWidth={2} />,
                    },
                  ]}
                  value={modoUSD}
                  onChange={handleModoUSDChange}
                  fullWidth
                  ariaLabel="Modo de pago en dólares"
                />

                {/* Alerta si elige pagar en USD pero no tiene billetera USD */}
                {modoUSD === 'dolares' && billeterasUSD.length === 0 && (
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
                      onClick={() => handleModoUSDChange('pesificar')}
                    >
                      Cambiar a pesificar
                    </button>
                  </div>
                )}
              </div>

              {/* Carrusel de Billeteras */}
              <div className={styles.formField} data-modal-block>
                <label className={styles.fieldLabel}>
                  ¿De qué cuenta sale el dinero?
                </label>

                {modoUSD === 'dolares' ? (
                  billeterasUSD.length === 0 ? (
                    <p className={styles.noWalletsText}>No tenés cuentas en dólares disponibles.</p>
                  ) : (
                    <div data-modal-carousel>
                      <div data-modal-carousel-track ref={carouselRef}>
                        {billeterasUSD.map(b => (
                          <SelectableSurface
                            key={b.id}
                            selected={billeteraUSDId === b.id}
                            context="modal"
                            onClick={() => setBilleteraUSDId(b.id)}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el as HTMLDivElement)
                              else cardRefs.current.delete(b.id)
                            }}
                            title={`Seleccionar ${b.nombre}`}
                            aria-label={`Seleccionar ${b.nombre}`}
                          >
                            <BilleteraCard
                              billetera={b}
                              variant="select"
                            />
                          </SelectableSurface>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  billeterasARS.length === 0 ? (
                    <p className={styles.noWalletsText}>No tenés cuentas en pesos disponibles.</p>
                  ) : (
                    <div data-modal-carousel>
                      <div data-modal-carousel-track ref={carouselRef}>
                        {billeterasARS.map(b => (
                          <SelectableSurface
                            key={b.id}
                            selected={billeteraARSId === b.id}
                            context="modal"
                            onClick={() => setBilleteraARSId(b.id)}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el as HTMLDivElement)
                              else cardRefs.current.delete(b.id)
                            }}
                            title={`Seleccionar ${b.nombre}`}
                            aria-label={`Seleccionar ${b.nombre}`}
                          >
                            <BilleteraCard
                              billetera={b}
                              variant="select"
                            />
                          </SelectableSurface>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ═══════════ ETAPA 2 (o ARS): Monto, Desglose, Pesificación y Confirmación ═══════════ */}
          {(monedaAPagar !== 'USD' || step === 2) && (
            <div className={styles.stepContainer} data-modal-stack>
              <div data-modal-block>
                {/* Segmented Control: Pagar Total vs Otro Monto */}
                <SegmentedControl<'total' | 'otro'>
                  options={[
                    {
                      value: 'total',
                      label: 'Pagar el total',
                      icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
                    },
                    {
                      value: 'otro',
                      label: 'Ingresar otro monto',
                      icon: <Edit3 size={15} strokeWidth={2} />,
                    },
                  ]}
                  value={tipoPago}
                  onChange={handleSelectTipo}
                  fullWidth
                  ariaLabel="Tipo de pago"
                />

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
                    placeholder={isPesificacion ? `Hasta ${formatMonto(totalAPagar, monedaAPagar)}` : undefined}
                    max={isPesificacion ? totalAPagar : undefined}
                    autoFocus
                    disabled={isPaying}
                  />

                  {/* Quick chips si elige otro monto y no supera el total */}
                  {totalAPagar > 0 && !isExcedente && (
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

                  {/* Bloque de excedente cuando montoCustom > totalAPagar */}
                  {isExcedente && (
                    <div className={styles.excedenteCard}>
                      <div className={styles.excedenteHeader}>
                        <span className={styles.excedenteTitulo}>
                          Pagás {formatMonto(diferencia, monedaAPagar)} más que el total que calcula Argentum.
                        </span>
                      </div>

                      <div className={styles.excedenteOpciones}>
                        <label
                          className={`${styles.excedenteOpcion} ${diferenciaTipo === 'cargos_banco' ? styles.excedenteOpcionActiva : ''}`}
                          onClick={() => setDiferenciaTipo('cargos_banco')}
                        >
                          <div className={styles.excedenteRadioRow}>
                            <input
                              type="radio"
                              name="diferencia_tipo"
                              checked={diferenciaTipo === 'cargos_banco'}
                              onChange={() => setDiferenciaTipo('cargos_banco')}
                              className={styles.excedenteRadio}
                            />
                            <div className={styles.excedenteTextos}>
                              <span className={styles.excedenteOpcionLabel}>
                                Cargos del banco (comisiones e impuestos)
                              </span>
                              <span className={styles.excedenteOpcionSublabel}>
                                Se anota como gasto en Banco &gt; Impuestos.
                              </span>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`${styles.excedenteOpcion} ${diferenciaTipo === 'intereses' ? styles.excedenteOpcionActiva : ''}`}
                          onClick={() => setDiferenciaTipo('intereses')}
                        >
                          <div className={styles.excedenteRadioRow}>
                            <input
                              type="radio"
                              name="diferencia_tipo"
                              checked={diferenciaTipo === 'intereses'}
                              onChange={() => setDiferenciaTipo('intereses')}
                              className={styles.excedenteRadio}
                            />
                            <div className={styles.excedenteTextos}>
                              <span className={styles.excedenteOpcionLabel}>
                                Intereses por no pagar el total
                              </span>
                              <span className={styles.excedenteOpcionSublabel}>
                                Se anota como gasto en Banco &gt; Intereses.
                              </span>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`${styles.excedenteOpcion} ${diferenciaTipo === 'compras_no_cargadas' ? styles.excedenteOpcionActiva : ''}`}
                          onClick={() => setDiferenciaTipo('compras_no_cargadas')}
                        >
                          <div className={styles.excedenteRadioRow}>
                            <input
                              type="radio"
                              name="diferencia_tipo"
                              checked={diferenciaTipo === 'compras_no_cargadas'}
                              onChange={() => setDiferenciaTipo('compras_no_cargadas')}
                              className={styles.excedenteRadio}
                            />
                            <div className={styles.excedenteTextos}>
                              <span className={styles.excedenteOpcionLabel}>
                                Compras que no cargué
                              </span>
                            </div>
                          </div>

                          {diferenciaTipo === 'compras_no_cargadas' && (
                            <div className={styles.excedenteCategoriaSelectorWrap} onClick={(e) => e.stopPropagation()}>
                              <CategoriaSelector
                                categorias={categorias}
                                categoriaId={diferenciaCategoriaId || ''}
                                subcategoriaId={diferenciaSubcategoriaId || ''}
                                tipo="egreso"
                                onSelectCategoria={(id) => {
                                  setDiferenciaCategoriaId(id)
                                  setDiferenciaSubcategoriaId(null)
                                }}
                                onSelectSubcategoria={(id) => {
                                  setDiferenciaSubcategoriaId(id)
                                }}
                              />
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desglose: solo si hay conceptos adicionales (deuda anterior o saldo financiado) */}
            {hasBreakdown && (
              <div className={styles.breakdownCard} data-modal-block>
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
                <div className={styles.pesificacionCard} data-modal-block>
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
                    <div className={styles.inlineMontoWrapper}>
                      <MontoInput
                        moneda="ARS"
                        compact
                        variant="outlined"
                        allowDecimals
                        value={montoPesosCustom !== '' ? Number(montoPesosCustom) : (subtotalPesosCalculado > 0 ? subtotalPesosCalculado : null)}
                        onChange={(val) => setMontoPesosCustom(val !== null ? String(val) : '')}
                        placeholder={subtotalPesosCalculado > 0 ? subtotalPesosCalculado.toFixed(2) : '0'}
                      />
                    </div>
                  </div>

                  <div className={styles.pesificacionRow}>
                    <span>Percepción impositiva ({percPercent}%)</span>
                    <div className={styles.inlineMontoWrapper}>
                      <MontoInput
                        moneda="ARS"
                        compact
                        variant="outlined"
                        allowDecimals
                        value={montoPercepcionCustom !== '' ? Number(montoPercepcionCustom) : (percepcionCalculada > 0 ? percepcionCalculada : null)}
                        onChange={(val) => setMontoPercepcionCustom(val !== null ? String(val) : '')}
                        placeholder={percepcionCalculada > 0 ? percepcionCalculada.toFixed(2) : '0'}
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

              {/* Bloque de pago mínimo y advertencias */}
              {(pagoMinimoEstimado > 0 || isMenorQueTotal || isMenorQueMinimo) && (
                <div data-modal-block>
                  {/* Box de Pago Mínimo Estimado */}
                  {pagoMinimoEstimado > 0 && !isExcedente && (
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
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {monedaAPagar === 'USD' && step === 1 ? (
            <>
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
                onClick={() => setStep(2)}
                disabled={modoUSD === 'dolares' ? !billeteraUSDId : !billeteraARSId}
              >
                <span>Continuar</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={monedaAPagar === 'USD' ? () => setStep(1) : onClose}
                disabled={isPaying}
              >
                {monedaAPagar === 'USD' ? 'Volver' : 'Cancelar'}
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
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PagarResumenModal
