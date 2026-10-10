import { useState, type FormEvent } from 'react'
import { X, Wallet, Check, AlertTriangle, CheckCircle2, ArrowLeft } from '@/components/ui/icons'
import { LunarLoader } from '@/components/ui'
import type { Billetera, ControlSaldoPreview } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import billeteraService from '@/services/billetera.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
import styles from './ActualizarSaldoModal.module.css'

interface ActualizarSaldoModalProps {
  billetera: Billetera | null
  isOpen: boolean
  onClose: () => void
  onActualizado: () => void
  onCargarMovimiento: (tipo: 'egreso' | 'ingreso') => void
}

function formatDiaMes(fechaStr: string): string {
  if (!fechaStr) return ''
  const clean = fechaStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return clean
}

export default function ActualizarSaldoModal({
  billetera,
  isOpen,
  onClose,
  onActualizado,
  onCargarMovimiento,
}: ActualizarSaldoModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [step, setStep] = useState<1 | 2>(1)
  const [monto, setMonto] = useState<number | null>(null)
  const [preview, setPreview] = useState<ControlSaldoPreview | null>(null)
  const [incluirRendimiento, setIncluirRendimiento] = useState<boolean>(true)
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Reset state when modal opens
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setStep(1)
      setMonto(null)
      setPreview(null)
      setIncluirRendimiento(true)
      setIsLoadingPreview(false)
      setIsSubmitting(false)
    }
  }

  const {
    headerRef,
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    containerStyle,
  } = useAdaptiveModalHeight({
    enabled: isOpen && !!billetera,
    deps: [step, monto, preview, incluirRendimiento, isLoadingPreview, isSubmitting],
    extraPadding: 8,
    maxHeightRatio: 0.90,
  })

  if (!isOpen || !billetera) return null

  const nombreBilletera = billetera.nombre

  const isMontoValid = monto !== null && !isNaN(monto) && monto >= 0

  const handleRevisar = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!isMontoValid || monto === null || isLoadingPreview) return

    setIsLoadingPreview(true)
    try {
      const data = await billeteraService.getControlSaldo(billetera.id, monto)
      setPreview(data)
      setIncluirRendimiento(true)
      setStep(2)
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos verificar el saldo. Intentá de nuevo.'),
      })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleAjustarSaldo = async () => {
    if (!preview || isSubmitting) return

    setIsSubmitting(true)
    try {
      const rendimientoToSend =
        preview.diferencia !== 0 &&
        incluirRendimiento &&
        preview.rendimiento_propuesto != null &&
        preview.rendimiento_propuesto > 0
          ? preview.rendimiento_propuesto
          : null

      await billeteraService.actualizarSaldo(billetera.id, {
        saldo_declarado: preview.saldo_declarado,
        rendimiento: rendimientoToSend,
      })

      sileo.success({
        title: preview.diferencia === 0 ? 'Control guardado.' : 'Saldo actualizado.',
      })
      onActualizado()
      onClose()
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos actualizar el saldo.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCargarMovimientoClick = () => {
    if (!preview) return
    const tipo = preview.diferencia < 0 ? 'egreso' : 'ingreso'
    onCargarMovimiento(tipo)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={styles.modalActualizarSaldo}
      noPadding
      showHeader={false}
      autoHeight
      ariaLabel="Actualizar saldo"
    >
      <div className={styles.modalContainer} style={containerStyle}>
        {/* Header */}
        <div ref={headerRef} className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Actualizar saldo</h2>
            <div className={styles.headerSubtitleRow}>
              <span className={styles.billeteraBadge}>
                <Wallet size={12} />
                <span>{nombreBilletera}</span>
              </span>
              <span className={styles.monedaBadge}>
                {billetera.moneda === 'USD' ? 'Dólares' : 'Pesos'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div ref={formBodyRef} className={styles.modalBody}>
          {/* Paso 1: Ingreso de monto */}
          {step === 1 && (
            <form id="actualizar-saldo-form" onSubmit={handleRevisar} className={styles.formFields}>
              <div className={styles.montoHeroSection}>
                <MontoInput
                  label={`¿Cuánto tenés hoy en ${nombreBilletera}?`}
                  value={monto}
                  onChange={setMonto}
                  moneda={billetera.moneda}
                  allowDecimals
                  placeholder="0"
                  autoFocus
                  disabled={isLoadingPreview}
                />
              </div>
            </form>
          )}

          {/* Paso 2: Revisión y ayuda */}
          {step === 2 && preview && (
            <div className={styles.formFields}>
              {preview.diferencia === 0 ? (
                <div className={styles.matchCard}>
                  <div className={styles.matchIconWrap}>
                    <CheckCircle2 size={24} className={styles.matchIcon} />
                  </div>
                  <div className={styles.matchTextContent}>
                    <h3 className={styles.matchTitle}>Coincide con lo que tenés cargado.</h3>
                    <p className={styles.matchSubtitle}>
                      Guardamos este control: nos ayuda a saber qué tan completos están tus datos.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Resumen de diferencia / Breakdown Card */}
                  <div className={styles.diffBreakdownCard}>
                    <div className={styles.diffRow}>
                      <span className={styles.diffLabel}>En Argentum figuran</span>
                      <span className={styles.diffVal}>
                        {formatMonto(preview.saldo_registrado, billetera.moneda)}
                      </span>
                    </div>
                    <div className={styles.diffRow}>
                      <span className={styles.diffLabel}>Vos tenés</span>
                      <span className={styles.diffValBold}>
                        {formatMonto(preview.saldo_declarado, billetera.moneda)}
                      </span>
                    </div>

                    <div className={styles.diffDivider} />

                    <div className={styles.diffStatusRow}>
                      <span className={styles.diffStatusLabel}>Diferencia</span>
                      <span
                        className={
                          preview.diferencia < 0
                            ? styles.diffMissingBadge
                            : styles.diffSurplusBadge
                        }
                      >
                        {preview.diferencia < 0
                          ? `Faltan ${formatMonto(Math.abs(preview.diferencia), billetera.moneda)}`
                          : `Sobran ${formatMonto(Math.abs(preview.diferencia), billetera.moneda)}`}
                      </span>
                    </div>
                  </div>

                  {/* Rendimiento propuesto si existe */}
                  {preview.rendimiento_propuesto != null && preview.rendimiento_propuesto > 0 && (
                    <div className={styles.rendimientoCard}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={incluirRendimiento}
                          onChange={(e) => setIncluirRendimiento(e.target.checked)}
                        />
                        <span className={styles.checkboxText}>
                          Una parte puede ser lo que te rindió: estimamos{' '}
                          <strong>{formatMonto(preview.rendimiento_propuesto, billetera.moneda)}</strong>.
                          Anotarlo como rendimiento.
                        </span>
                      </label>
                      {incluirRendimiento && preview.resto_con_rendimiento != null && (
                        <p className={styles.restoNote}>
                          El resto, <strong>{formatMonto(Math.abs(preview.resto_con_rendimiento), billetera.moneda)}</strong>, queda como ajuste.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bloque de ayuda si la diferencia es grande */}
                  {preview.es_grande && (
                    <div className={styles.ayudaCard}>
                      <div className={styles.ayudaHeader}>
                        <AlertTriangle size={16} className={styles.ayudaIcon} />
                        <span className={styles.ayudaTitle}>Antes de ajustar, fijate:</span>
                      </div>
                      {preview.diferencia < 0 ? (
                        <div className={styles.ayudaContent}>
                          <p className={styles.ayudaSubtitle}>Puede ser algo que no cargaste.</p>
                          {(preview.huecos.length > 0 || preview.ultimo_movimiento) && (
                            <ul className={styles.ayudaList}>
                              {preview.huecos.map((h, i) => (
                                <li key={i} className={styles.ayudaItem}>
                                  {h.desde === h.hasta
                                    ? `No cargaste nada en ${nombreBilletera} el ${formatDiaMes(h.desde)}.`
                                    : `No cargaste nada en ${nombreBilletera} entre el ${formatDiaMes(h.desde)} y el ${formatDiaMes(h.hasta)}.`}
                                </li>
                              ))}
                              {preview.ultimo_movimiento && (
                                <li className={styles.ayudaItem}>
                                  Lo último que cargaste en {nombreBilletera} es del {formatDiaMes(preview.ultimo_movimiento)}.
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <div className={styles.ayudaContent}>
                          <p className={styles.ayudaSubtitle}>Puede ser un ingreso que no cargaste o un gasto cargado dos veces.</p>
                          {preview.posibles_duplicados.length > 0 && (
                            <ul className={styles.ayudaList}>
                              {preview.posibles_duplicados.map((dup, i) => (
                                <li key={i} className={styles.ayudaItem}>
                                  {dup.cantidad} gastos de {formatMonto(dup.monto, billetera.moneda)} el {formatDiaMes(dup.fecha)}:{' '}
                                  {dup.descripciones.join(' y ')}.
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div ref={formFooterRef} className={styles.modalFooter}>
          {step === 1 && (
            <>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isLoadingPreview}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="actualizar-saldo-form"
                className={styles.submitBtn}
                disabled={!isMontoValid || isLoadingPreview}
              >
                {isLoadingPreview ? (
                  <>
                    <LunarLoader size={16} />
                    <span>Revisando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    <span>Revisar</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && preview && (
            <div className={styles.footerStep2Container}>
              {preview.diferencia === 0 ? (
                <div className={styles.footerRow}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={16} />
                    <span>Volver</span>
                  </button>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={handleAjustarSaldo}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LunarLoader size={16} />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        <span>Listo</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.footerRow}>
                    {preview.es_grande ? (
                      <>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={handleAjustarSaldo}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <LunarLoader size={16} /> : 'Ajustar el saldo'}
                        </button>
                        <button
                          type="button"
                          className={styles.submitBtn}
                          onClick={handleCargarMovimientoClick}
                        >
                          <span>{preview.diferencia < 0 ? 'Cargar lo que falta' : 'Cargar un ingreso'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={handleCargarMovimientoClick}
                        >
                          <span>{preview.diferencia < 0 ? 'Cargar lo que falta' : 'Cargar un ingreso'}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.submitBtn}
                          onClick={handleAjustarSaldo}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <LunarLoader size={16} />
                              <span>Ajustando...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} strokeWidth={2.5} />
                              <span>Ajustar el saldo</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  <p className={styles.footerHelpText}>
                    El ajuste corrige el saldo, pero no cuenta como gasto ni como ingreso.
                  </p>
                  <button
                    type="button"
                    className={styles.volverLinkBtn}
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
