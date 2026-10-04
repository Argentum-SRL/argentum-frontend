import { useState, useRef, useLayoutEffect, useCallback, type RefObject, type CSSProperties } from 'react'

export interface UseAdaptiveModalHeightOptions {
  /** Porcentaje máximo de la ventana. Por defecto: 0.85 (85vh) */
  maxHeightRatio?: number
  /** Compensación interna en px para holgura de renderizado y bordes. Por defecto: 4 */
  extraPadding?: number
  /** Dependencias que disparan la re-medición */
  deps?: unknown[]
  /** Si la medición debe estar activa */
  enabled?: boolean
}

export interface UseAdaptiveModalHeightReturn {
  containerRef: RefObject<HTMLDivElement | null>
  headerRef: RefObject<HTMLDivElement | null>
  fieldsRef: RefObject<HTMLDivElement | null>
  bodyRef: RefObject<HTMLDivElement | null> // Alias de fieldsRef
  footerRef: RefObject<HTMLDivElement | null>
  dynamicHeight: number | null
  containerStyle: CSSProperties | undefined
  recalculate: () => void
}

/**
 * Calcula la altura exterior real de un elemento (incluyendo márgenes verticales).
 */
function getElementOuterHeight(el: HTMLElement): number {
  const style = window.getComputedStyle(el)
  const marginTop = parseFloat(style.marginTop) || 0
  const marginBottom = parseFloat(style.marginBottom) || 0
  return el.offsetHeight + marginTop + marginBottom
}

/**
 * Calcula la altura intrínseca exacta requerida por un contenedor y sus hijos,
 * considerando padding interno, bordes, márgenes de hijos y gap de flexbox.
 */
function getContainerIntrinsicHeight(container: HTMLElement): number {
  const style = window.getComputedStyle(container)
  const paddingTop = parseFloat(style.paddingTop) || 0
  const paddingBottom = parseFloat(style.paddingBottom) || 0
  const borderTop = parseFloat(style.borderTopWidth) || 0
  const borderBottom = parseFloat(style.borderBottomWidth) || 0
  const rowGap = parseFloat(style.rowGap || style.gap) || 0

  // Filtrar solo elementos visibles en el flujo de render (ignora display:none y position:absolute)
  const visibleChildren = (Array.from(container.children) as HTMLElement[]).filter((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return false
    const s = window.getComputedStyle(child)
    return s.display !== 'none' && s.position !== 'absolute'
  })

  if (visibleChildren.length === 0) {
    return container.offsetHeight
  }

  let childrenH = 0
  for (const child of visibleChildren) {
    childrenH += getElementOuterHeight(child)
  }

  const gapsH = visibleChildren.length > 1 ? (visibleChildren.length - 1) * rowGap : 0
  return Math.ceil(paddingTop + paddingBottom + borderTop + borderBottom + childrenH + gapsH)
}

/**
 * Hook universal de altura adaptativa (Auto-Hugging) para Argentum.
 * Replicado y perfeccionado a partir de la arquitectura de BankPickerModal:
 * - Medición intrínseca exacta de hijos, padding y flex gaps (evita cortes por padding o flex: 1)
 * - Compatibilidad total con headers internos (formBodyWithHeader) o externos (headerRef)
 * - Medición precisa del footer fijo
 * - Límite estricto en Math.round(window.innerHeight * 0.85)
 * - Escucha continua con ResizeObserver en contenedor e hijos, resize de ventana y visualViewport
 */
export function useAdaptiveModalHeight(
  options: UseAdaptiveModalHeightOptions = {}
): UseAdaptiveModalHeightReturn {
  const {
    maxHeightRatio = 0.85,
    extraPadding = 4,
    deps = [],
    enabled = true,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const fieldsRef = useRef<HTMLDivElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)

  const [dynamicHeight, setDynamicHeight] = useState<number | null>(null)

  const measure = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    const bodyEl = fieldsRef.current
    const footerEl = footerRef.current
    const headerEl = headerRef.current
    const containerEl = containerRef.current

    let totalContentH: number

    if (bodyEl) {
      // Altura intrínseca real del cuerpo (hijos + padding + gap + bordes)
      const bodyH = getContainerIntrinsicHeight(bodyEl)

      // Si hay un header separado fuera de bodyEl, se suma
      const headerH = (headerEl && !bodyEl.contains(headerEl))
        ? getElementOuterHeight(headerEl)
        : 0

      // Footer fijo si existe
      const footerH = footerEl ? getElementOuterHeight(footerEl) : 0

      totalContentH = headerH + bodyH + footerH + extraPadding
    } else if (containerEl) {
      totalContentH = getContainerIntrinsicHeight(containerEl) + extraPadding
    } else {
      return
    }

    const maxWindowH = Math.round(window.innerHeight * maxHeightRatio)
    const targetH = Math.min(totalContentH, maxWindowH)
    setDynamicHeight(targetH)
  }, [enabled, extraPadding, maxHeightRatio])

  useLayoutEffect(() => {
    if (!enabled) return

    measure()

    const bodyEl = fieldsRef.current
    const headerEl = headerRef.current
    const footerEl = footerRef.current
    const containerEl = containerRef.current

    const observer = new ResizeObserver(() => {
      measure()
    })

    if (bodyEl) {
      observer.observe(bodyEl)
      // Observar cada hijo directo para detectar cambios de tamaño internos
      for (const child of Array.from(bodyEl.children)) {
        observer.observe(child)
      }
    }
    if (headerEl && !bodyEl?.contains(headerEl)) observer.observe(headerEl)
    if (footerEl) observer.observe(footerEl)
    if (containerEl && !bodyEl) observer.observe(containerEl)

    // Detectar cambios en la lista de hijos (por ej. aparición de alertas o subsecciones)
    let mutationObserver: MutationObserver | null = null
    if (bodyEl) {
      mutationObserver = new MutationObserver(() => {
        measure()
        for (const child of Array.from(bodyEl.children)) {
          observer.observe(child)
        }
      })
      mutationObserver.observe(bodyEl, { childList: true, subtree: false })
    }

    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, measure, ...deps])

  const effectiveHeight = enabled ? dynamicHeight : null

  const containerStyle: CSSProperties | undefined = effectiveHeight
    ? {
        height: `${effectiveHeight}px`,
        maxHeight: `${Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * maxHeightRatio)}px`,
        transition: 'height 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        willChange: 'height',
      }
    : undefined

  return {
    containerRef,
    headerRef,
    fieldsRef,
    bodyRef: fieldsRef,
    footerRef,
    dynamicHeight: effectiveHeight,
    containerStyle,
    recalculate: measure,
  }
}

export default useAdaptiveModalHeight
