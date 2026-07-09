import React, { useState, useEffect, useMemo, useCallback } from 'react'
import SelectInput from '@/components/ui/SelectInput/SelectInput'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'
import type { TransaccionParseada, Categoria, DecisionesImportacion, TransaccionConfirmarItem } from '@/types'
import styles from './TablaPreviewImportacion.module.css'

interface TablaPreviewImportacionProps {
  transacciones: TransaccionParseada[]
  decisiones: DecisionesImportacion
  categorias: Categoria[]
  onChange: (payload: TransaccionConfirmarItem[]) => void
}

interface RowState {
  categoriaId: string | null
  incluir: boolean
}

export const TablaPreviewImportacion: React.FC<TablaPreviewImportacionProps> = ({
  transacciones,
  decisiones,
  categorias,
  onChange,
}) => {
  // Función para determinar si una transacción debe excluirse (no renderizarse)
  const isTxVisible = useCallback((tx: TransaccionParseada) => {
    // 1. Titulares seleccionados
    if (decisiones.titulares_seleccionados !== null) {
      if (!tx.titular_seccion || !decisiones.titulares_seleccionados.includes(tx.titular_seccion)) {
        return false
      }
    }
    // 2. Decisión cargos bancarios
    if (decisiones.decision_cargos_bancarios === 'ignorar' && tx.es_cargo_bancario) {
      return false
    }
    // 3. Moneda USD
    if (decisiones.billetera_usd_id === null && tx.moneda === 'USD') {
      return false
    }
    return true
  }, [decisiones])

  // Inicializar estado local lazily
  const [rowStates, setRowStates] = useState<RowState[]>(() => {
    const cargosBancariosCat = categorias.find(
      c => c.tipo === 'egreso' && c.nombre.toLowerCase().trim() === 'cargos bancarios'
    )

    return transacciones.map(tx => {
      const visible = isTxVisible(tx)
      if (!visible) {
        // Excluida por filtros
        return { incluir: false, categoriaId: null }
      }

      let defaultCatId: string | null = null
      if (tx.es_cargo_bancario && decisiones.decision_cargos_bancarios === 'importar') {
        defaultCatId = cargosBancariosCat?.id || null
      }

      return {
        incluir: tx.posible_duplicado ? false : true,
        categoriaId: defaultCatId,
      }
    })
  })

  // Opciones de categoría mapeadas para el SelectInput
  const selectOptions = useMemo(() => {
    const activeCats = categorias.filter(c => c.estado === 'activa' && c.tipo === 'egreso')
    const mapped = activeCats.map(cat => ({
      value: cat.id,
      label: cat.nombre,
      icon: <CategoriaIcon nombre={cat.nombre} size={16} />,
    }))

    return [
      { value: '', label: 'Sin categoría' },
      ...mapped,
    ]
  }, [categorias])

  // Función auxiliar para mapear el estado local al payload esperado por el backend
  const mapRowStatesToPayload = (states: RowState[]): TransaccionConfirmarItem[] => {
    return states.map(s => ({
      categoria_id: s.categoriaId,
      incluir: s.incluir,
    }))
  }

  // Notificar al componente padre cuando cambia el estado de alguna transacción (incluido el primer renderizado)
  useEffect(() => {
    onChange(mapRowStatesToPayload(rowStates))
  }, [rowStates, onChange])

  // Handlers para actualizar los estados locales
  const handleCheckboxChange = (idx: number, checked: boolean) => {
    setRowStates(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], incluir: checked }
      return next
    })
  }

  const handleCategoryChange = (idx: number, catId: string) => {
    const val = catId === '' ? null : catId
    setRowStates(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], categoriaId: val }
      return next
    })
  }

  // Contadores calculados reactivamente
  const importablesCount = useMemo(() => {
    return rowStates.reduce((acc, row, idx) => {
      const tx = transacciones[idx]
      if (tx && isTxVisible(tx) && row.incluir) {
        return acc + 1
      }
      return acc
    }, 0)
  }, [rowStates, transacciones, isTxVisible])

  const totalDetectadas = transacciones.length

  // Obtiene los tags correspondientes de una transacción
  const getTagsForTx = (tx: TransaccionParseada) => {
    const tags: string[] = []
    tags.push('NUEVA')
    if (tx.cuota_actual !== null && tx.cuota_total !== null) {
      tags.push('CUOTA')
    }
    if (tx.es_cargo_bancario) {
      tags.push('CARGO BANCARIO')
    }
    if (tx.posible_duplicado) {
      tags.push('POSIBLE DUPLICADO')
    }
    return tags
  }

  // Si no se cargó el estado local, mostrar spinner
  if (rowStates.length === 0) {
    return <div className={styles.loading}>Procesando vista previa...</div>
  }

  return (
    <div className={styles.wrapper}>
      {/* Contador superior en tiempo real */}
      <div className={styles.counter}>
        <strong>{importablesCount}</strong> transacciones para importar de <strong>{totalDetectadas}</strong> detectadas
      </div>

      {/* Vista Desktop: Tabla */}
      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCheck}>Incluir</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Tags</th>
              <th>Cuota</th>
              <th className={styles.thCat}>Categoría</th>
              <th className={styles.thMonto}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((tx, idx) => {
              if (!isTxVisible(tx)) return null
              const rowState = rowStates[idx]
              if (!rowState) return null

              const tags = getTagsForTx(tx)
              const formatFecha = tx.fecha.split('T')[0]

              return (
                <tr
                  key={`tx-row-${idx}`}
                  className={`${styles.tr} ${!rowState.incluir ? styles.trDisabled : ''}`}
                >
                  <td className={styles.tdCheck}>
                    <input
                      type="checkbox"
                      checked={rowState.incluir}
                      onChange={(e) => handleCheckboxChange(idx, e.target.checked)}
                      className={styles.checkbox}
                      aria-label="Incluir transacción"
                    />
                  </td>
                  <td className={styles.tdFecha}>{formatFecha}</td>
                  <td className={styles.tdDesc}>
                    <div className={styles.descText} title={tx.descripcion}>
                      {tx.descripcion}
                    </div>
                    {tx.titular_seccion && (
                      <span className={styles.titularLabel}>{tx.titular_seccion}</span>
                    )}
                  </td>
                  <td className={styles.tdTags}>
                    <div className={styles.tagsContainer}>
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className={`${styles.tagBadge} ${
                            tag === 'NUEVA' ? styles.tagNueva :
                            tag === 'CUOTA' ? styles.tagCuota :
                            tag === 'CARGO BANCARIO' ? styles.tagCargo :
                            styles.tagDuplicado
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.tdCuota}>
                    {tx.cuota_actual !== null && tx.cuota_total !== null ? (
                      <span className={styles.cuotaBadge}>
                        {tx.cuota_actual}/{tx.cuota_total}
                      </span>
                    ) : (
                      <span className={styles.cuotaNone}>-</span>
                    )}
                  </td>
                  <td className={styles.tdCat}>
                    <SelectInput
                      value={rowState.categoriaId || ''}
                      onChange={(val) => handleCategoryChange(idx, val)}
                      options={selectOptions}
                      placeholder="Seleccionar..."
                      className={styles.selectCat}
                      disabled={!rowState.incluir}
                    />
                  </td>
                  <td className={`${styles.tdMonto} ${tx.monto < 0 ? styles.montoEgreso : styles.montoIngreso}`}>
                    {formatMonto(tx.monto, tx.moneda)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile: Tarjetas Apiladas (sin scroll horizontal) */}
      <div className={styles.cardsList}>
        {transacciones.map((tx, idx) => {
          if (!isTxVisible(tx)) return null
          const rowState = rowStates[idx]
          if (!rowState) return null

          const tags = getTagsForTx(tx)
          const formatFecha = tx.fecha.split('T')[0]

          return (
            <div
              key={`tx-card-${idx}`}
              className={`${styles.card} ${!rowState.incluir ? styles.cardDisabled : ''}`}
            >
              {/* Encabezado: Fecha + Incluir */}
              <div className={styles.cardHeader}>
                <span className={styles.cardFecha}>{formatFecha}</span>
                <label className={styles.cardCheckLabel}>
                  <input
                    type="checkbox"
                    checked={rowState.incluir}
                    onChange={(e) => handleCheckboxChange(idx, e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.cardCheckText}>Incluir</span>
                </label>
              </div>

              {/* Cuerpo: Descripción y Titular */}
              <div className={styles.cardBody}>
                <div className={styles.cardDesc}>{tx.descripcion}</div>
                {tx.titular_seccion && (
                  <div className={styles.cardTitular}>Titular: {tx.titular_seccion}</div>
                )}
              </div>

              {/* Tags y Cuotas */}
              <div className={styles.cardRow}>
                <div className={styles.tagsContainer}>
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className={`${styles.tagBadge} ${
                        tag === 'NUEVA' ? styles.tagNueva :
                        tag === 'CUOTA' ? styles.tagCuota :
                        tag === 'CARGO BANCARIO' ? styles.tagCargo :
                        styles.tagDuplicado
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {tx.cuota_actual !== null && tx.cuota_total !== null && (
                  <span className={styles.cuotaBadge}>
                    Cuota {tx.cuota_actual}/{tx.cuota_total}
                  </span>
                )}
              </div>

              {/* Categoría e Importe */}
              <div className={styles.cardFooter}>
                <div className={styles.cardCatContainer}>
                  <span className={styles.cardLabel}>Categoría:</span>
                  <SelectInput
                    value={rowState.categoriaId || ''}
                    onChange={(val) => handleCategoryChange(idx, val)}
                    options={selectOptions}
                    placeholder="Seleccionar..."
                    className={styles.selectCatMobile}
                    disabled={!rowState.incluir}
                  />
                </div>
                <div className={`${styles.cardMonto} ${tx.monto < 0 ? styles.montoEgreso : styles.montoIngreso}`}>
                  {formatMonto(tx.monto, tx.moneda)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TablaPreviewImportacion
