import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, X } from '@/components/ui/icons'
import { reportarErrorFrontend } from '@/services/reporteError.service'
import Modal from '@/components/ui/Modal'
import styles from './ModalErrorBoundary.module.css'

interface Props {
  children: ReactNode
  modalName?: string
  onClose?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ModalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ModalErrorBoundary] Error atrapado en modal "${this.props.modalName || 'Desconocido'}":`, error, errorInfo)
    reportarErrorFrontend({
      mensaje: error?.message || String(error),
      stack: error?.stack || errorInfo?.componentStack || null,
      componente: `ModalErrorBoundary(${this.props.modalName || 'Modal'})`,
    })
  }

  handleClose = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onClose?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Modal
          isOpen={true}
          onClose={this.handleClose}
          size="sm"
          showHeader={false}
          autoHeight
          ariaLabel="Error al abrir ventana"
        >
          <div className={styles.modalContent}>
            <div className={styles.iconWrapper}>
              <AlertCircle size={28} />
            </div>
            <h3 className={styles.title}>No pudimos abrir esta ventana</h3>
            <p className={styles.message}>
              Ocurrió un inconveniente al cargar el contenido de este modal. Podés cerrarlo y volver a intentar.
            </p>
            <button type="button" className={styles.closeBtn} onClick={this.handleClose}>
              <X size={16} />
              <span>Cerrar</span>
            </button>
          </div>
        </Modal>
      )
    }

    return this.props.children
  }
}

export default ModalErrorBoundary
