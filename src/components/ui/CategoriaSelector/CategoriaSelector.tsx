import React, { useState, useEffect, useMemo } from 'react'
import type { Categoria, Subcategoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { Skeleton } from '../Skeleton'
import categoriaService from '@/services/categoria.service'
import styles from './CategoriaSelector.module.css'

const normText = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export interface CategoriaSelectorProps {
  categorias: Categoria[]
  categoriaId: string
  subcategoriaId: string
  onSelectCategoria: (id: string) => void
  onSelectSubcategoria: (id: string) => void
  tipo?: 'egreso' | 'ingreso'
}

export const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  categorias,
  categoriaId,
  subcategoriaId,
  onSelectCategoria,
  onSelectSubcategoria,
  tipo = 'egreso',
}) => {
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingSubcats, setLoadingSubcats] = useState(false)

  const displayCategorias = useMemo(() => {
    const filtered = categorias.filter(c => (!tipo || c.tipo === tipo) && normText(c.nombre) !== 'ahorro')
    return filtered.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  }, [categorias, tipo])

  useEffect(() => {
    if (!categoriaId) return

    let active = true
    const fetchSubcats = async () => {
      setLoadingSubcats(true)
      try {
        const data = await categoriaService.getSubcategorias(categoriaId)
        if (active) setSubcategorias(data)
      } catch (e) {
        console.error('Error fetching subcategorias:', e)
      } finally {
        if (active) setLoadingSubcats(false)
      }
    }

    fetchSubcats()
    return () => {
      active = false
    }
  }, [categoriaId])

  const currentCat = useMemo(
    () => categorias.find(c => c.id === categoriaId),
    [categorias, categoriaId]
  )

  const sortedSubcategorias = useMemo(() => {
    const currentSubcats = categoriaId ? subcategorias : []
    return [...currentSubcats]
      .filter(s => {
        if (normText(s.nombre) === 'otros') return false
        // Las de sistema no se muestran salvo que sean la subcategoría actual del movimiento
        if (s.es_sistema && s.id !== subcategoriaId) return false
        return true
      })
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  }, [categoriaId, subcategorias, subcategoriaId])

  if (!categoriaId) {
    return (
      <div className={styles.container}>
        <label className={styles.fieldLabel}>Categoría</label>
        <div className={styles.catGrid}>
          {displayCategorias.map(cat => {
            const isActive = categoriaId === cat.id
            return (
              <button
                type="button"
                key={cat.id}
                data-active={isActive}
                className={`${styles.catBtn} ${isActive ? styles.catBtnActive : ''}`}
                title={`Categoría ${cat.nombre}`}
                aria-label={`Seleccionar categoría ${cat.nombre}`}
                onClick={() => {
                  onSelectCategoria(cat.id)
                  onSelectSubcategoria('')
                }}
              >
                <div className={styles.catIconWrapper}>
                  <CategoriaIcon nombre={cat.nombre} size={36} />
                </div>
                <span className={styles.catName}>{cat.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const isOtrosActive = !subcategoriaId

  return (
    <div className={styles.container}>
      <div className={styles.selectedCatBanner}>
        <div className={styles.selectedCatInfo}>
          <div className={styles.selectedCatIconWrap}>
            <CategoriaIcon nombre={currentCat?.nombre} size={32} />
          </div>
          <div className={styles.selectedCatText}>
            <span className={styles.selectedCatLabel}>Categoría</span>
            <span className={styles.selectedCatName}>{currentCat?.nombre}</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.changeCatBtn}
          onClick={() => {
            onSelectCategoria('')
            onSelectSubcategoria('')
          }}
        >
          Cambiar
        </button>
      </div>

      <div className={styles.subcatContainer}>
        <label className={styles.fieldLabel}>Subcategoría</label>
        <div className={styles.subcatGrid}>
          {loadingSubcats ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--surface-alt)', borderRadius: '10px' }} aria-hidden="true">
                  <Skeleton variant="rounded" width={24} height={24} borderRadius={6} />
                  <Skeleton variant="text" width="60%" height={12} />
                </div>
              ))}
            </>
          ) : (
            <>
              {sortedSubcategorias.map(sub => {
                const isSubActive = subcategoriaId === sub.id
                return (
                  <button
                    type="button"
                    key={sub.id}
                    data-active={isSubActive}
                    className={`${styles.subcatChip} ${isSubActive ? styles.subcatChipActive : ''}`}
                    onClick={() => onSelectSubcategoria(sub.id)}
                  >
                    <SubcategoriaIcon nombre={sub.nombre} parentCategory={currentCat?.nombre} size={28} />
                    <span>{sub.nombre}</span>
                  </button>
                )
              })}
              <button
                type="button"
                key="subcat-otros-vacia"
                data-active={isOtrosActive}
                className={`${styles.subcatChip} ${isOtrosActive ? styles.subcatChipActive : ''}`}
                onClick={() => onSelectSubcategoria('')}
              >
                <CategoriaIcon nombre={currentCat?.nombre} size={28} />
                <span>Otros</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoriaSelector
