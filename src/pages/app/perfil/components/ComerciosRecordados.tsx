import React, { useEffect, useState, useMemo } from 'react'
import { Receipt, Search, Trash2 } from '@/components/ui/icons'
import type { MemoriaComercio } from '@/types'
import memoriaComercioService from '@/services/memoriaComercio.service'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'
import { ComerciosRecordadosSkeleton } from '@/components/ui'
import styles from './ComerciosRecordados.module.css'

export const ComerciosRecordados: React.FC = () => {
  const { confirm } = useModal()
  const [comercios, setComercios] = useState<MemoriaComercio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleBorrar = (id: string, nombreComercio: string) => {
    confirm({
      title: `¿Borrar "${nombreComercio}"?`,
      description: 'La app dejará de sugerir automáticamente esta categoría al registrar movimientos. Tus gastos pasados no cambiarán.',
      variant: 'danger',
      confirmLabel: 'Borrar regla',
      onConfirm: async () => {
        try {
          await memoriaComercioService.eliminar(id)
          setComercios((prev) => prev.filter((c) => c.id !== id))
          sileo.success({ title: 'Comercio eliminado de la memoria' })
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos borrar el comercio recordado.') })
        }
      },
    })
  }

  const filteredComercios = useMemo(() => {
    if (!searchQuery.trim()) return comercios
    const q = searchQuery.toLowerCase().trim()
    return comercios.filter((c) => {
      const matchClave = c.clave.toLowerCase().includes(q)
      const matchCat = c.categoria_nombre?.toLowerCase().includes(q)
      const matchSub = c.subcategoria_nombre?.toLowerCase().includes(q)
      return matchClave || matchCat || matchSub
    })
  }, [comercios, searchQuery])

  return (
    <div className={styles.container}>
      {comercios.length > 3 && (
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar comercio o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar comercios recordados"
          />
        </div>
      )}

      {isLoading ? (
        <ComerciosRecordadosSkeleton count={3} />
      ) : comercios.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIconBox}>
            <Receipt size={20} />
          </div>
          <span className={styles.emptyTitle}>No hay comercios recordados</span>
          <p className={styles.emptyDesc}>
            Cuando categorices un movimiento en tus transacciones y confirmes recordarlo, Argentum aprenderá a clasificarlo automáticamente.
          </p>
        </div>
      ) : filteredComercios.length === 0 ? (
        <div className={styles.emptyCard}>
          <span className={styles.emptyTitle}>Sin coincidencias</span>
          <p className={styles.emptyDesc}>No encontramos comercios que coincidan con &ldquo;{searchQuery}&rdquo;.</p>
        </div>
      ) : (
        <div className={styles.listWrapper} role="list" aria-label="Lista de comercios recordados">
          {filteredComercios.map((comercio) => {
            const categoriaTexto = comercio.subcategoria_nombre
              ? `${comercio.categoria_nombre} › ${comercio.subcategoria_nombre}`
              : comercio.categoria_nombre || 'Sin categoría'

            return (
              <div key={comercio.id} className={styles.merchantRow} role="listitem">
                <div className={styles.merchantLeft}>
                  <div className={styles.merchantAvatar}>
                    <Receipt size={16} />
                  </div>
                  <div className={styles.merchantInfo}>
                    <span className={styles.merchantName} title={comercio.clave}>
                      {comercio.clave}
                    </span>
                    <span className={styles.categoryTag} title={categoriaTexto}>
                      {categoriaTexto}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBorrar(comercio.id, comercio.clave)}
                  className={styles.deleteBtn}
                  aria-label={`Borrar regla para ${comercio.clave}`}
                  title="Borrar regla"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ComerciosRecordados
