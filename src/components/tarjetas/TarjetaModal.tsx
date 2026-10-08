import React, { useState, useReducer, useRef, useEffect, useMemo } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useAuth } from '@/hooks/useAuth'
import tarjetaService from '@/services/tarjeta.service'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { getBankById, findBankByNombre, sortBilleteras } from '@/lib/utils/billeteras.utils'
import type { Billetera, TarjetaCredito, TarjetaCreditoCreate } from '@/types'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from './RealCardPreview'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import { formatMonto } from '@/utils/format'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import styles from './TarjetaModal.module.css'

// Logos de redes
import visaLogo from '@/assets/redes/visa.png'
import mastercardLogo from '@/assets/redes/mastercard.png'
import amexLogo from '@/assets/redes/amex.png'
import cabalLogo from '@/assets/redes/cabal.png'
import naranjaLogo from '@/assets/redes/naranjax.png'

const RED_LOGOS: Record<string, string> = {
  visa: visaLogo,
  mastercard: mastercardLogo,
  amex: amexLogo,
  cabal: cabalLogo,
  naranja: naranjaLogo,
}

const RED_CUSTOM_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  naranja: 'Naranja X',
  cabal: 'Cabal',
}

// Mapeo de colores a hex para persistencia en base de datos
const PREMIUM_COLORS_HEX: Record<string, string> = {
  'linear-gradient(140deg, #DFB756 0%, #A67B1E 60%, #5E430A 100%)': '#D4AF37', // GOLD
  'linear-gradient(140deg, #E2E8F0 0%, #94A3B8 55%, #475569 100%)': '#E5E4E2', // PLATINUM
  'linear-gradient(140deg, #242830 0%, #111317 60%, #050608 100%)': '#1A1A1B', // BLACK
  'linear-gradient(140deg, #1E3A8A 0%, #0F172A 60%, #020617 100%)': '#1E3A8A', // SAPPHIRE
  'linear-gradient(140deg, #881337 0%, #4C0519 65%, #23010A 100%)': '#BE123C', // RUBY
  'linear-gradient(140deg, #064E3B 0%, #022C22 65%, #011611 100%)': '#047857', // EMERALD
  'linear-gradient(140deg, #6B21A8 0%, #3B0764 65%, #19032E 100%)': '#7C3AED', // VIOLET
  'linear-gradient(140deg, #FF6F00 0%, #D43800 55%, #8C1C00 100%)': '#FF8C00', // GALICIA
  'linear-gradient(135deg, #E6C875 0%, #B89230 100%)': '#D4AF37',
  'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)': '#E5E4E2',
  'linear-gradient(135deg, #2A2D34 0%, #121316 100%)': '#1A1A1B',
  'linear-gradient(135deg, #1E40AF 0%, #0F172A 100%)': '#1E3A8A',
  'linear-gradient(135deg, #E11D48 0%, #881337 100%)': '#BE123C',
  'linear-gradient(135deg, #059669 0%, #064E3B 100%)': '#047857',
  'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)': '#7C3AED',
  'linear-gradient(135deg, #FF7A00 0%, #E65100 100%)': '#FF8C00',
  'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)': '#D4AF37',
  'linear-gradient(135deg, #E5E4E2 0%, #B4B4B4 100%)': '#E5E4E2',
  'linear-gradient(135deg, #1A1A1B 0%, #000000 100%)': '#1A1A1B',
  'linear-gradient(135deg, #0D2045 0%, #061228 100%)': '#1E3A8A',
  'linear-gradient(135deg, #EC0000 0%, #B30000 100%)': '#BE123C',
}

const EFECTIVO_BG: Record<'ARS' | 'USD', string> = {
  ARS: 'linear-gradient(135deg, #166534 0%, #14532D 100%)',
  USD: 'linear-gradient(135deg, #155E75 0%, #164E63 100%)',
}

