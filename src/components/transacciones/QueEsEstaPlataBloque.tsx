import SegmentedControl from '@/components/ui/SegmentedControl'
import { SelectableSurface } from '@/components/ui'
import MovimientoAvatar from '@/components/ui/MovimientoAvatar'
import { formatMonto } from '@/utils/format'
import type { Categoria } from '@/types'
import type { useQueEsEstaPlata } from './useQueEsEstaPlata'
import styles from './QueEsEstaPlataBloque.module.css'

function formatDDMM(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const clean = fechaIso.split('T')[0]
  const parts = clean.split('-')
  if (parts.length < 3) return fechaIso
  return `${parts[2]}/${parts[1]}`
}

export interface QueEsEstaPlataBloqueProps {
  hook: ReturnType<typeof useQueEsEstaPlata>
  moneda: string
  categorias?: Categoria[]
}

export function QueEsEstaPlataBloque({ hook, moneda, categorias }: QueEsEstaPlataBloqueProps) {
  const {
    opcion,
    setOpcion,
    gastoId,
    setGastoId,
    gastos,
    cargandoGastos,
  } = hook

  return (
    <div className={styles.container} data-modal-block>
      <h3 className={styles.titulo} data-modal-section-title>
        ¿Qué es esta plata?
      </h3>

      <div data-modal-field>
        <SegmentedControl<'me_pagaron' | 'parte_de_gasto' | 'paso_por_mi_cuenta'>
          layout="stacked"
          fullWidth
          ariaLabel="¿Qué es esta plata?"
          value={opcion}
          onChange={setOpcion}
          options={[
            { value: 'me_pagaron', label: 'Me pagaron' },
            { value: 'parte_de_gasto', label: 'Me devolvieron parte de un gasto' },
            { value: 'paso_por_mi_cuenta', label: 'Solo pasó por mi cuenta' },
          ]}
        />
      </div>

      {opcion === 'parte_de_gasto' && (
        <div className={styles.gastosSeccion} data-modal-field>
          <label className={styles.gastosLabel}>¿De qué gasto?</label>

          {cargandoGastos ? (
            <div className={styles.estadoTexto}>Buscando gastos…</div>
          ) : !gastos || gastos.length === 0 ? (
            <div className={styles.estadoTexto}>No encontramos gastos para elegir.</div>
          ) : (
            <div className={styles.gastosLista}>
              {gastos.map((g) => {
                const titulo = g.descripcion?.trim() || g.subcategoria_nombre || g.categoria_nombre || 'Gasto'
                const catNombre = g.categoria_nombre || categorias?.find((c) => c.id === g.categoria_id)?.nombre
                return (
                  <SelectableSurface
                    key={g.id}
                    selected={gastoId === g.id}
                    onClick={() => setGastoId(g.id)}
                    context="modal"
                    className={styles.gastoItem}
                    aria-label={`${titulo}, ${formatDDMM(g.fecha)}, monto ${formatMonto(g.monto, moneda)}`}
                  >
                    <div className={styles.gastoItemContent}>
                      <div className={styles.gastoPrincipal}>
                        <div className={styles.avatarContainer}>
                          <MovimientoAvatar
                            movimiento={{
                              descripcion: g.descripcion,
                              suscripcion_id: g.suscripcion_id,
                              subcategoria_nombre: g.subcategoria_nombre,
                              categoria_nombre: catNombre,
                              tipo: 'egreso',
                            }}
                            size={18}
                            className={styles.avatarIcon}
                          />
                        </div>
                        <span className={styles.gastoTitulo} title={titulo}>
                          {titulo}
                        </span>
                      </div>
                      <span className={styles.gastoDetalle}>
                        {formatDDMM(g.fecha)} · {formatMonto(g.monto, moneda)}
                      </span>
                    </div>
                  </SelectableSurface>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QueEsEstaPlataBloque

