import { useCallback, useState, type ReactNode } from 'react'
import { ModalContext } from '@/context/ModalContext'
import type { ModalId, ModalPayloadMap, ModalStateMap } from '@/context/modalRegistry'

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = useState<ModalStateMap>({})

  const openModal = useCallback(<K extends ModalId>(modalId: K, options: { data?: ModalPayloadMap[K]; onClose?: () => void } = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalId]: {
        isOpen: true,
        data: options.data,
        onClose: options.onClose,
      },
    }))
  }, [])

  const closeModal = useCallback((modalId: ModalId) => {
    let onClose: (() => void) | undefined

    setModals((prev) => {
      const modal = prev[modalId]
      onClose = modal?.onClose

      if (!modal) return prev

      return {
        ...prev,
        [modalId]: { isOpen: false, data: undefined, onClose: undefined },
      }
    })

    onClose?.()
  }, [])

  const closeAll = useCallback(() => {
    const callbacks: Array<() => void> = []

    setModals((prev) => {
      const next = { ...prev }

      Object.keys(next).forEach((key) => {
        const modal = next[key]
        if (modal?.onClose) {
          callbacks.push(modal.onClose)
        }
        next[key] = { isOpen: false, data: undefined, onClose: undefined }
      })

      return next
    })

    callbacks.forEach((callback) => callback())
  }, [])

  const isModalOpen = useCallback(
    (modalId: ModalId) => modals[modalId]?.isOpen ?? false,
    [modals],
  )

  const getModalData = useCallback(
    <K extends ModalId>(modalId: K) => modals[modalId]?.data,
    [modals],
  )

  return (
    <ModalContext.Provider
      value={{
        modals,
        openModal,
        closeModal,
        closeAll,
        isModalOpen,
        getModalData,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}