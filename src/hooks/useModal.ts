import { useContext } from 'react'
import { ModalContext } from '@/context/ModalContext'
import type { ModalId, ModalPayloadMap } from '@/context/modalRegistry'

export interface ConfirmModalOptions {
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  requireTyping?: string
}

interface UseModalOptions<K extends ModalId = ModalId> {
  data?: ModalPayloadMap[K]
  onClose?: () => void
}

export function useModal() {
  const context = useContext(ModalContext)

  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }

  return {
    open: <K extends ModalId>(modalId: K, options: UseModalOptions<K> = {}) => {
      context.openModal(modalId, options)
    },
    close: (modalId: ModalId) => {
      context.closeModal(modalId)
    },
    closeAll: () => {
      context.closeAll()
    },
    isOpen: (modalId: ModalId) => context.isModalOpen(modalId),
    getData: <K extends ModalId>(modalId: K) => context.getModalData(modalId),
    confirm: (options: ConfirmModalOptions) => {
      context.openModal('confirm', { data: options })
    },
  }
}