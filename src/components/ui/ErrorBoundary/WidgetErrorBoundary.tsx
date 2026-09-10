import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import styles from './WidgetErrorBoundary.module.css'

interface Props {
  children: ReactNode
  title?: string
  fallbackMessage?: string
  onReset?: () => void
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[WidgetErrorBoundary] Error atrapado en "${this.props.title || 'Widget'}":`, error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={`${styles.container} ${this.props.className || ''}`}>
          <div className={styles.iconWrapper}>
            <AlertCircle size={20} />
          </div>
          <p className={styles.title}>
            {this.props.title ? `No pudimos cargar "${this.props.title}"` : 'No pudimos cargar esta sección'}
          </p>
          <p className={styles.message}>
            {this.props.fallbackMessage || 'Ocurrió un inconveniente al mostrar los datos de esta tarjeta.'}
          </p>
          <button type="button" className={styles.retryBtn} onClick={this.handleReset}>
            <RefreshCw size={13} />
            <span>Reintentar</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default WidgetErrorBoundary
