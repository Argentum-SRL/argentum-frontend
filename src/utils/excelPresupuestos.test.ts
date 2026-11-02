import { describe, it, expect } from 'vitest'
import { nombreArchivoExcel, leerDetalleError } from './excelPresupuestos'

describe('excelPresupuestos', () => {
  it('obtiene el nombre desde Content-Disposition', () => {
    const header = 'attachment; filename="Argentum_presupuestos_2025-11-30_2026-11-29.xlsx"'
    const res = nombreArchivoExcel(header, new Date(2026, 10, 2))
    expect(res).toBe('Argentum_presupuestos_2025-11-30_2026-11-29.xlsx')
  })

  it('obtiene el nombre por defecto si header es undefined', () => {
    const res = nombreArchivoExcel(undefined, new Date(2026, 10, 2))
    expect(res).toBe('Argentum_presupuestos_2026-11-02.xlsx')
  })

  it('lee detalle de error desde un Blob con JSON', async () => {
    const blob = new Blob(['{"detail":"Todavía no tenés gastos ni ingresos para armar el Excel."}'], {
      type: 'application/json',
    })
    const res = await leerDetalleError(blob)
    expect(res).toBe('Todavía no tenés gastos ni ingresos para armar el Excel.')
  })

  it('devuelve null si el Blob no es json', async () => {
    const blob = new Blob(['no es json'], { type: 'text/plain' })
    const res = await leerDetalleError(blob)
    expect(res).toBeNull()
  })

  it('devuelve null si data es null', async () => {
    const res = await leerDetalleError(null)
    expect(res).toBeNull()
  })
})

