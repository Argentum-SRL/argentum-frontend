import React, { useState, useEffect, useMemo } from 'react'
import type { Categoria, Subcategoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import categoriaService from '@/services/categoria.service'
import styles from './CategoriaSelector.module.css'

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

  const displayCategorias = useMemo(
    () => categorias.filter(c => !tipo || c.tipo === tipo),
    [categorias, tipo]
  )

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
  const currentCatNorm = useMemo(
    () => currentCat ? currentCat.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '',
    [currentCat]
  )

  const sortedSubcategorias = useMemo(() => {
    const PROBABILIDAD_SUBCATS: Record<string, string[]> = {
      transporte: ['taxi / apps', 'transporte publico', 'combustible', 'peajes', 'estacionamiento', 'mantenimiento y seguro del auto'],
      salud: ['farmacia', 'medico / consulta', 'obra social / prepaga', 'estudios y analisis', 'odontologia', 'terapias', 'deportes y gimnasio'],
      'equipamiento del hogar': ['limpieza', 'reparaciones', 'muebles y electrodomesticos'],
      hogar: ['limpieza', 'reparaciones', 'muebles y electrodomesticos'],
      vivienda: ['luz', 'gas', 'agua', 'alquiler', 'expensas', 'impuestos', 'seguros'],
      servicios: ['luz', 'gas', 'agua', 'alquiler', 'expensas', 'impuestos', 'seguros'],
      recreativo: ['salidas', 'hobbies y juegos', 'viajes'],
      alimentacion: ['supermercado', 'kiosco', 'verduleria', 'carniceria'],
      indumentaria: ['ropa', 'calzado', 'accesorios'],
      comunicacion: ['celular', 'internet y cable'],
      educacion: ['cuotas', 'materiales y libros', 'idiomas'],
      gastronomia: ['restaurantes', 'delivery', 'cafeteria'],
      'restaurantes y delivery': ['restaurantes', 'delivery', 'cafeteria'],
      otros: ['reintegros', 'cuidado personal', 'mascotas', 'regalos'],
      banco: ['comisiones y gastos bancarios', 'impuesto al cheque / movimientos', 'prestamos', 'intereses pagados'],
      empleo: ['sueldo', 'bonos y horas extras', 'aguinaldo'],
      'trabajo independiente': ['honorarios', 'venta de productos/servicios'],
      'inversiones y rentas': ['dividendos e intereses', 'alquileres cobrados'],
    }

    const priorityList = PROBABILIDAD_SUBCATS[currentCatNorm] || []

    const currentSubcats = categoriaId ? subcategorias : []
    return [...currentSubcats]
      .filter(s => s.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() !== 'otros')
      .sort((a, b) => {
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        const aNorm = norm(a.nombre)
        const bNorm = norm(b.nombre)

        const idxA = priorityList.indexOf(aNorm)
        const idxB = priorityList.indexOf(bNorm)

        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return a.nombre.localeCompare(b.nombre)
      })
  }, [categoriaId, subcategorias, currentCatNorm])

  if (!categoriaId) {
    return (
      <div className={styles.container}>
        <label className={styles.fieldLabel}>Categoría</label>
        <div className={styles.catGrid}>
          {displayCategorias.map(cat => (
            <button
              type="button"
              key={cat.id}
              className={`${styles.catBtn} ${categoriaId === cat.id ? styles.catBtnActive : ''}`}
              onClick={() => {
                onSelectCategoria(cat.id)
                onSelectSubcategoria('')
              }}
            >
              <CategoriaIcon nombre={cat.nombre} size={36} />
              <span className={styles.catName}>{cat.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.selectedCatBanner}>
        <div className={styles.selectedCatInfo}>
          <CategoriaIcon nombre={currentCat?.nombre} size={32} />
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
            <div className={styles.subcatLoading}>Cargando subcategorías...</div>
          ) : (
            sortedSubcategorias.map(sub => (
              <button
                type="button"
                key={sub.id}
                className={`${styles.subcatChip} ${subcategoriaId === sub.id ? styles.subcatChipActive : ''}`}
                onClick={() => onSelectSubcategoria(sub.id)}
              >
                <SubcategoriaIcon nombre={sub.nombre} parentCategory={currentCat?.nombre} size={32} />
                {sub.nombre}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoriaSelector
