// ─── BilleterasPage ───────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Plus, Eye, EyeOff, Wallet, ArrowRightLeft, ArrowLeft } from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import { useNotificaciones } from '@/hooks/useNotificaciones'
import { getErrorMessage } from '@/utils/errorMessages'
import { calcularTotales, sortBilleteras } from '@/lib/utils/billeteras.utils'
import { formatMonto } from '@/utils/format'
import BilleteraCard, { NuevaBilleteraCard } from '@/components/billeteras/BilleteraCard'
import type { CreatePayload } from '@/components/billeteras/BankPickerModal'
import type { EditPayload } from '@/components/billeteras/EditBilleteraModal'
import billeteraService from '@/services/billetera.service'
import { dashboardService } from '@/services/dashboard.service'
import type { Billetera, CotizacionDolar } from '@/types'
import styles from './BilleterasPage.module.css'
import { EmptyState, PageSummaryBar } from '@/components/ui'
import { TransferenciaModal, TransferenciasTab } from '@/components/transferencias'
import transferenciaService from '@/services/transferencia.service'
import type { TransferenciaInterna } from '@/types'

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonGrid = memo(() => {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden="true" />
      ))}
    </div>
  )
})
SkeletonGrid.displayName = 'SkeletonGrid'

// ── Estado vacío ──────────────────────────────────────────────────────────────

const EstadoVacio = memo(({ onCrear }: { onCrear: () => void }) => {
  return (
    <EmptyState
      icon={Wallet}
      title="Todavía no creaste ninguna billetera."
      description="Agregá tu primera billetera para empezar a llevar el control de tu plata."
      actionLabel="Crear primera billetera"
      onActionClick={onCrear}
    />
  )
})
EstadoVacio.displayName = 'EstadoVacio'


// ── Página principal ──────────────────────────────────────────────────────────

