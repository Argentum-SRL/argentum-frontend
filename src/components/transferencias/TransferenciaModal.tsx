import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  X,
  AlertCircle,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { DateInput } from '@/components/ui'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import type { Billetera, CotizacionDolar, CotizacionesDolarResponse } from '@/types'
import transferenciaService from '@/services/transferencia.service'
import { getCotizaciones } from '@/services/onboarding.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './TransferenciaModal.module.css'

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  billeteras: Billetera[]
  cotizacionOficial?: CotizacionDolar | null
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const TransferenciaModal: React.FC<TransferenciaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  billeteras,
  cotizacionOficial,
}) => {
  // Cuentas activas
  const activeWallets = useMemo(() => {
    return billeteras.filter(b => b.estado === 'activa')
  }, [billeteras])

  // Tipos de Operación: Solo 2 solapas principales (Detección automática)
  const [tipoOperacion, setTipoOperacion] = useState<'entre_cuentas' | 'fx'>('entre_cuentas')
  const [fxDirection, setFxDirection] = useState<'compra' | 'venta'>('compra') // compra: ARS -> USD, venta: USD -> ARS

  // Moneda base del monto en Paso 1
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [monto, setMonto] = useState<number | null>(null)

  // Cuentas seleccionadas explícitamente por el usuario
  const [selectedOrigenId, setSelectedOrigenId] = useState<string>('')
  const [selectedDestinoId, setSelectedDestinoId] = useState<string>('')

  // Cotizaciones Dólar (Oficial, MEP, Blue, Personalizado)
  const [cotizacionesData, setCotizacionesData] = useState<CotizacionesDolarResponse['cotizaciones'] | null>(null)
  const [tipoCotizacion, setTipoCotizacion] = useState<'oficial' | 'mep' | 'blue' | 'manual'>('mep')
  const [cotizacionManual, setCotizacionManual] = useState<number | null>(null)

  // Fecha y Nota
  const [fecha, setFecha] = useState(todayLocal)
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pasos y Animación
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [animClass, setAnimClass] = useState('')

  // Referencias para scroll centrado del carrusel de billeteras
  const carouselOrigenRef = useRef<HTMLDivElement>(null)
  const carouselDestinoRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Cargar cotizaciones completas al montar/abrir
  useEffect(() => {
    if (!isOpen) return
    let active = true
    getCotizaciones()
      .then(res => {
        if (active && res?.cotizaciones) {
          setCotizacionesData(res.cotizaciones)
        }
      })
      .catch(() => {
        // Silenciar error en carga secundaria de cotizaciones
      })
    return () => {
      active = false
    }
  }, [isOpen])

  // Moneda efectiva según la operación
  const effectiveMoneda = tipoOperacion === 'fx' ? (fxDirection === 'compra' ? 'ARS' : 'USD') : moneda

  // Lista de billeteras de origen según operación y moneda (Principal primera, luego mayor a menor saldo)
  const billeterasOrigenDisponibles = useMemo(() => {
    const list = tipoOperacion === 'fx'
      ? activeWallets.filter(b => b.moneda === (fxDirection === 'compra' ? 'ARS' : 'USD'))
      : activeWallets.filter(b => b.moneda === effectiveMoneda)

    return list.slice().sort((a, b) => {
      if (a.es_principal && !b.es_principal) return -1
      if (!a.es_principal && b.es_principal) return 1
      return Number(b.saldo_actual) - Number(a.saldo_actual)
    })
  }, [activeWallets, tipoOperacion, fxDirection, effectiveMoneda])

  // Resolver ID de origen efectivo
  const billeteraOrigenId = useMemo(() => {
    if (selectedOrigenId && billeterasOrigenDisponibles.some(b => b.id === selectedOrigenId)) {
      return selectedOrigenId
    }
    const bestOrigen =
      billeterasOrigenDisponibles.find(b => b.es_principal) ||
      billeterasOrigenDisponibles[0]
    return bestOrigen?.id || ''
  }, [selectedOrigenId, billeterasOrigenDisponibles])

  // Lista de billeteras de destino según operación y origen (Principal primera, luego mayor a menor saldo)
  const billeterasDestinoDisponibles = useMemo(() => {
    const list = tipoOperacion === 'fx'
      ? activeWallets.filter(b => b.moneda === (fxDirection === 'compra' ? 'USD' : 'ARS') && b.id !== billeteraOrigenId)
      : activeWallets.filter(b => b.moneda === effectiveMoneda && b.id !== billeteraOrigenId)

    return list.slice().sort((a, b) => {
      if (a.es_principal && !b.es_principal) return -1
      if (!a.es_principal && b.es_principal) return 1
      return Number(b.saldo_actual) - Number(a.saldo_actual)
    })
  }, [activeWallets, tipoOperacion, fxDirection, effectiveMoneda, billeteraOrigenId])

  // Resolver ID de destino efectivo
  const billeteraDestinoId = useMemo(() => {
    if (selectedDestinoId && billeterasDestinoDisponibles.some(b => b.id === selectedDestinoId)) {
      return selectedDestinoId
    }
    const bestDestino =
      billeterasDestinoDisponibles.find(b => b.es_principal) ||
      billeterasDestinoDisponibles[0]
    return bestDestino?.id || ''
  }, [selectedDestinoId, billeterasDestinoDisponibles])

  // Scroll automático centrado en la billetera seleccionada (igual a TransaccionModal)
  useEffect(() => {
    if (!isOpen) return
    const idToScroll = step === 1 ? billeteraOrigenId : (step === 2 ? billeteraDestinoId : null)
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        const scroller = card.closest(`.${styles.billeterasCarouselScroller}`) as HTMLElement | null
        if (scroller) {
          const cardRect = card.getBoundingClientRect()
          const scrollerRect = scroller.getBoundingClientRect()
          const currentScroll = scroller.scrollLeft
          const offset = cardRect.left - scrollerRect.left + currentScroll
          const targetScrollLeft = offset - (scroller.clientWidth - cardRect.width) / 2

          scroller.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth',
          })
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [step, billeteraOrigenId, billeteraDestinoId, isOpen])

  // Entidades activas seleccionadas
  const billeteraOrigen = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraOrigenId)
  }, [activeWallets, billeteraOrigenId])

  const billeteraDestino = useMemo(() => {
    return activeWallets.find(b => b.id === billeteraDestinoId)
  }, [activeWallets, billeteraDestinoId])

  // Obtener cotización numérica para un tipo de cambio dado
  const getRateValue = useCallback((tipoRate: 'oficial' | 'mep' | 'blue' | 'manual'): number | null => {
    if (tipoRate === 'manual') return cotizacionManual
    if (cotizacionesData && cotizacionesData[tipoRate]) {
      const item = cotizacionesData[tipoRate]
      if (fxDirection === 'compra') {
        return item.venta ?? item.promedio ?? item.compra ?? null
      }
      return item.compra ?? item.promedio ?? item.venta ?? null
    }
    if (tipoRate === 'oficial' && cotizacionOficial) {
      if (fxDirection === 'compra') {
        return cotizacionOficial.venta ?? cotizacionOficial.promedio ?? cotizacionOficial.compra ?? 1090
      }
      return cotizacionOficial.compra ?? cotizacionOficial.promedio ?? cotizacionOficial.venta ?? 1050
    }
    // Valores de referencia de mercado si aún no cargó la API
    if (tipoRate === 'oficial') return fxDirection === 'compra' ? 1090 : 1050
    if (tipoRate === 'mep') return fxDirection === 'compra' ? 1415 : 1410
    if (tipoRate === 'blue') return fxDirection === 'compra' ? 1440 : 1420
    return null
  }, [cotizacionesData, fxDirection, cotizacionOficial, cotizacionManual])

  // Cotización activa calculada
  const cotizacionActivaValor = useMemo(() => {
    if (tipoOperacion !== 'fx') return null
    if (tipoCotizacion === 'manual') {
      return cotizacionManual ?? 1440
    }
    return getRateValue(tipoCotizacion) ?? cotizacionManual ?? 1440
  }, [tipoOperacion, tipoCotizacion, cotizacionManual, getRateValue])

  // Cálculo del monto en destino si es FX
  const montoDestinoCalculado = useMemo(() => {
    if (tipoOperacion !== 'fx' || !monto || monto <= 0 || !cotizacionActivaValor) {
      return null
    }

    if (fxDirection === 'compra') {
      // Paga ARS, recibe USD
      return Number((monto / cotizacionActivaValor).toFixed(2))
    }
    // Entrega USD, recibe ARS
    return Number((monto * cotizacionActivaValor).toFixed(2))
  }, [tipoOperacion, fxDirection, monto, cotizacionActivaValor])

  // Detección automática del tipo de movimiento (Opción 1)
  const tipoMovimientoDetectado = useMemo<'extraccion' | 'deposito' | 'transferencia' | 'fx'>(() => {
    if (tipoOperacion === 'fx') return 'fx'
    if (billeteraOrigen?.es_efectivo && !billeteraDestino?.es_efectivo) return 'deposito'
    if (!billeteraOrigen?.es_efectivo && billeteraDestino?.es_efectivo) return 'extraccion'
    return 'transferencia'
  }, [tipoOperacion, billeteraOrigen, billeteraDestino])

  // Saldos e impacto
  const saldoOrigenActual = billeteraOrigen?.saldo_actual ?? 0
  const isOverdraft = Boolean(monto && monto > saldoOrigenActual)

  // Título del botón de confirmación
  const submitTitle = useMemo(() => {
    if (tipoOperacion === 'fx') {
      return fxDirection === 'compra' ? 'Confirmar compra Dólares' : 'Confirmar venta Dólares'
    }
    if (tipoMovimientoDetectado === 'extraccion') {
      return 'Confirmar extracción'
    }
    if (tipoMovimientoDetectado === 'deposito') {
      return 'Confirmar depósito'
    }
    return 'Confirmar transferencia'
  }, [tipoOperacion, fxDirection, tipoMovimientoDetectado])

  // Mensaje de éxito del toast
  const successToastTitle = useMemo(() => {
    if (tipoOperacion === 'fx') {
      return fxDirection === 'compra' ? 'Compra de dólares registrada' : 'Venta de dólares registrada'
    }
    if (tipoMovimientoDetectado === 'extraccion') {
      return 'Extracción de efectivo registrada'
    }
    if (tipoMovimientoDetectado === 'deposito') {
      return 'Depósito registrado con éxito'
    }
    return 'Transferencia realizada con éxito'
  }, [tipoOperacion, fxDirection, tipoMovimientoDetectado])

  // Placeholder de nota según movimiento detectado
  const placeholderNota = useMemo(() => {
    if (tipoOperacion === 'fx') {
      return fxDirection === 'compra' ? 'Compra dólares MEP / Ahorro' : 'Venta de dólares'
    }
    if (tipoMovimientoDetectado === 'extraccion') {
      return 'Extracción por cajero automático'
    }
    if (tipoMovimientoDetectado === 'deposito') {
      return 'Depósito por terminal / ventanilla'
    }
    return 'Ej: Ahorro, traspaso, etc.'
  }, [tipoOperacion, fxDirection, tipoMovimientoDetectado])

  // Navegación de Pasos
  const goNext = () => {
    if (step === 1) {
      if (!monto || monto <= 0) {
        sileo.error({ title: 'Ingresá un monto válido mayor a 0' })
        return
      }
      if (!billeteraOrigenId) {
        sileo.error({ title: 'Seleccioná la cuenta de origen' })
        return
      }
      if (isOverdraft) {
        sileo.error({
          title: `Saldo insuficiente en ${billeteraOrigen?.nombre}. Disponible: ${formatMonto(saldoOrigenActual, effectiveMoneda)}`,
        })
        return
      }

      setAnimClass(styles.slideForward)
      setStep(2)
    } else if (step === 2) {
      if (!billeteraDestinoId) {
        sileo.error({ title: 'Seleccioná la cuenta de destino' })
        return
      }
      setAnimClass(styles.slideForward)
      if (tipoOperacion === 'fx') {
        setStep(3)
      } else {
        setStep(4)
      }
    } else if (step === 3) {
      if (!cotizacionActivaValor || cotizacionActivaValor <= 0) {
        sileo.error({ title: 'Ingresá una cotización válida' })
        return
      }
      setAnimClass(styles.slideForward)
      setStep(4)
    }
  }

  const goBack = () => {
    setAnimClass(styles.slideBack)
    if (step === 4) {
      if (tipoOperacion === 'fx') {
        setStep(3)
      } else {
        setStep(2)
      }
    } else if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1)
    }
  }

  // Hook de altura adaptativa (idéntico a TransaccionModal)
  const {
    headerRef: formHeaderRef,
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: isOpen,
    deps: [step, tipoOperacion, fxDirection, effectiveMoneda, monto, billeteraOrigenId, billeteraDestinoId, tipoCotizacion, cotizacionActivaValor, billeterasOrigenDisponibles.length, billeterasDestinoDisponibles.length],
    extraPadding: 22,
    maxHeightRatio: 0.90,
  })

  // Envío final
  const handleSubmit = async () => {
    if (isSubmitting || !billeteraOrigenId || !billeteraDestinoId || !monto) return

    setIsSubmitting(true)
    try {
      const monedaOrigen = billeteraOrigen?.moneda || effectiveMoneda
      const monedaDestino = billeteraDestino?.moneda || (tipoOperacion === 'fx' ? (fxDirection === 'compra' ? 'USD' : 'ARS') : effectiveMoneda)
      const esMismaMoneda = monedaOrigen === monedaDestino

      const finalMontoDestino = esMismaMoneda ? Number(monto) : Number(montoDestinoCalculado || monto)

      await transferenciaService.createTransferencia({
        billetera_origen_id: billeteraOrigenId,
        billetera_destino_id: billeteraDestinoId,
        monto: Number(monto),
        moneda: monedaOrigen,
        monto_origen: Number(monto),
        monto_destino: finalMontoDestino,
        moneda_origen: monedaOrigen,
        moneda_destino: monedaDestino,
        cotizacion: esMismaMoneda ? null : (cotizacionActivaValor ? Number(cotizacionActivaValor) : null),
        monto_comision: null,
        moneda_comision: null,
        fecha,
        notas: notas.trim() || null,
      })

      sileo.success({
        title: successToastTitle,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      sileo.error({ title: getErrorMessage(err, 'Error al procesar la transferencia.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      className={styles.modalTransferencia}
      ariaLabel="Transferir y Cambiar"
    >
      <div
        className={styles.slidesContainer}
        style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
      >
        {/* ── Step Indicator Dots (Idéntico a TransaccionModal) ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
          {tipoOperacion === 'fx' && (
            <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
          )}
          <div className={`${styles.stepDot} ${step === 4 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1: Monto, Operación y Origen ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <h2 className={styles.headerTitle}>Transferir y Cambiar</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep1}`}>
                {/* Selector de Operación (3 Solapas Directas Apple Style) */}
                <div className={styles.segmentedBar} role="radiogroup" aria-label="Tipo de operación">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipoOperacion === 'entre_cuentas'}
                    className={`${styles.segmentedPill} ${tipoOperacion === 'entre_cuentas' ? styles.segmentedPillActive : ''}`}
                    onClick={() => setTipoOperacion('entre_cuentas')}
                  >
                    <ArrowRightLeft size={14} strokeWidth={2} />
                    <span>Entre cuentas</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipoOperacion === 'fx' && fxDirection === 'compra'}
                    className={`${styles.segmentedPill} ${tipoOperacion === 'fx' && fxDirection === 'compra' ? styles.segmentedPillActive : ''}`}
                    onClick={() => {
                      setTipoOperacion('fx')
                      setFxDirection('compra')
                      setMoneda('ARS')
                    }}
                  >
                    <ArrowDownLeft size={14} strokeWidth={2.2} />
                    <span>Comprar</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipoOperacion === 'fx' && fxDirection === 'venta'}
                    className={`${styles.segmentedPill} ${tipoOperacion === 'fx' && fxDirection === 'venta' ? styles.segmentedPillActive : ''}`}
                    onClick={() => {
                      setTipoOperacion('fx')
                      setFxDirection('venta')
                      setMoneda('USD')
                    }}
                  >
                    <ArrowUpRight size={14} strokeWidth={2.2} />
                    <span>Vender</span>
                  </button>
                </div>

                {/* Hero Monto */}
                <MontoInput
                  value={monto}
                  onChange={setMonto}
                  moneda={effectiveMoneda}
                  onMonedaChange={setMoneda}
                  autoFocus
                  allowDecimals
                />

                {/* Cuenta de Origen con Carrusel idéntico a TransaccionModal */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {tipoOperacion === 'fx'
                      ? fxDirection === 'compra'
                        ? '¿De qué cuenta salen los pesos?'
                        : '¿De qué cuenta salen los dólares?'
                      : '¿De qué cuenta sale el dinero?'}
                  </label>

                  {billeterasOrigenDisponibles.length === 0 ? (
                    <p className={styles.noWalletsText}>No tenés cuentas disponibles para este tipo de operación.</p>
                  ) : (
                    <div className={styles.billeterasCarouselScroller}>
                      <div className={styles.billeterasCarousel} ref={carouselOrigenRef}>
                        {billeterasOrigenDisponibles.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={billeteraOrigenId === b.id}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el)
                              else cardRefs.current.delete(b.id)
                            }}
                          >
                            <BilleteraCard
                              billetera={b}
                              className={styles.fullHeightCard}
                              disableNavigation={true}
                              hideCurrencyChip={true}
                            />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => setSelectedOrigenId(b.id)}
                              title={`Seleccionar ${b.nombre}`}
                              aria-label={`Seleccionar ${b.nombre}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alerta de saldo insuficiente */}
                {isOverdraft && (
                  <div className={styles.overdraftWarning}>
                    <AlertCircle size={15} />
                    El monto supera el saldo disponible ({formatMonto(saldoOrigenActual, effectiveMoneda)})
                  </div>
                )}
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 2: Cuenta Destino ════════════════════ */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                  <ChevronLeft size={20} />
                </button>
                <h2 className={styles.headerTitle}>Cuenta de destino</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div ref={formBodyRef} className={styles.formBody}>
                {/* Selector de Billetera de Destino (Carrusel) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    {tipoOperacion === 'fx'
                      ? fxDirection === 'compra'
                        ? '¿A qué cuenta ingresan los dólares?'
                        : '¿A qué cuenta ingresan los pesos?'
                      : '¿A qué cuenta ingresa el dinero?'}
                  </label>

                  {billeterasDestinoDisponibles.length === 0 ? (
                    <p className={styles.noWalletsText}>No tenés otras cuentas disponibles para este destino.</p>
                  ) : (
                    <div className={styles.billeterasCarouselScroller}>
                      <div className={styles.billeterasCarousel} ref={carouselDestinoRef}>
                        {billeterasDestinoDisponibles.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={billeteraDestinoId === b.id}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el)
                              else cardRefs.current.delete(b.id)
                            }}
                          >
                            <BilleteraCard
                              billetera={b}
                              className={styles.fullHeightCard}
                              disableNavigation={true}
                              hideCurrencyChip={true}
                            />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => setSelectedDestinoId(b.id)}
                              title={`Seleccionar ${b.nombre}`}
                              aria-label={`Seleccionar ${b.nombre}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>
                  Atrás
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 3: Tipo de Cambio y Cotización (Solo FX) ════════════════════ */}
        {step === 3 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                  <ChevronLeft size={20} />
                </button>
                <h2 className={styles.headerTitle}>Tipo de cambio y Cotización</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div ref={formBodyRef} className={styles.formBody}>
                {/* Selector de Tipos de Cambio para Dólares (FX) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Tipo de cambio de referencia</label>
                  <div className={styles.methodGrid}>
                    {(['oficial', 'mep', 'blue', 'manual'] as const).map(tipoRate => {
                      const getRateDisplay = () => {
                        if (tipoRate === 'manual') {
                          return cotizacionManual ? `$ ${Number(cotizacionManual).toLocaleString('es-AR')}` : 'Manual'
                        }
                        const v = getRateValue(tipoRate)
                        return v ? `$ ${Number(v).toLocaleString('es-AR')}` : '-'
                      }
                      const rateDisplay = getRateDisplay()

                      return (
                        <button
                          key={tipoRate}
                          type="button"
                          className={`${styles.methodBtn} ${tipoCotizacion === tipoRate ? styles.methodBtnActive : ''}`}
                          onClick={() => {
                            setTipoCotizacion(tipoRate)
                            if (tipoRate !== 'manual') {
                              const v = getRateValue(tipoRate)
                              if (v) setCotizacionManual(v)
                            }
                          }}
                        >
                          <span className={styles.methodBtnTitle}>{tipoRate.toUpperCase()}</span>
                          <span className={styles.methodBtnRate}>{rateDisplay}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Input de Cotización con diseño Hero MontoInput */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Cotización aplicada (1 Dólar = $)</label>
                  <MontoInput
                    value={cotizacionActivaValor}
                    onChange={(val) => {
                      setTipoCotizacion('manual')
                      setCotizacionManual(val)
                    }}
                    moneda="ARS"
                    placeholder="0"
                    allowDecimals
                  />
                </div>

                {/* Monto proyectado a recibir */}
                <div className={styles.summaryBox}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLbl}>Recibís en destino:</span>
                    <span className={styles.summaryVal} style={{ color: '#16a34a', fontSize: 16 }}>
                      {formatMonto(montoDestinoCalculado || 0, fxDirection === 'compra' ? 'USD' : 'ARS')}
                    </span>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>
                  Atrás
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 4: Fecha, Nota y Confirmación (Para Entre Cuentas y FX) ════════════════════ */}
        {step === 4 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                  <ChevronLeft size={20} />
                </button>
                <h2 className={styles.headerTitle}>Detalles y Confirmación</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div ref={formBodyRef} className={styles.formBody}>
                {/* Descripción/Nota + Fecha (Idéntico a Paso 3 de TransaccionModal) */}
                <div className={styles.descFechaRow}>
                  <div className={`${styles.formField} ${styles.flex2}`}>
                    <label className={styles.fieldLabel} htmlFor="tx-nota">Concepto / Nota</label>
                    <input
                      id="tx-nota"
                      type="text"
                      className={styles.fieldInput}
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      placeholder={placeholderNota}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.flex1}`}>
                    <label className={styles.fieldLabel} htmlFor="tx-fecha">Fecha</label>
                    <DateInput
                      id="tx-fecha"
                      value={fecha}
                      onChange={setFecha}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                {/* Resumen Financiero Completo con Detección Automática */}
                <div className={styles.summaryBox}>
                  <div className={styles.summaryHeader}>
                    <span>
                      {tipoMovimientoDetectado === 'extraccion'
                        ? 'Extracción de efectivo'
                        : tipoMovimientoDetectado === 'deposito'
                          ? 'Depósito en cuenta'
                          : tipoMovimientoDetectado === 'fx'
                            ? fxDirection === 'compra'
                              ? 'Compra de dólares (FX)'
                              : 'Venta de dólares (FX)'
                            : 'Transferencia entre cuentas'}
                    </span>
                    {tipoOperacion === 'fx' && cotizacionActivaValor && (
                      <span className={styles.ratePill}>
                        1 Dólar = $ {cotizacionActivaValor} ({tipoCotizacion.toUpperCase()})
                      </span>
                    )}
                  </div>

                  <div className={styles.summaryRow}>
                    <div className={styles.summaryCol}>
                      <span className={styles.summaryLbl}>
                        {tipoMovimientoDetectado === 'deposito' ? 'Efectivo a entregar' : 'Cuenta de origen'}
                      </span>
                      <span className={styles.summaryVal}>{billeteraOrigen?.nombre}</span>
                    </div>
                    <div className={`${styles.summaryCol} ${styles.summaryColRight}`}>
                      <span className={styles.summaryLbl}>Importe a debitar</span>
                      <span className={styles.summaryVal} style={{ color: '#ef4444' }}>
                        - {formatMonto(monto || 0, billeteraOrigen?.moneda || effectiveMoneda)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <div className={styles.summaryCol}>
                      <span className={styles.summaryLbl}>
                        {tipoMovimientoDetectado === 'extraccion' ? 'Efectivo a recibir' : 'Cuenta de destino'}
                      </span>
                      <span className={styles.summaryVal}>{billeteraDestino?.nombre}</span>
                    </div>
                    <div className={`${styles.summaryCol} ${styles.summaryColRight}`}>
                      <span className={styles.summaryLbl}>Importe a acreditar</span>
                      <span className={styles.summaryVal} style={{ color: '#16a34a' }}>
                        + {formatMonto(
                          tipoOperacion === 'fx' ? (montoDestinoCalculado || 0) : (monto || 0),
                          billeteraDestino?.moneda || effectiveMoneda
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>
                  Atrás
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Procesando...' : submitTitle}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default TransferenciaModal