function getBilleteraColor(billetera: Billetera | undefined): string {
  if (!billetera) return 'linear-gradient(140deg, #FF6F00 0%, #D43800 55%, #8C1C00 100%)'
  if (billetera.es_efectivo) return EFECTIVO_BG[billetera.moneda]

  const bank = billetera.bank_id ? getBankById(billetera.bank_id) : findBankByNombre(billetera.nombre)
  if (bank?.id === 'galicia' || billetera.nombre.toLowerCase().includes('galicia')) {
    return 'linear-gradient(140deg, #FF6F00 0%, #D43800 55%, #8C1C00 100%)'
  }
  if (bank?.id === 'santander' || billetera.nombre.toLowerCase().includes('santander')) {
    return 'linear-gradient(140deg, #881337 0%, #4C0519 65%, #23010A 100%)'
  }
  if (bank?.id === 'bbva' || billetera.nombre.toLowerCase().includes('bbva')) {
    return 'linear-gradient(140deg, #1E3A8A 0%, #0F172A 60%, #020617 100%)'
  }
  if (bank?.gradiente) return bank.gradiente
  if (bank?.colorPrimario) {
    return `linear-gradient(140deg, ${bank.colorPrimario} 0%, color-mix(in srgb, ${bank.colorPrimario}, black 35%) 100%)`
  }

  return 'linear-gradient(140deg, #1E3A8A 0%, #0F172A 60%, #020617 100%)'
}

interface TarjetaModalState {
  ultimos4: string
  apodo: string
  red: string
  billeteraId: string
  moneda: 'ARS' | 'USD'
  diaCierre: number | ''
  diaVencimiento: number | ''
  limiteCredito: number | null
  percepcionMonedaExtranjera: number
  color: string | null
  loading: boolean
  error: string | null
}

type TarjetaModalAction =
  | { type: 'SET_FIELD'; field: keyof TarjetaModalState; value: TarjetaModalState[keyof TarjetaModalState] }
  | { type: 'RESET'; data: { tarjeta: TarjetaCredito | null; billeteras: Billetera[]; defaultBilleteraId?: string } }

const initialState: TarjetaModalState = {
  ultimos4: '',
  apodo: '',
  red: 'visa',
  billeteraId: '',
  moneda: 'ARS',
  diaCierre: 10,
  diaVencimiento: 3,
  limiteCredito: null,
  percepcionMonedaExtranjera: 30,
  color: null,
  loading: false,
  error: null,
}

function getInitialTarjetaState(data?: { tarjeta: TarjetaCredito | null; billeteras?: Billetera[]; billeteraId?: string; defaultBilleteraId?: string }): TarjetaModalState {
  if (!data) return initialState

  if (data.tarjeta) {
    const t = data.tarjeta
    return {
      ...initialState,
      ultimos4: t.nombre.replace('•••• ', ''),
      apodo: t.apodo || '',
      red: t.red,
      billeteraId: t.billetera_id,
      moneda: t.moneda,
      diaCierre: t.dia_cierre,
      diaVencimiento: t.dia_vencimiento,
      limiteCredito: t.limite_credito,
      percepcionMonedaExtranjera: t.percepcion_moneda_extranjera !== undefined ? Number(t.percepcion_moneda_extranjera) : 30,
      color: t.color || getBilleteraColor((data.billeteras || []).find(b => b.id === t.billetera_id)),
    }
  }

  const bancarias = sortBilleteras((data.billeteras || []).filter(b => !b.es_efectivo))
  const defaultId = data.billeteraId || data.defaultBilleteraId || bancarias[0]?.id || ''
  const defaultColor = getBilleteraColor((data.billeteras || []).find(b => b.id === defaultId))

  return {
    ...initialState,
    billeteraId: defaultId,
    moneda: ((data.billeteras || []).find(b => b.id === defaultId)?.moneda as 'ARS' | 'USD') || 'ARS',
    color: defaultColor,
  }
}

function tarjetaReducer(state: TarjetaModalState, action: TarjetaModalAction): TarjetaModalState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET': {
      return getInitialTarjetaState({
        tarjeta: action.data.tarjeta,
        billeteras: action.data.billeteras,
        billeteraId: action.data.defaultBilleteraId,
      })
    }
    default:
      return state
  }
}

