import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Pause, 
  Play, 
  Edit3, 
  Trash2,
  Clock
} from 'lucide-react'
import styles from './RecurrentesPage.module.css'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import recurrenteService from '@/services/recurrente.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import type { TransaccionRecurrente, Billetera, Categoria } from '@/types'
import { formatMonto } from '@/utils/format'
import Button from '@/components/ui/Button/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

interface RecurrentesPageProps {
  embedded?: boolean
}

const RecurrentesPage: React.FC<RecurrentesPageProps> = ({ embedded = false }) => {
  const [recurrentes, setRecurrentes] = useState<TransaccionRecurrente[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    tipo: 'egreso' as 'ingreso' | 'egreso',
    descripcion: '',
    monto: null as number | null,
    moneda: 'ARS' as 'ARS' | 'USD',
    billetera_id: '',
    categoria_id: '',
    frecuencia: 'mensual' as 'semanal' | 'quincenal' | 'mensual',
    dia_registro: 1
  })

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const [r, b, c] = await Promise.all([
        recurrenteService.getRecurrentes(),
        billeteraService.list(),
        categoriaService.getCategorias()
      ])
      setRecurrentes(r)
      setBilleteras(b.filter((w: Billetera) => w.estado === 'activa'))
      setCategorias(c)
    } catch (err) {
      console.error('Error al cargar datos:', err)
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchInitialData])

  const handleOpenModal = (rec?: TransaccionRecurrente) => {
    if (rec) {
      setEditingId(rec.id)
      setFormData({
        tipo: rec.tipo,
        descripcion: rec.descripcion,
        monto: rec.monto,
        moneda: rec.moneda,
        billetera_id: rec.billetera_id,
        categoria_id: rec.categoria_id || '',
        frecuencia: rec.frecuencia,
        dia_registro: rec.dia_registro
      })
    } else {
      setEditingId(null)
      setFormData({
        tipo: 'egreso',
        descripcion: '',
        monto: null,
        moneda: 'ARS',
        billetera_id: '',
        categoria_id: '',
        frecuencia: 'mensual',
        dia_registro: 1
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        monto: formData.monto || 0,
        categoria_id: formData.categoria_id || null,
        billetera_id: formData.billetera_id
      }
      if (editingId) {
        await recurrenteService.updateRecurrente(editingId, payload)
      } else {
        await recurrenteService.createRecurrente(payload)
      }
      setIsModalOpen(false)
      showToast(editingId ? 'Configuración actualizada' : 'Recurrente creada', 'success')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      showToast('Error al guardar la recurrente', 'error')
    }
  }

  const handleToggleEstado = async (rec: TransaccionRecurrente) => {
    try {
      if (rec.estado === 'activa') {
        await recurrenteService.pausarRecurrente(rec.id)
      } else {
        await recurrenteService.reanudarRecurrente(rec.id)
      }
      showToast(rec.estado === 'activa' ? 'Recurrente pausada' : 'Recurrente reanudada', 'success')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      showToast('Error al cambiar el estado', 'error')
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await recurrenteService.deleteRecurrente(deleteTarget)
      showToast('Recurrente eliminada', 'success')
      fetchInitialData()
    } catch (err) {
      console.error(err)
      showToast('Error al eliminar', 'error')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getFriendlyFrequency = (rec: TransaccionRecurrente) => {
    if (rec.frecuencia === 'semanal') {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      return `Cada semana (${dias[rec.dia_registro]})`
    }
    if (rec.frecuencia === 'quincenal') return 'Cada 15 días'
    if (rec.frecuencia === 'mensual') return `Cada mes el día ${rec.dia_registro}`
    return rec.frecuencia
  }

  const activas = recurrentes.filter(r => r.estado === 'activa')
  const pausadas = recurrentes.filter(r => r.estado === 'pausada')

  const renderCard = (rec: TransaccionRecurrente) => (
    <div key={rec.id} className={`${styles.card} ${rec.estado === 'pausada' ? styles.pausada : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.mainInfo}>
          <div className={`${styles.iconWrapper} ${rec.tipo === 'ingreso' ? styles.ingresoIcon : styles.egresoIcon}`}>
            {(() => {
              const cat = categorias.find(c => c.id === rec.categoria_id)
              if (cat) {
                return <CategoriaIcon nombre={cat.nombre} size={32} />
              }
              const IconComp = rec.tipo === 'ingreso' ? ArrowUpRight : ArrowDownLeft
              return <IconComp size={20} strokeWidth={1.75} />
            })()}
          </div>
          <div className={styles.titleArea}>
            <h3>{rec.descripcion}</h3>
            <span className={styles.monto}>
              {formatMonto(rec.monto, rec.moneda)}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton} 
            title={rec.estado === 'activa' ? 'Pausar' : 'Reanudar'}
            onClick={() => handleToggleEstado(rec)}
          >
            {rec.estado === 'activa' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            className={styles.actionButton} 
            onClick={() => handleOpenModal(rec)}
            title="Editar recurrente"
          >
            <Edit3 size={16} />
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteAction}`} 
            onClick={() => setDeleteTarget(rec.id)}
            title="Eliminar recurrente"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.frequencyArea}>
        <div className={styles.detailItem}>
          <Clock size={14} />
          <span>{getFriendlyFrequency(rec)}</span>
        </div>
        <div className={styles.detailItem}>
          <Wallet size={14} />
          <span>{billeteras.find(b => b.id === rec.billetera_id)?.nombre || 'Billetera desconocida'}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={embedded ? styles.embeddedContainer : styles.container}>
      {!embedded ? (
        <header className={styles.header}>
          <h1>Recurrentes</h1>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} /> Nueva recurrente
          </Button>
        </header>
      ) : (
        <div className={styles.embeddedHeader}>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} /> Nueva recurrente
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}>Cargando...</div>
      ) : recurrentes.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={40} className={styles.emptyStateIcon} />
          <p>No tienes transacciones recurrentes configuradas.</p>
          <p className={styles.emptyStateSubtext}>Las recurrentes generan movimientos automáticos según la frecuencia que elijas.</p>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <h2>
              Activas <span className={styles.count}>{activas.length}</span>
            </h2>
            <div className={styles.grid}>
              {activas.map(renderCard)}
            </div>
          </section>

          {pausadas.length > 0 && (
            <section className={styles.section}>
              <h2>
                Pausadas <span className={styles.count}>{pausadas.length}</span>
              </h2>
              <div className={styles.grid}>
                {pausadas.map(renderCard)}
              </div>
            </section>
          )}
        </>
      )}


      <Drawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Recurrente' : 'Nueva Recurrente'}
        width={480}
      >
        <div className={styles.drawerForm}>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <label htmlFor="form-desc" className={styles.label}>Descripción <span className={styles.fieldOptional}>(opcional)</span></label>
              <input 
                id="form-desc"
                type="text" 
                className={styles.input} 
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Ej: Netflix, Alquiler, Sueldo..."
              />
            </div>

            <div>
              <label htmlFor="form-tipo" className={styles.label}>Tipo</label>
              <select 
                id="form-tipo"
                className={styles.select}
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value as 'ingreso' | 'egreso'})}
                title="Tipo de transacción"
              >
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div>
              <MontoInput
                value={formData.monto}
                onChange={v => setFormData({...formData, monto: v})}
                moneda={formData.moneda}
                label="Monto"
                placeholder="0"
                allowDecimals
              />
            </div>

            <div>
              <label htmlFor="form-moneda" className={styles.label}>Moneda</label>
              <select 
                id="form-moneda"
                className={styles.select}
                value={formData.moneda}
                onChange={e => setFormData({...formData, moneda: e.target.value as 'ARS' | 'USD'})}
                title="Moneda"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label htmlFor="form-billetera" className={styles.label}>Billetera</label>
              <select 
                id="form-billetera"
                className={styles.select}
                value={formData.billetera_id}
                onChange={e => setFormData({...formData, billetera_id: e.target.value})}
                title="Seleccionar billetera"
              >
                <option value="">Seleccionar...</option>
                {billeteras.filter(b => b.moneda === formData.moneda).map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>

            <div className={styles.fullWidth}>
              <label htmlFor="form-categoria" className={styles.label}>Categoría</label>
              <select 
                id="form-categoria"
                className={styles.select}
                value={formData.categoria_id}
                onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                title="Seleccionar categoría"
              >
                <option value="">Seleccionar...</option>
                {categorias.filter(c => c.tipo === formData.tipo).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="form-frecuencia" className={styles.label}>Frecuencia</label>
              <select 
                id="form-frecuencia"
                className={styles.select}
                value={formData.frecuencia}
                onChange={e => setFormData({...formData, frecuencia: e.target.value as 'semanal' | 'quincenal' | 'mensual', dia_registro: 1})}
                title="Frecuencia de registro"
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div>
              <label htmlFor="form-dia" className={styles.label}>Día de registro</label>
              {formData.frecuencia === 'semanal' ? (
                <select 
                  id="form-dia"
                  className={styles.select}
                  value={formData.dia_registro}
                  onChange={e => setFormData({...formData, dia_registro: parseInt(e.target.value)})}
                  title="Seleccionar día de la semana"
                >
                  <option value={0}>Lunes</option>
                  <option value={1}>Martes</option>
                  <option value={2}>Miércoles</option>
                  <option value={3}>Jueves</option>
                  <option value={4}>Viernes</option>
                  <option value={5}>Sábado</option>
                  <option value={6}>Domingo</option>
                </select>
              ) : (
                <input 
                  id="form-dia"
                  type="number" 
                  min={1} 
                  max={28}
                  className={styles.input}
                  value={formData.dia_registro}
                  onChange={e => setFormData({...formData, dia_registro: parseInt(e.target.value) || 1})}
                />
              )}
            </div>
          </div>

          <div className={styles.drawerFooter}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} fullWidth>Guardar configuración</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Eliminar transacción recurrente"
        description="¿Estás seguro de eliminar esta transacción recurrente? Dejará de generar transacciones automáticas."
        variant="danger"
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  )
}

export default RecurrentesPage
