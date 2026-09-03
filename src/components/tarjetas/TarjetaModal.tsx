import { useReducer, useRef, useEffect } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { useAuth } from '@/hooks/useAuth'
import tarjetaService from '@/services/tarjeta.service'
import { TARJETA_COLORES, RED_LABEL } from '@/lib/utils/tarjeta.utils'
import { getBankById, findBankByNombre } from '@/lib/utils/billeteras.utils'
import type { Billetera, TarjetaCredito, TarjetaCreditoCreate } from '@/types'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import RealCardPreview from './RealCardPreview'
import styles from './TarjetaModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

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
  naranja: naranjaLogo
}

// Mapeo de colores premium a hex
const PREMIUM_COLORS_HEX: Record<string, string> = {
  'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)': '#D4AF37', // GOLD
  'linear-gradient(135deg, #E5E4E2 0%, #B4B4B4 100%)': '#E5E4E2', // PLATINUM
  'linear-gradient(135deg, #1A1A1B 0%, #000000 100%)': '#1A1A1B'  // BLACK
}

// Colores Premium
const PREMIUM_COLORS = {
  GOLD: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
  PLATINUM: 'linear-gradient(135deg, #E5E4E2 0%, #B4B4B4 100%)',
  BLACK: 'linear-gradient(135deg, #1A1A1B 0%, #000000 100%)'
}

const EFECTIVO_BG: Record<'ARS' | 'USD', string> = {
  ARS: 'linear-gradient(135deg, #166534 0%, #14532D 100%)',
  USD: 'linear-gradient(135deg, #155E75 0%, #164E63 100%)',
}

function getBilleteraColor(billetera: Billetera | undefined): string {
  if (!billetera) return TARJETA_COLORES[0]
  if (billetera.es_efectivo) return EFECTIVO_BG[billetera.moneda]
  
  const bank = billetera.bank_id ? getBankById(billetera.bank_id) : findBankByNombre(billetera.nombre)
  if (bank?.gradiente) return bank.gradiente
  if (bank?.colorPrimario) return bank.colorPrimario
  
  return 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
}

interface TarjetaModalState {
  ultimos4: string
  red: string
  billeteraId: string
  moneda: 'ARS' | 'USD'
  diaCierre: number | ''
  diaVencimiento: number | ''
  limiteCredito: number | null
  color: string | null
  loading: boolean
  error: string | null
}

type TarjetaModalAction =
  | { type: 'SET_FIELD'; field: keyof TarjetaModalState; value: TarjetaModalState[keyof TarjetaModalState] }
  | { type: 'RESET'; data: { tarjeta: TarjetaCredito | null, billeteras: Billetera[], defaultBilleteraId?: string } }

const initialState: TarjetaModalState = {
  ultimos4: '',
  red: 'visa',
  billeteraId: '',
  moneda: 'ARS',
  diaCierre: 10,
  diaVencimiento: 3,
  limiteCredito: null,
  color: null,
  loading: false,
  error: null
}

function tarjetaReducer(state: TarjetaModalState, action: TarjetaModalAction): TarjetaModalState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET': {
      if (action.data.tarjeta) {
        const t = action.data.tarjeta
        return {
          ...initialState,
          ultimos4: t.nombre.replace('•••• ', ''),
          red: t.red,
          billeteraId: t.billetera_id,
          moneda: t.moneda,
          diaCierre: t.dia_cierre,
          diaVencimiento: t.dia_vencimiento,
          limiteCredito: t.limite_credito,
          color: t.color || getBilleteraColor(action.data.billeteras.find(b => b.id === t.billetera_id))
        }
      }
      
      const bancarias = action.data.billeteras.filter(b => !b.es_efectivo)
      const defaultId = action.data.defaultBilleteraId || bancarias[0]?.id || ''
      const defaultColor = getBilleteraColor(action.data.billeteras.find(b => b.id === defaultId))
      
      return {
        ...initialState,
        billeteraId: defaultId,
        moneda: (action.data.billeteras.find(b => b.id === defaultId)?.moneda as 'ARS' | 'USD') || 'ARS',
        color: defaultColor
      }
    }
    default:
      return state
  }
}