export const TarjetaModal: React.FC = () => {
  const { getData, close } = useModal()
  const data = getData('tarjeta')
  const { usuario } = useAuth()

  const [state, dispatch] = useReducer(tarjetaReducer, data, getInitialTarjetaState)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [animClass, setAnimClass] = useState('')

  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Altura dinámica adaptativa idéntica a TransferenciaModal
  const {
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: Boolean(data),
    deps: [step, state, data],
    extraPadding: 22,
    maxHeightRatio: 0.90,
  })

  const [prevData, setPrevData] = useState(data)
  if (data !== prevData) {
    setPrevData(data)
    if (data) {
      setStep(1)
      setAnimClass('')
      dispatch({
        type: 'RESET',
        data: {
          tarjeta: data.tarjeta,
          billeteras: data.billeteras || [],
          defaultBilleteraId: data.billeteraId,
        },
      })
    }
  }

  const bancarias = useMemo(() => {
    return sortBilleteras((data?.billeteras || []).filter((b: Billetera) => !b.es_efectivo))
  }, [data?.billeteras])

  const selectedBilletera = useMemo(() => {
    return (data?.billeteras || []).find((b: Billetera) => b.id === state.billeteraId)
  }, [data?.billeteras, state.billeteraId])

  // Scroll automático centrado en la billetera seleccionada en el carrusel
  useEffect(() => {
    if (!data || step !== 1 || !state.billeteraId) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(state.billeteraId)
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
  }, [step, state.billeteraId, data])

  if (!data) return null

  // Paleta de opciones de colores
  const colorOptions = [
    { id: 'banco', label: 'Banco', value: getBilleteraColor(selectedBilletera) },
    { id: 'gold', label: 'Gold', value: 'linear-gradient(140deg, #DFB756 0%, #A67B1E 60%, #5E430A 100%)' },
    { id: 'platinum', label: 'Platinum', value: 'linear-gradient(140deg, #E2E8F0 0%, #94A3B8 55%, #475569 100%)' },
    { id: 'black', label: 'Black', value: 'linear-gradient(140deg, #242830 0%, #111317 60%, #050608 100%)' },
    { id: 'sapphire', label: 'Zafiro', value: 'linear-gradient(140deg, #1E3A8A 0%, #0F172A 60%, #020617 100%)' },
  ]

  // Navegación de Pasos
  const goNext = () => {
    if (step === 1) {
      if (!state.ultimos4 || state.ultimos4.length !== 4) {
        sileo.error({ title: 'Ingresá los 4 últimos dígitos de la tarjeta' })
        return
      }
      if (!state.billeteraId) {
        sileo.error({ title: 'Seleccioná la cuenta bancaria asociada' })
        return
      }
      if (!state.red) {
        sileo.error({ title: 'Seleccioná la red emisora de la tarjeta' })
        return
      }
      setAnimClass(styles.slideForward)
      setStep(2)
    } else if (step === 2) {
      const diaCierreNum = Number(state.diaCierre)
      const diaVencimientoNum = Number(state.diaVencimiento)

      if (!Number.isInteger(diaCierreNum) || diaCierreNum < 1 || diaCierreNum > 28) {
        sileo.error({ title: 'El día de cierre debe estar entre 1 y 28' })
        return
      }
      if (!Number.isInteger(diaVencimientoNum) || diaVencimientoNum < 1 || diaVencimientoNum > 28) {
        sileo.error({ title: 'El día de vencimiento debe estar entre 1 y 28' })
        return
      }
      if (state.limiteCredito !== null && state.limiteCredito !== undefined && state.limiteCredito <= 0) {
        sileo.error({ title: 'El límite de crédito debe ser mayor a cero si se indica' })
        return
      }
      setAnimClass(styles.slideForward)
      setStep(3)
    }
  }

  const goBack = () => {
    if (step === 2) {
      setAnimClass(styles.slideBack)
      setStep(1)
    } else if (step === 3) {
      setAnimClass(styles.slideBack)
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true })
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    const diaCierreNum = Number(state.diaCierre)
    const diaVencimientoNum = Number(state.diaVencimiento)

    try {
      let colorToSend: string | undefined = undefined
      if (state.color) {
        colorToSend = PREMIUM_COLORS_HEX[state.color]
        if (!colorToSend) {
          const hexMatch = state.color.match(/#[0-9A-Fa-f]{6}/g)
          colorToSend = hexMatch ? hexMatch[0] : state.color
        }
        if (colorToSend && colorToSend.length > 7) {
          colorToSend = colorToSend.substring(0, 7)
        }
      }

      const payload: TarjetaCreditoCreate = {
        nombre: `•••• ${state.ultimos4}`,
        apodo: state.apodo && state.apodo.trim() ? state.apodo.trim() : null,
        red: state.red,
        billetera_id: state.billeteraId,
        moneda: state.moneda,
        dia_cierre: diaCierreNum,
        dia_vencimiento: diaVencimientoNum,
        limite_credito: state.limiteCredito !== null && state.limiteCredito !== undefined ? state.limiteCredito : undefined,
        percepcion_moneda_extranjera: Number(state.percepcionMonedaExtranjera),
        color: colorToSend,
      }

      if (data.tarjeta) {
        const res = await tarjetaService.updateTarjeta(data.tarjeta.id, payload)
        if (res?.cuotas_recalculadas && res.cuotas_recalculadas > 0) {
          sileo.success({
            title: `Tarjeta actualizada. Se recalcularon las fechas de ${res.cuotas_recalculadas} ${res.cuotas_recalculadas === 1 ? 'cuota futura' : 'cuotas futuras'}.`,
          })
        } else {
          sileo.success({ title: 'Tarjeta actualizada' })
        }
      } else {
        await tarjetaService.createTarjeta(payload)
        sileo.success({ title: 'Tarjeta guardada' })
      }

      data.onSuccess()
      close('tarjeta')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } | string } }
      const errorData = axiosError.response?.data
      console.error('Error al guardar tarjeta:', errorData)

      let errorMsg = 'Error al guardar tarjeta'
      if (typeof errorData === 'string') {
        errorMsg = errorData
      } else if (errorData && typeof errorData === 'object' && 'detail' in errorData && typeof errorData.detail === 'string') {
        errorMsg = errorData.detail
      }
      sileo.error({ title: errorMsg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'loading', value: false })
    }
  }

  const titular = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim().toUpperCase() : 'TITULAR'

  return (
    <Modal
      isOpen={true}
      onClose={() => close('tarjeta')}
      showHeader={false}
      noPadding
      autoHeight
      className={styles.modalTarjeta}
      ariaLabel={data.tarjeta ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
    >
      <div
        className={styles.slidesContainer}
        style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
      >
        {/* ── Step Indicator Dots (Funden fluidamente con el body) ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1: Identificación y Red ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formBodyRef} className={styles.formBody}>
                {/* Header integrado directamente en el Body */}
                <div className={styles.formHeader}>
                  <h2 className={styles.headerTitle}>
                    {data.tarjeta ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
                  </h2>
                  <button type="button" className={styles.closeBtn} onClick={() => close('tarjeta')} title="Cerrar">
                    <X size={16} />
                  </button>
                </div>

                {/* Red de la tarjeta (Apple Interactive Brand Tiles con efecto 3D Wallet) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Red de la tarjeta</label>
                  <div className={styles.redGrid}>
                    {Object.entries(RED_CUSTOM_LABELS).map(([id, label]) => {
                      const isActive = state.red === id
                      return (
                        <button
                          type="button"
                          key={id}
                          data-active={isActive}
                          className={styles.redTile}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'red', value: id })}
                          title={label}
                          aria-label={`Seleccionar red ${label}`}
                        >
                          <div className={styles.redLogoWrapper}>
                            {RED_LOGOS[id] ? (
                              <img
                                src={RED_LOGOS[id]}
                                alt={label}
                                className={styles.networkLogoImg}
                              />
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: 800 }}>{label}</span>
                            )}
                          </div>
                          <span className={styles.redTileLabel}>{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Últimos 4 Dígitos en un único renglón estricto */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="tarjeta-ultimos4">
                    Últimos 4 dígitos
                  </label>
                  <div className={styles.cardDigitsHero}>
                    <span className={styles.cardDigitsPrefix}>•••• •••• ••••</span>
                    <input
                      id="tarjeta-ultimos4"
                      className={styles.cardDigitsInput}
                      value={state.ultimos4}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                        dispatch({ type: 'SET_FIELD', field: 'ultimos4', value: val })
                      }}
                      placeholder="0000"
                      maxLength={4}
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Apodo / Identificador */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="tarjeta-apodo">
                    Apodo
                  </label>
                  <input
                    id="tarjeta-apodo"
                    type="text"
                    maxLength={50}
                    className={styles.fieldInput}
                    value={state.apodo}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'apodo', value: e.target.value })}
                    placeholder="Ej. Black Signature, Platinum Rewards, Titanium"
                  />
                  <span className={styles.fieldHint}>
                    Alias para identificarla al instante en tus resúmenes y al registrar consumos por WhatsApp (ej. &quot;pagué con la Signature&quot;).
                  </span>
                </div>

                {/* Selector de billetera solo si no viene fija */}
                {(!data.billeteraId && !data.tarjeta && bancarias.length > 0) && (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Cuenta bancaria asociada</label>
                    <div className={styles.billeterasCarouselScroller}>
                      <div className={styles.billeterasCarousel} ref={carouselRef}>
                        {bancarias.map((b: Billetera) => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={state.billeteraId === b.id}
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
                              onClick={() => {
                                dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })
                                dispatch({ type: 'SET_FIELD', field: 'moneda', value: b.moneda })
                              }}
                              title={`Seleccionar ${b.nombre}`}
                              aria-label={`Seleccionar ${b.nombre}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => close('tarjeta')}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 2: Ciclo y Límites ════════════════════ */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formBodyRef} className={styles.formBody}>
                {/* Header integrado directamente en el Body */}
                <div className={styles.formHeader}>
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className={styles.headerTitle}>Ciclo y Límites</h2>
                  <button type="button" className={styles.closeBtn} onClick={() => close('tarjeta')} title="Cerrar">
                    <X size={16} />
                  </button>
                </div>

                {/* Ciclo de Facturación (Dual Card) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Fechas del resumen</label>
                  <div className={styles.cycleDualCard}>
                    <div className={styles.cycleCol}>
                      <span className={styles.cycleColLabel}>Cierre de resumen</span>
                      <div className={styles.cycleValueRow}>
                        <span className={styles.cycleValuePrefix}>Día</span>
                        <input
                          id="dia-cierre"
                          type="number"
                          min={1}
                          max={28}
                          className={styles.cycleValueInput}
                          value={state.diaCierre}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'diaCierre', value: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.cycleDivider}>
                      <div className={styles.cycleDividerLine} />
                    </div>

                    <div className={styles.cycleCol}>
                      <span className={styles.cycleColLabel}>Vencimiento de pago</span>
                      <div className={styles.cycleValueRow}>
                        <span className={styles.cycleValuePrefix}>Día</span>
                        <input
                          id="dia-vencimiento"
                          type="number"
                          min={1}
                          max={28}
                          className={styles.cycleValueInput}
                          value={state.diaVencimiento}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'diaVencimiento', value: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Límite de Crédito (Componente Universal MontoInput) */}
                <div className={styles.formField}>
                  <MontoInput
                    label="Límite de crédito"
                    value={state.limiteCredito}
                    onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'limiteCredito', value: v })}
                    moneda={state.moneda}
                    allowDecimals
                  />
                </div>

                {/* Percepción Moneda Extranjera (Settings Row Card) */}
                <div className={styles.formField}>
                  <div className={styles.percepcionCard}>
                    <div className={styles.percepcionInfo}>
                      <span className={styles.percepcionTitle}>Recargo compras en USD</span>
                      <span className={styles.percepcionSubtitle}>
                        Percepción impositiva para gastos en el exterior
                      </span>
                    </div>
                    <div className={styles.percepcionBadgeInput}>
                      <input
                        id="percepcion-me"
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        className={styles.percepcionInputNumber}
                        value={state.percepcionMonedaExtranjera}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'percepcionMonedaExtranjera', value: Number(e.target.value) })}
                      />
                      <span className={styles.percepcionSuffixText}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>
                  Atrás
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 3: Diseño y Confirmación ════════════════════ */}
        {step === 3 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div ref={formBodyRef} className={styles.formBody}>
                {/* Header integrado directamente en el Body */}
                <div className={styles.formHeader}>
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className={styles.headerTitle}>Diseño y Confirmación</h2>
                  <button type="button" className={styles.closeBtn} onClick={() => close('tarjeta')} title="Cerrar">
                    <X size={16} />
                  </button>
                </div>

                {/* Preview de Tarjeta Física */}
                <div className={styles.previewSection}>
                  <div className={styles.previewWithArrows}>
                    <button
                      type="button"
                      className={styles.colorArrowLarge}
                      title="Color anterior"
                      onClick={() => {
                        const currentIndex = colorOptions.findIndex(c => c.value === state.color)
                        const idx = (currentIndex - 1 + colorOptions.length) % colorOptions.length
                        dispatch({ type: 'SET_FIELD', field: 'color', value: colorOptions[idx].value })
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <RealCardPreview
                      ultimos4={state.ultimos4}
                      red={state.red}
                      titular={titular}
                      diaCierre={Number(state.diaCierre) || 10}
                      diaVencimiento={Number(state.diaVencimiento) || 3}
                      color={state.color || colorOptions[0].value}
                      billeteraNombre={selectedBilletera?.nombre || ''}
                    />

                    <button
                      type="button"
                      className={styles.colorArrowLarge}
                      title="Siguiente color"
                      onClick={() => {
                        const currentIndex = colorOptions.findIndex(c => c.value === state.color)
                        const idx = (currentIndex + 1) % colorOptions.length
                        dispatch({ type: 'SET_FIELD', field: 'color', value: colorOptions[idx].value })
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Selector de Swatches de Color con elevación 3D Apple/FinTech */}
                  <div className={styles.colorSwatchesGrid}>
                    {colorOptions.map((c) => {
                      const isActive = state.color === c.value || (!state.color && c.id === 'banco')
                      return (
                        <button
                          key={c.id}
                          type="button"
                          data-active={isActive}
                          className={styles.colorSwatchBtn}
                          onClick={() => dispatch({ type: 'SET_FIELD', field: 'color', value: c.value })}
                          title={`Color ${c.label}`}
                          aria-label={`Seleccionar color ${c.label}`}
                        >
                          <div
                            className={styles.colorSwatchCircle}
                            style={{ background: c.value }}
                          />
                          <span className={styles.colorSwatchLabel}>{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Resumen Final de la Tarjeta */}
                <div className={styles.summaryBox}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLbl}>Tarjeta</span>
                    <span className={styles.summaryVal}>
                      •••• {state.ultimos4} ({RED_LABEL[state.red] || state.red})
                    </span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLbl}>Banco emisor</span>
                    <span className={styles.summaryVal}>{selectedBilletera?.nombre || 'Cuenta Bancaria'}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLbl}>Ciclo mensual</span>
                    <span className={styles.summaryVal}>
                      Cierre día {state.diaCierre} • Vence día {state.diaVencimiento}
                    </span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLbl}>Límite disponible</span>
                    <span className={styles.summaryVal}>
                      {state.limiteCredito ? formatMonto(state.limiteCredito, state.moneda) : 'Sin límite fijado'}
                    </span>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>
                  Atrás
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={state.loading}
                >
                  {state.loading
                    ? 'Guardando...'
                    : data.tarjeta
                      ? 'Actualizar tarjeta'
                      : 'Guardar tarjeta'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default TarjetaModal
