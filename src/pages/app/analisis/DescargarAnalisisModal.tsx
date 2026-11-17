import { useState } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import ModalFooter from '@/components/ui/Modal/ModalFooter'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { sileo } from 'sileo'
import analisisService from '@/services/analisis.service'
import { getErrorMessage } from '@/utils/errorMessages'
import {
  nombreArchivoDescarga,
  resumenPedido,
  type PedidoDescarga,
} from './descargaAnalisis'
import { exportarInformePdf } from './exportarInformePdf'
import styles from './DescargarAnalisisModal.module.css'

interface DescargarAnalisisModalProps {
  isOpen: boolean
  onClose: () => void
  pedido: PedidoDescarga | null
  nombres?: {
    billeteras?: Record<string, string>
    tarjetas?: Record<string, string>
    billeteraNombre?: string
    tarjetaNombre?: string
  }
}

export default function DescargarAnalisisModal({
  isOpen,
  onClose,
  pedido,
  nombres,
}: DescargarAnalisisModalProps) {
  const [formato, setFormato] = useState<'excel' | 'pdf'>('excel')
  const [descargando, setDescargando] = useState(false)
  const [prevOpen, setPrevOpen] = useState(isOpen)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      setFormato('excel')
      setDescargando(false)
    }
  }

  const handleDescargar = async () => {
    if (!pedido) return
    setDescargando(true)

    try {
      if (formato === 'excel') {
        const blob = await analisisService.exportarExcel(pedido)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nombreArchivoDescarga(pedido.titulo, 'xlsx')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        sileo.success({ title: 'Excel descargado.' })
      } else {
        await exportarInformePdf(pedido, nombres)
        sileo.success({ title: 'PDF descargado.' })
      }
      onClose()
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No se pudo descargar el archivo. Probá de nuevo.'),
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

  const lineaResumen = pedido ? resumenPedido(pedido, nombres) : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Descargar análisis"
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
              onClick={() => void handleDescargar()}
              disabled={descargando || !pedido}
            >
              {descargando ? 'Descargando…' : 'Descargar'}
            </Button>
          }
        />
      }
    >
      <div className={styles.container} data-modal-block>
        <p className={styles.texto}>
          {lineaResumen}
        </p>

        <div className={styles.selectorWrapper}>
          <SegmentedControl<'excel' | 'pdf'>
            options={[
              { value: 'excel', label: 'Excel (.xlsx)' },
              { value: 'pdf', label: 'Informe PDF' },
            ]}
            value={formato}
            onChange={(val) => {
              if (!descargando) {
                setFormato(val)
              }
            }}
            ariaLabel="Formato de descarga del análisis"
            fullWidth
          />
        </div>
      </div>
    </Modal>
  )
}
