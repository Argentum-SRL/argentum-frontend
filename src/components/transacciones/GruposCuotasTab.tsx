import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Trash2, Edit2, AlertTriangle } from 'lucide-react'
import styles from './GruposCuotasTab.module.css'
import grupoCuotasService from '@/services/grupoCuotas.service'
import type { GrupoCuotasResumen } from '@/types'
import { formatMonto } from '@/utils/format'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import { EmptyState } from '@/components/ui'
import Modal from '@/components/ui/Modal/Modal'

export default function GruposCuotasTab() {
  const [grupos, setGrupos] = useState<GrupoCuotasResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGrupo, setEditingGrupo] = useState<GrupoCuotasResumen | null>(null)
  
  // States for the edit form
  const [editDesc, setEditDesc] = useState('')
  const [editMonto, setEditMonto] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  const { showToast } = useToast()
  const { confirm } = useModal()

  const fetchGrupos = useCallback(async () => {
    try {
      const data = await grupoCuotasService.getGruposCuotas()
      setGrupos(data)
    } catch (e) {
      console.error(e)
      showToast('Error al cargar grupos de cuotas', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrupos()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchGrupos])

  const handleEditClick = (grupo: GrupoCuotasResumen) => {
    setEditingGrupo(grupo)
    setEditDesc(grupo.descripcion)
    setEditMonto(grupo.monto_total)
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
      const axiosError = e as { response?: { data?: { error?: { message?: string } } } }
      const errorMsg = axiosError.response?.data?.error?.message || 'Error al actualizar la compra'
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    confirm({
      title: '¿Eliminar esta compra en cuotas?',
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
          showToast('Error al eliminar la compra en cuotas', 'error')
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
    </div>
  )
}
