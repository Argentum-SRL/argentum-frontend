// ─── BilleterasPage ───────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Plus, Eye, EyeOff, Info } from 'lucide-react'
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
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} aria-hidden="true">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="36" cy="36" r="36" fill="var(--surface-alt)" />
          <path d="M22 28C22 25.8 23.8 24 26 24H46C48.2 24 50 25.8 50 28V44C50 46.2 48.2 48 46 48H26C23.8 48 22 46.2 22 44V28Z" stroke="var(--silver)" strokeWidth="1.75" fill="none"/>
          <path d="M22 32H50" stroke="var(--silver)" strokeWidth="1.75"/>
          <rect x="28" y="38" width="8" height="4" rx="2" fill="var(--silver)" opacity="0.5"/>
        </svg>
      </div>
      <h2 className={styles.emptyTitle}>Todavía no tenés billeteras</h2>
      <p className={styles.emptySubtitle}>
        Agregá tu primera billetera para empezar a llevar el control de tu plata.
      </p>
      <button className={styles.emptyBtn} onClick={onCrear}>
        <Plus size={16} strokeWidth={2} />
        Crear primera billetera
      </button>
    </div>
  )
})
EstadoVacio.displayName = 'EstadoVacio'

// ── Totales hero ──────────────────────────────────────────────────────────────

const TotalesHero = memo(({ billeteras, cotizacion }: { billeteras: Billetera[], cotizacion: CotizacionDolar | null }) => {
  const valorUSD = cotizacion?.venta ?? 0
  const tipoLabel = cotizacion?.nombre ?? 'Blue'
  
  const { totalARS, totalUSD, equivalenteTotal } = useMemo(() => 
    calcularTotales(billeteras, valorUSD), 
    [billeteras, valorUSD]
  )

  return (
    <div className={styles.totals}>
      <div className={styles.tmMain}>
        <p className={styles.totalLbl}>Equivalente total</p>
        <p className={styles.tmMainVal}>{formatSaldo(equivalenteTotal, 'ARS')}</p>
      </div>

      <div className={styles.tmRow}>
        <div className={styles.tmSub}>
          <p className={styles.totalLbl}>Total ARS</p>
          <p className={styles.tmSubVal}>{formatSaldo(totalARS, 'ARS')}</p>
        </div>
        <div className={styles.tmSub}>
          <div className={styles.lblWithIcon}>
            <p className={styles.totalLbl}>Total USD</p>
            <Info 
              size={12} 
              color="rgba(255, 255, 255, 0.4)" 
              style={{ cursor: 'help' }}
              title={`Cotización utilizada: USD ${tipoLabel} · ${formatSaldo(valorUSD, 'ARS')}`}
            />
          </div>
          <p className={styles.tmSubVal}>{formatSaldo(totalUSD, 'USD')}</p>
        </div>
      </div>
    </div>
  )
})
TotalesHero.displayName = 'TotalesHero'

// ── Página principal ──────────────────────────────────────────────────────────

export default function BilleterasPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()
  const { open, confirm } = useModal()
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [frontCardId, setFrontCardId] = useState<string | null>(null)
  const [cotizacion, setCotizacion] = useState<CotizacionDolar | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPageData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [bRes, cRes] = await Promise.all([
        billeteraService.list(),
        dashboardService.getCotizacion().catch(() => null)
      ])
      
      if (Array.isArray(bRes)) {
        setBilleteras(bRes.map((d: Billetera) => ({
          ...d,
          saldo_actual: Number(d.saldo_actual),
          saldo_inicial: Number(d.saldo_inicial)
        })))
      }
      setCotizacion(cRes)
    } catch (err) {
      console.error('Error fetching billeteras data:', err)
      showToast('Error al cargar datos', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    const tid = setTimeout(() => {
      void fetchPageData()
    }, 0)
    return () => clearTimeout(tid)
  }, [fetchPageData])

  const [showArchived, setShowArchived] = useState(false)

  const { 
    billeterasActivas, 
    billeterasArchivadas, 
    billeterasRegulares, 
    billeterasEfectivo,
    totalARSActivo
  } = useMemo(() => {
    const activas = billeteras.filter((b) => b.estado === 'activa')
    const archivadas = billeteras.filter((b) => b.estado === 'archivada')
    
    return {
      billeterasActivas: activas,
      billeterasArchivadas: archivadas,
      billeterasRegulares: activas.filter((b) => !b.es_efectivo),
      billeterasEfectivo: activas.filter((b) => b.es_efectivo),
      totalARSActivo: activas
        .filter((b) => b.moneda === 'ARS')
        .reduce((a, b) => a + b.saldo_actual, 0)
    }
  }, [billeteras])

  // Inicializar la tarjeta principal como la que está al frente por defecto
  useEffect(() => {
    if (billeterasActivas.length > 0 && !frontCardId) {
      const principal = billeterasActivas.find(b => b.es_principal)
      if (principal) {
        setFrontCardId(principal.id)
      } else {
        setFrontCardId(billeterasActivas[0].id)
      }
    }
  }, [billeterasActivas, frontCardId])

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
            const axiosErr = error as { response?: { data?: { detail?: string } } }
            msg = axiosErr.response?.data?.detail || msg
          }
          showToast(msg, 'error')
        }
      },
    })
  }, [billeteras, confirm, fetchPageData, showToast])

  const handleGuardarEdicion = useCallback(async (id: string, payload: EditPayload) => {
    await billeteraService.update(id, payload)
    await fetchPageData()
    showToast(`Billetera actualizada exitosamente`, 'success')
  }, [fetchPageData, showToast])

  const handleEditar = useCallback((id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (b) {
      open('editBilletera', {
        data: {
          billetera: b,
          billeteraPrincipalActual: billeteras.find((item) => item.es_principal),
          onEditar: handleGuardarEdicion,
        },
      })
    }
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
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Billeteras</h1>
          {!isLoading && (
            <p className={styles.pageSubtitle}>
              {billeterasActivas.length} activa{billeterasActivas.length !== 1 ? 's' : ''}
              {' · '}Total:{' '}
              {formatSaldo(totalARSActivo, 'ARS')}
            </p>
          )}
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
        <TotalesHero billeteras={billeteras} cotizacion={cotizacion} />
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
