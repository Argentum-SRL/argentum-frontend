import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, ArrowRightLeft, ChevronLeft } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Billetera } from '@/types'
import transferenciaService from '@/services/transferencia.service'
import { useToast } from '@/hooks/useToast'
import styles from './TransferenciaModal.module.css'
import { DateInput } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import BilleteraCard from '@/components/billeteras/BilleteraCard'

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  billeteras: Billetera[]
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const TransferenciaModal: React.FC<TransferenciaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  billeteras
}) => {
  const { showToast } = useToast()

  const [step, setStep] = useState<1 | 2>(1)

  const [monto, setMonto] = useState<number | null>(null)
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [fecha, setFecha] = useState(todayLocal())
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animClass, setAnimClass] = useState('')

  const [billeteraOrigenId, setBilleteraOrigenId] = useState(() => {
    const activeForCurrency = billeteras.filter(b => b.estado === 'activa' && b.moneda === 'ARS')
    if (activeForCurrency.length > 0) {
      const bestOrigen = activeForCurrency.find(b => b.es_principal && b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.es_principal) ||
        activeForCurrency[0]
      return bestOrigen.id
    }
    return ''
  })

  const [billeteraDestinoId, setBilleteraDestinoId] = useState(() => {
    const activeForCurrency = billeteras.filter(b => b.estado === 'activa' && b.moneda === 'ARS')
    if (activeForCurrency.length > 0) {
      const bestOrigen = activeForCurrency.find(b => b.es_principal && b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.es_principal) ||
        activeForCurrency[0]
      
      const possibleDestinations = activeForCurrency.filter(b => b.id !== bestOrigen.id)
      if (possibleDestinations.length > 0) {
        const bestDest = possibleDestinations.find(b => b.es_principal) || possibleDestinations[0]
        return bestDest.id
      }
    }
    return ''
  })

  const carouselOrigenRef = useRef<HTMLDivElement>(null)
  const carouselDestinoRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())



  // Handle auto-scroll for active cards in carousels
  useEffect(() => {
    if (!isOpen) return
    const idToScroll = step === 1 ? billeteraOrigenId : billeteraDestinoId
    if (!idToScroll) return

    const timer = setTimeout(() => {
      const card = cardRefs.current.get(idToScroll)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [billeteraOrigenId, billeteraDestinoId, isOpen, step])

  const activeWalletsOfCurrency = useMemo(() => {
    return billeteras.filter(b => b.estado === 'activa' && b.moneda === moneda)
  }, [billeteras, moneda])

  const walletsOrigenCarousel = useMemo(() => {
    return [...activeWalletsOfCurrency].sort((a, b) => {
      if (a.es_principal && !b.es_principal) return -1
      if (!a.es_principal && b.es_principal) return 1
      return b.saldo_actual - a.saldo_actual
    })
  }, [activeWalletsOfCurrency])

  const walletsDestinoCarousel = useMemo(() => {
    return activeWalletsOfCurrency
      .filter(b => b.id !== billeteraOrigenId)
      .sort((a, b) => {
        if (a.es_principal && !b.es_principal) return -1
        if (!a.es_principal && b.es_principal) return 1
        return b.saldo_actual - a.saldo_actual
      })
  }, [activeWalletsOfCurrency, billeteraOrigenId])

  const selectOrigen = (id: string) => {
    setBilleteraOrigenId(id)
    if (id === billeteraDestinoId) {
      const firstAvailableDest = activeWalletsOfCurrency.find(b => b.id !== id)
      setBilleteraDestinoId(firstAvailableDest?.id || '')
    }
  }

  const goNext = () => {
    if (monto === null || isNaN(monto) || monto <= 0) {
      showToast('Ingresá un monto mayor a 0', 'error')
      return
    }
    if (!billeteraOrigenId) {
      showToast('Seleccioná la cuenta de origen', 'error')
      return
    }
    setAnimClass(styles.slideForward)
    setStep(2)
  }

  const goBack = () => {
    setAnimClass(styles.slideBack)
    setStep(1)
  }

  const handleMonedaToggle = (m: 'ARS' | 'USD') => {
    setMoneda(m)
    const activeForCurrency = billeteras.filter(b => b.estado === 'activa' && b.moneda === m)
    if (activeForCurrency.length > 0) {
      const bestOrigen = activeForCurrency.find(b => b.es_principal && b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.saldo_actual > 0) ||
        activeForCurrency.find(b => b.es_principal) ||
        activeForCurrency[0]
      
      setBilleteraOrigenId(bestOrigen.id)
      
      const possibleDestinations = activeForCurrency.filter(b => b.id !== bestOrigen.id)
      if (possibleDestinations.length > 0) {
        const bestDest = possibleDestinations.find(b => b.es_principal) || possibleDestinations[0]
        setBilleteraDestinoId(bestDest.id)
      } else {
        setBilleteraDestinoId('')
      }
    } else {
      setBilleteraOrigenId('')
      setBilleteraDestinoId('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!billeteraOrigenId) {
      showToast('Seleccioná la cuenta de origen', 'error')
      return
    }
    if (!billeteraDestinoId) {
      showToast('Seleccioná la cuenta de destino', 'error')
      return
    }
    if (billeteraOrigenId === billeteraDestinoId) {
      showToast('La cuenta de origen y destino no pueden ser la misma', 'error')
      return
    }
    if (monto === null || isNaN(monto) || monto <= 0) {
      showToast('Ingresá un monto mayor a 0', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await transferenciaService.createTransferencia({
        billetera_origen_id: billeteraOrigenId,
        billetera_destino_id: billeteraDestinoId,
        monto: Number(monto),
        moneda,
        fecha: fecha,
        notas: notas.trim() || null
      })

      showToast('Transferencia realizada con éxito', 'success')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al procesar la transferencia.'
      showToast(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Transferencia interna">
      <div className={styles.slidesContainer}>

        {/* ── Step Indicator Dots ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1: Monto y Cuenta Origen ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>Pasar plata entre cuentas</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div className={styles.formBody}>
                {/* Hero monto */}
                <MontoInput
                  value={monto}
                  onChange={setMonto}
                  moneda={moneda}
                  onMonedaChange={handleMonedaToggle}
                  autoFocus
                  allowDecimals
                />

                {/* Origen */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Desde (Cuenta origen)</label>
                  <div className={styles.billeterasCarouselScroller}>
                    <div className={styles.billeterasCarousel} ref={carouselOrigenRef}>
                      {walletsOrigenCarousel.length === 0 ? (
                        <p className={styles.noTarjetas}>No hay billeteras en {moneda}.</p>
                      ) : (
                        walletsOrigenCarousel.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={billeteraOrigenId === b.id}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el)
                              else cardRefs.current.delete(b.id)
                            }}
                          >
                            <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => selectOrigen(b.id)}
                              title={`Seleccionar billetera ${b.nombre}`}
                              aria-label={`Seleccionar billetera ${b.nombre}`}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {activeWalletsOfCurrency.length < 2 && (
                  <p className={styles.noCuentasWarning}>
                    Necesitás al menos dos cuentas en {moneda} para transferir.
                  </p>
                )}
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={activeWalletsOfCurrency.length < 2 || !monto || monto <= 0}
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 2: Cuenta Destino y Detalles ════════════════════ */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={handleSubmit}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás">
                  <ChevronLeft size={20} />
                </button>
                <h2 className={styles.headerTitle}>Pasar plata entre cuentas</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar">
                  <X size={16} />
                </button>
              </div>

              <div className={styles.formBody}>
                {/* Destino */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Hacia (Cuenta destino)</label>
                  <div className={styles.billeterasCarouselScroller}>
                    <div className={styles.billeterasCarousel} ref={carouselDestinoRef}>
                      {walletsDestinoCarousel.length === 0 ? (
                        <p className={styles.noTarjetas}>No hay otras billeteras en {moneda}.</p>
                      ) : (
                        walletsDestinoCarousel.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={billeteraDestinoId === b.id}
                            ref={(el) => {
                              if (el) cardRefs.current.set(b.id, el)
                              else cardRefs.current.delete(b.id)
                            }}
                          >
                            <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => setBilleteraDestinoId(b.id)}
                              title={`Seleccionar billetera ${b.nombre}`}
                              aria-label={`Seleccionar billetera ${b.nombre}`}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Fecha */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="tf-fecha">Fecha</label>
                  <DateInput
                    id="tf-fecha"
                    className={styles.fieldInput}
                    value={fecha}
                    onChange={setFecha}
                    required
                  />
                </div>

                {/* Notas */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="tf-notas">
                    Notas <span className={styles.fieldOptional}>(opcional)</span>
                  </label>
                  <textarea
                    id="tf-notas"
                    className={`${styles.fieldInput} ${styles.notesTextarea}`}
                    placeholder="Ej: Traspaso de fondos..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack} disabled={isSubmitting}>
                  Atrás
                </button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !billeteraDestinoId}>
                  <ArrowRightLeft size={16} />
                  {isSubmitting ? 'Procesando...' : 'Pasar plata'}
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
