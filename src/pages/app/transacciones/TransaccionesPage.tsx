import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, ArrowLeftRight, Search, Trash2, X } from 'lucide-react'
import styles from './TransaccionesPage.module.css'
import transaccionService from '@/services/transaccion.service'
import type { TransaccionFilters } from '@/services/transaccion.service'
import transferenciaService from '@/services/transferencia.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import type { Transaccion, Billetera, Categoria, Subcategoria } from '@/types'
import { formatMonto, formatFecha } from '@/utils/format'
import Button from '@/components/ui/Button/Button'

const TransaccionesPage: React.FC = () => {
  // --- Estado de Datos ---
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [loading, setLoading] = useState(true)

  // --- Estado de Filtros ---
  const [filters, setFilters] = useState<TransaccionFilters>({
    tipo: undefined,
    moneda: undefined,
    fecha_desde: '',
    fecha_hasta: '',
    billetera_id: '',
    busqueda: ''
  })

  // --- Estado de Modales ---
  const [isModalTxOpen, setIsModalTxOpen] = useState(false)
  const [isModalTrOpen, setIsModalTrOpen] = useState(false)
  const [isModalConfirmIAOpen, setIsModalConfirmIAOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null)

  // --- Estado de Formulario Transaccion ---
  const [formData, setFormData] = useState({
    tipo: 'egreso' as 'ingreso' | 'egreso',
    descripcion: '',
    monto: '',
    moneda: 'ARS' as 'ARS' | 'USD',
    fecha: new Date().toISOString().split('T')[0],
    categoria_id: '',
    subcategoria_id: '',
    billetera_id: '',
    metodo_pago: 'debito' as 'debito' | 'efectivo' | 'credito',
    es_padre_cuotas: false,
    info_cuotas: {
      cantidad_cuotas: 2,
      tiene_interes: false,
      tasa_interes: 0,
      monto_total: 0
    }
  })

  // --- Estado de Formulario Transferencia ---
  const [formTrData, setFormTrData] = useState({
    billetera_origen_id: '',
    billetera_destino_id: '',
    monto: '',
    moneda: 'ARS' as 'ARS' | 'USD',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  })

  const fetchTransacciones = useCallback(async () => {
    try {
      const data = await transaccionService.getTransacciones(filters)
      setTransacciones(data)
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  }, [filters])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [b, c] = await Promise.all([
        billeteraService.list(),
        categoriaService.getCategorias()
      ])
      setBilleteras(b.filter((w: Billetera) => w.estado === 'activa'))
      setCategorias(c)
      await fetchTransacciones()
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchTransacciones])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsModalTxOpen(false)
        setIsModalTrOpen(false)
        setIsModalConfirmIAOpen(false)
      }
    }
    const isAnyOpen = isModalTxOpen || isModalTrOpen || isModalConfirmIAOpen
    if (isAnyOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isModalTxOpen, isModalTrOpen, isModalConfirmIAOpen])

  // --- Carga Inicial ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransacciones()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchTransacciones])

  const handleSubcategorias = async (catId: string) => {
    if (!catId) {
      setSubcategorias([])
      return
    }
    try {
      const data = await categoriaService.getSubcategorias(catId)
      setSubcategorias(data)
    } catch (err) {
      console.error('Error fetching subcategories:', err)
    }
  }

  // --- Handlers ---
  const handleClearFilters = () => {
    setFilters({
      tipo: undefined,
      moneda: undefined,
      fecha_desde: '',
      fecha_hasta: '',
      billetera_id: '',
      busqueda: ''
    })
  }

  const handleSaveTx = async () => {
    try {
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto),
        origen: 'manual' as const
      }
      if (formData.metodo_pago === 'credito') {
        payload.es_padre_cuotas = true
        payload.info_cuotas = {
          ...formData.info_cuotas,
          monto_total: parseFloat(formData.monto)
        }
      }
      await transaccionService.createTransaccion(payload)
      setIsModalTxOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error al guardar la transacción')
    }
  }

  const handleSaveTr = async () => {
    try {
      const payload = {
        ...formTrData,
        monto: parseFloat(formTrData.monto)
      }
      await transferenciaService.createTransferencia(payload)
      setIsModalTrOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error al realizar la transferencia')
    }
  }

  const handleConfirmIA = async () => {
    if (!selectedTx) return
    try {
      // Primero actualizamos por si el usuario editó algo en el modal de confirmacion
      await transaccionService.updateTransaccion(selectedTx.id, selectedTx)
      // Luego confirmamos
      await transaccionService.confirmarIA(selectedTx.id)
      setIsModalConfirmIAOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Error al confirmar transacción')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de eliminar esta transacción? Si es parte de un grupo de cuotas, se eliminará todo el grupo.')) {
      await transaccionService.deleteTransaccion(id)
      fetchData()
    }
  }

  // --- Calculos Tiempo Real Cuotas ---
  const calculoCuotas = useMemo(() => {
    const monto = parseFloat(formData.monto) || 0
    const cant = formData.info_cuotas.cantidad_cuotas || 1
    const tasa = formData.info_cuotas.tiene_interes ? (formData.info_cuotas.tasa_interes || 0) / 100 : 0
    
    const valorCuota = tasa > 0 
      ? monto * (tasa * Math.pow(1 + tasa, cant)) / (Math.pow(1 + tasa, cant) - 1)
      : monto / cant

    return {
      total: valorCuota * cant,
      cuota: valorCuota
    }
  }, [formData.monto, formData.info_cuotas])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Transacciones</h1>
        <div className={styles.actions}>
          <Button onClick={() => setIsModalTxOpen(true)}>
            <Plus size={18} /> Nueva transacción
          </Button>
          <Button variant="secondary" onClick={() => setIsModalTrOpen(true)}>
            <ArrowLeftRight size={18} /> Nueva transferencia
          </Button>
        </div>
      </header>

      {/* FILTROS */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="filter-tipo">Tipo</label>
          <select 
            id="filter-tipo"
            className={styles.filterInput} 
            value={filters.tipo || ''} 
            onChange={e => setFilters({...filters, tipo: (e.target.value as 'ingreso' | 'egreso') || undefined})}
            title="Filtrar por tipo"
          >
            <option value="">Todos</option>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filter-moneda">Moneda</label>
          <select 
            id="filter-moneda"
            className={styles.filterInput}
            value={filters.moneda || ''}
            onChange={e => setFilters({...filters, moneda: e.target.value || undefined})}
            title="Filtrar por moneda"
          >
            <option value="">Todas</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filter-billetera">Billetera</label>
          <select 
            id="filter-billetera"
            className={styles.filterInput}
            value={filters.billetera_id || ''}
            onChange={e => setFilters({...filters, billetera_id: e.target.value})}
            title="Filtrar por billetera"
          >
            <option value="">Todas</option>
            {billeteras.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filter-desde">Desde</label>
          <input 
            id="filter-desde"
            type="date" 
            className={styles.filterInput}
            value={filters.fecha_desde}
            onChange={e => setFilters({...filters, fecha_desde: e.target.value})}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filter-hasta">Hasta</label>
          <input 
            id="filter-hasta"
            type="date" 
            className={styles.filterInput}
            value={filters.fecha_hasta}
            onChange={e => setFilters({...filters, fecha_hasta: e.target.value})}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="filter-search">Buscar</label>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input 
              id="filter-search"
              type="text" 
              placeholder="Descripción..." 
              className={`${styles.filterInput} ${styles.searchInput}`}
              value={filters.busqueda}
              onChange={e => setFilters({...filters, busqueda: e.target.value})}
            />
          </div>
        </div>

        <button className={styles.clearButton} onClick={handleClearFilters}>
          Limpiar
        </button>
      </div>

      {/* LISTA */}
      <div className={styles.listContainer}>
        <div className={styles.tableHeader}>
          <span></span>
          <span>Descripción</span>
          <span>Billetera</span>
          <span>Fecha</span>
          <span className={styles.textRight}>Monto</span>
          <span></span>
        </div>
        
        {loading ? (
          <div className={styles.emptyState}>Cargando transacciones...</div>
        ) : transacciones.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron transacciones.</div>
        ) : (
          transacciones.map(tx => {
            const cat = categorias.find(c => c.id === tx.categoria_id)
            return (
              <div 
                key={tx.id} 
                className={styles.transactionItem}
                onClick={() => {
                  if (tx.estado_verificacion === 'pendiente') {
                    setSelectedTx(tx)
                    setIsModalConfirmIAOpen(true)
                  }
                }}
              >
                <div className={styles.icon}>
                  {cat?.icono || '💰'}
                </div>
                <div className={styles.desc}>
                  <span>{tx.descripcion}</span>
                  {cat && <small className={styles.sub}>{cat.nombre}</small>}
                  <div className={styles.badges}>
                    {tx.estado_verificacion === 'pendiente' && (
                      <span className={`${styles.badge} ${styles.badgePending}`}>Pendiente IA</span>
                    )}
                    {tx.es_cuota_hija && (
                      <span className={`${styles.badge} ${styles.badgeCuota}`}>Cuota</span>
                    )}
                  </div>
                </div>
                <div className={styles.billetera}>
                  {billeteras.find(b => b.id === tx.billetera_id)?.nombre}
                </div>
                <div className={styles.fecha}>{formatFecha(tx.fecha)}</div>
                <div className={`${styles.monto} ${tx.tipo === 'ingreso' ? styles.ingreso : styles.egreso}`}>
                  {tx.tipo === 'egreso' ? '- ' : '+ '}
                  {formatMonto(tx.monto, tx.moneda)}
                </div>
                <div className={styles.actionsCell}>
                  <button 
                    className={`${styles.clearButton} ${styles.deleteButton}`} 
                    onClick={(e) => handleDelete(tx.id, e)}
                    title="Eliminar transacción"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* OVERLAY */}
      {(isModalTxOpen || isModalTrOpen || isModalConfirmIAOpen) && (
        <div 
          className={styles.overlay} 
          onClick={() => {
            setIsModalTxOpen(false)
            setIsModalTrOpen(false)
            setIsModalConfirmIAOpen(false)
          }} 
        />
      )}

      {/* DRAWER NUEVA TRANSACCION */}
      <div className={[styles.drawer, isModalTxOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}>
        <div className={styles.drawerContent}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Nueva Transacción</h2>
            <button className={styles.formClose} onClick={() => setIsModalTxOpen(false)} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className={styles.drawerForm}>
            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="form-tipo">Tipo</label>
                <select 
                  id="form-tipo"
                  className={styles.filterInput} 
                  value={formData.tipo} 
                  onChange={e => setFormData({...formData, tipo: e.target.value as 'ingreso' | 'egreso'})}
                  title="Tipo de transacción"
                >
                  <option value="egreso">Egreso</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="form-monto">Monto</label>
                <input 
                  id="form-monto"
                  type="number" 
                  className={styles.filterInput} 
                  value={formData.monto} 
                  onChange={e => setFormData({...formData, monto: e.target.value})} 
                  placeholder="0.00" 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={`${styles.filterGroup} ${styles.fullWidth}`}>
                <label htmlFor="form-desc">Descripción</label>
                <input 
                  id="form-desc"
                  type="text" 
                  className={styles.filterInput} 
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                  placeholder="Ej: Supermercado" 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="form-moneda">Moneda</label>
                <select 
                  id="form-moneda"
                  className={styles.filterInput} 
                  value={formData.moneda} 
                  onChange={e => setFormData({...formData, moneda: e.target.value as 'ARS' | 'USD'})}
                  title="Moneda"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="form-fecha">Fecha</label>
                <input 
                  id="form-fecha"
                  type="date" 
                  className={styles.filterInput} 
                  value={formData.fecha} 
                  onChange={e => setFormData({...formData, fecha: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="form-categoria">Categoría</label>
                <select 
                  id="form-categoria"
                  className={styles.filterInput} 
                  value={formData.categoria_id} 
                  onChange={e => {
                    setFormData({...formData, categoria_id: e.target.value, subcategoria_id: ''})
                    handleSubcategorias(e.target.value)
                  }}
                  title="Seleccionar categoría"
                >
                  <option value="">Seleccionar...</option>
                  {categorias.filter(c => c.tipo === formData.tipo).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="form-subcategoria">Subcategoría</label>
                <select 
                  id="form-subcategoria"
                  className={styles.filterInput} 
                  value={formData.subcategoria_id} 
                  onChange={e => setFormData({...formData, subcategoria_id: e.target.value})}
                  title="Seleccionar subcategoría"
                >
                  <option value="">Sin subcategoría</option>
                  {subcategorias.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="form-billetera">Billetera</label>
                <select 
                  id="form-billetera"
                  className={styles.filterInput} 
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
              <div className={styles.filterGroup}>
                <label htmlFor="form-metodo">Método de Pago</label>
                <select 
                  id="form-metodo"
                  className={styles.filterInput} 
                  value={formData.metodo_pago} 
                  onChange={e => setFormData({...formData, metodo_pago: e.target.value as 'debito' | 'efectivo' | 'credito'})}
                  title="Método de pago"
                >
                  <option value="debito">Débito / Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="credito">Crédito (Cuotas)</option>
                </select>
              </div>
            </div>

            {formData.metodo_pago === 'credito' && (
              <div className={styles.creditSection}>
                <div className={styles.formRow}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="form-cuotas">Cantidad de cuotas</label>
                    <input 
                      id="form-cuotas"
                      type="number" 
                      className={styles.filterInput} 
                      value={formData.info_cuotas.cantidad_cuotas} 
                      onChange={e => setFormData({...formData, info_cuotas: {...formData.info_cuotas, cantidad_cuotas: parseInt(e.target.value) || 1}})}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <div className={styles.toggleRow}>
                      <label htmlFor="form-interes">¿Tiene interés?</label>
                      <input 
                        id="form-interes"
                        type="checkbox" 
                        checked={formData.info_cuotas.tiene_interes} 
                        onChange={e => setFormData({...formData, info_cuotas: {...formData.info_cuotas, tiene_interes: e.target.checked}})} 
                      />
                    </div>
                    {formData.info_cuotas.tiene_interes && (
                      <input 
                        type="number" 
                        placeholder="Tasa mensual %" 
                        className={`${styles.filterInput} ${styles.mt8}`} 
                        value={formData.info_cuotas.tasa_interes}
                        onChange={e => setFormData({...formData, info_cuotas: {...formData.info_cuotas, tasa_interes: parseFloat(e.target.value) || 0}})}
                        title="Tasa de interés mensual"
                      />
                    )}
                  </div>
                </div>
                <div className={styles.summary}>
                  <p>Total financiado: <strong>{formatMonto(calculoCuotas.total, formData.moneda)}</strong></p>
                  <p>Valor de cada cuota: <strong>{formatMonto(calculoCuotas.cuota, formData.moneda)}</strong></p>
                </div>
              </div>
            )}

            <div className={styles.drawerFooter}>
              <Button variant="secondary" onClick={() => setIsModalTxOpen(false)} fullWidth>Cancelar</Button>
              <Button onClick={handleSaveTx} fullWidth>Guardar transacción</Button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER NUEVA TRANSFERENCIA */}
      <div className={[styles.drawer, isModalTrOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}>
        <div className={styles.drawerContent}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Nueva Transferencia</h2>
            <button className={styles.formClose} onClick={() => setIsModalTrOpen(false)} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          <div className={styles.drawerForm}>
            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="tr-origen">Billetera Origen</label>
                <select 
                  id="tr-origen"
                  className={styles.filterInput} 
                  value={formTrData.billetera_origen_id} 
                  onChange={e => setFormTrData({...formTrData, billetera_origen_id: e.target.value})}
                  title="Billetera origen"
                >
                  <option value="">Seleccionar...</option>
                  {billeteras.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.moneda})</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="tr-destino">Billetera Destino</label>
                <select 
                  id="tr-destino"
                  className={styles.filterInput} 
                  value={formTrData.billetera_destino_id} 
                  onChange={e => setFormTrData({...formTrData, billetera_destino_id: e.target.value})}
                  title="Billetera destino"
                >
                  <option value="">Seleccionar...</option>
                  {billeteras.filter(b => b.id !== formTrData.billetera_origen_id).map(b => (
                    <option key={b.id} value={b.id}>{b.nombre} ({b.moneda})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="tr-monto">Monto</label>
                <input 
                  id="tr-monto"
                  type="number" 
                  className={styles.filterInput} 
                  value={formTrData.monto} 
                  onChange={e => setFormTrData({...formTrData, monto: e.target.value})} 
                />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="tr-moneda">Moneda que transfieres</label>
                <select 
                  id="tr-moneda"
                  className={styles.filterInput} 
                  value={formTrData.moneda} 
                  onChange={e => setFormTrData({...formTrData, moneda: e.target.value as 'ARS' | 'USD'})}
                  title="Moneda de origen"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={`${styles.filterGroup} ${styles.fullWidth}`}>
                <label htmlFor="tr-notas">Notas</label>
                <textarea 
                  id="tr-notas"
                  className={styles.filterInput} 
                  rows={3} 
                  value={formTrData.notas} 
                  onChange={e => setFormTrData({...formTrData, notas: e.target.value})} 
                />
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <Button variant="secondary" onClick={() => setIsModalTrOpen(false)} fullWidth>Cancelar</Button>
              <Button onClick={handleSaveTr} fullWidth>Realizar transferencia</Button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER CONFIRMAR IA */}
      <div className={[styles.drawer, isModalConfirmIAOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}>
        <div className={styles.drawerContent}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Confirmar Transacción IA</h2>
            <button className={styles.formClose} onClick={() => setIsModalConfirmIAOpen(false)} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          {selectedTx && (
            <div className={styles.drawerForm}>
              <div className={styles.iaAlert}>
                Esta transacción fue detectada automáticamente. Verificá los datos antes de confirmar.
              </div>
              <div className={styles.formRow}>
                <div className={styles.filterGroup}>
                  <label htmlFor="ia-desc">Descripción</label>
                  <input 
                    id="ia-desc"
                    type="text" 
                    className={styles.filterInput} 
                    value={selectedTx.descripcion} 
                    onChange={e => setSelectedTx({...selectedTx, descripcion: e.target.value})} 
                  />
                </div>
                <div className={styles.filterGroup}>
                  <label htmlFor="ia-monto">Monto</label>
                  <input 
                    id="ia-monto"
                    type="number" 
                    className={styles.filterInput} 
                    value={selectedTx.monto} 
                    onChange={e => setSelectedTx({...selectedTx, monto: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.filterGroup}>
                  <label htmlFor="ia-categoria">Categoría</label>
                  <select 
                    id="ia-categoria"
                    className={styles.filterInput} 
                    value={selectedTx.categoria_id || ''} 
                    onChange={e => setSelectedTx({...selectedTx, categoria_id: e.target.value})}
                    title="Categoría detectada"
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label htmlFor="ia-billetera">Billetera</label>
                  <select 
                    id="ia-billetera"
                    className={styles.filterInput} 
                    value={selectedTx.billetera_id} 
                    onChange={e => setSelectedTx({...selectedTx, billetera_id: e.target.value})}
                    title="Billetera detectada"
                  >
                    {billeteras.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <Button variant="secondary" onClick={() => setIsModalConfirmIAOpen(false)} fullWidth>Cancelar</Button>
                <Button onClick={handleConfirmIA} fullWidth>Confirmar y Guardar</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransaccionesPage
