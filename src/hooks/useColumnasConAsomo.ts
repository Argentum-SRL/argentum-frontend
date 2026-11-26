import { useLayoutEffect, useState, type RefObject } from 'react'

export interface OpcionesColumnasConAsomo {
  base?: number
  minimo?: number
  gap?: number
  padIzq?: number
  padDer?: number
}

export interface ResultadoColumnasConAsomo {
  ancho: number
  asomo: boolean
}

const OPCIONES_DEFAULT: Required<OpcionesColumnasConAsomo> = {
  base: 86,
  minimo: 86,
  gap: 16,
  padIzq: 28,
  padDer: 28,
}

/**
 * Calcula el ancho de cada columna en un carrusel horizontal para que, cuando
 * no entran todas, asome exactamente la mitad de la columna siguiente.
 */
export function calcularColumnasConAsomo(
  anchoContenedor: number,
  cantidad: number,
  opciones: OpcionesColumnasConAsomo = {}
): ResultadoColumnasConAsomo {
  const base = opciones.base ?? OPCIONES_DEFAULT.base
  const minimo = opciones.minimo ?? OPCIONES_DEFAULT.minimo
  const gap = opciones.gap ?? OPCIONES_DEFAULT.gap
  const padIzq = opciones.padIzq ?? OPCIONES_DEFAULT.padIzq
  const padDer = opciones.padDer ?? OPCIONES_DEFAULT.padDer

  if (cantidad <= 0) {
    return { ancho: base, asomo: false }
  }

  const f = (anchoContenedor - padIzq - padDer - (cantidad - 1) * gap) / cantidad
  if (f >= minimo) {
    return { ancho: Math.min(f, base), asomo: false }
  }

  const n = Math.max(1, Math.floor((anchoContenedor - padIzq - minimo / 2) / (minimo + gap)))
  const ancho = (anchoContenedor - padIzq - n * gap) / (n + 0.5)
  return { ancho, asomo: true }
}

/**
 * Mide el contenedor horizontal con ResizeObserver y devuelve el ancho óptimo de columna
 * para garantizar el asomo de la siguiente barra cuando el contenido excede el ancho visible.
 */
export function useColumnasConAsomo(
  containerRef: RefObject<HTMLElement | null>,
  cantidad: number,
  opciones: OpcionesColumnasConAsomo = {}
): ResultadoColumnasConAsomo {
  const base = opciones.base ?? OPCIONES_DEFAULT.base
  const minimo = opciones.minimo ?? OPCIONES_DEFAULT.minimo
  const gap = opciones.gap ?? OPCIONES_DEFAULT.gap
  const padIzq = opciones.padIzq ?? OPCIONES_DEFAULT.padIzq
  const padDer = opciones.padDer ?? OPCIONES_DEFAULT.padDer

  const [resultado, setResultado] = useState<ResultadoColumnasConAsomo>(() => ({
    ancho: base,
    asomo: false,
  }))

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || cantidad <= 0) {
      setResultado({ ancho: base, asomo: false })
      return
    }

    const recalcular = () => {
      const anchoContenedor = el.clientWidth
      if (anchoContenedor <= 0) return
      const siguiente = calcularColumnasConAsomo(anchoContenedor, cantidad, {
        base,
        minimo,
        gap,
        padIzq,
        padDer,
      })
      setResultado((prev) =>
        Math.abs(prev.ancho - siguiente.ancho) < 0.01 && prev.asomo === siguiente.asomo
          ? prev
          : siguiente
      )
    }

    recalcular()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(recalcular)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, cantidad, base, minimo, gap, padIzq, padDer])

  return resultado
}
