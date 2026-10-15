import React, { useState } from 'react'
import { X } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import tarjetaService from '@/services/tarjeta.service'
import styles from './FechasResumenModal.module.css'

export interface FechasResumenModalProps {
  isOpen: boolean
  onClose: () => void
  tarjetaId: string
  fechaCierreInicial?: string
  fechaVencimientoInicial?: string
  onSuccess: () => void
}

export const FechasResumenModal: React.FC<FechasResumenModalProps> = ({
  isOpen,
  onClose,
  tarjetaId,
  fechaCierreInicial = '',
  fechaVencimientoInicial = '',
  onSuccess,
}) => {
  const currentKey = `${isOpen}-${fechaCierreInicial}-${fechaVencimientoInicial}`
  const [prevKey, setPrevKey] = useState(currentKey)
  const [fechaCierre, setFechaCierre] = useState(
    fechaCierreInicial ? fechaCierreInicial.split('T')[0] : ''
  )
  const [fechaVencimiento, setFechaVencimiento] = useState(
    fechaVencimientoInicial ? fechaVencimientoInicial.split('T')[0] : ''
  )
  const [saving, setSaving] = useState(false)

  if (currentKey !== prevKey) {
    setPrevKey(currentKey)
    if (isOpen) {
      setFechaCierre(fechaCierreInicial ? fechaCierreInicial.split('T')[0] : '')
      setFechaVencimiento(fechaVencimientoInicial ? fechaVencimientoInicial.split('T')[0] : '')
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fechaCierre) {
      sileo.error({ title: 'Ingresá la fecha de cierre' })
      return
    }
    if (!fechaVencimiento) {
      sileo.error({ title: 'Ingresá la fecha de vencimiento' })
      return
    }

    const diffMs = new Date(fechaVencimiento).getTime() - new Date(fechaCierre).getTime()
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (fechaVencimiento <= fechaCierre || diffDias > 31) {
      sileo.error({ title: 'El vencimiento tiene que ser posterior al cierre y dentro del mes siguiente.' })
      return
    }

    setSaving(true)
    try {
      await tarjetaService.actualizarFechasResumen(tarjetaId, {
        fecha_cierre: fechaCierre,
        fecha_vencimiento: fechaVencimiento,
      })
      sileo.success({ title: 'Listo, actualizamos las fechas de este resumen.' })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('Error al actualizar fechas del resumen:', err)
      sileo.error({
        title: getErrorMessage(err, 'Error al actualizar las fechas del resumen.'),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      ariaLabel="Cambiar fechas de este resumen"
    >
      <form className={styles.modalContainer} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Cambiar fechas de este resumen</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <p className={styles.modalDescription}>
          Modificá las fechas reales para este período. Se recalcularán las cuotas que correspondan a este resumen.
        </p>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="fecha-cierre-resumen">
              Fecha de cierre
            </label>
            <input
              id="fecha-cierre-resumen"
              type="date"
              className={styles.dateInput}
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="fecha-vencimiento-resumen">
              Fecha de vencimiento
            </label>
            <input
              id="fecha-vencimiento-resumen"
              type="date"
              className={styles.dateInput}
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar fechas'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default FechasResumenModal
