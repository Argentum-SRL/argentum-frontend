import { describe, it, expect } from 'vitest'
import { armarPayloadReintegro, type EntradaArmarPayloadReintegro } from './reintegroPayload'

describe('reintegroPayload', () => {
  const baseEntrada: EntradaArmarPayloadReintegro = {
    tieneReintegro: true,
    teniaReintegroInicial: false,
    isCompraRecibidaInicial: false,
    modoMonto: 'monto',
    montoManual: 25000,
    porcentaje: null,
    montoCompra: null,
    yaRecibido: true,
    isEdit: false,
    fechaCompra: '2026-10-20',
    fechaRecibido: '2026-10-25',
    hoy: '2026-10-27',
  }

  it('crear con monto 25000 y "Sí"', () => {
    const res = armarPayloadReintegro(baseEntrada)
    expect(res).toEqual({
      accion: 'guardar',
      payload: {
        monto: 25000,
        recibido: true,
        fecha_recibido: '2026-10-20',
      },
    })
  })

  it('crear con "No"', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      yaRecibido: false,
    })
    expect(res.accion).toBe('guardar')
    if (res.accion === 'guardar') {
      expect(res.payload).toEqual({
        monto: 25000,
        recibido: false,
      })
    }
  })

  it('editar pendiente con "Sí"', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      isEdit: true,
      yaRecibido: true,
      fechaRecibido: '2026-10-25',
    })
    expect(res.accion).toBe('guardar')
    if (res.accion === 'guardar') {
      expect(res.payload.fecha_recibido).toBe('2026-10-25')
    }
  })

  it('editar pendiente con "Sí" y fechaRecibido vacía', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      isEdit: true,
      yaRecibido: true,
      fechaRecibido: '',
    })
    expect(res.accion).toBe('guardar')
    if (res.accion === 'guardar') {
      expect(res.payload.fecha_recibido).toBe('2026-10-27')
    }
  })

  it('modo porcentaje con montoCompra 100000 y 25', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      modoMonto: 'porcentaje',
      montoCompra: 100000,
      porcentaje: 25,
      montoManual: null,
    })
    expect(res.accion).toBe('guardar')
    if (res.accion === 'guardar') {
      expect(res.payload.monto).toBe(25000)
    }
  })

  it('montoManual 0', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      montoManual: 0,
    })
    expect(res).toEqual({ accion: 'nada' })
  })

  it('sin reintegro y teniaReintegroInicial true', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      tieneReintegro: false,
      teniaReintegroInicial: true,
    })
    expect(res).toEqual({ accion: 'quitar' })
  })

  it('sin reintegro y sin inicial', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      tieneReintegro: false,
      teniaReintegroInicial: false,
    })
    expect(res).toEqual({ accion: 'nada' })
  })

  it('compra ya recibida (isCompraRecibidaInicial true)', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      isCompraRecibidaInicial: true,
    })
    expect(res).toEqual({ accion: 'nada' })
  })

  it('crear con modoMonto todo, montoCompra 100000 y "Sí"', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      modoMonto: 'todo',
      montoCompra: 100000,
      montoManual: null,
      yaRecibido: true,
    })
    expect(res).toEqual({
      accion: 'guardar',
      payload: {
        monto: 100000,
        recibido: true,
        fecha_recibido: '2026-10-20',
      },
    })
  })

  it('modoMonto todo con montoCompra null', () => {
    const res = armarPayloadReintegro({
      ...baseEntrada,
      modoMonto: 'todo',
      montoCompra: null,
      montoManual: null,
    })
    expect(res).toEqual({ accion: 'nada' })
  })
})

