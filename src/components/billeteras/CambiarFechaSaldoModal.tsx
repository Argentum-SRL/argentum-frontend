import { useState, useEffect, type FormEvent } from 'react'
import { X, Wallet } from '@/components/ui/icons'
import { LunarLoader, DateInput } from '@/components/ui'
import type { Billetera, PrevisualizarFechaSaldoResponse } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import billeteraService from '@/services/billetera.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './CambiarFechaSaldoModal.module.css'

interface CambiarFechaSaldoModalProps {
  billetera: Billetera | null
  isOpen: boolean
  onClose: () => void
  onActualizado: () => void
}

function parseIsoDate(isoDate: string): [number, number, number] {
  const parts = isoDate.split('T')[0].split('-').map(Number)
  return [parts[0], parts[1], parts[2]]
}

function formatDateToIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function subtractDaysFromIso(isoDate: string, days: number): string {
  const [y, m, d] = parseIsoDate(isoDate)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - days)
  return formatDateToIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

function todayIso(): string {
  const d = new Date()
  return formatDateToIso(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function formatFechaDDMMAAAA(fechaIso: string): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return clean
}

export default function CambiarFechaSaldoModal({
  billetera,
  isOpen,
  onClose,
  onActualizado,
}: CambiarFechaSaldoModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [fechaNueva, setFechaNueva] = useState<string>('')
  const [preview, setPreview] = useState<PrevisualizarFechaSaldoResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const fechaEfectiva = billetera?.fecha_saldo_efectiva || todayIso()
  const maxFecha = subtractDaysFromIso(fechaEfectiva, 1)
  const minFecha = subtractDaysFromIso(todayIso(), 730)

  // Validación derivada sin llamar a setState en render ni en effect
  const validationError = (() => {
    if (!fechaNueva) return null
    if (fechaNueva > maxFecha) return 'Solo se puede mover la fecha hacia atrás.'
    if (fechaNueva < minFecha) return 'La fecha del saldo no puede ser de hace más de 2 años.'
    return null
  })()

  const error = validationError || apiError
  const activePreview = !validationError && preview && preview.fecha_nueva === fechaNueva ? preview : null

  // Reset al abrir
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setFechaNueva(maxFecha)
      setPreview(null)
      setApiError(null)
      setIsLoadingPreview(false)
      setIsSubmitting(false)
    }
  }

  // Previsualización con debounce de 300 ms (solo llamadas asíncronas dentro del timer)
  useEffect(() => {
    if (!isOpen || !billetera || !fechaNueva || validationError) {
      return
    }

    let isCancelled = false
    const timer = setTimeout(async () => {
      setIsLoadingPreview(true)
      try {
        const res = await billeteraService.previsualizarFechaSaldo(billetera.id, fechaNueva)
        if (!isCancelled) {
          setPreview(res)
          setApiError(null)
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setPreview(null)
          setApiError(getErrorMessage(err, 'No se pudo obtener la vista previa.'))
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPreview(false)
        }
      }
    }, 300)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, billetera, fechaNueva, validationError])

  if (!isOpen || !billetera) return null

  const handleCambiar = async (e: FormEvent) => {
    e.preventDefault()
    if (!billetera || !activePreview || isLoadingPreview || isSubmitting || Boolean(error)) return

    setIsSubmitting(true)
    setApiError(null)
    try {
      await billeteraService.cambiarFechaSaldo(billetera.id, fechaNueva)
      sileo.success({ title: 'Listo, fecha del saldo cambiada.' })
      onActualizado()
      onClose()
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'No se pudo cambiar la fecha del saldo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCambiarDisabled = !activePreview || isLoadingPreview || isSubmitting || Boolean(error)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={styles.modalCambiarFechaSaldo}
      noPadding
      showHeader={false}
      autoHeight
      ariaLabel="Fecha del saldo"
    >
      <form onSubmit={handleCambiar} className={styles.modalContainer} data-modal-frame>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Fecha del saldo</h2>
            <div className={styles.headerSubtitleRow}>
              <span className={styles.billeteraBadge}>
                <Wallet size={12} />
                <span>{billetera.nombre}</span>
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
        <div className={styles.modalBody} data-modal-stack>
          <div className={styles.fieldBlock} data-modal-block>
            <p className={styles.descriptionText}>
              Tu saldo es del {formatFechaDDMMAAAA(fechaEfectiva)}. Si era de antes, elegí esa fecha.
            </p>
            <div data-modal-field>
              <DateInput
                id="cambiar-fecha-saldo"
                value={fechaNueva}
                max={maxFecha}
                min={minFecha}
                onChange={(val) => setFechaNueva(val)}
              />
            </div>
          </div>

          <div className={styles.previewBox}>
            {isLoadingPreview ? (
              <div className={styles.previewLoading}>
                <LunarLoader size={14} />
                <span>Calculando vista previa...</span>
              </div>
            ) : error ? (
              <p className={styles.previewError}>{error}</p>
            ) : activePreview ? (
              <p className={styles.previewText}>
                Tu saldo pasaría de {formatMonto(activePreview.saldo_actual, billetera.moneda)} a {formatMonto(activePreview.saldo_nuevo, billetera.moneda)} ({activePreview.cantidad_movimientos} movimientos).
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isCambiarDisabled}
          >
            {isSubmitting ? (
              <>
                <LunarLoader size={16} />
                <span>Cambiando...</span>
              </>
            ) : (
              'Cambiar'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
