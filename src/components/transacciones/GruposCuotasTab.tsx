import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Trash2, Edit2, AlertTriangle, XCircle } from 'lucide-react'
import styles from './GruposCuotasTab.module.css'
import grupoCuotasService from '@/services/grupoCuotas.service'
import billeteraService from '@/services/billetera.service'
import type { GrupoCuotasResumen, Billetera } from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import { EmptyState, SelectInput } from '@/components/ui'
import Modal from '@/components/ui/Modal/Modal'

interface GrupoCuotasResumenExtended extends GrupoCuotasResumen {
  estado?: 'activo' | 'cancelado' | 'completado'
}

export default function GruposCuotasTab() {
  const [grupos, setGrupos] = useState<GrupoCuotasResumenExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGrupo, setEditingGrupo] = useState<GrupoCuotasResumenExtended | null>(null)
  
  // States for the edit form
  const [editDesc, setEditDesc] = useState('')
  const [editMonto, setEditMonto] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  // Prepayment & Wallet states
  const [grupoPrepago, setGrupoPrepago] = useState<GrupoCuotasResumenExtended | null>(null)
  const [billeteraSeleccionada, setBilleteraSeleccionada] = useState<string>('')
  const [billeteras, setBilleteras] = useState<Billetera[]>([])

  const { showToast } = useToast()
  const { confirm } = useModal()

  const fetchGrupos = useCallback(async () => {
    try {
      const data = await grupoCuotasService.getGruposCuotas()
      setGrupos(data)
    } catch (e) {
      console.error(e)
      showToast(getErrorMessage(e, 'No pudimos cargar los grupos de cuotas. Intentá de nuevo.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchBilleteras = useCallback(async () => {
    try {
      const data = await billeteraService.list()
      setBilleteras(data.filter(b => b.estado === 'activa'))
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrupos()
      fetchBilleteras()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchGrupos, fetchBilleteras])

  const handleEditClick = (grupo: GrupoCuotasResumenExtended) => {
    setEditingGrupo(grupo)
    setEditDesc(grupo.descripcion)
    setEditMonto(grupo.monto_total)
  }

  const handleCancelar = (grupo: GrupoCuotasResumenExtended) => {
    confirm({
      title: '¿Cancelás esta cuota?',
      description: 'La cuota se va a marcar como cancelada y no se va a cobrar más.',
      variant: 'danger',
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        try {
          await grupoCuotasService.cancelarGrupo(grupo.id)
          showToast('Cuotas canceladas correctamente', 'success')
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const handlePrepagar = (grupo: GrupoCuotasResumenExtended) => {
    setGrupoPrepago(grupo)
    setBilleteraSeleccionada('')
  }

  const confirmarPrepago = async () => {
    if (!grupoPrepago || !billeteraSeleccionada) return
    confirm({
      title: '¿Prepagás las cuotas restantes?',
      description: 'Se van a saldar todas las cuotas pendientes de este grupo.',
      variant: 'default',
      confirmLabel: 'Confirmar',
      onConfirm: async () => {
        setSaving(true)
        try {
          await grupoCuotasService.prepagarGrupo(grupoPrepago.id, billeteraSeleccionada)
          showToast('¡Listo! Las cuotas restantes se saldaron.', 'success')
          setGrupoPrepago(null)
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos saldar las cuotas. Intentá de nuevo.'), 'error')
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGrupo) return

    if (!editDesc.trim()) {
      showToast('Ingresá una descripción válida', 'error')
      return
    }

    if (editMonto === '' || editMonto <= 0) {
      showToast('Ingresá un monto total válido', 'error')
      return
    }

    setSaving(true)
    try {
      await grupoCuotasService.updateGrupoCuotas(editingGrupo.id, {
        descripcion: editDesc,
        monto_total_nuevo: editMonto
      })
      showToast('Compra en cuotas actualizada', 'success')
      setEditingGrupo(null)
      fetchGrupos()
    } catch (e: unknown) {
      console.error(e)
      showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    confirm({
      title: '¿Eliminás esta compra en cuotas?',
      description: 'Se borran todas las cuotas pendientes. Las ya pagadas quedan en tu historial.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await grupoCuotasService.deleteGrupoCuotas(id)
          showToast('Compra en cuotas eliminada', 'success')
          fetchGrupos()
        } catch (e) {
          console.error(e)
          showToast(getErrorMessage(e, 'No pudimos completar la acción. Intentá de nuevo.'), 'error')
        }
      }
    })
  }

  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return ''
    const cleanStr = fechaStr.split('T')[0]
    const [year, month, day] = cleanStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return <div className={styles.loadingState}>Cargando compras en cuotas...</div>
  }

  if (grupos.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No tenés compras en cuotas"
        description="No tenés compras en cuotas activas."
      />
    )
  }

  return (
    <div className={styles.container}>
      <style>{`
        .canceladaBadge {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: #EF4444 !important;
        }
        .prepayInfoPanel {
          background: var(--surface-alt) !important;
          border: 1px solid var(--border) !important;
        }
        .prepayInfoIcon {
          color: var(--primary) !important;
        }
        .prepayInfoText {
          color: var(--text) !important;
        }
        .redInfoPanel {
          border: 1px solid rgba(220, 38, 38, 0.2) !important;
          background: rgba(220, 38, 38, 0.08) !important;
        }
        .redInfoIcon {
          color: #DC2626 !important;
        }
        .redInfoText {
          color: #991B1B !important;
        }
      `}</style>
      <div className={styles.grid}>
        {grupos.map((grupo) => {
          const progressPercent = grupo.cantidad_cuotas > 0 
            ? (grupo.cantidad_pagadas / grupo.cantidad_cuotas) * 100 
            : 0

          return (
            <div key={grupo.id} className={styles.card}>
              
              {/* ENCABEZADO */}
              <div className={styles.cardHeader}>
                <div className={styles.headerMain}>
                  <h3 className={styles.cardTitle}>{grupo.descripcion}</h3>
                  <div className={styles.badgeRow}>
                    {grupo.tarjeta_nombre && (
                      <span className={styles.cardBadge}>{grupo.tarjeta_nombre}</span>
                    )}
                    {grupo.tiene_interes && (
                      <span className={styles.interesBadge}>Con Interés</span>
                    )}
                  </div>
                </div>
                <span className={styles.cardTotal}>
                  {formatMonto(grupo.monto_total, grupo.moneda)}
                </span>
              </div>

              {/* PROGRESO */}
              <div className={styles.cardProgressArea}>
                <svg className={styles.progressBarSvg}>
                  <rect width="100%" height="6" rx="3" fill="var(--border)" />
                  <rect width={`${progressPercent}%`} height="6" rx="3" fill="var(--primary)" />
                </svg>
                
                <div className={styles.progressTextRow}>
                  <span className={styles.progressText}>
                    {grupo.cantidad_pagadas} de {grupo.cantidad_cuotas} cuotas pagadas
                  </span>
                  <span className={styles.installmentText}>
                    {formatMonto(grupo.monto_cuota, grupo.moneda)} por cuota
                  </span>
                </div>

                <div className={styles.vencimientoRow}>
                  {grupo.cantidad_pendientes > 0 ? (
                    <span className={styles.vencimientoText}>
                      Próximo vencimiento: {formatFecha(grupo.proximo_vencimiento!)}
                    </span>
                  ) : (grupo.estado === 'cancelado' || grupo.cantidad_pagadas < grupo.cantidad_cuotas) ? (
                    <span className={`${styles.completedBadge} canceladaBadge`}>Cancelada</span>
                  ) : (
                    <span className={styles.completedBadge}>Completada</span>
                  )}
                </div>
              </div>

              {/* MONTOS DESGLOSADOS */}
              <div className={styles.cardAmountsRow}>
                <div className={styles.amountCol}>
                  <span className={styles.amountLabel}>Total pagado</span>
                  <span className={styles.amountValue}>
                    {formatMonto(grupo.total_pagado, grupo.moneda)}
                  </span>
                </div>
                <div className={styles.amountCol}>
                  <span className={styles.amountLabel}>Total pendiente</span>
                  <span className={`${styles.amountValue} ${grupo.total_pendiente > 0 ? styles.pendingAmount : ''}`}>
                    {formatMonto(grupo.total_pendiente, grupo.moneda)}
                  </span>
                </div>
              </div>

              {/* ACCIONES */}
              <div className={styles.cardActions}>
                {grupo.cantidad_pendientes > 0 && (grupo.estado === 'activo' || !grupo.estado) && (
                  <button 
                    className={styles.editBtn} 
                    onClick={() => handlePrepagar(grupo)}
                  >
                    <CreditCard size={14} className={styles.actionIcon} />
                    Prepagar
                  </button>
                )}

                {grupo.cantidad_pendientes > 0 && grupo.estado !== 'cancelado' && (
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => handleCancelar(grupo)}
                  >
                    <XCircle size={14} className={styles.actionIcon} />
                    Cancelar
                  </button>
                )}

                <button 
                  className={styles.editBtn} 
                  onClick={() => handleEditClick(grupo)}
                >
                  <Edit2 size={14} className={styles.actionIcon} />
                  Editar
                </button>
                <button 
                  className={styles.deleteBtn} 
                  onClick={() => handleDeleteClick(grupo.id)}
                >
                  <Trash2 size={14} className={styles.actionIcon} />
                  Eliminar
                </button>
              </div>

            </div>
          )
        })}
      </div>

      {/* MODAL DE EDICIÓN */}
      <Modal 
        isOpen={!!editingGrupo} 
        onClose={() => setEditingGrupo(null)}
        title="Editar compra en cuotas"
        size="md"
      >
        {editingGrupo && (
          <form onSubmit={handleSave} className={styles.editForm}>
            
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Descripción</label>
              <input 
                type="text" 
                className={styles.fieldInput} 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Ej. Compra de heladera"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Monto total de la compra</label>
              <div className={styles.inputWithCurrency}>
                <span className={styles.currencyPrefix}>{editingGrupo.moneda}</span>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.fieldInput} 
                  value={editMonto} 
                  onChange={(e) => setEditMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className={styles.modalInfoPanel}>
              <AlertTriangle size={18} className={styles.infoIcon} />
              <p className={styles.infoText}>
                Si ajustás el monto total, se recalculará automáticamente el valor de las{' '}
                <strong>{editingGrupo.cantidad_pendientes} cuotas que aún no pagaste</strong>. 
                Las cuotas ya abonadas no serán modificadas.
              </p>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => setEditingGrupo(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.submitBtn} 
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

          </form>
        )}
      </Modal>

      {/* MODAL DE PREPAGO */}
      <Modal 
        isOpen={!!grupoPrepago} 
        onClose={() => setGrupoPrepago(null)}
        title="Prepagar cuotas"
        size="md"
      >
        {grupoPrepago && (
          <div className={styles.editForm}>
            <div className={`${styles.modalInfoPanel} prepayInfoPanel`}>
              <CreditCard size={18} className={`${styles.infoIcon} prepayInfoIcon`} />
              <p className={`${styles.infoText} prepayInfoText`}>
                Seleccioná la billetera desde donde se debitará el monto total pendiente de{' '}
                <strong>{grupoPrepago.cantidad_pendientes} cuotas</strong>:{' '}
                <strong>{formatMonto(grupoPrepago.total_pendiente, grupoPrepago.moneda)}</strong>
              </p>
            </div>

            {billeteras.length === 0 ? (
              <div className={`${styles.modalInfoPanel} redInfoPanel`}>
                <AlertTriangle size={18} className={`${styles.infoIcon} redInfoIcon`} />
                <p className={`${styles.infoText} redInfoText`}>
                  No tenés billeteras disponibles para realizar el pago.
                </p>
              </div>
            ) : (
              <SelectInput
                id="select-billetera-prepago"
                label="Billetera de débito"
                placeholder="Seleccioná una billetera"
                value={billeteraSeleccionada}
                onChange={setBilleteraSeleccionada}
                options={billeteras.map((b) => ({
                  value: b.id,
                  label: `${b.nombre} (${formatMonto(b.saldo_actual, b.moneda)})`
                }))}
              />
            )}

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => setGrupoPrepago(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className={styles.submitBtn} 
                onClick={confirmarPrepago}
                disabled={saving || !billeteraSeleccionada || billeteras.length === 0}
              >
                {saving ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
