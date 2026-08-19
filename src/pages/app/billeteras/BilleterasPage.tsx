// ─── BilleterasPage ───────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Plus, Eye, EyeOff, Wallet, ArrowRightLeft, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { calcularTotales, formatSaldo } from '@/lib/utils/billeteras.utils'
import BilleteraCard, { NuevaBilleteraCard } from '@/components/billeteras/BilleteraCard'
import type { CreatePayload } from '@/components/billeteras/BankPickerModal'
import type { EditPayload } from '@/components/billeteras/EditBilleteraModal'
import billeteraService from '@/services/billetera.service'
import { dashboardService } from '@/services/dashboard.service'
import type { Billetera, CotizacionDolar } from '@/types'
import styles from './BilleterasPage.module.css'
import { EmptyState, PageSummaryBar } from '@/components/ui'
import TransferenciaModal from '@/components/transferencias/TransferenciaModal'
import TransferenciaRow from '@/components/transferencias/TransferenciaRow'
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
  const { showToast } = useToast()
  const { open, confirm } = useModal()
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
      showToast(getErrorMessage(err, 'No pudimos cargar los datos. Intentá de nuevo.'), 'error')
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [showToast])

  const fetchTransferenciasData = useCallback(async (signal?: AbortSignal) => {
    setLoadingTransferencias(true)
    try {
      const data = await transferenciaService.getTransferencias()
      if (signal?.aborted) return
      setTransferencias(data)
    } catch (err) {
      console.error('Error fetching transferencias:', err)
      showToast(getErrorMessage(err, 'No pudimos cargar las transferencias. Intentá de nuevo.'), 'error')
    } finally {
      if (!signal?.aborted) {
        setLoadingTransferencias(false)
      }
    }
  }, [showToast])

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
          showToast('Transferencia eliminada', 'success')
          void fetchTransferenciasData()
          void fetchPageData()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      },
    })
  }, [confirm, fetchPageData, fetchTransferenciasData, showToast])

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

  const [showArchived, setShowArchived] = useState(false)

  const { 
    billeterasActivas, 
    billeterasArchivadas, 
    billeterasRegulares, 
    billeterasEfectivo
  } = useMemo(() => {
    const activas = billeteras.filter((b) => b.estado === 'activa')
    const archivadas = billeteras.filter((b) => b.estado === 'archivada')
    
    return {
      billeterasActivas: activas,
      billeterasArchivadas: archivadas,
      billeterasRegulares: activas.filter((b) => !b.es_efectivo),
      billeterasEfectivo: activas.filter((b) => b.es_efectivo)
    }
  }, [billeteras])

  const { totalARS, totalUSD } = useMemo(() => {
    const valorUSD = cotizacion?.venta ?? 0
    return calcularTotales(billeteras, valorUSD)
  }, [billeteras, cotizacion])

  const formatCurrency = (monto: number) => formatSaldo(monto, 'ARS')

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
          showToast(`"${b.nombre}" archivada`, 'success')
        } catch (error: unknown) {
          showToast(getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }, [billeteras, confirm, fetchPageData, showToast])

  const handleDesarchivar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.desarchivar(id)
      await fetchPageData()
      if (b) showToast(`"${b.nombre}" reactivada`, 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    }
  }, [billeteras, fetchPageData, showToast])

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
          showToast(`"${b.nombre}" se eliminó.`, 'success')
        } catch (error: unknown) {
          showToast(getErrorMessage(error, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      },
    })
  }, [billeteras, confirm, fetchPageData, showToast])

  const handleGuardarEdicion = useCallback(async (id: string, payload: EditPayload) => {
    try {
      await billeteraService.update(id, payload)
      await fetchPageData()
      showToast(`Billetera actualizada exitosamente`, 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    }
  }, [fetchPageData, showToast])

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
        bank_id: payload.bank_id,
      })
      await fetchPageData()
      showToast(`"${payload.nombre}" creada exitosamente`, 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    }
  }, [fetchPageData, showToast])

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

  const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const getDayLabel = (fechaStr: string): string => {
    if (!fechaStr) return ''
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (fechaStr === todayStr) return 'Hoy'
    if (fechaStr === yesterdayStr) return 'Ayer'

    const [y, m, d] = fechaStr.split('-').map(Number)
    if (!y || !m || !d) return fechaStr
    
    return `${d} de ${MESES[m - 1]}`
  }

  const gruposTransferencias = useMemo(() => {
    const gruposObj: Record<string, TransferenciaInterna[]> = {}
    transferencias.forEach(tx => {
      const fecha = tx.fecha.split('T')[0]
      if (!gruposObj[fecha]) gruposObj[fecha] = []
      gruposObj[fecha].push(tx)
    })
    return Object.entries(gruposObj).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transferencias])

  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Billeteras</h1>
          <p className={styles.subtitle}>Controlá tus cuentas bancarias, tarjetas y efectivo</p>
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
                Pasar plata entre cuentas
              </>
            )}
          </button>
          <button
            className={styles.nuevaBtn}
            onClick={activeTab === 'billeteras' ? openCrearModal : () => setIsTransferModalOpen(true)}
            aria-label={activeTab === 'billeteras' ? 'Agregar nueva billetera' : 'Pasar plata'}
          >
            {activeTab === 'billeteras' ? (
              <>
                <Plus size={16} strokeWidth={2.5} />
                Nueva<span className={styles.btnSuffix}> billetera</span>
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} strokeWidth={2.5} />
                Pasar plata
              </>
            )}
          </button>
        </div>
      </div>

      {/* Switch de pestañas solo para mobile */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'billeteras' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('billeteras')}
        >
          Mis Billeteras
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'transferencias' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('transferencias')}
        >
          Pasar entre cuentas
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
                <span>≈ USD {totalUSD.toLocaleString('es-AR')}</span>
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
                  label: "Total ARS",
                  value: formatCurrency(totalARS),
                },
                {
                  label: "Total USD",
                  value: `USD ${totalUSD.toLocaleString('es-AR')}`,
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
              {billeterasRegulares.map((b) => (
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
              {billeterasEfectivo.map((b) => (
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
        <div className={styles.transferenciasList}>
          {loadingTransferencias ? (
            <div className={styles.loadingState}>Cargando transferencias...</div>
          ) : gruposTransferencias.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="Pasar plata entre cuentas"
              description="Pasá saldo de una cuenta (origen) a otra (destino) de forma simple."
              actionLabel="Hacer primera transferencia"
              onActionClick={() => setIsTransferModalOpen(true)}
            />
          ) : (
            gruposTransferencias.map(([fecha, txs]) => (
              <div key={fecha} className={styles.dayGroupContainer}>
                <div className={styles.dayGroupHeader}>
                  <h3 className={styles.dayGroupTitle}>
                    {getDayLabel(fecha)}
                  </h3>
                </div>
                <div className={styles.dayGroupList}>
                  {txs.map((tx, idx) => {
                    const orig = billeteras.find(b => b.id === tx.billetera_origen_id)
                    const dest = billeteras.find(b => b.id === tx.billetera_destino_id)
                    return (
                      <div 
                        key={tx.id} 
                        className={idx < txs.length - 1 ? styles.rowWrapperBorder : styles.rowWrapper}
                      >
                        <TransferenciaRow
                          transferencia={tx}
                          billeteraOrigen={orig}
                          billeteraDestino={dest}
                          onDelete={handleDeleteTransferencia}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
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
        />
      )}
    </div>
  )
}
