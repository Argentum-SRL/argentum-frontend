import React, { useState, useEffect, useMemo } from 'react'
import { ArrowUpRight, ArrowDownLeft, CreditCard, ArrowRightLeft, Layers, Banknote, GripHorizontal } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria } from '@/types'
import transaccionService from '@/services/transaccion.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionDrawer.module.css'
import { useToast } from '@/hooks/useToast'

interface TransaccionDrawerProps {
  open: boolean
  onClose: () => void
  transaccion?: Transaccion | null
  billeteras: Billetera[]
  categorias: Categoria[]
  onSuccess: () => void
}

export default function TransaccionDrawer({
  open,
  onClose,
  transaccion,
  billeteras,
  categorias,
  onSuccess
}: TransaccionDrawerProps) {
  const isEdit = !!transaccion
  const { showToast } = useToast()

  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('egreso')
  const [montoRaw, setMontoRaw] = useState('')
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [billeteraId, setBilleteraId] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [metodoPago, setMetodoPago] = useState<'debito' | 'efectivo' | 'credito' | 'transferencia'>('debito')
  
  const [showAllCats, setShowAllCats] = useState(false)
  const [cantidadCuotas, setCantidadCuotas] = useState(2)
  const [tasaInteres, setTasaInteres] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      if (transaccion) {
        const formatInitialMonto = (num: number) => {
          const str = num.toString().replace('.', ',')
          const parts = str.split(',')
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          return parts.join(',')
        }

        setTipo(transaccion.tipo)
        setMontoRaw(formatInitialMonto(transaccion.monto))
        setMoneda(transaccion.moneda)
        setDescripcion(transaccion.descripcion || '')
        setCategoriaId(transaccion.categoria_id || '')
        setBilleteraId(transaccion.billetera_id)
        setFecha(transaccion.fecha.split('T')[0])
        setMetodoPago(transaccion.metodo_pago)
      } else {
        setTipo('egreso')
        setMontoRaw('')
        setDescripcion('')
        setCategoriaId('')
        setFecha(new Date().toISOString().split('T')[0])
        setMetodoPago('debito')
        
        const principal = billeteras.find(b => b.es_principal)
        if (principal) {
          setBilleteraId(principal.id)
          setMoneda(principal.moneda)
        } else if (billeteras.length > 0) {
          setBilleteraId(billeteras[0].id)
          setMoneda(billeteras[0].moneda)
        }
      }
      setShowAllCats(false)
    }
  }, [open, transaccion, billeteras])

  const parsedMonto = parseFloat(montoRaw.replace(/\./g, '').replace(',', '.')) || 0

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d,]/g, '')
    const parts = raw.split(',')
    if (parts.length > 2) {
      raw = parts[0] + ',' + parts.slice(1).join('')
    }
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      raw = parts.join(',')
    }
    setMontoRaw(raw)
  }

  const isCuotaHija = isEdit && transaccion.es_cuota_hija

  const activeCategorias = useMemo(() => {
    const filtered = categorias.filter(c => c.tipo === tipo)
    
    // Lista de principales solicitada por el usuario (normalizada)
    const mainCats = [
      'alimentacion',
      'transporte',
      'salud',
      'entretenimiento',
      'servicios',
      'ropa',
      'ropa e indumentaria',
      'educacion',
      'vivienda'
    ]

    return filtered.sort((a, b) => {
      const aName = a.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      const bName = b.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      
      const aIdx = mainCats.indexOf(aName)
      const bIdx = mainCats.indexOf(bName)

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return aName.localeCompare(bName)
    })
  }, [categorias, tipo])

  const displayCategorias = showAllCats ? activeCategorias : activeCategorias.slice(0, 7)
  const hasMoreCats = activeCategorias.length > 7

  const calculoCuotas = useMemo(() => {
    const cant = cantidadCuotas || 1
    const tasa = tasaInteres ? tasaInteres / 100 : 0
    const valorCuota = tasa > 0 
      ? (parsedMonto * tasa * Math.pow(1 + tasa, cant)) / (Math.pow(1 + tasa, cant) - 1)
      : parsedMonto / cant

    return {
      total: valorCuota * cant,
      cuota: valorCuota
    }
  }, [parsedMonto, cantidadCuotas, tasaInteres])

  const handleSubmit = async () => {
    if (!montoRaw || !descripcion || !billeteraId) {
      showToast('Completá los campos obligatorios', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        tipo,
        monto: parsedMonto,
        moneda,
        descripcion,
        categoria_id: categoriaId || null,
        billetera_id: billeteraId,
        fecha,
        metodo_pago: metodoPago
      }

      if (!isEdit) {
        payload.origen = 'manual'
        if (metodoPago === 'credito') {
          payload.es_padre_cuotas = true
          payload.info_cuotas = {
            cantidad_cuotas: cantidadCuotas,
            tiene_interes: tasaInteres > 0,
            tasa_interes: tasaInteres,
            monto_total: parsedMonto
          }
        }
        await transaccionService.createTransaccion(payload)
        showToast('Transacción creada', 'success')
      } else {
        await transaccionService.updateTransaccion(transaccion.id, payload)
        showToast('Transacción actualizada', 'success')
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      showToast('Error al guardar la transacción', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaccion) return
    if (!window.confirm('¿Estás seguro de que querés eliminar esta transacción?')) return
    
    setIsSubmitting(true)
    try {
      await transaccionService.deleteTransaccion(transaccion.id)
      showToast('Transacción eliminada', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      showToast('Error al eliminar la transacción', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '16px' }}>
      <span style={{ fontSize: '18px', fontWeight: 600 }}>{isEdit ? 'Editar transacción' : 'Nueva transacción'}</span>
      <div className={styles.typeToggle} style={{ margin: 0 }}>
        <button
          className={`${styles.typeBtn} ${tipo === 'egreso' ? styles.typeBtnActiveEgreso : ''}`}
          onClick={() => !isCuotaHija && setTipo('egreso')}
          disabled={isCuotaHija}
          style={{ width: '100px' }}
        >
          <ArrowUpRight size={16} strokeWidth={2} /> Egreso
        </button>
        <button
          className={`${styles.typeBtn} ${tipo === 'ingreso' ? styles.typeBtnActiveIngreso : ''}`}
          onClick={() => !isCuotaHija && setTipo('ingreso')}
          disabled={isCuotaHija}
          style={{ width: '100px' }}
        >
          <ArrowDownLeft size={16} strokeWidth={2} /> Ingreso
        </button>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <div className={styles.drawerContent}>
        
        {/* Hero Monto */}
        <div className={`${styles.montoCard} ${tipo === 'egreso' ? styles.montoCardEgreso : styles.montoCardIngreso}`}>
          <div className={styles.montoInputWrapper}>
            <span className={styles.montoPrefix}>{moneda === 'ARS' ? '$' : 'USD $'}</span>
            <input
              type="text"
              inputMode="decimal"
              className={styles.montoInput}
              value={montoRaw}
              onChange={handleMontoChange}
              placeholder="0"
              disabled={isCuotaHija}
            />
          </div>
          <div className={styles.monedaToggle}>
            <button
              className={`${styles.monedaBtn} ${moneda === 'ARS' ? styles.monedaBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMoneda('ARS')}
              disabled={isCuotaHija}
            >
              ARS
            </button>
            <button
              className={`${styles.monedaBtn} ${moneda === 'USD' ? styles.monedaBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMoneda('USD')}
              disabled={isCuotaHija}
            >
              USD
            </button>
          </div>
        </div>

        {isCuotaHija && (
          <div style={{ fontSize: 12, color: '#D97706', background: '#FEF3C7', padding: '8px 12px', borderRadius: 8 }}>
            Monto, moneda, tipo y fecha no se pueden cambiar porque esta transacción es parte de una compra en cuotas.
          </div>
        )}

        {/* Descripción */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Descripción</label>
          <input
            type="text"
            className={styles.textInput}
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Ej: Supermercado"
          />
        </div>

        {/* Categoría Grid */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Categoría</label>
          <div className={styles.catGrid}>
            {displayCategorias.map(cat => {
              const isActive = categoriaId === cat.id
              return (
                <button
                  key={cat.id}
                  className={`${styles.catBtn} ${isActive ? styles.catBtnActive : ''}`}
                  onClick={() => setCategoriaId(cat.id)}
                >
                  <CategoriaIcon nombre={cat.nombre} size={40} />
                  <span className={styles.catName}>{cat.nombre}</span>
                </button>
              )
            })}
            {!showAllCats && hasMoreCats && (
              <button className={styles.catBtn} onClick={() => setShowAllCats(true)}>
                <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E9198' }}>
                  <GripHorizontal size={24} strokeWidth={1.5} />
                </div>
                <span className={styles.catName}>Ver todas</span>
              </button>
            )}
          </div>
        </div>

        {/* Billetera y Fecha */}
        <div className={styles.row2}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Billetera</label>
            <select
              className={`${styles.textInput} ${styles.selectInput}`}
              value={billeteraId}
              onChange={e => setBilleteraId(e.target.value)}
              disabled={isCuotaHija}
            >
              <option value="" disabled>Seleccionar...</option>
              {billeteras.filter(b => b.moneda === moneda).map(b => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Fecha</label>
            <input
              type="date"
              className={styles.textInput}
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              disabled={isCuotaHija}
            />
          </div>
        </div>

        {/* Método de Pago */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Método de pago</label>
          <div className={styles.methodGrid}>
            <button
              className={`${styles.methodBtn} ${metodoPago === 'debito' ? styles.methodBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMetodoPago('debito')}
              disabled={isCuotaHija}
            >
              <CreditCard size={18} /> Débito
            </button>
            <button
              className={`${styles.methodBtn} ${metodoPago === 'transferencia' ? styles.methodBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMetodoPago('transferencia')}
              disabled={isCuotaHija}
            >
              <ArrowRightLeft size={18} /> Transfer
            </button>
            <button
              className={`${styles.methodBtn} ${metodoPago === 'credito' ? styles.methodBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMetodoPago('credito')}
              disabled={isCuotaHija}
            >
              <Layers size={18} /> Crédito
            </button>
            <button
              className={`${styles.methodBtn} ${metodoPago === 'efectivo' ? styles.methodBtnActive : ''}`}
              onClick={() => !isCuotaHija && setMetodoPago('efectivo')}
              disabled={isCuotaHija}
            >
              <Banknote size={18} /> Efectivo
            </button>
          </div>
        </div>

        {/* Cuotas Section */}
        {!isEdit && metodoPago === 'credito' && (
          <div className={styles.cuotasSection}>
            <div className={styles.cuotasInputs}>
              <div className={styles.cuotaField}>
                <label className={styles.sectionLabel} style={{ marginBottom: 4 }}>Cuotas</label>
                <input
                  type="number"
                  className={styles.textInput}
                  style={{ padding: '8px 10px' }}
                  value={cantidadCuotas}
                  onChange={e => setCantidadCuotas(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div className={styles.cuotaField}>
                <label className={styles.sectionLabel} style={{ marginBottom: 4 }}>Interés % (mensual)</label>
                <input
                  type="number"
                  step="0.1"
                  className={styles.textInput}
                  style={{ padding: '8px 10px' }}
                  value={tasaInteres}
                  onChange={e => setTasaInteres(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
            <div className={styles.cuotasSummary}>
              <div className={styles.summaryCol}>
                <span className={styles.summaryLbl}>Cuota</span>
                <span className={styles.summaryVal}>{formatMonto(calculoCuotas.cuota, moneda)}</span>
              </div>
              <div className={styles.summaryCol} style={{ textAlign: 'right' }}>
                <span className={styles.summaryLbl}>Total</span>
                <span className={styles.summaryVal}>{formatMonto(calculoCuotas.total, moneda)}</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.drawerFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          {isEdit && (
            <button className={styles.btnDelete} onClick={handleDelete} disabled={isSubmitting}>
              Eliminar
            </button>
          )}
          <button className={styles.btnSubmit} onClick={handleSubmit} disabled={isSubmitting || !montoRaw || !descripcion || !billeteraId}>
            {isSubmitting ? 'Guardando...' : (metodoPago === 'credito' && !isEdit && cantidadCuotas > 1 ? `Guardar · ${cantidadCuotas} cuotas` : 'Guardar transacción')}
          </button>
        </div>

      </div>
    </Modal>
  )
}
