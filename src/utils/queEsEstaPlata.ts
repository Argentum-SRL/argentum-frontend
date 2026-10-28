export type OpcionQueEsEstaPlata = 'me_pagaron' | 'parte_de_gasto' | 'paso_por_mi_cuenta'

export interface ArmarPedidoQueEsParams {
  opcionInicial: OpcionQueEsEstaPlata
  opcion: OpcionQueEsEstaPlata
  gastoId?: string | null
}

export type ResultadoArmarPedidoQueEs =
  | { accion: 'nada' }
  | { accion: 'error'; mensaje: string }
  | { accion: 'enviar'; payload: { opcion: OpcionQueEsEstaPlata; gasto_id?: string } }

export function armarPedidoQueEs(
  paramsOrInicial: ArmarPedidoQueEsParams | OpcionQueEsEstaPlata,
  opcionParam?: OpcionQueEsEstaPlata,
  gastoIdParam?: string | null
): ResultadoArmarPedidoQueEs {
  let opcionInicial: OpcionQueEsEstaPlata
  let opcion: OpcionQueEsEstaPlata
  let gastoId: string | null | undefined

  if (typeof paramsOrInicial === 'object' && paramsOrInicial !== null) {
    opcionInicial = paramsOrInicial.opcionInicial
    opcion = paramsOrInicial.opcion
    gastoId = paramsOrInicial.gastoId
  } else {
    opcionInicial = paramsOrInicial
    opcion = opcionParam!
    gastoId = gastoIdParam
  }

  if (opcion === 'parte_de_gasto') {
    if (!gastoId) {
      return { accion: 'error', mensaje: 'Elegí el gasto.' }
    }
    return {
      accion: 'enviar',
      payload: { opcion: 'parte_de_gasto', gasto_id: gastoId },
    }
  }

  if (opcion === opcionInicial) {
    return { accion: 'nada' }
  }

  return {
    accion: 'enviar',
    payload: { opcion },
  }
}

