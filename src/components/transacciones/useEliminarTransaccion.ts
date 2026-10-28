import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import transaccionService from '@/services/transaccion.service'
import type { Transaccion } from '@/types'

interface UseEliminarTransaccionProps {
  transaccion?: Transaccion | null
  isCuotaHija: boolean
  onSuccess: (tx?: Transaccion | null) => void
  onClose: () => void
}

export function useEliminarTransaccion({
  transaccion,
  isCuotaHija,
  onSuccess,
  onClose,
}: UseEliminarTransaccionProps) {
  const { confirm } = useModal()

  const handleDeleteTransaction = () => {
    if (!transaccion) return

    if (isCuotaHija) {
      confirm({
        title: '¿Eliminar esta cuota?',
        description: 'Se eliminará únicamente esta cuota pendiente. El resto de las cuotas y la compra se mantendrán intactas.',
        variant: 'danger',
        confirmLabel: 'Eliminar cuota',
        onConfirm: async () => {
          try {
            await transaccionService.deleteCuotaIndividual(transaccion.id)
            sileo.success({ title: 'Cuota eliminada correctamente' })
            onSuccess()
            onClose()
          } catch (e) {
            console.error(e)
            sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar la cuota') })
          }
        },
      })
      return
    }

    confirm({
      title: '¿Eliminar transacción?',
      description: 'Esta acción no se puede deshacer y restaurará el saldo correspondiente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(transaccion.id)
          sileo.success({ title: 'Transacción eliminada correctamente' })
          onSuccess()
          onClose()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar la transacción') })
        }
      },
    })
  }

  return { handleDeleteTransaction }
}

