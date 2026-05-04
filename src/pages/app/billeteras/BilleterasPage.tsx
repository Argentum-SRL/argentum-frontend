// ─── BilleterasPage ───────────────────────────────────────────────────────────

import { useState } from 'react'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useFinancial } from '@/hooks/useFinancial'
import { MOCK_COTIZACION_USD } from '@/lib/mock/billeteras.mock'
import { calcularTotales, formatSaldo } from '@/lib/utils/billeteras.utils'
import BilleteraCard, { NuevaBilleteraCard } from '@/components/billeteras/BilleteraCard'
import BankPickerModal from '@/components/billeteras/BankPickerModal'
import type { CreatePayload } from '@/components/billeteras/BankPickerModal'
import EditBilleteraModal from '@/components/billeteras/EditBilleteraModal'
import type { EditPayload } from '@/components/billeteras/EditBilleteraModal'
import billeteraService from '@/services/billetera.service'
import type { Billetera } from '@/types'
import styles from './BilleterasPage.module.css'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden="true" />
      ))}
    </div>
  )
}

// ── Estado vacío ──────────────────────────────────────────────────────────────

function EstadoVacio({ onCrear }: { onCrear: () => void }) {
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
}

// ── Totales hero ──────────────────────────────────────────────────────────────

function TotalesHero({ billeteras }: { billeteras: Billetera[] }) {
  const cotizacion = MOCK_COTIZACION_USD
  const { totalARS, totalUSD, equivalenteTotal } = calcularTotales(billeteras, cotizacion.valor)

  return (
    <div className={styles.totals}>
      <div className={styles.tmMain}>
        <p className={styles.totalLbl}>Equivalente total</p>
        <p className={styles.tmMainVal}>{formatSaldo(equivalenteTotal, 'ARS')}</p>
        <span className={styles.totalBadge}>
          USD {cotizacion.tipo} · {formatSaldo(cotizacion.valor, 'ARS')}
        </span>
      </div>

      <div className={styles.tmRow}>
        <div className={styles.tmSub}>
          <p className={styles.totalLbl}>Total ARS</p>
          <p className={styles.tmSubVal}>{formatSaldo(totalARS, 'ARS')}</p>
          <p className={styles.totalSub}>pesos argentinos</p>
        </div>
        <div className={styles.tmSub}>
          <p className={styles.totalLbl}>Total USD</p>
          <p className={styles.tmSubVal}>{formatSaldo(totalUSD, 'USD')}</p>
          <p className={styles.totalSub}>dólares</p>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BilleterasPage() {
  const { usuario } = useAuth()
  const { showToast } = useToast()
  const { billeteras, isLoading, refreshBilleteras } = useFinancial()

  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [billeteraAEditar, setBilleteraAEditar] = useState<Billetera | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const billeterasActivas = billeteras.filter((b) => b.estado === 'activa')
  const billeterasArchivadas = billeteras.filter((b) => b.estado === 'archivada')
  const billeterasRegulares = billeterasActivas.filter((b) => !b.es_efectivo)
  const billeterasEfectivo = billeterasActivas.filter((b) => b.es_efectivo)

  const handleArchivar = async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.archivar(id)
      await refreshBilleteras()
      if (b) showToast(`"${b.nombre}" archivada`, 'success')
    } catch {
      showToast('Error al archivar la billetera', 'error')
    }
  }

  const handleDesarchivar = async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    try {
      await billeteraService.desarchivar(id)
      await refreshBilleteras()
      if (b) showToast(`"${b.nombre}" reactivada`, 'success')
    } catch {
      showToast('Error al desarchivar la billetera', 'error')
    }
  }

  const handleEliminar = async (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (!b) return

    const confirmacion = window.confirm(`¿Estás seguro de que querés eliminar "${b.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmacion) return

    try {
      await billeteraService.delete(id)
      await refreshBilleteras()
      showToast(`"${b.nombre}" eliminada exitosamente`, 'success')
    } catch (error: unknown) {
      let msg = 'Error al eliminar la billetera'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { detail?: string } } }
        msg = axiosErr.response?.data?.detail || msg
      }
      showToast(msg, 'error')
    }
  }

  const handleEditar = (id: string) => {
    const b = billeteras.find((b) => b.id === id)
    if (b) {
      setBilleteraAEditar(b)
      setEditModalOpen(true)
    }
  }

  const handleGuardarEdicion = async (id: string, payload: EditPayload) => {
    await billeteraService.update(id, payload)
    await refreshBilleteras()
    setEditModalOpen(false)
    setBilleteraAEditar(null)
    showToast(`Billetera actualizada exitosamente`, 'success')
  }

  const handleCrear = async (payload: CreatePayload) => {
    await billeteraService.create({
      nombre: payload.nombre,
      moneda: payload.moneda,
      saldo_inicial: payload.saldo_inicial,
      es_principal: payload.es_principal,
      bank_id: payload.bank_id,
    })
    await refreshBilleteras()
    setModalOpen(false)
    showToast(`"${payload.nombre}" creada exitosamente`, 'success')
  }

  const monedaPrincipal = (usuario?.moneda_principal as 'ARS' | 'USD') ?? 'ARS'

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
              {formatSaldo(
                billeteras
                  .filter((b) => b.estado === 'activa' && b.moneda === 'ARS')
                  .reduce((a, b) => a + b.saldo_actual, 0),
                'ARS',
              )}
            </p>
          )}
        </div>
        <button
          className={styles.nuevaBtn}
          onClick={() => setModalOpen(true)}
          aria-label="Agregar nueva billetera"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nueva<span className={styles.btnSuffix}> billetera</span>
        </button>
      </div>

      {/* ── Barra de resumen ───────────────────────────────────────────────── */}
      {!isLoading && billeterasActivas.length > 0 && (
        <TotalesHero billeteras={billeteras} />
      )}

      {/* ── Grid / Skeleton / Estado vacío ────────────────────────────────── */}
      {isLoading ? (
        <SkeletonGrid />
      ) : billeterasActivas.length === 0 ? (
        <EstadoVacio onCrear={() => setModalOpen(true)} />
      ) : (
        <div className={styles.grid}>
          {billeterasRegulares.map((b) => (
            <BilleteraCard
              key={b.id}
              billetera={b}
              onArchivar={handleArchivar}
              onDesarchivar={handleDesarchivar}
              onEliminar={handleEliminar}
              onEditar={handleEditar}
            />
          ))}
          {billeterasEfectivo.map((b) => (
            <BilleteraCard key={b.id} billetera={b} />
          ))}
          <NuevaBilleteraCard onClick={() => setModalOpen(true)} />
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <BankPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCrear={handleCrear}
        billeterasActuales={billeteras}
        monedaPrincipalUsuario={monedaPrincipal}
      />

      {/* ── Modal Edición ──────────────────────────────────────────────────── */}
      <EditBilleteraModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onEditar={handleGuardarEdicion}
        billetera={billeteraAEditar}
        billeteraPrincipalActual={billeteras.find((b) => b.es_principal)}
      />

      {/* ── Sección de archivadas ─────────────────────────────────────────── */}
      {!isLoading && billeterasArchivadas.length > 0 && (
        <div className={styles.archivedSection}>
          <div className={styles.archivedHeader}>
            <h2 className={styles.archivedTitle}>
              Billeteras archivadas ({billeterasArchivadas.length})
            </h2>
            <button 
              className={styles.showArchivedBtn}
              onClick={() => setShowArchived(!showArchived)}
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
