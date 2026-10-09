import React, { useState, useEffect, useCallback, useRef } from 'react'
import { sileo } from 'sileo'
import { AlertCircle, RefreshCw, ChevronDown } from '@/components/ui/icons'
import { Inbox } from 'lucide-react'
import { getErrorMessage } from '@/utils/errorMessages'
import patronesService from '@/services/patrones.service'
import type {
  PatronesResumen,
  ItemIngreso,
  ItemRepetido,
} from '@/types'
import {
  TEXTOS,
  armarEncabezadoDescripcion,
  armarTotalSeccion,
  armarMontoItem,
  armarDetalleIngreso,
  armarDetalleFijo,
  armarDetalleCostumbreDiaADia,
  armarNotaMovido,
  armarAvisoMovido,
} from './textos'
import styles from './LoQueSeRepitePage.module.css'

interface MoverOpcion {
  caja: 'fijo' | 'costumbre' | 'dia_a_dia'
  titulo: string
}

export const LoQueSeRepitePage: React.FC = () => {
  const [data, setData] = useState<PatronesResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingItemKey, setLoadingItemKey] = useState<string | null>(null)
  const [menuMoverAbierto, setMenuMoverAbierto] = useState<string | null>(null)
  const [descarteReciente, setDescarteReciente] = useState<{
    clave_item: string
    nombre: string
  } | null>(null)

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carga inicial de datos desde el backend
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await patronesService.getPatrones(signal)
      if (!signal?.aborted) {
        setData(res)
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error(err)
      const msg = getErrorMessage(err, 'No pudimos cargar los patrones. Probá de nuevo.')
      setError(msg)
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void loadData(controller.signal)
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [loadData])

  // Cerrar popover de mover al clickear afuera
  useEffect(() => {
    if (!menuMoverAbierto) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.moverWrapper}`)) {
        setMenuMoverAbierto(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuMoverAbierto(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuMoverAbierto])

  // Manejo de la decisión "Es así" (confirmar)
  const handleConfirmar = async (clave_item: string) => {
    setLoadingItemKey(clave_item)
    try {
      const res = await patronesService.registrarDecision({
        clave_item,
        decision: 'confirmar',
      })
      setData(res)
      // "Es así": sin aviso
    } catch (err) {
      console.error(err)
      sileo.error({
        title: getErrorMessage(err, TEXTOS.AVISOS.ERROR_DEFAULT),
      })
    } finally {
      setLoadingItemKey(null)
    }
  }

  // Manejo de la decisión "No es así" (descartar)
  const handleDescartar = async (clave_item: string, nombre: string) => {
    setLoadingItemKey(clave_item)
    try {
      const res = await patronesService.registrarDecision({
        clave_item,
        decision: 'descartar',
      })
      setData(res)

      // Activar aviso en página durante 10 segundos
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
      setDescarteReciente({ clave_item, nombre })
      undoTimerRef.current = setTimeout(() => {
        setDescarteReciente(null)
      }, 10000)

      // Aviso con Sileo incluyendo botón Deshacer de 10 segundos
      sileo.action({
        title: TEXTOS.AVISOS.DESCARTADO,
        button: {
          title: TEXTOS.BOTONES.DESHACER,
          onClick: () => {
            void handleDeshacer(clave_item)
          },
        },
        duration: 10000,
      })
    } catch (err) {
      console.error(err)
      sileo.error({
        title: getErrorMessage(err, TEXTOS.AVISOS.ERROR_DEFAULT),
      })
    } finally {
      setLoadingItemKey(null)
    }
  }

  // Manejo de la decisión "Moverlo" (mover a otra sección)
  const handleMover = async (clave_item: string, caja_destino: 'fijo' | 'costumbre' | 'dia_a_dia') => {
    setMenuMoverAbierto(null)
    setLoadingItemKey(clave_item)
    try {
      const res = await patronesService.registrarDecision({
        clave_item,
        decision: 'mover',
        caja_destino,
      })
      setData(res)
      sileo.success({
        title: armarAvisoMovido(caja_destino),
      })
    } catch (err) {
      console.error(err)
      sileo.error({
        title: getErrorMessage(err, TEXTOS.AVISOS.ERROR_DEFAULT),
      })
    } finally {
      setLoadingItemKey(null)
    }
  }

  // Manejo de la acción "Deshacer"
  const handleDeshacer = async (clave_item: string) => {
    setLoadingItemKey(clave_item)
    try {
      const res = await patronesService.deshacerDecision({
        clave_item,
      })
      setData(res)
      setDescarteReciente(null)
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
      // "Deshacer": sin aviso
    } catch (err) {
      console.error(err)
      sileo.error({
        title: getErrorMessage(err, TEXTOS.AVISOS.ERROR_DEFAULT),
      })
    } finally {
      setLoadingItemKey(null)
    }
  }

  // Opciones de destino para el menú Moverlo (nunca incluye la actual)
  const getOpcionesMover = (cajaActual: string): MoverOpcion[] => {
    const todas: MoverOpcion[] = [
      { caja: 'fijo', titulo: TEXTOS.SECCIONES.fijos.titulo },
      { caja: 'costumbre', titulo: TEXTOS.SECCIONES.costumbre.titulo },
      { caja: 'dia_a_dia', titulo: TEXTOS.SECCIONES.dia_a_dia.titulo },
    ]
    return todas.filter((opt) => opt.caja !== cajaActual)
  }

  // Estado de carga con esqueleto
  if (loading) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>{TEXTOS.TITULO_PAGINA}</h1>
          <p className={styles.subtitle}>Cargando lo que se repite...</p>
        </header>
        <div className={styles.sections}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.section}>
              <div className={styles.skeletonGrid}>
                {[1, 2].map((j) => (
                  <div key={j} className={styles.skeletonCard} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Estado de error con reintento
  if (error || !data) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <h1 className={styles.title}>{TEXTOS.TITULO_PAGINA}</h1>
        </header>
        <div className={styles.errorContainer}>
          <AlertCircle size={40} className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>No pudimos cargar los patrones</h2>
          <p className={styles.errorMessage}>{error || TEXTOS.AVISOS.ERROR_DEFAULT}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void loadData()}>
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    )
  }

  const { fecha_calculo, meses_ventana, ingresos, fijos, costumbre, dia_a_dia } = data

  const totalItems = ingresos.length + fijos.length + costumbre.length + dia_a_dia.length
  const descripcionEncabezado = armarEncabezadoDescripcion(fecha_calculo, meses_ventana)

  return (
    <div className={styles.root}>
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.title}>{TEXTOS.TITULO_PAGINA}</h1>
        <p className={styles.subtitle}>{descripcionEncabezado}</p>
      </header>

      {/* ── Aviso Undo En Página (dura 10 segundos tras descartar) ───────────── */}
      {descarteReciente && (
        <div className={styles.undoBanner} role="status">
          <span>{TEXTOS.AVISOS.DESCARTADO}</span>
          <button
            type="button"
            className={styles.undoBtn}
            onClick={() => void handleDeshacer(descarteReciente.clave_item)}
          >
            {TEXTOS.BOTONES.DESHACER}
          </button>
        </div>
      )}

      {/* ── Estado Todo Vacío ────────────────────────────────────────────────── */}
      {totalItems === 0 ? (
        <div className={styles.todoVacio}>
          <Inbox size={40} className={styles.todoVacioIcon} />
          <p className={styles.todoVacioTexto}>{TEXTOS.ESTADOS.TODO_VACIO}</p>
        </div>
      ) : (
        <div className={styles.sections}>
          {/* ── Sección 1: Ingresos habituales ─────────────────────────────── */}
          <section className={styles.section} aria-labelledby="sec-ingresos">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 id="sec-ingresos" className={styles.sectionTitle}>
                  {TEXTOS.SECCIONES.ingresos.titulo}
                </h2>
                <span className={styles.sectionTotal}>{armarTotalSeccion(ingresos)}</span>
              </div>
              <p className={styles.sectionDescription}>{TEXTOS.SECCIONES.ingresos.descripcion}</p>
            </div>

            {ingresos.length === 0 ? (
              <p className={styles.seccionVacia}>{TEXTOS.ESTADOS.SECCION_VACIA}</p>
            ) : (
              <div className={styles.grid}>
                {ingresos.map((item: ItemIngreso) => {
                  const isBusy = loadingItemKey === item.clave_item
                  const detalleTexto = armarDetalleIngreso(item.tipo)

                  return (
                    <article key={item.clave_item} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardMainInfo}>
                          <h3 className={styles.cardName}>{item.nombre}</h3>
                          {detalleTexto && <p className={styles.cardDetail}>{detalleTexto}</p>}
                          {item.estado === 'confirmado' && (
                            <div className={styles.badgesRow}>
                              <span className={styles.badgeConfirmado}>
                                {TEXTOS.NOTAS.CONFIRMADO}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={styles.cardAmountCol}>
                          <span className={styles.cardAmount}>{armarMontoItem(item)}</span>
                        </div>
                      </div>

                      {item.editable !== false && (
                        <div className={styles.cardActions}>
                          {item.estado === 'sugerido' ? (
                            <>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.btnConfirmar}`}
                                disabled={isBusy}
                                onClick={() => void handleConfirmar(item.clave_item)}
                              >
                                {TEXTOS.BOTONES.CONFIRMAR}
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.btnDescartar}`}
                                disabled={isBusy}
                                onClick={() => void handleDescartar(item.clave_item, item.nombre)}
                              >
                                {TEXTOS.BOTONES.DESCARTAR}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnDeshacer}`}
                              disabled={isBusy}
                              onClick={() => void handleDeshacer(item.clave_item)}
                            >
                              {TEXTOS.BOTONES.DESHACER}
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Sección 2: Gastos fijos ────────────────────────────────────── */}
          <section className={styles.section} aria-labelledby="sec-fijos">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 id="sec-fijos" className={styles.sectionTitle}>
                  {TEXTOS.SECCIONES.fijos.titulo}
                </h2>
                <span className={styles.sectionTotal}>{armarTotalSeccion(fijos)}</span>
              </div>
              <p className={styles.sectionDescription}>{TEXTOS.SECCIONES.fijos.descripcion}</p>
            </div>

            {fijos.length === 0 ? (
              <p className={styles.seccionVacia}>{TEXTOS.ESTADOS.SECCION_VACIA}</p>
            ) : (
              <div className={styles.grid}>
                {fijos.map((item: ItemRepetido) => {
                  const isBusy = loadingItemKey === item.clave_item
                  const detalleTexto = armarDetalleFijo(item)
                  const esFijoDebilSugerido =
                    item.caja === 'fijo' && item.estado === 'sugerido' && item.fuerza === 'debil'

                  return (
                    <article key={item.clave_item} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardMainInfo}>
                          <h3 className={styles.cardName}>{item.nombre}</h3>
                          {detalleTexto && <p className={styles.cardDetail}>{detalleTexto}</p>}

                          <div className={styles.badgesRow}>
                            {item.estado === 'confirmado' && (
                              <span className={styles.badgeConfirmado}>
                                {TEXTOS.NOTAS.CONFIRMADO}
                              </span>
                            )}
                            {item.estado === 'movido' && (
                              <span className={styles.badgeMovido}>
                                {armarNotaMovido(item.caja_detectada)}
                              </span>
                            )}
                          </div>

                          {esFijoDebilSugerido && (
                            <div className={styles.notaDebil}>{TEXTOS.NOTAS.DEBIL}</div>
                          )}
                        </div>
                        <div className={styles.cardAmountCol}>
                          <span className={styles.cardAmount}>{armarMontoItem(item)}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        {item.estado === 'sugerido' ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnConfirmar}`}
                              disabled={isBusy}
                              onClick={() => void handleConfirmar(item.clave_item)}
                            >
                              {TEXTOS.BOTONES.CONFIRMAR}
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnDescartar}`}
                              disabled={isBusy}
                              onClick={() => void handleDescartar(item.clave_item, item.nombre)}
                            >
                              {TEXTOS.BOTONES.DESCARTAR}
                            </button>

                            <div className={styles.moverWrapper}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                disabled={isBusy}
                                onClick={() =>
                                  setMenuMoverAbierto((prev) =>
                                    prev === item.clave_item ? null : item.clave_item
                                  )
                                }
                              >
                                <span>{TEXTOS.BOTONES.MOVER}</span>
                                <ChevronDown size={14} />
                              </button>

                              {menuMoverAbierto === item.clave_item && (
                                <div className={styles.moverPopover} role="menu">
                                  {getOpcionesMover(item.caja).map((opt) => (
                                    <button
                                      key={opt.caja}
                                      type="button"
                                      role="menuitem"
                                      className={styles.moverOption}
                                      onClick={() => void handleMover(item.clave_item, opt.caja)}
                                    >
                                      {opt.titulo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.btnDeshacer}`}
                            disabled={isBusy}
                            onClick={() => void handleDeshacer(item.clave_item)}
                          >
                            {TEXTOS.BOTONES.DESHACER}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Sección 3: Gastos de costumbre ─────────────────────────────── */}
          <section className={styles.section} aria-labelledby="sec-costumbre">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 id="sec-costumbre" className={styles.sectionTitle}>
                  {TEXTOS.SECCIONES.costumbre.titulo}
                </h2>
                <span className={styles.sectionTotal}>{armarTotalSeccion(costumbre)}</span>
              </div>
              <p className={styles.sectionDescription}>{TEXTOS.SECCIONES.costumbre.descripcion}</p>
            </div>

            {costumbre.length === 0 ? (
              <p className={styles.seccionVacia}>{TEXTOS.ESTADOS.SECCION_VACIA}</p>
            ) : (
              <div className={styles.grid}>
                {costumbre.map((item: ItemRepetido) => {
                  const isBusy = loadingItemKey === item.clave_item
                  const detalleTexto = armarDetalleCostumbreDiaADia(item.ocurrencias, meses_ventana)

                  return (
                    <article key={item.clave_item} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardMainInfo}>
                          <h3 className={styles.cardName}>{item.nombre}</h3>
                          <p className={styles.cardDetail}>{detalleTexto}</p>

                          <div className={styles.badgesRow}>
                            {item.estado === 'confirmado' && (
                              <span className={styles.badgeConfirmado}>
                                {TEXTOS.NOTAS.CONFIRMADO}
                              </span>
                            )}
                            {item.estado === 'movido' && (
                              <span className={styles.badgeMovido}>
                                {armarNotaMovido(item.caja_detectada)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.cardAmountCol}>
                          <span className={styles.cardAmount}>{armarMontoItem(item)}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        {item.estado === 'sugerido' ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnConfirmar}`}
                              disabled={isBusy}
                              onClick={() => void handleConfirmar(item.clave_item)}
                            >
                              {TEXTOS.BOTONES.CONFIRMAR}
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnDescartar}`}
                              disabled={isBusy}
                              onClick={() => void handleDescartar(item.clave_item, item.nombre)}
                            >
                              {TEXTOS.BOTONES.DESCARTAR}
                            </button>

                            <div className={styles.moverWrapper}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                disabled={isBusy}
                                onClick={() =>
                                  setMenuMoverAbierto((prev) =>
                                    prev === item.clave_item ? null : item.clave_item
                                  )
                                }
                              >
                                <span>{TEXTOS.BOTONES.MOVER}</span>
                                <ChevronDown size={14} />
                              </button>

                              {menuMoverAbierto === item.clave_item && (
                                <div className={styles.moverPopover} role="menu">
                                  {getOpcionesMover(item.caja).map((opt) => (
                                    <button
                                      key={opt.caja}
                                      type="button"
                                      role="menuitem"
                                      className={styles.moverOption}
                                      onClick={() => void handleMover(item.clave_item, opt.caja)}
                                    >
                                      {opt.titulo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.btnDeshacer}`}
                            disabled={isBusy}
                            onClick={() => void handleDeshacer(item.clave_item)}
                          >
                            {TEXTOS.BOTONES.DESHACER}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Sección 4: Gastos del día a día ────────────────────────────── */}
          <section className={styles.section} aria-labelledby="sec-dia-a-dia">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <h2 id="sec-dia-a-dia" className={styles.sectionTitle}>
                  {TEXTOS.SECCIONES.dia_a_dia.titulo}
                </h2>
                <span className={styles.sectionTotal}>{armarTotalSeccion(dia_a_dia)}</span>
              </div>
              <p className={styles.sectionDescription}>{TEXTOS.SECCIONES.dia_a_dia.descripcion}</p>
            </div>

            {dia_a_dia.length === 0 ? (
              <p className={styles.seccionVacia}>{TEXTOS.ESTADOS.SECCION_VACIA}</p>
            ) : (
              <div className={styles.grid}>
                {dia_a_dia.map((item: ItemRepetido) => {
                  const isBusy = loadingItemKey === item.clave_item
                  const detalleTexto = armarDetalleCostumbreDiaADia(item.ocurrencias, meses_ventana)

                  return (
                    <article key={item.clave_item} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div className={styles.cardMainInfo}>
                          <h3 className={styles.cardName}>{item.nombre}</h3>
                          <p className={styles.cardDetail}>{detalleTexto}</p>

                          <div className={styles.badgesRow}>
                            {item.estado === 'confirmado' && (
                              <span className={styles.badgeConfirmado}>
                                {TEXTOS.NOTAS.CONFIRMADO}
                              </span>
                            )}
                            {item.estado === 'movido' && (
                              <span className={styles.badgeMovido}>
                                {armarNotaMovido(item.caja_detectada)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.cardAmountCol}>
                          <span className={styles.cardAmount}>{armarMontoItem(item)}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        {item.estado === 'sugerido' ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnConfirmar}`}
                              disabled={isBusy}
                              onClick={() => void handleConfirmar(item.clave_item)}
                            >
                              {TEXTOS.BOTONES.CONFIRMAR}
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.btnDescartar}`}
                              disabled={isBusy}
                              onClick={() => void handleDescartar(item.clave_item, item.nombre)}
                            >
                              {TEXTOS.BOTONES.DESCARTAR}
                            </button>

                            <div className={styles.moverWrapper}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                disabled={isBusy}
                                onClick={() =>
                                  setMenuMoverAbierto((prev) =>
                                    prev === item.clave_item ? null : item.clave_item
                                  )
                                }
                              >
                                <span>{TEXTOS.BOTONES.MOVER}</span>
                                <ChevronDown size={14} />
                              </button>

                              {menuMoverAbierto === item.clave_item && (
                                <div className={styles.moverPopover} role="menu">
                                  {getOpcionesMover(item.caja).map((opt) => (
                                    <button
                                      key={opt.caja}
                                      type="button"
                                      role="menuitem"
                                      className={styles.moverOption}
                                      onClick={() => void handleMover(item.clave_item, opt.caja)}
                                    >
                                      {opt.titulo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.btnDeshacer}`}
                            disabled={isBusy}
                            onClick={() => void handleDeshacer(item.clave_item)}
                          >
                            {TEXTOS.BOTONES.DESHACER}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default LoQueSeRepitePage
