import { describe, it, expect } from 'vitest'
import {
  lineasFinDeMes,
  debeMostrarLineaSaldo,
  debeMostrarTarjetaFinDeMes,
} from './finDeMes'
import type { FinDeMesTarjeta, FinDeMesResponse } from '@/types'

describe('lineasFinDeMes', () => {
  it('filtra y devuelve las líneas no nulas en orden', () => {
    const tarjeta: FinDeMesTarjeta = {
      titulo: '¿Cómo llegás a fin de mes?',
      monto: 'Entre $100.000 y $200.000',
      subtitulo: 'Hasta el 30/11',
      linea_riesgo: 'R',
      linea_cobro: null,
      linea_cobertura: 'C',
    }
    expect(lineasFinDeMes(tarjeta)).toEqual(['R', 'C'])
  })

  it('devuelve array vacío cuando todas son null', () => {
    const tarjeta: FinDeMesTarjeta = {
      titulo: '¿Cómo llegás a fin de mes?',
      monto: 'Entre $100.000 y $200.000',
      subtitulo: 'Hasta el 30/11',
      linea_riesgo: null,
      linea_cobro: null,
      linea_cobertura: null,
    }
    expect(lineasFinDeMes(tarjeta)).toEqual([])
  })

  it('devuelve las tres líneas con texto en el orden riesgo, cobro, cobertura', () => {
    const tarjeta: FinDeMesTarjeta = {
      titulo: '¿Cómo llegás a fin de mes?',
      monto: 'Entre $100.000 y $200.000',
      subtitulo: 'Hasta el 30/11',
      linea_riesgo: 'R',
      linea_cobro: 'B',
      linea_cobertura: 'C',
    }
    expect(lineasFinDeMes(tarjeta)).toEqual(['R', 'B', 'C'])
  })
})

describe('debeMostrarLineaSaldo', () => {
  it("('ARS', null, 0) → true", () => {
    expect(debeMostrarLineaSaldo('ARS', null, 0)).toBe(true)
  })

  it("('USD', null, 0) → false", () => {
    expect(debeMostrarLineaSaldo('USD', null, 0)).toBe(false)
  })

  it("('ARS', {}, 0) → false", () => {
    expect(debeMostrarLineaSaldo('ARS', {}, 0)).toBe(false)
  })

  it("('ARS', null, 2) → false", () => {
    expect(debeMostrarLineaSaldo('ARS', null, 2)).toBe(false)
  })
})

describe('debeMostrarTarjetaFinDeMes', () => {
  const tarjetaValida: FinDeMesTarjeta = {
    titulo: '¿Cómo llegás a fin de mes?',
    monto: 'Entre $100.000 y $200.000',
    subtitulo: 'Hasta el 30/11',
    linea_riesgo: null,
    linea_cobro: null,
    linea_cobertura: null,
  }

  const dataConTarjeta: FinDeMesResponse = {
    estado: 'completo',
    mostrar_tarjeta: true,
    fin_ciclo: '2026-11-30',
    linea_saldo: 'Saldo',
    tarjeta: tarjetaValida,
    mostrar_modal_bienvenida: false,
  }

  const dataSinTarjeta: FinDeMesResponse = {
    estado: 'sin_ingreso',
    mostrar_tarjeta: false,
    fin_ciclo: '2026-11-30',
    linea_saldo: 'Saldo',
    tarjeta: null,
    mostrar_modal_bienvenida: false,
  }

  it("('ARS', null, data con tarjeta) → true", () => {
    expect(debeMostrarTarjetaFinDeMes('ARS', null, dataConTarjeta)).toBe(true)
  })

  it("('ARS', null, data con tarjeta null) → false", () => {
    expect(debeMostrarTarjetaFinDeMes('ARS', null, dataSinTarjeta)).toBe(false)
  })

  it("('USD', null, data con tarjeta) → false", () => {
    expect(debeMostrarTarjetaFinDeMes('USD', null, dataConTarjeta)).toBe(false)
  })

  it("('ARS', null, null) → false", () => {
    expect(debeMostrarTarjetaFinDeMes('ARS', null, null)).toBe(false)
  })
})
