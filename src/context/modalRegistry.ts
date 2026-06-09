import type { CreatePayload } from '@/components/billeteras/BankPickerModal'
import type { EditPayload } from '@/components/billeteras/EditBilleteraModal'
import type { ConfirmModalOptions } from '@/hooks/useModal'
import type { Billetera, Categoria, Proyeccion, Transaccion, TransaccionRecurrente, TarjetaCredito, Presupuesto } from '@/types'
import type { Goal } from '@/types/goals'
import type { TransaccionFilters } from '@/services/transaccion.service'

export interface ModalPayloadMap {
  bankPicker: {
    billeterasActuales: Billetera[]
    monedaPrincipalUsuario: 'ARS' | 'USD'
    onCrear: (payload: CreatePayload) => Promise<void>
  }
  editBilletera: {
    billetera: Billetera
    billeteraPrincipalActual?: Billetera
    onEditar: (id: string, payload: EditPayload) => Promise<void>
  }
  transaccion: {
    transaccion: Transaccion | null
    billeteras: Billetera[]
    categorias: Categoria[]
    tarjetas: TarjetaCredito[]
    onSuccess: () => Promise<void> | void
  }
  recurrente: {
    recurrente: TransaccionRecurrente | null
    billeteras: Billetera[]
    categorias: Categoria[]
    onSuccess: () => Promise<void> | void
  }
  tarjeta: {
    tarjeta: TarjetaCredito | null
    billeteras: Billetera[]
    billeteraId?: string
    onSuccess: () => Promise<void> | void
  }
  transaccionFilters: {
    filters: TransaccionFilters
    onFilterChange: (newFilters: TransaccionFilters) => void
    onClear: () => void
    billeteras: Billetera[]
    categorias: Categoria[]
    hasActiveFilters: boolean
  }
  proyeccion: {
    proyeccion: Proyeccion
  }
  balance_ciclo: Record<string, never>
  presupuesto: {
    presupuesto: Presupuesto | null
    categorias: Categoria[]
    onSuccess: () => Promise<void> | void
  }
  goal: {
    goal: Goal | null
    onSuccess: () => Promise<void> | void
  }
  goalContribution: {
    goal: Goal
    billeteras: Billetera[]
    onSuccess: () => Promise<void> | void
  }
  confirm: ConfirmModalOptions
}

export type ModalId = keyof ModalPayloadMap

export type ModalStateMap = {
  [K in ModalId]?: {
    isOpen: boolean
    data?: ModalPayloadMap[K]
    onClose?: () => void
  }
}