export default function BilleterasPage() {
  const { usuario } = useAuth()
  const { open, confirm } = useModal()
  const { lastDataUpdate } = useNotificaciones()
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [frontCardId, setFrontCardId] = useState<string | null>(null)
  const [prevBilleteras, setPrevBilleteras] = useState<Billetera[]>([])
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'billeteras' | 'transferencias'>('billeteras')
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferencias, setTransferencias] = useState<TransferenciaInterna[]>([])
  const [loadingTransferencias, setLoadingTransferencias] = useState(false)

  const fetchPageData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const [bRes, cRes] = await Promise.all([
        billeteraService.list(signal),
        dashboardService.getCotizacion(signal).catch(() => null)
      ])
      
      if (signal?.aborted) return

      if (Array.isArray(bRes)) {
        setBilleteras(bRes.map((d: Billetera) => ({
          ...d,
          saldo_actual: Number(d.saldo_actual),
          saldo_inicial: Number(d.saldo_inicial)
        })))
      }
      setCotizacion(cRes)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error fetching billeteras data:', err)
      sileo.error({ title: getErrorMessage(err, 'No pudimos cargar los datos. Intentá de nuevo.') })
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  const fetchTransferenciasData = useCallback(async (signal?: AbortSignal) => {
    setLoadingTransferencias(true)
    try {
      const data = await transferenciaService.getTransferencias()
      if (signal?.aborted) return
      setTransferencias(data)
    } catch (err) {
      console.error('Error fetching transferencias:', err)
      sileo.error({ title: getErrorMessage(err, 'No pudimos cargar las transferencias. Intentá de nuevo.') })
    } finally {
      if (!signal?.aborted) {
        setLoadingTransferencias(false)
      }
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'transferencias') {
      const controller = new AbortController()
      const tid = setTimeout(() => {
        void fetchTransferenciasData(controller.signal)
      }, 0)
      return () => {
        clearTimeout(tid)
        controller.abort()
      }
    }
  }, [activeTab, fetchTransferenciasData])

  const handleDeleteTransferencia = useCallback((id: string) => {
    confirm({
      title: 'Eliminar transferencia',
      description: '¿Estás seguro de que querés eliminar esta transferencia? Esto revertirá los saldos de las billeteras involucradas.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transferenciaService.deleteTransferencia(id)
          sileo.success({ title: 'Transferencia eliminada' })
          void fetchTransferenciasData()
          void fetchPageData()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.') })
        }
      },
    })
  }, [confirm, fetchPageData, fetchTransferenciasData])

  useEffect(() => {
    const controller = new AbortController()
    const tid = setTimeout(() => {
      void fetchPageData(controller.signal)
    }, 0)
    return () => {
      clearTimeout(tid)
      controller.abort()
    }
  }, [fetchPageData])

  // Auto-refresco en vivo ante eventos SSE de actualización de datos
  useEffect(() => {
    if (lastDataUpdate?.entidad === 'billeteras' || lastDataUpdate?.entidad === 'transacciones') {
      const controller = new AbortController()
      const tid = setTimeout(() => {
        void fetchPageData(controller.signal)
        void fetchTransferenciasData(controller.signal)
      }, 0)
      return () => {
        clearTimeout(tid)
        controller.abort()
      }
    }
  }, [lastDataUpdate?.timestamp, lastDataUpdate?.entidad, fetchPageData, fetchTransferenciasData])

  const [showArchived, setShowArchived] = useState(false)

  const monedaUsuario = usuario?.moneda_principal ?? 'ARS'

  const { 
    billeterasActivas, 
    billeterasArchivadas
  } = useMemo(() => {
    const activas = sortBilleteras(
      billeteras.filter((b) => b.estado === 'activa'),
      monedaUsuario
    )
    const archivadas = sortBilleteras(
      billeteras.filter((b) => b.estado === 'archivada'),
      monedaUsuario
    )
    
    return {
      billeterasActivas: activas,
      billeterasArchivadas: archivadas
    }
  }, [billeteras, monedaUsuario])

  const { totalARS, totalUSD } = useMemo(() => {
    const valorUSD = cotizacion?.venta ?? 0
    return calcularTotales(billeteras, valorUSD)
  }, [billeteras, cotizacion])

  const formatCurrency = (monto: number) => formatMonto(monto, 'ARS')

  // Ajustar frontCardId durante el render cuando la lista de billeteras cambia
  if (billeterasActivas !== prevBilleteras) {
    setPrevBilleteras(billeterasActivas)
    const principal = billeterasActivas.find(b => b.es_principal)
    const targetId = principal ? principal.id : (billeterasActivas[0]?.id || null)
    setFrontCardId(targetId)
  }

  const handleArchivar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (!b) return
    confirm({
      title: '¿Archivás esta billetera?',
      description: 'Va a dejar de aparecer en tu dashboard, pero podés desarchivarla cuando quieras.',
      variant: 'danger',
      confirmLabel: 'Archivar',
      onConfirm: async () => {
        try {
          await billeteraService.archivar(id)
          await fetchPageData()
          sileo.success({ title: `"${b.nombre}" archivada` })
        } catch (error: unknown) {
          sileo.error({ title: getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.') })
        }
      }
    })
  }, [billeteras, confirm, fetchPageData])

  const handleDesarchivar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.desarchivar(id)
      await fetchPageData()
      if (b) sileo.success({ title: `"${b.nombre}" reactivada` })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.') })
    }
  }, [billeteras, fetchPageData])

  const handleEliminar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (!b) return

    confirm({
      title: '¿Eliminás esta billetera?',
      description: 'Se borran también todas sus transacciones asociadas.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await billeteraService.delete(id)
          await fetchPageData()
          sileo.success({ title: `"${b.nombre}" se eliminó.` })
        } catch (error: unknown) {
          sileo.error({ title: getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.') })
        }
      },
    })
  }, [billeteras, confirm, fetchPageData])

  const handleGuardarEdicion = useCallback(async (id: string, payload: EditPayload) => {
    try {
      await billeteraService.update(id, payload)
      await fetchPageData()
      sileo.success({ title: 'Billetera actualizada exitosamente' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.') })
    }
  }, [fetchPageData])

  const handleEditar = useCallback((b: Billetera) => {
    open('editBilletera', {
      data: {
        billetera: b,
        billeteraPrincipalActual: billeteras.find((item) => item.es_principal),
        onEditar: handleGuardarEdicion,
      },
    })
  }, [billeteras, open, handleGuardarEdicion])

  const handleCrear = useCallback(async (payload: CreatePayload) => {
    try {
      await billeteraService.create({
        nombre: payload.nombre,
        moneda: payload.moneda,
        saldo_inicial: payload.saldo_inicial,
        es_principal: payload.es_principal,
        es_inversion: payload.es_inversion,
        tna: payload.tna,
        bank_id: payload.bank_id,
      })
      await fetchPageData()
      sileo.success({ title: `"${payload.nombre}" creada exitosamente` })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.') })
    }
  }, [fetchPageData])

  const monedaPrincipal = (usuario?.moneda_principal as 'ARS' | 'USD') ?? 'ARS'

  const openCrearModal = useCallback(() => {
    open('bankPicker', {
      data: {
        billeterasActuales: billeteras,
        monedaPrincipalUsuario: monedaPrincipal,
        onCrear: handleCrear,
      },
    })
  }, [billeteras, open, monedaPrincipal, handleCrear])

  const toggleShowArchived = useCallback(() => {
    setShowArchived(prev => !prev)
  }, [])



  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>{activeTab === 'transferencias' ? 'Movimientos entre cuentas' : 'Billeteras'}</h1>
          <p className={styles.subtitle}>
            {activeTab === 'transferencias'
              ? 'Pasá plata entre tus cuentas, extraé efectivo o registrá compra y venta de dólares'
              : 'Controlá tus cuentas bancarias, tarjetas y efectivo'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={`${styles.btnGhost} ${activeTab === 'transferencias' ? styles.btnTabActive : ''} ${styles.desktopOnly}`} 
            onClick={() => setActiveTab(prev => prev === 'billeteras' ? 'transferencias' : 'billeteras')}
          >
            {activeTab === 'transferencias' ? (
              <>
                <ArrowLeft size={16} />
                Volver a mis billeteras
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} />
                Transferir entre cuentas
              </>
            )}
          </button>
          <button
            className={styles.nuevaBtn}
            onClick={activeTab === 'billeteras' ? openCrearModal : () => setIsTransferModalOpen(true)}
            aria-label={activeTab === 'billeteras' ? 'Agregar nueva billetera' : 'Transferir'}
          >
            {activeTab === 'billeteras' ? (
              <>
                <Plus size={16} strokeWidth={2.5} />
                Nueva<span className={styles.btnSuffix}> billetera</span>
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} strokeWidth={2.5} />
                Transferir
              </>
            )}
          </button>
        </div>
      </div>

      {/* Switch de pestañas solo para mobile */}
      <div className={styles.tabsContainer} role="tablist" aria-label="Secciones de billeteras">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'billeteras'}
          className={`${styles.tabBtn} ${activeTab === 'billeteras' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('billeteras')}
        >
          Mis Billeteras
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'transferencias'}
          className={`${styles.tabBtn} ${activeTab === 'transferencias' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('transferencias')}
        >
          Transferencias
        </button>
      </div>

      {activeTab === 'billeteras' ? (
        <>
          {/* ── Mobile Summary Card (Unified Metric Surface) ────────────────── */}
          {!isLoading && billeterasActivas.length > 0 && (
            <div className={styles.mobileSummaryCard}>
              <div className={styles.cardTopRow}>
                <span className={styles.cardLabel}>Patrimonio total</span>
                <span className={styles.cardBadge}>
                  {billeterasActivas.length} {billeterasActivas.length === 1 ? 'cuenta' : 'cuentas'}
                </span>
              </div>
              <span className={styles.cardAmount}>{formatCurrency(totalARS)}</span>
              <div className={styles.cardSubline}>
                <span>≈ {formatMonto(totalUSD, 'USD')}</span>
              </div>
            </div>
          )}

          {/* ── Barra de resumen (Desktop) ───────────────────────────────────────── */}
          {!isLoading && billeterasActivas.length > 0 && (
            <PageSummaryBar
              className={styles.desktopSummaryBar}
              items={[
                {
                  label: "Billeteras activas",
                  value: String(billeterasActivas.length),
                  highlight: true,
                },
                {
                  label: "Total en Pesos",
                  value: formatCurrency(totalARS),
                },
                {
                  label: "Total en Dólares",
                  value: formatMonto(totalUSD, 'USD'),
                },
              ]}
            />
          )}

          {/* ── Grid / Skeleton / Estado vacío ────────────────────────────────── */}
          {isLoading ? (
            <SkeletonGrid />
          ) : billeterasActivas.length === 0 ? (
            <EstadoVacio onCrear={openCrearModal} />
          ) : (
            <div className={styles.grid}>
              {billeterasActivas.map((b) => (
                <BilleteraCard
                  key={b.id}
                  billetera={b}
                  isFront={frontCardId === b.id}
                  onSetFront={() => setFrontCardId(b.id)}
                  onArchivar={handleArchivar}
                  onDesarchivar={handleDesarchivar}
                  onEliminar={handleEliminar}
                  onEditar={handleEditar}
                />
              ))}
              <NuevaBilleteraCard onClick={openCrearModal} />
            </div>
          )}

          {/* ── Sección de archivadas ─────────────────────────────────────────── */}
          {!isLoading && billeterasArchivadas.length > 0 && (
            <div className={styles.archivedSection}>
              <div className={styles.archivedHeader}>
                <h2 className={styles.archivedTitle}>
                  Billeteras archivadas ({billeterasArchivadas.length})
                </h2>
                <button 
                  className={styles.showArchivedBtn}
                  onClick={toggleShowArchived}
                >
                  {showArchived ? (
                    <><EyeOff size={16} /> Ocultar</>
                  ) : (
                    <><Eye size={16} /> Ver todas</>
                  )}
                </button>
              </div>

              {showArchived && (
                <div className={styles.grid}>
                  {billeterasArchivadas.map((b) => (
                    <BilleteraCard
                      key={b.id}
                      billetera={b}
                      onDesarchivar={handleDesarchivar}
                      onEliminar={handleEliminar}
                      onEditar={handleEditar}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <TransferenciasTab
          transferencias={transferencias}
          billeteras={billeterasActivas}
          loading={loadingTransferencias}
          onDelete={handleDeleteTransferencia}
          onOpenTransferModal={() => setIsTransferModalOpen(true)}
        />
      )}


      {/* Modal de Transferencia */}
      {isTransferModalOpen && (
        <TransferenciaModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            void fetchTransferenciasData()
            void fetchPageData()
          }}
          billeteras={billeteras}
          cotizacionOficial={cotizacion}
        />
      )}
    </div>
  )
}
