import React, { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Drawer, Button, Field, MontoInput } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import type { TarjetaCredito, TarjetaCreditoCreate } from '@/types'
import { RED_LABEL, TARJETA_COLORES } from '@/lib/utils/tarjeta.utils'
import tarjetaService from '@/services/tarjeta.service'
import TarjetaCard from './TarjetaCard'
import styles from './TarjetaDrawer.module.css'

interface TarjetaDrawerProps {
  open: boolean
  onClose: () => void
  tarjeta?: TarjetaCredito
  billeteraId: string
  onSuccess: () => void
}

const REDES = Object.keys(RED_LABEL)

const TarjetaDrawer: React.FC<TarjetaDrawerProps> = ({ 
  open, 
  onClose, 
  tarjeta, 
  billeteraId, 
  onSuccess 
}) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<TarjetaCreditoCreate>>({
    nombre: '',
    red: 'visa',
    dia_cierre: 10,
    dia_vencimiento: 3,
    moneda: 'ARS',
    limite_credito: undefined,
    color: undefined
  })

  useEffect(() => {
    if (tarjeta) {
      setFormData({
        nombre: tarjeta.nombre,
        red: tarjeta.red,
        dia_cierre: tarjeta.dia_cierre,
        dia_vencimiento: tarjeta.dia_vencimiento,
        moneda: tarjeta.moneda,
        limite_credito: tarjeta.limite_credito || undefined,
        color: tarjeta.color || undefined
      })
    } else {
      setFormData({
        nombre: '',
        red: 'visa',
        dia_cierre: 10,
        dia_vencimiento: 3,
        moneda: 'ARS',
        limite_credito: undefined,
        color: undefined
      })
    }
  }, [tarjeta, open])

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.dia_cierre || !formData.dia_vencimiento) {
      showToast('Completá los campos obligatorios', 'error')
      return
    }

    if (formData.dia_cierre < 1 || formData.dia_cierre > 28 || 
        formData.dia_vencimiento < 1 || formData.dia_vencimiento > 28) {
      showToast('Los días deben estar entre 1 y 28', 'error')
      return
    }

    setLoading(true)
    try {
      if (tarjeta) {
        await tarjetaService.updateTarjeta(tarjeta.id, formData)
        showToast('Tarjeta actualizada', 'success')
      } else {
        await tarjetaService.createTarjeta({
          ...formData,
          billetera_id: billeteraId
        } as TarjetaCreditoCreate)
        showToast('Tarjeta creada', 'success')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      const detail = error.response?.data?.detail || 'Error al guardar la tarjeta'
      showToast(detail, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Objeto para la preview
  const tarjetaPreview: TarjetaCredito = {
    id: 'preview',
    usuario_id: 'preview',
    billetera_id: billeteraId,
    nombre: formData.nombre || 'Nombre de la tarjeta',
    red: (formData.red as any) || 'visa',
    dia_cierre: formData.dia_cierre || 0,
    dia_vencimiento: formData.dia_vencimiento || 0,
    limite_credito: formData.limite_credito || null,
    moneda: (formData.moneda as any) || 'ARS',
    estado: 'activa',
    color: formData.color || null,
    fecha_creacion: new Date().toISOString()
  }

  const showPreview = formData.dia_cierre && formData.dia_vencimiento

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={tarjeta ? 'Editar tarjeta' : 'Nueva tarjeta'}
    >
      <div className={styles.form}>
        <Field
          label="Nombre"
          placeholder="Ej: Visa Santander"
          value={formData.nombre || ''}
          onChange={(v: string) => setFormData({ ...formData, nombre: v })}
          autoFocus={!tarjeta}
        />

        <div className={styles.section}>
          <label className={styles.label}>Red</label>
          <div className={styles.pills}>
            {REDES.map(red => (
              <button
                key={red}
                className={`${styles.pill} ${formData.red === red ? styles.pillActive : ''}`}
                onClick={() => setFormData({ ...formData, red })}
              >
                {RED_LABEL[red]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          <Field
            label="Día de cierre"
            hint="Día en que cierra el resumen"
            type="number"
            inputMode="numeric"
            value={formData.dia_cierre?.toString() || ''}
            onChange={(v: string) => setFormData({ ...formData, dia_cierre: parseInt(v) || 0 })}
          />
          <Field
            label="Día de vencimiento"
            hint="Día en que vence el pago"
            type="number"
            inputMode="numeric"
            value={formData.dia_vencimiento?.toString() || ''}
            onChange={(v: string) => setFormData({ ...formData, dia_vencimiento: parseInt(v) || 0 })}
          />
        </div>

        <MontoInput
          label="Límite de crédito (opcional)"
          value={formData.limite_credito || null}
          onChange={(v: number | null) => setFormData({ ...formData, limite_credito: v || undefined })}
          moneda={(formData.moneda as 'ARS' | 'USD') || 'ARS'}
        />

        <div className={styles.section}>
          <label className={styles.label}>Moneda</label>
          <div className={styles.pills}>
            {['ARS', 'USD'].map(m => (
              <button
                key={m}
                className={`${styles.pill} ${formData.moneda === m ? styles.pillActive : ''}`}
                onClick={() => setFormData({ ...formData, moneda: m as 'ARS' | 'USD' })}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Color</label>
          <div className={styles.colorGrid}>
            {TARJETA_COLORES.map(color => (
              <div
                key={color}
                className={`${styles.colorSwatch} ${formData.color === color ? styles.colorSwatchActive : ''}`}
                style={{ background: color }}
                onClick={() => setFormData({ ...formData, color })}
              >
                {formData.color === color && <Check size={16} />}
              </div>
            ))}
          </div>
        </div>

        {showPreview && (
          <div className={styles.previewSection}>
            <span className={styles.previewTitle}>Vista previa</span>
            <div className={styles.previewCard}>
              <TarjetaCard 
                tarjeta={tarjetaPreview} 
                onEdit={() => {}} 
                onArchive={() => {}} 
                onDelete={() => {}}
              />
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {tarjeta ? 'Guardar cambios' : 'Crear tarjeta'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

export default TarjetaDrawer
