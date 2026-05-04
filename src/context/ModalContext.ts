import { createContext } from 'react'
import type { ModalId, ModalPayloadMap, ModalStateMap } from '@/context/modalRegistry'

export interface OpenModalOptions<K extends ModalId = ModalId> {
  data?: ModalPayloadMap[K]
  onClose?: () => void
}

export interface ModalContextValue {
  modals: ModalStateMap
  openModal: <K extends ModalId>(modalId: K, options?: OpenModalOptions<K>) => void
  closeModal: (modalId: ModalId) => void
  closeAll: () => void
  isModalOpen: (modalId: ModalId) => boolean
  getModalData: <K extends ModalId>(modalId: K) => ModalPayloadMap[K] | undefined
}

export const ModalContext = createContext<ModalContextValue | undefined>(undefined)