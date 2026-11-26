import { useLayoutEffect, useRef, useState } from 'react'
import { elegirFormatoMonto, type FormatoMontoElegido } from '@/utils/montoFit'
import styles from './MontoFit.module.css'

export interface MontoFitProps {
  completo: string
  corto: string
  className?: string
}

const observadores = new Map<Element, () => void>()
let resizeObserverUnico: ResizeObserver | null = null

function obtenerObserverCompartido(): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') return null
  if (!resizeObserverUnico) {
    resizeObserverUnico = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const callback = observadores.get(entry.target)
        if (callback) callback()
      }
    })
  }
  return resizeObserverUnico
}

function observarElemento(el: Element, callback: () => void): () => void {
  const observer = obtenerObserverCompartido()
  if (!observer) return () => {}

  observadores.set(el, callback)
  observer.observe(el)

  return () => {
    observadores.delete(el)
    observer.unobserve(el)
    if (observadores.size === 0 && resizeObserverUnico) {
      resizeObserverUnico.disconnect()
      resizeObserverUnico = null
    }
  }
}

/**
 * Muestra el monto completo si entra en su contenedor y cambia a su versión corta
 * cuando no entra, preservando siempre el monto completo en title y aria-label.
 */
export function MontoFit({ completo, corto, className }: MontoFitProps) {
  const contenedorRef = useRef<HTMLSpanElement>(null)
  const medidorRef = useRef<HTMLSpanElement>(null)
  const [formato, setFormato] = useState<FormatoMontoElegido>('completo')

  useLayoutEffect(() => {
    const el = contenedorRef.current
    const medidor = medidorRef.current
    if (!el || !medidor) return

    const actualizar = () => {
      const anchoDisponible = el.clientWidth
      const anchoCompleto = medidor.getBoundingClientRect().width
      const siguiente = elegirFormatoMonto(anchoDisponible, anchoCompleto)
      setFormato((prev) => (prev === siguiente ? prev : siguiente))
    }

    actualizar()
    return observarElemento(el, actualizar)
  }, [completo])

  const clases = [
    styles.contenedor,
    formato === 'corto' ? styles.cortoFallback : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={contenedorRef} className={clases} title={completo} aria-label={completo}>
      <span ref={medidorRef} className={styles.medidor} aria-hidden="true">
        {completo}
      </span>
      {formato === 'corto' ? corto : completo}
    </span>
  )
}

export default MontoFit
