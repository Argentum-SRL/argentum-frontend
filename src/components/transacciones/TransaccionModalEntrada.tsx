import { useState, useEffect } from 'react'
// Canónico R11: este wrapper delega en modales que usan @/components/ui/Modal
import TransaccionModal, { type TransaccionModalProps } from './TransaccionModal'
import QueEsEstaPlataModal from './QueEsEstaPlataModal'
import transaccionService from '@/services/transaccion.service'
import type { Transaccion } from '@/types'

export type TransaccionModalEntradaProps = TransaccionModalProps

export function TransaccionModalEntrada(props: TransaccionModalEntradaProps) {
  const { open, transaccion } = props

  const isEspejoParte = Boolean(
    transaccion?.reintegro_de_id && transaccion?.tipo_espejo === 'parte'
  )
  const isEspejoReintegro = Boolean(
    transaccion?.reintegro_de_id && transaccion?.tipo_espejo !== 'parte'
  )

  const [compraPadre, setCompraPadre] = useState<Transaccion | null>(null)
  const [cargandoCompra, setCargandoCompra] = useState<boolean>(false)

  const [prevTargetId, setPrevTargetId] = useState<string | null>(null)
  const currentTargetId = open && isEspejoReintegro ? (transaccion?.reintegro_de_id ?? null) : null
  if (currentTargetId !== prevTargetId) {
    setPrevTargetId(currentTargetId)
    setCargandoCompra(Boolean(currentTargetId))
    setCompraPadre(null)
  }

  useEffect(() => {
    if (currentTargetId) {
      let active = true
      transaccionService
        .getTransaccion(currentTargetId)
        .then((compra) => {
          if (active) {
            setCompraPadre(compra)
            setCargandoCompra(false)
          }
        })
        .catch((err) => {
          console.error(err)
          if (active) setCargandoCompra(false)
        })
      return () => {
        active = false
      }
    }
  }, [currentTargetId])

  if (!open) return null

  // Caso 1: Espejo con tipo_espejo "parte"
  if (isEspejoParte && transaccion) {
    return (
      <QueEsEstaPlataModal
        open={open}
        onClose={props.onClose}
        transaccion={transaccion}
        onSuccess={(tx) => props.onSuccess?.(tx ?? undefined)}
      />
    )
  }

  // Caso 2: Espejo "reintegro" (o sin tipo)
  if (isEspejoReintegro) {
    if (cargandoCompra || !compraPadre) {
      // Mientras carga, nada
      return null
    }
    return <TransaccionModal {...props} transaccion={compraPadre} />
  }

  // Caso 3: Sin reintegro_de_id -> TransaccionModal igual que hoy
  return <TransaccionModal {...props} />
}

export default TransaccionModalEntrada

