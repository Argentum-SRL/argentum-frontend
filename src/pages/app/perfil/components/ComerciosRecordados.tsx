import React, { useEffect, useState } from 'react'
import { Receipt } from '@/components/ui/icons'
import type { MemoriaComercio } from '@/types'
import memoriaComercioService from '@/services/memoriaComercio.service'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from '../PerfilPage.module.css'
import { ComerciosRecordadosSkeleton } from '@/components/ui'

export const ComerciosRecordados: React.FC = () => {
  const { confirm } = useModal()
  const [comercios, setComercios] = useState<MemoriaComercio[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    memoriaComercioService
      .listar(controller.signal)
      .then(setComercios)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos cargar los comercios recordados.') })
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  const handleBorrar = (id: string) => {
    confirm({
      title: '¿Borrar este comercio?',
      description: 'La app deja de sugerir esa categoría. Tus movimientos no cambian.',
      variant: 'danger',
      confirmLabel: 'Borrar',
      onConfirm: async () => {
        try {
          await memoriaComercioService.eliminar(id)
          setComercios((prev) => prev.filter((c) => c.id !== id))
          sileo.success({ title: 'Listo, ya no lo recuerda.' })
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos borrar el comercio recordado.') })
        }
      },
    })
  }

  return (
    <section className={`${styles.sectionCard} ${styles.tabGridFullCol}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIconWrap}>
          <Receipt size={18} />
        </div>
        <div className={styles.sectionHeaderText}>
          <h3>Comercios recordados</h3>
          <p>Cuando cambiás la categoría de un comercio y decís que sí, la app la recuerda. Si te equivocaste, borrala.</p>
        </div>
      </div>

      <div className={styles.contactList}>
        {isLoading ? (
          <ComerciosRecordadosSkeleton count={3} />
        ) : comercios.length === 0 ? (
          <div className={styles.contactItemBox}>
            <span className={styles.contactItemValue}>Todavía no hay comercios recordados.</span>
          </div>
        ) : (
          comercios.map((comercio) => {
            const categoriaTexto = comercio.subcategoria_nombre
              ? `${comercio.categoria_nombre} > ${comercio.subcategoria_nombre}`
              : comercio.categoria_nombre || ''

            return (
              <div key={comercio.id} className={styles.contactItemBox}>
                <div className={styles.contactItemInfo}>
                  <div className={styles.contactItemLabelRow}>
                    <span className={styles.contactItemLabel}>{comercio.clave}</span>
                  </div>
                  <span className={styles.contactItemValue}>{categoriaTexto}</span>
                </div>
                <div className={styles.contactItemAction}>
                  <button
                    type="button"
                    onClick={() => handleBorrar(comercio.id)}
                    className={styles.unlinkContactBtn}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default ComerciosRecordados

