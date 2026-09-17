import type { ProyeccionesResponse } from '@/types'

export function hasProyeccionVisible(
  proyeccion: ProyeccionesResponse | null | undefined,
  moneda?: 'ARS' | 'USD'
): boolean {
  if (!proyeccion) return false
  const mostrarArs = Boolean(proyeccion.ars?.mostrar_card ?? proyeccion.ars?.datos_suficientes ?? false)
  const mostrarUsd = Boolean(proyeccion.usd?.mostrar_card ?? proyeccion.usd?.datos_suficientes ?? false)

  const hasArs = Boolean(
    proyeccion.ars &&
    mostrarArs && (
      proyeccion.ars.datos_suficientes ||
      (proyeccion.ars.certezas?.total ?? 0) > 0 ||
      (proyeccion.ars.gasto_proyectado_total !== null && (proyeccion.ars.gasto_proyectado_total ?? 0) > 0)
    )
  )
  const hasUsd = Boolean(
    proyeccion.usd &&
    mostrarUsd && (
      proyeccion.usd.datos_suficientes ||
      (proyeccion.usd.certezas?.total ?? 0) > 0 ||
      (proyeccion.usd.gasto_proyectado_total !== null && (proyeccion.usd.gasto_proyectado_total ?? 0) > 0) ||
      (proyeccion.usd.ingresos_proyectados !== null && (proyeccion.usd.ingresos_proyectados ?? 0) > 0)
    )
  )

  const showArs = (!moneda || moneda === 'ARS') && hasArs
  const showUsd = (!moneda || moneda === 'USD') && hasUsd

  return Boolean(showArs || showUsd)
}
