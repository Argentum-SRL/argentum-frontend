import { describe, expect, it } from 'vitest'
import type { Presupuesto } from '@/types'
import { enRiesgo } from './resumenPresupuestos'

function armarPresupuesto(
  overrides: Partial<Presupuesto> & {
    porcentajeUsado?: number
    montoLimite?: number
  } = {}
): Presupuesto {
  const {
    porcentajeUsado = 0,
    montoLimite = 10000,
    ...rest
  } = overrides
  return {
    id: 'presu-1',
    usuario_id: 'usr-1',
    nombre: 'Súper',
    monto: montoLimite,
    moneda: 'ARS',
    periodo: 'mensual',
    renovacion: 'automatica',
    estado: 'activo',
    fecha_creacion: '2026-11-01T10:00:00Z',
    categorias: [],
    alertas_porcentajes: [80, 100],
    periodo_actual: {
      id: 'per-1',
      presupuesto_id: 'presu-1',
      fecha_inicio: '2026-11-01',
      fecha_fin: '2026-11-30',
      monto_limite: montoLimite,
      monto_usado: (montoLimite * porcentajeUsado) / 100,
      superado: porcentajeUsado >= 100,
      porcentaje_usado: porcentajeUsado,
      dias_restantes: 12,
    },
    proxima_renovacion: '2026-12-01',
    ...rest,
  }
}

describe('enRiesgo', () => {
  it('con [80, 100] al 79% devuelve 0 y al 80% devuelve 1', () => {
    expect(
      enRiesgo([armarPresupuesto({ alertas_porcentajes: [80, 100], porcentajeUsado: 79 })])
    ).toBe(0)
    expect(
      enRiesgo([armarPresupuesto({ alertas_porcentajes: [80, 100], porcentajeUsado: 80 })])
    ).toBe(1)
  })

  it('con [50, 100] al 55% devuelve 1', () => {
    expect(
      enRiesgo([armarPresupuesto({ alertas_porcentajes: [50, 100], porcentajeUsado: 55 })])
    ).toBe(1)
  })

  it('con [100] al 99% devuelve 0 y al 100% devuelve 1', () => {
    expect(
      enRiesgo([armarPresupuesto({ alertas_porcentajes: [100], porcentajeUsado: 99 })])
    ).toBe(0)
    expect(
      enRiesgo([armarPresupuesto({ alertas_porcentajes: [100], porcentajeUsado: 100 })])
    ).toBe(1)
  })

  it('ignora presupuestos pausados o con límite 0', () => {
    expect(
      enRiesgo([
        armarPresupuesto({ estado: 'pausado', alertas_porcentajes: [80, 100], porcentajeUsado: 120 }),
      ])
    ).toBe(0)
    expect(
      enRiesgo([
        armarPresupuesto({ montoLimite: 0, alertas_porcentajes: [80, 100], porcentajeUsado: 120 }),
      ])
    ).toBe(0)
  })
})
