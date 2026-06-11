import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import recurrenteService from '@/services/recurrente.service'
import type { TransaccionRecurrente, Billetera, Categoria } from '@/types'
import Button from '@/components/ui/Button/Button'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import styles from '@/pages/app/transacciones/RecurrentesPage.module.css'

interface RecurrenteModalProps {
  isOpen: boolean
  onClose: () => void
  recurrente: TransaccionRecurrente | null
  billeteras: Billetera[]
  categorias: Categoria[]
  onSuccess: () => Promise<void> | void
}

function getInitialFormData(recurrente: TransaccionRecurrente | null) {
  if (recurrente) {
    return {
      tipo: recurrente.tipo,
      descripcion: recurrente.descripcion,
      monto: recurrente.monto,
      moneda: recurrente.moneda,
      billetera_id: recurrente.billetera_id,
      categoria_id: recurrente.categoria_id || '',
      frecuencia: recurrente.frecuencia,
      dia_registro: recurrente.dia_registro,
    }
  }

  return {
    tipo: 'egreso' as 'ingreso' | 'egreso',
    descripcion: '',
    monto: null as number | null,
    moneda: 'ARS' as 'ARS' | 'USD',
    billetera_id: '',
    categoria_id: '',
    frecuencia: 'mensual' as 'semanal' | 'quincenal' | 'mensual',
    dia_registro: 1,
  }
}

export default function RecurrenteModal({
  isOpen,
  onClose,
  recurrente,
  billeteras,
  categorias,
  onSuccess,
}: RecurrenteModalProps) {
  const { showToast } = useToast()
  const { confirm } = useModal()
  const [formData, setFormData] = useState(() => getInitialFormData(recurrente))

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        monto: formData.monto || 0,
        categoria_id: formData.categoria_id || null,
        billetera_id: formData.billetera_id,
      }

      if (recurrente) {
        await recurrenteService.updateRecurrente(recurrente.id, payload)
      } else {
        await recurrenteService.createRecurrente(payload)
      }

      showToast(recurrente ? 'Configuración actualizada' : 'Recurrente creada', 'success')
      await onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      showToast('Error al guardar la recurrente', 'error')
    }
  }

  const handleDelete = () => {
    if (!recurrente) return

    confirm({
      title: 'Eliminar recurrente',
      description: '¿Estás seguro de eliminar esta transacción recurrente? Dejará de generar transacciones automáticas.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await recurrenteService.deleteRecurrente(recurrente.id)
          showToast('Recurrente eliminada', 'success')
          await onSuccess()
          onClose()
        } catch (err) {
          console.error(err)
          showToast('Error al eliminar', 'error')
        }
      },
    })
  }

  const billeterasFiltradas = billeteras.filter((b) => b.moneda === formData.moneda)
  const categoriasFiltradas = categorias.filter((c) => c.tipo === formData.tipo)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recurrente ? 'Editar Recurrente' : 'Nueva Recurrente'}
      size="md"
    >
      <form 
        className={styles.modalForm}
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <div className={styles.formGrid}>
          <div className={styles.fullWidth}>
            <label htmlFor="form-desc" className={styles.label}>Descripción <span className={styles.fieldOptional}>(opcional)</span></label>
            <input
              id="form-desc"
              type="text"
              className={styles.input}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Ej: Netflix, Alquiler, Sueldo..."
            />
          </div>

          <div>
            <label htmlFor="form-tipo" className={styles.label}>Tipo</label>
            <select
              id="form-tipo"
              className={styles.select}
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'ingreso' | 'egreso' })}
              title="Tipo de transacción"
            >
              <option value="egreso">Egreso</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </div>

          <div className={styles.fullWidth}>
            <MontoInput
              value={formData.monto}
              onChange={(v) => setFormData({ ...formData, monto: v })}
              moneda={formData.moneda}
              onMonedaChange={(m) => setFormData({ ...formData, moneda: m })}
              label="Monto"
              placeholder="0"
              allowDecimals
            />
          </div>

          <div>
            <label htmlFor="form-billetera" className={styles.label}>Billetera</label>
            <select
              id="form-billetera"
              className={styles.select}
              value={formData.billetera_id}
              onChange={(e) => setFormData({ ...formData, billetera_id: e.target.value })}
              title="Seleccionar billetera"
            >
              <option value="">Seleccionar...</option>
              {billeterasFiltradas.map((b) => (
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
              onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              title="Seleccionar categoría"
            >
              <option value="">Seleccionar...</option>
              {categoriasFiltradas.map((c) => (
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
              onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as 'semanal' | 'quincenal' | 'mensual', dia_registro: 1 })}
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
                onChange={(e) => setFormData({ ...formData, dia_registro: parseInt(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, dia_registro: parseInt(e.target.value) || 1 })}
              />
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
          {recurrente ? (
            <Button type="button" variant="secondary" onClick={handleDelete} fullWidth>Eliminar</Button>
          ) : null}
          <Button type="submit" fullWidth>Guardar configuración</Button>
        </div>
      </form>
    </Modal>
  )
}