export default function TarjetaModal() {
  const { getData, close } = useModal()
  const data = getData('tarjeta')
  const { showToast } = useToast()
  const { usuario } = useAuth()
  
  const [state, dispatch] = useReducer(tarjetaReducer, initialState)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data) {
      dispatch({ type: 'RESET', data: { 
        tarjeta: data.tarjeta, 
        billeteras: data.billeteras,
        defaultBilleteraId: data.billeteraId 
      } })
    }
  }, [data])

  if (!data) return null

  const handleSubmit = async () => {
    dispatch({ type: 'SET_FIELD', field: 'loading', value: true })
    dispatch({ type: 'SET_FIELD', field: 'error', value: null })

    const diaCierreNum = Number(state.diaCierre)
    const diaVencimientoNum = Number(state.diaVencimiento)

    if (!state.ultimos4 || state.ultimos4.length !== 4) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'Los últimos 4 dígitos de la tarjeta son obligatorios.' })
      return
    }

    if (!state.billeteraId) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'Seleccioná la billetera asociada a la tarjeta.' })
      return
    }

    if (!Number.isInteger(diaCierreNum) || diaCierreNum < 1 || diaCierreNum > 28) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'El día de cierre debe estar entre 1 y 28.' })
      return
    }

    if (!Number.isInteger(diaVencimientoNum) || diaVencimientoNum < 1 || diaVencimientoNum > 28) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'El día de vencimiento debe estar entre 1 y 28.' })
      return
    }

    if (state.limiteCredito !== null && state.limiteCredito !== undefined && state.limiteCredito <= 0) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: 'El límite de crédito debe ser mayor a cero si se indica.' })
      return
    }

    try {
      // Convertir color a hex si es un gradiente
      let colorToSend: string | undefined = undefined
      if (state.color) {
        // Primero intentar con el mapeo de premium colors
        colorToSend = PREMIUM_COLORS_HEX[state.color]
        
        // Si no está en el mapeo, intentar extraer hex del gradiente
        if (!colorToSend) {
          // Extraer primer color hex del gradiente usando regex
          const hexMatch = state.color.match(/#[0-9A-Fa-f]{6}/g)
          colorToSend = hexMatch ? hexMatch[0] : state.color
        }
        
        // Si aún tiene más de 7 caracteres, solo tomar los primeros 7
        if (colorToSend && colorToSend.length > 7) {
          colorToSend = colorToSend.substring(0, 7)
        }
      }

      const payload: TarjetaCreditoCreate = {
        nombre: `•••• ${state.ultimos4}`,
        red: state.red,
        billetera_id: state.billeteraId,
        moneda: state.moneda,
        dia_cierre: diaCierreNum,
        dia_vencimiento: diaVencimientoNum,
        limite_credito: state.limiteCredito !== null && state.limiteCredito !== undefined ? state.limiteCredito : undefined,
        color: colorToSend
      }

      console.log('Payload enviando:', payload)

      if (data.tarjeta) {
        const res = await tarjetaService.updateTarjeta(data.tarjeta.id, payload)
        if (res?.cuotas_recalculadas && res.cuotas_recalculadas > 0) {
          showToast(
            `Tarjeta actualizada. Se recalcularon las fechas de ${res.cuotas_recalculadas} ${res.cuotas_recalculadas === 1 ? 'cuota futura' : 'cuotas futuras'}.`,
            'success'
          )
        } else {
          showToast('Tarjeta actualizada', 'success')
        }
      } else {
        await tarjetaService.createTarjeta(payload)
        showToast('Tarjeta guardada', 'success')
      }

      data.onSuccess()
      close('tarjeta')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } | string } };
      const errorData = axiosError.response?.data;
      console.error('Error al guardar tarjeta:', errorData)
      
      let errorMsg = 'Error al guardar tarjeta';
      if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (errorData && typeof errorData === 'object' && 'detail' in errorData && typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      } else if (errorData) {
        errorMsg = JSON.stringify(errorData);
      }
      
      dispatch({ type: 'SET_FIELD', field: 'error', value: errorMsg })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'loading', value: false })
    }
  }

  const titular = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim().toUpperCase() : 'TITULAR'
  const bancarias = data.billeteras.filter((b: Billetera) => !b.es_efectivo)
  const selectedBilletera = data.billeteras.find((b: Billetera) => b.id === state.billeteraId)

  const isValid = state.ultimos4.length === 4 && 
                  state.billeteraId !== '' && 
                  state.diaCierre !== '' && 
                  state.diaVencimiento !== ''

  return (
    <Modal
      isOpen={true}
      onClose={() => close('tarjeta')}
      showHeader={false}
      noPadding={true}
      className={styles.baseModalOverride}
      size="md"
    >
      <form 
        className={styles.modal}
        onSubmit={(e) => {
          e.preventDefault()
          if (isValid && !state.loading) handleSubmit()
        }}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleLarge}>
            {data.tarjeta ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
          </div>
          <button type="button" className={styles.closeBtn} onClick={() => close('tarjeta')} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className={styles.formBody}>
          <div className={styles.stepWrapper}>
            <div className={styles.formSection}>
              
              {/* FILA 1: 4 Digitos + Cierre + Vencimiento */}
              <div className={styles.inputGrid3}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Últimos 4</label>
                  <input
                    className={styles.fieldInputCenter}
                    value={state.ultimos4}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      dispatch({ type: 'SET_FIELD', field: 'ultimos4', value: val })
                    }}
                    placeholder="0000"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="dia-cierre">Día Cierre</label>
                  <input
                    id="dia-cierre"
                    type="number"
                    min={1}
                    max={28}
                    className={styles.fieldInputCenter}
                    value={state.diaCierre}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'diaCierre', value: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="dia-vencimiento">Día Vence</label>
                  <input
                    id="dia-vencimiento"
                    type="number"
                    min={1}
                    max={28}
                    className={styles.fieldInputCenter}
                    value={state.diaVencimiento}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'diaVencimiento', value: e.target.value })}
                  />
                </div>
              </div>

              {/* FILA 2: Límite */}
              <MontoInput
                label="Límite de crédito"
                optional
                value={state.limiteCredito}
                onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'limiteCredito', value: v })}
                moneda={state.moneda}
                allowDecimals
                compact
              />

              {/* FILA 3: Red */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Red de la tarjeta</label>
                <div className={styles.redGrid}>
                  {Object.entries(RED_LABEL).map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      className={`${styles.redBtn} ${state.red === id ? styles.redBtnActive : ''}`}
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'red', value: id })}
                    >
                      {RED_LOGOS[id] ? (
                        <img 
                          src={RED_LOGOS[id]} 
                          alt={label} 
                          className={styles.networkLogoSmall}
                        />
                      ) : (
                        label
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {(!data.billeteraId && !data.tarjeta) && (
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Billetera asociada</label>
                  {bancarias.length > 0 ? (
                    <div className={styles.billeterasCarousel} ref={carouselRef}>
                      {bancarias.map((b: Billetera) => (
                        <div
                          key={b.id}
                          className={styles.billeteraSelectWrap}
                          data-active={state.billeteraId === b.id}
                          onClick={() => {
                            dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: b.id })
                            dispatch({ type: 'SET_FIELD', field: 'moneda', value: b.moneda })
                          }}
                        >
                          <BilleteraCard billetera={b} disableNavigation={true} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyBilleteras}>
                      No tenés billeteras bancarias. Creá una primero.
                    </div>
                  )}
                </div>
              )}

              {/* FILA 4: Preview y Color con Flechas */}
              <div className={styles.previewSection}>
                <div className={styles.previewWithArrows}>
                  <button 
                    type="button"
                    className={styles.colorArrowLarge}
                    title="Color anterior"
                    onClick={() => {
                      const allColors = [
                        { value: TARJETA_COLORES[0] },
                        { value: getBilleteraColor(selectedBilletera) },
                        { value: PREMIUM_COLORS.GOLD },
                        { value: PREMIUM_COLORS.PLATINUM },
                        { value: PREMIUM_COLORS.BLACK }
                      ]
                      const currentIndex = allColors.findIndex(c => c.value === state.color)
                      const idx = (currentIndex - 1 + allColors.length) % allColors.length
                      dispatch({ type: 'SET_FIELD', field: 'color', value: allColors[idx].value })
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <RealCardPreview 
                    ultimos4={state.ultimos4}
                    red={state.red}
                    titular={titular}
                    diaCierre={Number(state.diaCierre) || 10}
                    diaVencimiento={Number(state.diaVencimiento) || 3}
                    color={state.color || TARJETA_COLORES[0]}
                    billeteraNombre={selectedBilletera?.nombre || ''}
                  />
                  
                  <button 
                    type="button"
                    className={styles.colorArrowLarge}
                    title="Siguiente color"
                    onClick={() => {
                      const allColors = [
                        { value: TARJETA_COLORES[0] },
                        { value: getBilleteraColor(selectedBilletera) },
                        { value: PREMIUM_COLORS.GOLD },
                        { value: PREMIUM_COLORS.PLATINUM },
                        { value: PREMIUM_COLORS.BLACK }
                      ]
                      const currentIndex = allColors.findIndex(c => c.value === state.color)
                      const idx = (currentIndex + 1) % allColors.length
                      dispatch({ type: 'SET_FIELD', field: 'color', value: allColors[idx].value })
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          <button type="button" className={styles.btnCancel} onClick={() => close('tarjeta')}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={!isValid || state.loading}
          >
            {state.loading ? 'Guardando...' : data.tarjeta ? 'Actualizar tarjeta' : 'Guardar tarjeta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
