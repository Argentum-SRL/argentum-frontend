import { useState } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import ModalFooter from '@/components/ui/Modal/ModalFooter'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Button from '@/components/ui/Button/Button'
import { sileo } from 'sileo'
import analisisService, {
  type AnalisisQueryParams,
  type AnalisisResumenResponse,
} from '@/services/analisis.service'
import { exportarAnalisisPdf } from './exportarAnalisisPdf'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './DescargarAnalisisModal.module.css'

interface DescargarAnalisisModalProps {
  isOpen: boolean
  onClose: () => void
  queryParams: AnalisisQueryParams
  data: AnalisisResumenResponse | null
}

export default function DescargarAnalisisModal({
  isOpen,
  onClose,
  queryParams,
  data,
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
    if (formato === 'excel') {
      setDescargando(true)
      try {
        const blob = await analisisService.exportarExcel(queryParams)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Analisis_Argentum_${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        sileo.success({ title: 'Libro Excel (.xlsx) descargado.' })
        onClose()
      } catch (err: unknown) {
        sileo.error({
          title: getErrorMessage(err, 'No pudimos exportar el Excel.'),
        })
      } finally {
        setDescargando(false)
      }
    } else {
      if (data) {
        exportarAnalisisPdf(data, 'Argentum — Tu análisis')
        sileo.success({ title: 'Informe PDF descargado.' })
      }
      onClose()
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
              disabled={descargando || (formato === 'pdf' && !data)}
            >
              {descargando ? 'Descargando…' : 'Descargar'}
            </Button>
          }
        />
      }
    >
      <div className={styles.container} data-modal-block>
        <p className={styles.texto}>
          Elegí el formato para descargar el análisis con los filtros seleccionados.
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
