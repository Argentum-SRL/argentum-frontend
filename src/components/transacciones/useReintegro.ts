import { useState, useMemo, useCallback } from 'react'
import type { Transaccion } from '@/types'
import transaccionService from '@/services/transaccion.service'
import { montoDesdePorcentaje } from '@/utils/ayudasEscritura'
import { armarPayloadReintegro } from '@/utils/reintegroPayload'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface UseReintegroOptions {
  transaccion?: Pick<Transaccion, 'id' | 'reintegro'> | null
  montoCompra: number | null
  fechaCompra: string
  moneda: 'ARS' | 'USD'
  isEdit: boolean
  onReintegroQuitado?: () => void
}

export function useReintegro({
  transaccion,
  montoCompra,
  fechaCompra,
  moneda,
  isEdit,
  onReintegroQuitado,
}: UseReintegroOptions) {
  const reintegroExistente = transaccion?.reintegro ?? null
  const teniaReintegroInicial = Boolean(reintegroExistente)
  const isCompraRecibidaInicial = Boolean(isEdit && reintegroExistente?.estado === 'recibido')

  const [tieneReintegro, setTieneReintegro] = useState<boolean>(teniaReintegroInicial)
  const [modoMonto, setModoMonto] = useState<'monto' | 'porcentaje' | 'todo'>('monto')
  const [montoManual, setMontoManual] = useState<number | null>(reintegroExistente?.monto ?? null)
  const [porcentaje, setPorcentaje] = useState<number | null>(null)
  const [yaRecibido, setYaRecibido] = useState<boolean>(
    reintegroExistente ? reintegroExistente.estado === 'recibido' : true
  )
  const [fechaRecibido, setFechaRecibido] = useState<string>(
    reintegroExistente?.fecha_recibido || todayLocal()
  )
  const [isQuitting, setIsQuitting] = useState(false)

  // Reset al cambiar transacción
  const [prevTx, setPrevTx] = useState(transaccion)
  if (transaccion !== prevTx) {
    setPrevTx(transaccion)
    const r = transaccion?.reintegro ?? null
    setTieneReintegro(Boolean(r))
    setModoMonto('monto')
    setMontoManual(r?.monto ?? null)
    setPorcentaje(null)
    setYaRecibido(r ? r.estado === 'recibido' : true)
    setFechaRecibido(r?.fecha_recibido || todayLocal())
  }

  // Monto calculado a partir del porcentaje
  const montoCalculadoPorcentaje = useMemo(() => {
    if (!montoCompra || !porcentaje || porcentaje <= 0) return null
    return montoDesdePorcentaje(montoCompra, porcentaje)
  }, [montoCompra, porcentaje])

  const montoFinal =
    modoMonto === 'todo' ? montoCompra : modoMonto === 'monto' ? montoManual : montoCalculadoPorcentaje

  const isCompraRecibida = isCompraRecibidaInicial && tieneReintegro

  const debeGuardarReintegro = teniaReintegroInicial || tieneReintegro

  const quitarReintegroInmediato = useCallback(async () => {
    if (transaccion?.id) {
      setIsQuitting(true)
      try {
        await transaccionService.quitarReintegro(transaccion.id)
      } finally {
        setIsQuitting(false)
      }
    }
    setTieneReintegro(false)
    setMontoManual(null)
    setPorcentaje(null)
    onReintegroQuitado?.()
  }, [transaccion?.id, onReintegroQuitado])

  const guardarReintegro = useCallback(async (txId: string) => {
    const res = armarPayloadReintegro({
      tieneReintegro,
      teniaReintegroInicial,
      isCompraRecibidaInicial,
      modoMonto,
      montoManual,
      porcentaje,
      montoCompra,
      yaRecibido,
      isEdit,
      fechaCompra,
      fechaRecibido,
      hoy: todayLocal(),
    })

    if (res.accion === 'quitar') {
      await transaccionService.quitarReintegro(txId)
    } else if (res.accion === 'guardar') {
      await transaccionService.setReintegro(txId, res.payload)
    }
  }, [
    tieneReintegro,
    teniaReintegroInicial,
    isCompraRecibidaInicial,
    modoMonto,
    montoManual,
    porcentaje,
    montoCompra,
    yaRecibido,
    isEdit,
    fechaCompra,
    fechaRecibido,
  ])

  return {
    tieneReintegro,
    setTieneReintegro,
    modoMonto,
    setModoMonto,
    montoManual,
    setMontoManual,
    porcentaje,
    setPorcentaje,
    yaRecibido,
    setYaRecibido,
    fechaRecibido,
    setFechaRecibido,
    montoCalculadoPorcentaje,
    montoFinal,
    isCompraRecibida,
    reintegroExistente,
    isQuitting,
    quitarReintegroInmediato,
    guardarReintegro,
    debeGuardarReintegro,
    moneda,
    montoCompra,
  }
}
