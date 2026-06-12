// ─── BilleterasPage ───────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Plus, Eye, EyeOff, Wallet } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { calcularTotales, formatSaldo } from '@/lib/utils/billeteras.utils'
import BilleteraCard, { NuevaBilleteraCard } from '@/components/billeteras/BilleteraCard'
import type { CreatePayload } from '@/components/billeteras/BankPickerModal'
import type { EditPayload } from '@/components/billeteras/EditBilleteraModal'
import billeteraService from '@/services/billetera.service'
import { dashboardService } from '@/services/dashboard.service'
import type { Billetera, CotizacionDolar } from '@/types'
import styles from './BilleterasPage.module.css'
import { EmptyState, PageSummaryBar } from '@/components/ui'

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
      title="Todavía no tenés billeteras"
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
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      showToast('Error al cargar datos', 'error')
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [showToast])

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

  // Inicializar la tarjeta principal como la que está al frente por defecto
  if (billeterasActivas.length > 0 && !frontCardId) {
    const principal = billeterasActivas.find(b => b.es_principal)
    setFrontCardId(principal ? principal.id : billeterasActivas[0].id)
  }

  const handleArchivar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.archivar(id)
      await fetchPageData()
      if (b) showToast(`"${b.nombre}" archivada`, 'success')
    } catch {
      showToast('Error al archivar la billetera', 'error')
    }
  }, [billeteras, fetchPageData, showToast])

  const handleDesarchivar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.desarchivar(id)
      await fetchPageData()
      if (b) showToast(`"${b.nombre}" reactivada`, 'success')
    } catch {
      showToast('Error al desarchivar la billetera', 'error')
    }
  }, [billeteras, fetchPageData, showToast])

  const handleEliminar = useCallback(async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (!b) return

    confirm({
      title: 'Eliminar billetera',
      description: `¿Estás seguro de que querés eliminar "${b.nombre}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await billeteraService.delete(id)
          await fetchPageData()
          showToast(`"${b.nombre}" eliminada exitosamente`, 'success')
        } catch (error: unknown) {
          let msg = 'Error al eliminar la billetera'
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosErr = error as { 
              response?: { 
                data?: { 
                  detail?: string | { success?: boolean; error?: { message?: string } } 
                } 
              } 
            }
            const detail = axiosErr.response?.data?.detail
            if (typeof detail === 'string') {
              msg = detail
            } else if (detail && typeof detail === 'object') {
              if (detail.error?.message) {
                msg = detail.error.message
              } else {
                const detailObj = detail as Record<string, unknown>
                if (typeof detailObj.message === 'string') {
                  msg = detailObj.message
                }
              }
            }
          }
          showToast(msg, 'error')
          throw error
        }
      },
    })
  }, [billeteras, confirm, fetchPageData, showToast])

  const handleGuardarEdicion = useCallback(async (id: string, payload: EditPayload) => {
    await billeteraService.update(id, payload)
    await fetchPageData()
    showToast(`Billetera actualizada exitosamente`, 'success')
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
    await billeteraService.create({
      nombre: payload.nombre,
      moneda: payload.moneda,
      saldo_inicial: payload.saldo_inicial,
      es_principal: payload.es_principal,
      bank_id: payload.bank_id,
    })
    await fetchPageData()
    showToast(`"${payload.nombre}" creada exitosamente`, 'success')
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

  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Billeteras</h1>
          <p className={styles.subtitle}>Controlá tus cuentas bancarias, tarjetas y efectivo</p>
        </div>
        <button
          className={styles.nuevaBtn}
          onClick={openCrearModal}
          aria-label="Agregar nueva billetera"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nueva<span className={styles.btnSuffix}> billetera</span>
        </button>
      </div>

      {/* ── Barra de resumen ───────────────────────────────────────────────── */}
      {!isLoading && billeterasActivas.length > 0 && (
        <PageSummaryBar
          className={styles.summaryBar}
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
    </div>
  )
}
