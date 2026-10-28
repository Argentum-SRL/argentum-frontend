import { useState, useCallback, useMemo } from 'react'
import type { GastoParaVincular } from '@/types'
import transaccionService from '@/services/transaccion.service'
import { useSimulacionBackend } from '@/hooks/useSimulacionBackend'
import {
  armarPedidoQueEs,
  type OpcionQueEsEstaPlata,
  type ResultadoArmarPedidoQueEs,
} from '@/utils/queEsEstaPlata'

export interface UseQueEsEstaPlataOptions {
  subcategoriaNombre?: string | null
  moneda: string
  fecha: string
  monto: number | null
}

export function useQueEsEstaPlata({
  subcategoriaNombre,
  moneda,
  fecha,
  monto,
}: UseQueEsEstaPlataOptions) {
  const isPasoPorMiCuenta = useMemo(() => {
    const s = subcategoriaNombre?.trim().toLowerCase()
    return s === 'pasó por mi cuenta' || s === 'paso por mi cuenta'
  }, [subcategoriaNombre])

  const opcionInicial: OpcionQueEsEstaPlata = isPasoPorMiCuenta
    ? 'paso_por_mi_cuenta'
    : 'me_pagaron'

  const [opcion, setOpcion] = useState<OpcionQueEsEstaPlata>(opcionInicial)
  const [gastoId, setGastoId] = useState<string | null>(null)

  const [prevInicial, setPrevInicial] = useState<OpcionQueEsEstaPlata>(opcionInicial)
  if (opcionInicial !== prevInicial) {
    setPrevInicial(opcionInicial)
    setOpcion(opcionInicial)
    setGastoId(null)
  }

  const claveSimulacion = useMemo(() => {
    if (!moneda || !fecha || !monto || monto <= 0) return null
    return `${moneda}|${fecha}|${monto}`
  }, [moneda, fecha, monto])

  const pedirGastos = useCallback(
    (signal: AbortSignal) =>
      transaccionService.getGastosParaVincular(
        {
          moneda: moneda as 'ARS' | 'USD',
          fecha,
          monto: Number(monto),
        },
        signal
      ),
    [moneda, fecha, monto]
  )

  const { datos: gastos, cargando: cargandoGastos } = useSimulacionBackend<GastoParaVincular[]>(
    opcion === 'parte_de_gasto' ? claveSimulacion : null,
    pedirGastos
  )

  const armarPedido = useCallback((): ResultadoArmarPedidoQueEs => {
    return armarPedidoQueEs({
      opcionInicial,
      opcion,
      gastoId,
    })
  }, [opcionInicial, opcion, gastoId])

  const validar = useCallback((): { valido: boolean; mensaje?: string } => {
    const pedido = armarPedido()
    if (pedido.accion === 'error') {
      return { valido: false, mensaje: pedido.mensaje }
    }
    return { valido: true }
  }, [armarPedido])

  const responderQueEs = useCallback(
    async (transaccionId: string, clave?: string) => {
      const pedido = armarPedido()
      if (pedido.accion === 'enviar') {
        await transaccionService.responderQueEsEstaPlata(
          transaccionId,
          pedido.payload,
          clave
        )
      }
    },
    [armarPedido]
  )

  return {
    opcion,
    setOpcion,
    gastoId,
    setGastoId,
    gastos,
    cargandoGastos,
    validar,
    responderQueEs,
    opcionInicial,
  }
}

