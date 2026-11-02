import { useState } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import ModalFooter from '@/components/ui/Modal/ModalFooter'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { sileo } from 'sileo'
import presupuestoService from '@/services/presupuesto.service'
import { leerDetalleError } from '@/utils/excelPresupuestos'
import styles from './DescargarExcelModal.module.css'

interface DescargarExcelModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DescargarExcelModal({ isOpen, onClose }: DescargarExcelModalProps) {
  const [alcance, setAlcance] = useState<'12' | 'todo'>('12')
  const [descargando, setDescargando] = useState(false)
  const [prevOpen, setPrevOpen] = useState(isOpen)

  // Resetea a '12' al abrir
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setAlcance('12')
      setDescargando(false)
    }
  }

  const handleDescargar = async () => {
    setDescargando(true)
    try {
      const { blob, nombreArchivo } = await presupuestoService.descargarExcel(alcance)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      sileo.success({ title: 'Listo, se descargó tu Excel.' })
      onClose()
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: unknown } }
      const detalle = await leerDetalleError(errObj?.response?.data)
      sileo.error({
        title: detalle || 'No pudimos armar el Excel. Probá de nuevo en unos minutos.',
      })
    } finally {
      setDescargando(false)
    }
  }

  const handleClose = () => {
    if (!descargando) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Descargar en Excel"
      size="sm"
      closeOnOverlayClick={!descargando}
      closeOnEscape={!descargando}
      footer={
        <ModalFooter
          secondary={
            <Button
              variant="outline"
              fullWidth
              onClick={handleClose}
              disabled={descargando}
            >
              Cancelar
            </Button>
          }
          primary={
            <Button
              variant="primary"
              fullWidth
              onClick={handleDescargar}
              disabled={descargando}
            >
              {descargando ? 'Armando el Excel…' : 'Descargar'}
            </Button>
          }
        />
      }
    >
      <div className={styles.container} data-modal-block>
        <p className={styles.texto}>
          Te armamos un Excel con una hoja por mes, un comparativo entre meses y uno anual. Solo van los meses con movimientos.
        </p>

        <div className={styles.selectorWrapper}>
          <SegmentedControl<'12' | 'todo'>
            options={[
              { value: '12', label: 'Últimos 12 meses' },
              { value: 'todo', label: 'Todo mi historial' },
            ]}
            value={alcance}
            onChange={(val) => {
              if (!descargando) {
                setAlcance(val)
              }
            }}
            ariaLabel="Alcance del Excel de presupuestos"
            fullWidth
          />
        </div>
      </div>
    </Modal>
  )
}
