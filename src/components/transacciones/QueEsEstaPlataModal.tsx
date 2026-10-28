import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import ModalFooter from '@/components/ui/Modal/ModalFooter'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { Trash2 } from '@/components/ui/icons'
import { formatMonto } from '@/utils/format'
import transaccionService from '@/services/transaccion.service'
import { nuevaClaveOperacion } from '@/services/api'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import type { Transaccion } from '@/types'
import styles from './QueEsEstaPlataBloque.module.css'

function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
}

export interface QueEsEstaPlataModalProps {
  open: boolean
  onClose: () => void
  transaccion: Transaccion
  onSuccess?: (tx?: Transaccion | null) => void
}

export function QueEsEstaPlataModal({
  open,
  onClose,
  transaccion,
  onSuccess,
}: QueEsEstaPlataModalProps) {
  const { confirm } = useModal()
  const [opcion, setOpcion] = useState<'me_pagaron' | 'paso_por_mi_cuenta'>('me_pagaron')
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setOpcion('me_pagaron')
    }
  }
  const [gastoPadre, setGastoPadre] = useState<Transaccion | null>(null)
  const [saving, setSaving] = useState(false)
  const claveOperacionRef = useRef<string>('')

  useEffect(() => {
    if (open) {
      claveOperacionRef.current = nuevaClaveOperacion()
      if (transaccion.reintegro_de_id) {
        transaccionService
          .getTransaccion(transaccion.reintegro_de_id)
          .then(setGastoPadre)
          .catch((err) => {
            console.error(err)
          })
      }
    }
  }, [open, transaccion.reintegro_de_id])

  const handleDelete = () => {
    confirm({
      title: '¿Eliminar movimiento?',
      description: 'Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(transaccion.id)
          sileo.success({ title: 'Movimiento eliminado' })
          onSuccess?.(null)
          onClose()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar el movimiento.') })
        }
      },
    })
  }

  const handleGuardar = async () => {
    setSaving(true)
    try {
      const clave = claveOperacionRef.current || nuevaClaveOperacion()
      const updated = await transaccionService.responderQueEsEstaPlata(
        transaccion.id,
        { opcion },
        clave
      )
      sileo.success({ title: 'Movimiento actualizado' })
      onSuccess?.(updated)
      onClose()
    } catch (e) {
      console.error(e)
      sileo.error({ title: getErrorMessage(e, 'No se pudo actualizar el movimiento.') })
    } finally {
      setSaving(false)
    }
  }

  const descGasto = gastoPadre?.descripcion?.trim() || 'Gasto'
  const montoAbs = Math.abs(transaccion.monto)
  const textoDevolucion = `Te devolvieron ${formatMonto(montoAbs, transaccion.moneda)} de «${descGasto}» (${formatDDMM(transaccion.fecha)}).`

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        <div className={styles.modalHeaderTitle}>
          <span>¿Qué es esta plata?</span>
          <button
            type="button"
            onClick={handleDelete}
            title="Eliminar movimiento"
            aria-label="Eliminar movimiento"
            data-modal-delete
            className={styles.deleteBtn}
          >
            <Trash2 size={16} />
          </button>
        </div>
      }
      footer={
        <ModalFooter
          secondary={
            <Button variant="outline" fullWidth onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          }
          primary={
            <Button variant="primary" fullWidth onClick={handleGuardar} loading={saving}>
              Guardar
            </Button>
          }
        />
      }
    >
      <div className={styles.modalBody} data-modal-block>
        <p className={styles.modalTexto}>
          {textoDevolucion}
        </p>

        <div data-modal-field>
          <SegmentedControl<'me_pagaron' | 'paso_por_mi_cuenta'>
            layout="stacked"
            fullWidth
            ariaLabel="¿Qué es esta plata?"
            value={opcion}
            onChange={setOpcion}
            options={[
              { value: 'me_pagaron', label: 'Me pagaron' },
              { value: 'paso_por_mi_cuenta', label: 'Solo pasó por mi cuenta' },
            ]}
          />
        </div>
      </div>
    </Modal>
  )
}

export default QueEsEstaPlataModal
