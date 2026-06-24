import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import type { ExportacionResponse } from '@/types'
import styles from './ExportarBoton.module.css'

interface ExportarBotonProps {
  onExportar: () => Promise<ExportacionResponse | null>
}

export const ExportarBoton: React.FC<ExportarBotonProps> = ({ onExportar }) => {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [advertencias, setAdvertencias] = useState<string[]>([])
  const [showFallbackTextarea, setShowFallbackTextarea] = useState(false)
  const [textToCopy, setTextToCopy] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleExportar = async () => {
    setEstado('loading')
    setAdvertencias([])
    setShowFallbackTextarea(false)
    setTextToCopy('')

    try {
      const res = await onExportar()
      if (res && res.texto) {
        setAdvertencias(res.advertencias || [])
        setTextToCopy(res.texto)
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(res.texto)
          setEstado('success')
          setTimeout(() => {
            setEstado('idle')
          }, 2000)
        } else {
          setShowFallbackTextarea(true)
          setEstado('idle')
        }
      } else {
        setEstado('error')
        setTimeout(() => {
          setEstado('idle')
        }, 2000)
      }
    } catch (err) {
      console.error('Error al exportar o copiar:', err)
      setEstado('error')
      setTimeout(() => {
        setEstado('idle')
      }, 2000)
    }
  }

  useEffect(() => {
    if (showFallbackTextarea && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [showFallbackTextarea])

  const getButtonText = () => {
    switch (estado) {
      case 'loading':
        return 'Exportando...'
      case 'success':
        return 'Copiado'
      case 'error':
        return 'Error al exportar'
      default:
        return 'Exportar datos'
    }
  }

  const getButtonVariant = () => {
    if (estado === 'success') return 'primary'
    if (estado === 'error') return 'danger'
    return 'outline'
  }

  return (
    <div className={styles.container}>
      <Button
        type="button"
        variant={getButtonVariant()}
        className={`${estado === 'success' ? styles.success : ''} ${estado === 'error' ? styles.error : ''}`}
        onClick={handleExportar}
        disabled={estado === 'loading'}
        loading={estado === 'loading'}
        fullWidth
      >
        {getButtonText()}
      </Button>

      {showFallbackTextarea && (
        <div className={styles.fallbackContainer}>
          <p className={styles.fallbackLabel}>
            Tu navegador no soporta copia automática. Copiá el texto de abajo manualmente:
          </p>
          <textarea
            ref={textareaRef}
            readOnly
            value={textToCopy}
            title="Datos exportados"
            aria-label="Texto de datos exportados para copiar manualmente"
            className={styles.fallbackTextarea}
            onClick={(e) => {
              e.currentTarget.focus()
              e.currentTarget.select()
            }}
          />
        </div>
      )}

      {advertencias.length > 0 && (
        <div className={styles.warningsList}>
          <span className={styles.warningsTitle}>Advertencias de exportación:</span>
          <ul>
            {advertencias.map((adv, idx) => (
              <li key={idx} className={styles.warningItem}>{adv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ExportarBoton
