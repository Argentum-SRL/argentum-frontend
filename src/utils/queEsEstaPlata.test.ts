import { describe, it, expect } from 'vitest'
import { armarPedidoQueEs } from './queEsEstaPlata'

describe('armarPedidoQueEs', () => {
  it('misma opcion inicial me_pagaron devuelve nada', () => {
    expect(armarPedidoQueEs('me_pagaron', 'me_pagaron', null)).toEqual({ accion: 'nada' })
    expect(armarPedidoQueEs({ opcionInicial: 'me_pagaron', opcion: 'me_pagaron', gastoId: null })).toEqual({ accion: 'nada' })
  })

  it('de me_pagaron a paso_por_mi_cuenta devuelve enviar', () => {
    expect(armarPedidoQueEs('me_pagaron', 'paso_por_mi_cuenta', null)).toEqual({
      accion: 'enviar',
      payload: { opcion: 'paso_por_mi_cuenta' },
    })
    expect(armarPedidoQueEs({ opcionInicial: 'me_pagaron', opcion: 'paso_por_mi_cuenta', gastoId: null })).toEqual({
      accion: 'enviar',
      payload: { opcion: 'paso_por_mi_cuenta' },
    })
  })

  it('parte_de_gasto sin gasto_id devuelve error', () => {
    expect(armarPedidoQueEs('me_pagaron', 'parte_de_gasto', null)).toEqual({
      accion: 'error',
      mensaje: 'Elegí el gasto.',
    })
    expect(armarPedidoQueEs({ opcionInicial: 'me_pagaron', opcion: 'parte_de_gasto', gastoId: null })).toEqual({
      accion: 'error',
      mensaje: 'Elegí el gasto.',
    })
  })

  it('parte_de_gasto con gasto_id devuelve enviar con gasto_id', () => {
    expect(armarPedidoQueEs('me_pagaron', 'parte_de_gasto', 'g1')).toEqual({
      accion: 'enviar',
      payload: { opcion: 'parte_de_gasto', gasto_id: 'g1' },
    })
    expect(armarPedidoQueEs({ opcionInicial: 'me_pagaron', opcion: 'parte_de_gasto', gastoId: 'g1' })).toEqual({
      accion: 'enviar',
      payload: { opcion: 'parte_de_gasto', gasto_id: 'g1' },
    })
  })

  it('de paso_por_mi_cuenta a me_pagaron devuelve enviar', () => {
    expect(armarPedidoQueEs('paso_por_mi_cuenta', 'me_pagaron', null)).toEqual({
      accion: 'enviar',
      payload: { opcion: 'me_pagaron' },
    })
    expect(armarPedidoQueEs({ opcionInicial: 'paso_por_mi_cuenta', opcion: 'me_pagaron', gastoId: null })).toEqual({
      accion: 'enviar',
      payload: { opcion: 'me_pagaron' },
    })
  })

  it('misma opcion inicial paso_por_mi_cuenta devuelve nada', () => {
    expect(armarPedidoQueEs('paso_por_mi_cuenta', 'paso_por_mi_cuenta', null)).toEqual({ accion: 'nada' })
    expect(armarPedidoQueEs({ opcionInicial: 'paso_por_mi_cuenta', opcion: 'paso_por_mi_cuenta', gastoId: null })).toEqual({ accion: 'nada' })
  })
})

