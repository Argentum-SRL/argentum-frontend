/**
 * Modal de edición en dos pasos para compras en cuotas.
 */
import type { RefObject } from 'react'
import {
  CreditCard,
  ChevronLeft,
  X,
  Lightbulb,
} from '@/components/ui/icons'
import styles from './GruposCuotasTab.module.css'
import type { GrupoCuotasResumen, Billetera, Categoria, TarjetaCredito } from '@/types'
import { DateInput } from '@/components/ui'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import CategoriaSelector from '@/components/ui/CategoriaSelector/CategoriaSelector'
import RealCardPreview from '@/components/tarjetas/RealCardPreview'
import SelectableSurface from '@/components/ui/SelectableSurface'
import { RED_LABEL } from '@/lib/utils/tarjeta.utils'
import Modal from '@/components/ui/Modal/Modal'

export interface GrupoCuotasEditarModalProps {
  editingGrupo: GrupoCuotasResumen | null
  setEditingGrupo: (grupo: GrupoCuotasResumen | null) => void
  editStep: 1 | 2
  editSlideDirection: 'forward' | 'back'
  editMonto: number | null
  setEditMonto: (val: number | null) => void
  tarjetasCarousel: TarjetaCredito[]
  editTarjetaId: string
  setEditTarjetaId: (id: string) => void
  setEditTarjetaTouched: (touched: boolean) => void
  billeteras: Billetera[]
  editDesc: string
  setEditDesc: (desc: string) => void
  editFechaReferencia: string
  setEditFechaReferencia: (fecha: string) => void
  setEditFechaTouched: (touched: boolean) => void
  categorias: Categoria[]
  editCategoriaId: string
  setEditCategoriaId: (id: string) => void
  editSubcategoriaId: string
  setEditSubcategoriaId: (id: string) => void
  saving: boolean
  goEditStep1: () => void
  goEditStep2: (e?: React.FormEvent) => void
  handleSave: (e: React.FormEvent) => Promise<void> | void
  tarjetasCarouselRef: RefObject<HTMLDivElement | null>
}

export default function GrupoCuotasEditarModal({
  editingGrupo,
  setEditingGrupo,
  editStep,
  editSlideDirection,
  editMonto,
  setEditMonto,
  tarjetasCarousel,
  editTarjetaId,
  setEditTarjetaId,
  setEditTarjetaTouched,
  billeteras,
  editDesc,
  setEditDesc,
  editFechaReferencia,
  setEditFechaReferencia,
  setEditFechaTouched,
  categorias,
  editCategoriaId,
  setEditCategoriaId,
  editSubcategoriaId,
  setEditSubcategoriaId,
  saving,
  goEditStep1,
  goEditStep2,
  handleSave,
  tarjetasCarouselRef,
}: GrupoCuotasEditarModalProps) {
  return (
    <>
      {/* ── MODAL DE EDICIÓN (2 PASOS - ESTILO TRANSACCIONMODAL) ────────── */}
      <Modal 
        isOpen={!!editingGrupo} 
        onClose={() => setEditingGrupo(null)}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel="Editar compra en cuotas"
      >
        {editingGrupo && (
          <div className={styles.modalRoot}>
            {/* Indicador de pasos superior centrado */}
            <div className={styles.stepIndicator} aria-hidden="true">
              <div className={`${styles.dot} ${editStep === 1 ? styles.dotActive : styles.dotInactive}`} />
              <div className={`${styles.dot} ${editStep === 2 ? styles.dotActive : styles.dotInactive}`} />
            </div>

            <div className={styles.slidesContainer}>
              
              {/* ──── PASO 1: Monto y Tarjeta ──── */}
              <div
                className={`${styles.slide} ${
                  editStep === 1
                    ? styles.slideVisible
                    : editSlideDirection === 'forward'
                    ? styles.slideExitLeft
                    : styles.slideExitRight
                }`}
                data-modal-frame
              >
                <form className={styles.formContainer} onSubmit={goEditStep2}>
                  <div
                    className={`${styles.formBody} ${styles.formBodyWithHeader} ${styles.formBodyStep1}`}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <h2 className={styles.headerTitle}>Editar compra en cuotas</h2>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={() => setEditingGrupo(null)}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFields} data-modal-stack>
                      <div data-modal-block>
                      {/* 1. Hero Monto */}
                      <div className={styles.formField} data-modal-field>
                        <label className={styles.fieldLabel}>Monto total recalculado</label>
                        <MontoInput
                          value={editMonto}
                          onChange={(v) => setEditMonto(v)}
                          moneda={(editingGrupo.moneda as 'ARS' | 'USD') || 'ARS'}
                          allowDecimals
                          autoFocus
                        />
                      </div>

                      {/* 2. Tarjeta Carousel */}
                      <div className={styles.formField} data-modal-field>
                        <label className={styles.fieldLabel}>Tarjeta de crédito</label>
                        {tarjetasCarousel.length === 0 ? (
                          <div className={styles.emptyWalletBox}>
                            <div className={styles.emptyWalletIcon}>
                              <CreditCard size={22} strokeWidth={1.75} />
                            </div>
                            <p className={styles.emptyWalletTitle}>No tenés tarjetas activas</p>
                          </div>
                        ) : (
                          <div data-modal-carousel>
                            <div data-modal-carousel-track ref={tarjetasCarouselRef}>
                              {tarjetasCarousel.map(t => (
                                <SelectableSurface
                                  key={t.id}
                                  data-id={t.id}
                                  selected={editTarjetaId === t.id}
                                  onClick={() => {
                                    setEditTarjetaId(t.id)
                                    setEditTarjetaTouched(true)
                                  }}
                                  aria-label={`Seleccionar tarjeta ${t.nombre}`}
                                >
                                  <RealCardPreview
                                    ultimos4={t.nombre.replace('•••• ', '').slice(-4)}
                                    red={t.red}
                                    titular={t.nombre}
                                    diaCierre={t.dia_cierre}
                                    diaVencimiento={t.dia_vencimiento}
                                    proximoCierre={t.proximo_cierre}
                                    proximoVencimiento={t.proximo_vencimiento}
                                    color={t.color || '#0D2045'}
                                    billeteraNombre={billeteras.find(b => b.id === t.billetera_id)?.nombre || RED_LABEL[t.red]}
                                  />
                                </SelectableSurface>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formFooter}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setEditingGrupo(null)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                      Continuar
                    </button>
                  </div>
                </form>
              </div>

              {/* ──── PASO 2: Detalles, Fecha y Categoría ──── */}
              <div
                className={`${styles.slide} ${
                  editStep === 2
                    ? styles.slideVisible
                    : editSlideDirection === 'forward'
                    ? styles.slideEnterRight
                    : styles.slideEnterLeft
                }`}
                data-modal-frame
              >
                <form className={styles.formContainer} onSubmit={handleSave}>
                  <div
                    className={`${styles.formBody} ${styles.formBodyWithHeader}`}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={goEditStep1}
                          title="Atrás"
                          aria-label="Atrás"
                        >
                          <ChevronLeft size={18} strokeWidth={2} />
                        </button>
                        <div>
                          <h2 className={styles.headerTitle}>Detalles</h2>
                        </div>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={() => setEditingGrupo(null)}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.formFields} data-modal-stack>
                      <div data-modal-block>
                      {/* Descripción + Fecha */}
                      <div className={styles.descFechaRow}>
                        <div className={`${styles.formField} ${styles.descCol}`} data-modal-field>
                          <label className={styles.fieldLabel} htmlFor="edit-cuota-desc">Descripción</label>
                          <input
                            id="edit-cuota-desc"
                            type="text"
                            className={styles.fieldInput}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Ej: Smart TV 55"
                          />
                        </div>
                        <div className={`${styles.formField} ${styles.fechaCol}`} data-modal-field>
                          <label className={styles.fieldLabel} htmlFor="edit-cuota-fecha">Fecha compra</label>
                          <DateInput
                            id="edit-cuota-fecha"
                            value={editFechaReferencia}
                            onChange={(val) => {
                              setEditFechaReferencia(val)
                              setEditFechaTouched(true)
                            }}
                            className={styles.fieldInput}
                          />
                        </div>
                      </div>

                      {/* Categoría y Subcategoría (reusado CategoriaSelector) */}
                      <CategoriaSelector
                        categorias={categorias}
                        categoriaId={editCategoriaId}
                        subcategoriaId={editSubcategoriaId}
                        tipo="egreso"
                        autoseleccionarPrimeraSubcategoria={true}
                        onSelectCategoria={(id) => {
                          setEditCategoriaId(id)
                          setEditSubcategoriaId('')
                        }}
                        onSelectSubcategoria={(id) => setEditSubcategoriaId(id)}
                      />

                      {/* Recalculation Notice */}
                      <div className={styles.editRecalcNotice}>
                        <Lightbulb size={15} strokeWidth={2} className={styles.prepayNoticeIcon} aria-hidden="true" />
                        <span>
                          Al modificar el monto total o tarjeta, se recalcularán automáticamente las <strong>{editingGrupo.cantidad_pendientes} cuotas pendientes</strong>.
                        </span>
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formFooter}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={goEditStep1}
                      disabled={saving}
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
