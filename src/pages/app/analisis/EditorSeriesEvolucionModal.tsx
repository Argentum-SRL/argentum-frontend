import { useState, type DragEvent } from 'react'
import Modal from '@/components/ui/Modal/Modal'
import { Button } from '@/components/ui'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { ChevronDown, ChevronRight, X, Sparkles } from '@/components/ui/icons'
import type {
  AnalisisCategoriaItem,
  AnalisisSubcategoriaItem,
  SerieEvolucionPersonalizada,
} from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'
import styles from './EditorSeriesEvolucionModal.module.css'

const PALETA_SERIES_EVOLUCION = [
  '#2563EB', // Azul real
  '#10B981', // Esmeralda
  '#F59E0B', // Ámbar
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#14B8A6', // Teal
  '#6366F1', // Índigo
  '#84CC16', // Lima
]

interface EditorSeriesEvolucionModalProps {
  isOpen: boolean
  onClose: () => void
  categorias: AnalisisCategoriaItem[]
  monedaVisual: 'ARS' | 'USD'
  seriesActivas: SerieEvolucionPersonalizada[]
  onChangeSeries: (nuevas: SerieEvolucionPersonalizada[]) => void
}

export default function EditorSeriesEvolucionModal({
  isOpen,
  onClose,
  categorias,
  monedaVisual,
  seriesActivas,
  onChangeSeries,
}: EditorSeriesEvolucionModalProps) {
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    if (categorias[0]) {
      initial[categorias[0].categoria_id ?? 'sin-categoria'] = true
    }
    return initial
  })
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const toggleExpandCat = (catKey: string) => {
    setExpandedCatIds((prev) => ({ ...prev, [catKey]: !prev[catKey] }))
  }

  const nextColorFor = (currentList: SerieEvolucionPersonalizada[]): string => {
    const used = new Set(currentList.map((s) => s.color))
    const available = PALETA_SERIES_EVOLUCION.find((c) => !used.has(c))
    return available ?? PALETA_SERIES_EVOLUCION[currentList.length % PALETA_SERIES_EVOLUCION.length]
  }

  const toggleCategoriaCompleta = (cat: AnalisisCategoriaItem) => {
    const catId = cat.categoria_id ?? 'sin-categoria'
    const key = `cat:${catId}`
    const exists = seriesActivas.some((s) => s.key === key)
    if (exists) {
      onChangeSeries(seriesActivas.filter((s) => s.key !== key))
    } else {
      const nueva: SerieEvolucionPersonalizada = {
        key,
        tipo: 'categoria',
        id: catId,
        nombre: cat.categoria_nombre,
        color: nextColorFor(seriesActivas),
      }
      onChangeSeries([...seriesActivas, nueva])
    }
  }

  const toggleSubcategoria = (cat: AnalisisCategoriaItem, sub: AnalisisSubcategoriaItem) => {
    const catId = cat.categoria_id ?? 'sin-categoria'
    const subIdCompuesto =
      sub.subcategoria_id === 'general' ? `${catId}:general` : sub.subcategoria_id
    const key = `sub:${subIdCompuesto}`
    const exists = seriesActivas.some((s) => s.key === key)
    if (exists) {
      onChangeSeries(seriesActivas.filter((s) => s.key !== key))
    } else {
      const nueva: SerieEvolucionPersonalizada = {
        key,
        tipo: 'subcategoria',
        id: subIdCompuesto,
        nombre: sub.subcategoria_nombre,
        categoriaPadreNombre: cat.categoria_nombre,
        color: nextColorFor(seriesActivas),
      }
      onChangeSeries([...seriesActivas, nueva])
    }
  }

  const agregarTodasLasSubcategorias = (cat: AnalisisCategoriaItem) => {
    const catId = cat.categoria_id ?? 'sin-categoria'
    // Quitamos la categoría consolidada si estaba puesta y sumamos cada subcategoría por separado
    const baseSinCat = seriesActivas.filter((s) => s.key !== `cat:${catId}`)
    const nuevas = [...baseSinCat]

    for (const sub of cat.subcategorias) {
      const subIdCompuesto =
        sub.subcategoria_id === 'general' ? `${catId}:general` : sub.subcategoria_id
      const key = `sub:${subIdCompuesto}`
      if (!nuevas.some((s) => s.key === key)) {
        nuevas.push({
          key,
          tipo: 'subcategoria',
          id: subIdCompuesto,
          nombre: sub.subcategoria_nombre,
          categoriaPadreNombre: cat.categoria_nombre,
          color: nextColorFor(nuevas),
        })
      }
    }
    onChangeSeries(nuevas)
  }

  const handleDragStartCat = (e: DragEvent<HTMLElement>, cat: AnalisisCategoriaItem) => {
    const catId = cat.categoria_id ?? 'sin-categoria'
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        tipo: 'categoria',
        id: catId,
        nombre: cat.categoria_nombre,
      })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragStartSub = (
    e: DragEvent<HTMLElement>,
    cat: AnalisisCategoriaItem,
    sub: AnalisisSubcategoriaItem
  ) => {
    const catId = cat.categoria_id ?? 'sin-categoria'
    const subIdCompuesto =
      sub.subcategoria_id === 'general' ? `${catId}:general` : sub.subcategoria_id
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        tipo: 'subcategoria',
        id: subIdCompuesto,
        nombre: sub.subcategoria_nombre,
        categoriaPadreNombre: cat.categoria_nombre,
      })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDropOnZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const raw = e.dataTransfer.getData('application/json')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as {
        tipo: 'categoria' | 'subcategoria'
        id: string
        nombre: string
        categoriaPadreNombre?: string
      }
      const key = `${parsed.tipo === 'categoria' ? 'cat' : 'sub'}:${parsed.id}`
      if (seriesActivas.some((s) => s.key === key)) return
      onChangeSeries([
        ...seriesActivas,
        {
          key,
          tipo: parsed.tipo,
          id: parsed.id,
          nombre: parsed.nombre,
          categoriaPadreNombre: parsed.categoriaPadreNombre,
          color: nextColorFor(seriesActivas),
        },
      ])
    } catch {
      // Ignorar payload inválido
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar qué ver en el gráfico"
      size="xl"
      footer={
        <div className={styles.modalFooterActions}>
          {seriesActivas.length > 0 && (
            <Button variant="secondary" onClick={() => onChangeSeries([])}>
              Volver a Ingresos vs. Gastos
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Listo
          </Button>
        </div>
      }
    >
      <div className={styles.editorWrap} data-modal-block>
        <div className={styles.introBanner}>
          <span>
            Arrastrá o tocá <strong>categorías enteras</strong> (ej. Hogar) o{' '}
            <strong>subcategorías individuales</strong> (ej. cada servicio) para compararlas en
            barras separadas ciclo a ciclo.
          </span>
          {seriesActivas.length > 0 && (
            <button
              type="button"
              className={styles.resetDefaultBtn}
              onClick={() => onChangeSeries([])}
            >
              Ver Ingresos y Egresos
            </button>
          )}
        </div>

        <div className={styles.columnsGrid}>
          {/* Columna izquierda: Catálogo de Categorías y Subcategorías */}
          <div className={styles.catalogColumn}>
            <h3 className={styles.columnHeading}>1. Categorías y subcategorías (arrastrá o tocá)</h3>
            <div className={styles.catalogScroll}>
              {categorias.map((cat) => {
                const catKey = cat.categoria_id ?? 'sin-categoria'
                const isExpanded = Boolean(expandedCatIds[catKey])
                const isCatAdded = seriesActivas.some((s) => s.key === `cat:${catKey}`)

                return (
                  <div key={catKey} className={styles.catCard}>
                    <div
                      className={styles.catHeaderBar}
                      draggable
                      onDragStart={(e) => handleDragStartCat(e, cat)}
                    >
                      <button
                        type="button"
                        className={styles.catExpandBtn}
                        onClick={() => toggleExpandCat(catKey)}
                      >
                        <span className={styles.chevronBox}>
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </span>
                        <CategoriaIcon nombre={cat.categoria_nombre} size={26} />
                        <div className={styles.catMetaStack}>
                          <span className={styles.catNameText}>{cat.categoria_nombre}</span>
                          <span className={styles.catAmountText}>
                            {formatMonto(cat.monto, monedaVisual)} · {cat.subcategorias.length}{' '}
                            {cat.subcategorias.length === 1 ? 'subcat.' : 'subcats.'}
                          </span>
                        </div>
                      </button>

                      <div className={styles.catQuickBtns}>
                        <button
                          type="button"
                          className={`${styles.addWholeCatBtn} ${
                            isCatAdded ? styles.addWholeCatBtnActive : ''
                          }`}
                          onClick={() => toggleCategoriaCompleta(cat)}
                          title="Ver toda la categoría junta en una barra"
                        >
                          {isCatAdded ? '✓ En gráfico' : '+ Todo junto'}
                        </button>
                        {cat.subcategorias.length > 1 && (
                          <button
                            type="button"
                            className={styles.splitSubsBtn}
                            onClick={() => agregarTodasLasSubcategorias(cat)}
                            title="Ver cada subcategoría en una barra separada"
                          >
                            Separar ({cat.subcategorias.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.subsContainer}>
                        {cat.subcategorias.map((sub) => {
                          const subIdCompuesto =
                            sub.subcategoria_id === 'general'
                              ? `${catKey}:general`
                              : sub.subcategoria_id
                          const isSubAdded = seriesActivas.some(
                            (s) => s.key === `sub:${subIdCompuesto}`
                          )
                          return (
                            <button
                              key={sub.subcategoria_id}
                              type="button"
                              draggable
                              onDragStart={(e) => handleDragStartSub(e, cat, sub)}
                              onClick={() => toggleSubcategoria(cat, sub)}
                              className={`${styles.subDraggablePill} ${
                                isSubAdded ? styles.subDraggablePillActive : ''
                              }`}
                            >
                              <div className={styles.subLeftIdentity}>
                                <SubcategoriaIcon
                                  nombre={sub.subcategoria_nombre}
                                  parentCategory={cat.categoria_nombre}
                                  size={22}
                                />
                                <span className={styles.subLabelText}>
                                  {sub.subcategoria_nombre}
                                </span>
                              </div>
                              <span className={styles.subRightAmount}>
                                {isSubAdded ? '✓ ' : '+ '}
                                {formatMonto(sub.monto, monedaVisual)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Columna derecha: Zona de Drop / Series activas en el gráfico */}
          <div className={styles.dropColumn}>
            <h3 className={styles.columnHeading}>
              2. Barras activas por período ({seriesActivas.length || 'Modo Ingresos vs. Gastos'})
            </h3>
            <div
              className={`${styles.dropZoneBox} ${isDraggingOver ? styles.dropZoneBoxActive : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropOnZone}
            >
              {seriesActivas.length === 0 ? (
                <div className={styles.emptyDropState}>
                  <Sparkles size={26} />
                  <p className={styles.emptyDropTitle}>
                    Vista por defecto: Ingresos vs. Gastos
                  </p>
                  <p className={styles.emptyDropHint}>
                    Arrastrá cualquier categoría o subcategoría hasta este recuadro para ver su
                    evolución ciclo a ciclo en barras separadas.
                  </p>
                </div>
              ) : (
                seriesActivas.map((item) => (
                  <div key={item.key} className={styles.activeChipItem}>
                    <div className={styles.chipLeftInfo}>
                      <span
                        className={styles.colorSwatchDot}
                        style={{ backgroundColor: item.color }}
                      />
                      <div className={styles.chipTextStack}>
                        <span className={styles.chipMainName}>{item.nombre}</span>
                        <span className={styles.chipSubType}>
                          {item.tipo === 'categoria'
                            ? 'Categoría completa (todo junto)'
                            : `Subcategoría de ${item.categoriaPadreNombre ?? 'Categoría'}`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.removeChipBtn}
                      onClick={() =>
                        onChangeSeries(seriesActivas.filter((s) => s.key !== item.key))
                      }
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
