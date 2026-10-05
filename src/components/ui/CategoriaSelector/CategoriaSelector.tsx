import React, { useState, useEffect, useMemo } from 'react'
import type { Categoria, Subcategoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import categoriaService from '@/services/categoria.service'
import styles from './CategoriaSelector.module.css'

const MAIN_CATS = [
  'alimentacion', 'transporte', 'gastronomia', 'restaurante', 'restaurantes', 'restaurantes y delivery',
  'salud', 'vivienda', 'servicios', 'entretenimiento', 'recreativo', 'indumentaria', 'educacion',
  'equipamiento del hogar', 'hogar', 'comunicacion', 'banco', 'empleo', 'trabajo independiente', 'inversiones y rentas',
]
const normText = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export interface CategoriaSelectorProps {
  categorias: Categoria[]
  categoriaId: string
  subcategoriaId: string
  onSelectCategoria: (id: string) => void
  onSelectSubcategoria: (id: string) => void
  tipo?: 'egreso' | 'ingreso'
  autoseleccionarPrimeraSubcategoria?: boolean
}

export const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  categorias,
  categoriaId,
  subcategoriaId,
  onSelectCategoria,
  onSelectSubcategoria,
  tipo = 'egreso',
  autoseleccionarPrimeraSubcategoria = false,
}) => {
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loadingSubcats, setLoadingSubcats] = useState(false)

  const displayCategorias = useMemo(() => {
    const filtered = categorias.filter(c => (!tipo || c.tipo === tipo) && normText(c.nombre) !== 'ahorro')
    return filtered.sort((a, b) => {
      const aNorm = normText(a.nombre)
      const bNorm = normText(b.nombre)
      const isAOtros = aNorm === 'otros' || aNorm === 'otro' || aNorm === 'otras' || aNorm === 'otros gastos' || aNorm === 'otros ingresos'
      const isBOtros = bNorm === 'otros' || bNorm === 'otro' || bNorm === 'otras' || bNorm === 'otros gastos' || bNorm === 'otros ingresos'
      if (isAOtros && !isBOtros) return 1
      if (!isAOtros && isBOtros) return -1
      if (isAOtros && isBOtros) return 0
      const ai = MAIN_CATS.indexOf(aNorm), bi = MAIN_CATS.indexOf(bNorm)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return aNorm.localeCompare(bNorm)
    })
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
  const currentCatNorm = useMemo(
    () => currentCat ? normText(currentCat.nombre) : '',
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
      .filter(s => normText(s.nombre) !== 'otros')
      .sort((a, b) => {
        const aNorm = normText(a.nombre)
        const bNorm = normText(b.nombre)
        const isAOtros = aNorm === 'otros' || aNorm === 'otro' || aNorm === 'otras' || aNorm === 'otros gastos' || aNorm === 'otros ingresos' || aNorm === 'varios'
        const isBOtros = bNorm === 'otros' || bNorm === 'otro' || bNorm === 'otras' || bNorm === 'otros gastos' || bNorm === 'otros ingresos' || bNorm === 'varios'
        if (isAOtros && !isBOtros) return 1
        if (!isAOtros && isBOtros) return -1
        if (isAOtros && isBOtros) return 0

        const ai = priorityList.indexOf(aNorm)
        const bi = priorityList.indexOf(bNorm)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1

        if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
          return a.orden - b.orden
        }

        return aNorm.localeCompare(bNorm)
      })
  }, [categoriaId, subcategorias, currentCatNorm])

  useEffect(() => {
    if (autoseleccionarPrimeraSubcategoria && !subcategoriaId && sortedSubcategorias.length > 0) {
      onSelectSubcategoria(sortedSubcategorias[0].id)
    }
  }, [autoseleccionarPrimeraSubcategoria, subcategoriaId, sortedSubcategorias, onSelectSubcategoria])

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
            <div className={styles.subcatLoading}>Cargando subcategorías...</div>
          ) : (
            sortedSubcategorias.map(sub => {
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
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoriaSelector
