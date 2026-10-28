/**
 * Modal de detalle y acciones (prepago y cancelación) para un grupo de compras en cuotas.
 */
import { useMemo, useState, type RefObject } from 'react'
import {
  Trash2,
  X,
  CreditCard,
  XCircle,
  Edit2,
  Sparkles,
  ChevronLeft,
  Wallet,
  Lightbulb,
} from '@/components/ui/icons'
import styles from './GruposCuotasTab.module.css'
import type { GrupoCuotasResumen, Billetera, Categoria, Subcategoria, Suscripcion } from '@/types'
import { formatMonto } from '@/utils/format'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import SelectableSurface from '@/components/ui/SelectableSurface'
import Modal from '@/components/ui/Modal/Modal'
import GrupoCuotasAvatar from './GrupoCuotasAvatar'
import ReintegroBloque, { ReintegroSwitchCard } from './ReintegroBloque'
import { useReintegro } from './useReintegro'
import { sileo } from 'sileo'
import { getErrorMessage } from '@/utils/errorMessages'

export interface GrupoCuotasDetalleModalProps {
  selectedGrupo: GrupoCuotasResumen | null
  detailSlide: 'detail' | 'prepay' | 'reintegro'
  detailSlideDirection: 'forward' | 'back'
  detailSelectedCat?: Categoria
  categorias?: Categoria[]
  subcategorias?: Subcategoria[]
  suscripciones?: Suscripcion[]
  detailProgressPercent: number
  detailMatchingWallets: Billetera[]
  billeteraSeleccionada: string
  saving: boolean
  handleCloseDetail: () => void
  handleDeleteClick: (id: string) => void
  formatFecha: (fechaStr: string) => string
  handleCancelar: (grupo: GrupoCuotasResumen) => void
  handleAdelantar?: (grupo: GrupoCuotasResumen) => void
  handleEditClick: (grupo: GrupoCuotasResumen) => void
  handleGoPrepay: () => void
  handleGoReintegro: () => void
  handleBackToDetail: () => void
  handleReintegroGuardado: () => void
  ejecutarPrepago: (grupoId: string) => Promise<void> | void
  setBilleteraSeleccionada: (id: string) => void
  detailWalletsCarouselRef: RefObject<HTMLDivElement | null>
}

export default function GrupoCuotasDetalleModal({
  selectedGrupo,
  detailSlide,
  detailSlideDirection,
  detailSelectedCat,
  categorias = [],
  subcategorias = [],
  suscripciones = [],
  detailProgressPercent,
  detailMatchingWallets,
  billeteraSeleccionada,
  saving,
  handleCloseDetail,
  handleDeleteClick,
  formatFecha,
  handleCancelar,
  handleAdelantar,
  handleEditClick,
  handleGoPrepay,
  handleGoReintegro,
  handleBackToDetail,
  handleReintegroGuardado,
  ejecutarPrepago,
  setBilleteraSeleccionada,
  detailWalletsCarouselRef,
}: GrupoCuotasDetalleModalProps) {
  const tieneTarjeta = Boolean(selectedGrupo?.tarjeta_nombre || selectedGrupo?.vencimiento_adelanto)
  const [savingReintegro, setSavingReintegro] = useState(false)
  // Objeto estable: useReintegro reinicia su estado cuando cambia la transacción (un objeto nuevo en cada render lo reiniciaría sin fin)
  const padreId = selectedGrupo?.transaccion_padre_id ?? null
  const padreReintegro = selectedGrupo?.reintegro ?? null
  const transaccionPadre = useMemo(
    () => (padreId ? { id: padreId, reintegro: padreReintegro } : null),
    [padreId, padreReintegro]
  )
  const reintegroHook = useReintegro({
    transaccion: transaccionPadre,
    montoCompra: selectedGrupo?.monto_total ?? null,
    fechaCompra: selectedGrupo?.fecha_compra ? selectedGrupo.fecha_compra.split('T')[0] : '',
    moneda: (selectedGrupo?.moneda as 'ARS' | 'USD') || 'ARS',
    isEdit: true,
  })
  return (
    <>
      {/* ── MODAL DE DETALLE & ACCIONES DE CUOTA ────────────────────────── */}
      <Modal
        isOpen={!!selectedGrupo}
        onClose={handleCloseDetail}
        showHeader={false}
        noPadding
        autoHeight
        ariaLabel="Detalle de compra en cuotas"
      >
        {selectedGrupo && (
          <div className={styles.modalRoot}>
            <div className={styles.slidesContainer}>
              
              {/* ──── SLIDE 1: Vista Detalle ──── */}
              <div
                className={`${styles.slide} ${
                  detailSlide === 'detail'
                    ? styles.slideVisible
                    : detailSlideDirection === 'forward'
                    ? styles.slideExitLeft
                    : styles.slideExitRight
                }`}
                data-modal-frame
              >
                  <div className={styles.formContainer} data-modal-frame>
                    {/* Header */}
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <h2 className={styles.headerTitle}>Detalle de cuotas</h2>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.deleteHeaderBtn}
                          onClick={() => handleDeleteClick(selectedGrupo.id)}
                          title="Eliminar compra"
                          aria-label="Eliminar compra"
                          data-modal-delete
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={handleCloseDetail}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={styles.formBody}
                      data-modal-stack
                    >
                      {/* Main Content */}
                      <div className={styles.detailBodyContent}>
                        
                        {/* 1. Hero Identity & Amount Card */}
                        <div className={styles.detailHeroSurface}>
                          <div className={styles.detailHeroTopRow}>
                            <div className={styles.detailHeroAvatar}>
                              <GrupoCuotasAvatar
                                grupo={selectedGrupo}
                                categorias={categorias.length > 0 ? categorias : (detailSelectedCat ? [detailSelectedCat] : [])}
                                subcategorias={subcategorias}
                                suscripciones={suscripciones}
                                size={24}
                                fallbackIconSize={20}
                                fallbackStyle={{ color: 'var(--primary)' }}
                              />
                            </div>
                            <div className={styles.detailHeroMeta}>
                              <h3 className={styles.detailHeroTitle} title={selectedGrupo.descripcion?.trim() || 'Compra en cuotas'}>
                                {selectedGrupo.descripcion?.trim() || 'Compra en cuotas'}
                              </h3>
                              <div className={styles.detailHeroBadgeList}>
                                <span className={styles.cuotasCountBadge}>
                                  {selectedGrupo.cantidad_cuotas} {selectedGrupo.cantidad_cuotas === 1 ? 'pago' : 'cuotas'}
                                </span>
                                {selectedGrupo.tarjeta_nombre && (
                                  <span className={styles.cardInfoBadge}>
                                    <CreditCard size={11} strokeWidth={2} />
                                    <span>{selectedGrupo.tarjeta_nombre}</span>
                                  </span>
                                )}
                                {selectedGrupo.tiene_interes ? (
                                  <span className={styles.interesBadge}>
                                    {selectedGrupo.tna != null
                                      ? `Con interés · TNA ${selectedGrupo.tna.toLocaleString('es-AR')}%`
                                      : 'Con Interés'}
                                  </span>
                                ) : (
                                  <span className={styles.sinInteresBadge}>Sin Interés</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.detailHeroNumbersRow}>
                            <div className={styles.detailHeroAmountGroup}>
                              <span className={styles.detailHeroMainAmount}>
                                {formatMonto(selectedGrupo.monto_cuota, selectedGrupo.moneda)}
                              </span>
                              <span className={styles.detailHeroAmountSuffix}>/ cuota</span>
                            </div>
                            <div className={styles.detailHeroTotalPill}>
                              <span className={styles.detailHeroTotalLabel}>Total:</span>
                              <span className={styles.detailHeroTotalVal}>
                                {formatMonto(selectedGrupo.monto_total, selectedGrupo.moneda)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Progress & Financial Breakdown */}
                        <div className={styles.detailProgressSurface}>
                          <div className={styles.detailProgressHeader}>
                            <span className={styles.detailProgressTitle}>
                              <strong>{selectedGrupo.cantidad_pagadas}</strong> de <strong>{selectedGrupo.cantidad_cuotas}</strong> cuotas pagadas
                            </span>
                            <span className={styles.detailProgressBadge}>
                              {detailProgressPercent}%
                            </span>
                          </div>

                          <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={detailProgressPercent} aria-valuemin={0} aria-valuemax={100}>
                            <div 
                              className={styles.progressBarFill}
                              style={{ width: `${detailProgressPercent}%` }}
                            />
                          </div>

                          <div className={styles.detailStatsGrid}>
                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Total Pagado</span>
                              <span className={styles.detailStatValue}>
                                {formatMonto(selectedGrupo.total_pagado, selectedGrupo.moneda)}
                              </span>
                            </div>

                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Total Pendiente</span>
                              <span className={`${styles.detailStatValue} ${selectedGrupo.cantidad_pendientes > 0 ? styles.statPendingRed : ''}`}>
                                {formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)}
                              </span>
                            </div>

                            <div className={styles.detailStatCell}>
                              <span className={styles.detailStatLabel}>Próximo vencimiento</span>
                              <span className={styles.detailStatValue}>
                                {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.proximo_vencimiento
                                  ? formatFecha(selectedGrupo.proximo_vencimiento)
                                  : 'Al día'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Costo Financiero (solo si tiene interés) */}
                        {selectedGrupo.tiene_interes && (
                          <div className={styles.detailTasasSurface}>
                            <div className={styles.detailTasasTop}>
                              <span className={styles.detailTasasHeading}>Costo financiero</span>
                              {selectedGrupo.tasa_interes != null && (
                                <span className={styles.detailTasaMensualPill}>
                                  {Number(selectedGrupo.tasa_interes).toFixed(2)}% mensual
                                </span>
                              )}
                            </div>
                            <div className={styles.detailTasasPillsRow}>
                              {selectedGrupo.cft_estimado != null && (
                                <div className={`${styles.tasaChip} ${styles.tasaChipCft}`}>
                                  <span className={styles.tasaChipLbl}>CFT</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.cft_estimado).toFixed(2)}%</span>
                                </div>
                              )}
                              {selectedGrupo.tna != null && (
                                <div className={styles.tasaChip}>
                                  <span className={styles.tasaChipLbl}>TNA</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.tna).toFixed(2)}%</span>
                                </div>
                              )}
                              {selectedGrupo.tea != null && (
                                <div className={styles.tasaChip}>
                                  <span className={styles.tasaChipLbl}>TEA</span>
                                  <span className={styles.tasaChipVal}>{Number(selectedGrupo.tea).toFixed(2)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Reintegro switch card */}
                        {selectedGrupo.transaccion_padre_id && (
                          <ReintegroSwitchCard
                            tieneReintegro={Boolean(selectedGrupo.reintegro)}
                            onToggle={() => {
                              reintegroHook.setTieneReintegro(true)
                              handleGoReintegro()
                            }}
                          />
                        )}

                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.detailFormFooter}>
                      <div className={styles.detailFooterLeftGroup}>
                        {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                          <button
                            type="button"
                            className={styles.detailCancelCuotasBtn}
                            onClick={() => handleCancelar(selectedGrupo)}
                            title="Cancelar cuotas restantes"
                          >
                            <XCircle size={15} />
                            <span>Cancelar cuotas</span>
                          </button>
                        )}
                      </div>

                      <div className={styles.detailFooterRightGroup}>
                        <button
                          type="button"
                          className={styles.detailEditActionBtn}
                          onClick={() => handleEditClick(selectedGrupo)}
                          title="Editar compra"
                        >
                          <Edit2 size={14} />
                          <span>Editar</span>
                        </button>

                        {selectedGrupo.cantidad_pendientes > 0 && selectedGrupo.estado !== 'cancelado' && (
                          tieneTarjeta ? (
                            <button
                              type="button"
                              className={styles.detailAdelantarActionBtn}
                              onClick={() => handleAdelantar?.(selectedGrupo)}
                              title="Adelantar cuotas al próximo resumen"
                            >
                              <Sparkles size={14} />
                              <span>Adelantar cuotas</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.detailPrepayActionBtn}
                              onClick={handleGoPrepay}
                              title="Prepagar cuotas pendientes"
                            >
                              <Sparkles size={14} />
                              <span>Prepagar</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ──── SLIDE 2: Prepagar Cuotas (Solapa Separada) ──── */}
                <div
                  className={`${styles.slide} ${
                    detailSlide === 'prepay'
                      ? styles.slideVisible
                      : detailSlideDirection === 'forward'
                      ? styles.slideEnterRight
                      : styles.slideEnterLeft
                  }`}
                  data-modal-frame
                >
                  <form
                    className={styles.formContainer}
                    onSubmit={(e) => {
                      e.preventDefault()
                      ejecutarPrepago(selectedGrupo.id)
                    }}
                    data-modal-frame
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={handleBackToDetail}
                          title="Volver al detalle"
                          aria-label="Volver al detalle"
                        >
                          <ChevronLeft size={18} strokeWidth={2} />
                        </button>
                        <div>
                          <h2 className={styles.headerTitle}>Prepagar cuotas</h2>
                        </div>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={handleCloseDetail}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={styles.formBody}
                      data-modal-stack
                    >
                      <div className={styles.formFields}>
                        {/* 1. Hero Prepay Banner */}
                        <div className={styles.prepayHeroBanner}>
                          <div className={styles.prepayHeroIconWrap}>
                            <Sparkles size={20} strokeWidth={2} />
                          </div>
                          <div className={styles.prepayHeroContent}>
                            <span className={styles.prepayHeroLabel}>Total a adelantar</span>
                            <div className={styles.prepayHeroAmount}>
                              {formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)}
                            </div>
                            <p className={styles.prepayHeroNarrative}>
                              Saldarás <strong>{selectedGrupo.cantidad_pendientes} {selectedGrupo.cantidad_pendientes === 1 ? 'cuota pendiente restante' : 'cuotas pendientes restantes'}</strong> de <strong>"{selectedGrupo.descripcion?.trim()}"</strong>.
                            </p>
                          </div>
                        </div>

                        {/* 2. Wallet Carousel */}
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>¿Con qué billetera o cuenta pagás?</label>
                          {detailMatchingWallets.length === 0 ? (
                            <div className={styles.emptyWalletBox}>
                              <div className={styles.emptyWalletIcon}>
                                <Wallet size={22} strokeWidth={1.75} />
                              </div>
                              <p className={styles.emptyWalletTitle}>
                                No tenés cuentas en {selectedGrupo.moneda}
                              </p>
                              <p className={styles.emptyWalletSub}>
                                Creá o activá una billetera en {selectedGrupo.moneda} para poder saldar estas cuotas.
                              </p>
                            </div>
                          ) : (
                            <div data-modal-carousel>
                              <div data-modal-carousel-track ref={detailWalletsCarouselRef}>
                                {detailMatchingWallets.map((b) => (
                                  <SelectableSurface
                                    key={b.id}
                                    data-id={b.id}
                                    selected={billeteraSeleccionada === b.id}
                                    onClick={() => setBilleteraSeleccionada(b.id)}
                                    aria-label={`Seleccionar cuenta ${b.nombre}`}
                                  >
                                    <BilleteraCard
                                      billetera={b}
                                      variant="select"
                                    />
                                  </SelectableSurface>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Notice */}
                        <div className={styles.prepayNoticeTip}>
                          <Lightbulb size={15} strokeWidth={2} className={styles.prepayNoticeIcon} aria-hidden="true" />
                          <span>
                            Al confirmar el pago, las <strong>{selectedGrupo.cantidad_pendientes} cuotas pendientes</strong> se registrarán como pagadas inmediatamente y se debitarán de tu cuenta.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.formFooter}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={handleBackToDetail}
                        disabled={saving}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={!billeteraSeleccionada || detailMatchingWallets.length === 0 || saving}
                      >
                        {saving
                          ? 'Procesando pago...'
                          : `Confirmar pago (${formatMonto(selectedGrupo.total_pendiente, selectedGrupo.moneda)})`}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ──── SLIDE 3: Devolución o reintegro ──── */}
                <div
                  className={`${styles.slide} ${
                    detailSlide === 'reintegro'
                      ? styles.slideVisible
                      : detailSlideDirection === 'forward'
                      ? styles.slideEnterRight
                      : styles.slideEnterLeft
                  }`}
                  data-modal-frame
                >
                  <form
                    className={styles.formContainer}
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!selectedGrupo.transaccion_padre_id) return
                      setSavingReintegro(true)
                      try {
                        await reintegroHook.guardarReintegro(selectedGrupo.transaccion_padre_id)
                        handleReintegroGuardado()
                      } catch (err) {
                        console.error(err)
                        sileo.error({ title: getErrorMessage(err, 'No pudimos guardar el reintegro.') })
                      } finally {
                        setSavingReintegro(false)
                      }
                    }}
                    data-modal-frame
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.headerLeft}>
                        <button
                          type="button"
                          className={styles.backBtn}
                          onClick={handleBackToDetail}
                          title="Volver al detalle"
                          aria-label="Volver al detalle"
                        >
                          <ChevronLeft size={18} strokeWidth={2} />
                        </button>
                        <div>
                          <h2 className={styles.headerTitle}>Devolución o reintegro</h2>
                        </div>
                      </div>
                      <div className={styles.headerRightActions}>
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={handleCloseDetail}
                          title="Cerrar"
                          aria-label="Cerrar"
                        >
                          <X size={18} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div
                      className={styles.formBody}
                      data-modal-stack
                    >
                      <div className={styles.formFields}>
                        <ReintegroBloque
                          reintegro={reintegroHook}
                          isEdit={true}
                        />
                      </div>
                    </div>

                    <div className={styles.formFooter}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={handleBackToDetail}
                        disabled={savingReintegro}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={savingReintegro}
                      >
                        {savingReintegro ? 'Guardando...' : 'Guardar'}
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
