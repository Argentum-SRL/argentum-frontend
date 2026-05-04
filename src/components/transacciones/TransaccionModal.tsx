import { useMemo, useEffect, useReducer } from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ArrowRightLeft,
  Layers,
  Banknote,
  GripHorizontal,
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Transaccion, Billetera, Categoria } from '@/types'
import transaccionService from '@/services/transaccion.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'
import styles from './TransaccionModal.module.css'
import { useToast } from '@/hooks/useToast'
import MontoInput from '@/components/ui/MontoInput/MontoInput'

interface TransaccionModalProps {
  open: boolean
  onClose: () => void
  transaccion?: Transaccion | null
  billeteras: Billetera[]
  categorias: Categoria[]
  onSuccess: () => void
}

interface FormState {
  tipo: 'ingreso' | 'egreso'
  monto: number | null
  moneda: 'ARS' | 'USD'
  descripcion: string
  categoriaId: string
  billeteraId: string
  fecha: string
  metodoPago: 'debito' | 'efectivo' | 'credito' | 'transferencia'
  showAllCats: boolean
  cantidadCuotas: number
  tasaInteres: number
  isSubmitting: boolean
}

type FormAction =
  | { type: 'RESET'; transaccion: Transaccion | null; billeteras: Billetera[] }
  | { [K in keyof FormState]: { type: 'SET_FIELD'; field: K; value: FormState[K] } }[keyof FormState]

const initialState: FormState = {
  tipo: 'egreso',
  monto: null,
  moneda: 'ARS',
  descripcion: '',
  categoriaId: '',
  billeteraId: '',
  fecha: new Date().toISOString().split('T')[0],
  metodoPago: 'debito',
  showAllCats: false,
  cantidadCuotas: 2,
  tasaInteres: 0,
  isSubmitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      if (action.transaccion) {
        return {
          ...initialState,
          tipo: action.transaccion.tipo,
          monto: action.transaccion.monto,
          moneda: action.transaccion.moneda,
          descripcion: action.transaccion.descripcion || '',
          categoriaId: action.transaccion.categoria_id || '',
          billeteraId: action.transaccion.billetera_id,
          fecha: action.transaccion.fecha.split('T')[0],
          metodoPago: action.transaccion.metodo_pago,
        }
      } else {
        const principal = action.billeteras.find((b) => b.es_principal && b.estado === 'activa')
        const firstActive = action.billeteras.find((b) => b.estado === 'activa')
        return {
          ...initialState,
          billeteraId: principal?.id || firstActive?.id || '',
          moneda: principal?.moneda || firstActive?.moneda || 'ARS',
        }
      }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}

export default function TransaccionModal({
  open,
  onClose,
  transaccion,
  billeteras,
  categorias,
  onSuccess,
}: TransaccionModalProps) {
  const isEdit = !!transaccion
  const { showToast } = useToast()

  const [state, dispatch] = useReducer(formReducer, initialState)

  const {
    tipo,
    monto,
    moneda,
    descripcion,
    categoriaId,
    billeteraId,
    fecha,
    metodoPago,
    showAllCats,
    cantidadCuotas,
    tasaInteres,
    isSubmitting,
  } = state

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      dispatch({ type: 'RESET', transaccion: transaccion || null, billeteras })
    }
  }, [open, transaccion, billeteras])

  const isCuotaHija = isEdit && transaccion?.es_cuota_hija

  const activeCategorias = useMemo(() => {
    const filtered = categorias.filter((c) => c.tipo === tipo)

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
      'vivienda',
    ]

    return filtered.sort((a, b) => {
      const aName = a.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      const bName = b.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

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
    const m = monto || 0
    const valorCuota =
      tasa > 0
        ? (m * tasa * Math.pow(1 + tasa, cant)) / (Math.pow(1 + tasa, cant) - 1)
        : m / cant

    return {
      total: valorCuota * cant,
      cuota: valorCuota,
    }
  }, [monto, cantidadCuotas, tasaInteres])

  const handleSubmit = async () => {
    if (monto === null || monto === 0 || !billeteraId) {
      showToast('Completá los campos obligatorios', 'error')
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      const payload = {
        tipo,
        monto: monto || 0,
        moneda,
        descripcion,
        categoria_id: categoriaId || null,
        billetera_id: billeteraId,
        fecha,
        metodo_pago: metodoPago,
        origen: isEdit ? undefined : ('manual' as const),
        es_padre_cuotas: !isEdit && metodoPago === 'credito' ? true : undefined,
        info_cuotas:
          !isEdit && metodoPago === 'credito'
            ? {
                cantidad_cuotas: cantidadCuotas,
                tiene_interes: tasaInteres > 0,
                tasa_interes: tasaInteres,
                monto_total: monto || 0,
              }
            : undefined,
      }

      if (!isEdit) {
        await transaccionService.createTransaccion(payload)
        showToast('Transacción creada', 'success')
      } else if (transaccion) {
        await transaccionService.updateTransaccion(transaccion.id, payload)
        showToast('Transacción actualizada', 'success')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      showToast('Error al guardar la transacción', 'error')
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const handleDelete = async () => {
    if (!transaccion) return
    if (!window.confirm('¿Estás seguro de que querés eliminar esta transacción?')) return

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      await transaccionService.deleteTransaccion(transaccion.id)
      showToast('Transacción eliminada', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      showToast('Error al eliminar la transacción', 'error')
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const modalTitle = (
    <div className={styles.modalTitle}>
      <span className={styles.modalTitleText}>
        {isEdit ? 'Editar transacción' : 'Nueva transacción'}
      </span>
      <div className={`${styles.typeToggle} ${styles.typeToggleNoMargin}`}>
        <button
          className={`${styles.typeBtn} ${tipo === 'egreso' ? styles.typeBtnActiveEgreso : ''} ${
            styles.typeBtnFixed
          }`}
          onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'egreso' })}
          disabled={isCuotaHija}
        >
          <ArrowUpRight size={16} strokeWidth={2} /> Egreso
        </button>
        <button
          className={`${styles.typeBtn} ${tipo === 'ingreso' ? styles.typeBtnActiveIngreso : ''} ${
            styles.typeBtnFixed
          }`}
          onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'tipo', value: 'ingreso' })}
          disabled={isCuotaHija}
        >
          <ArrowDownLeft size={16} strokeWidth={2} /> Ingreso
        </button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={open} onClose={onClose} title={modalTitle} size="md">
      <div className={styles.modalContent}>
        {/* Hero Monto */}
        <div
          className={`${styles.montoCard} ${
            tipo === 'egreso' ? styles.montoCardEgreso : styles.montoCardIngreso
          }`}
        >
          <MontoInput
            value={monto}
            onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'monto', value: v })}
            moneda={moneda}
            disabled={isCuotaHija}
            className={styles.montoInputWrapper}
            inputClassName={styles.montoInput}
            prefixClassName={styles.montoPrefixHero}
            placeholder="0"
            allowDecimals
            ghost
          />
          <div className={styles.monedaToggle}>
            <button
              className={`${styles.monedaBtn} ${moneda === 'ARS' ? styles.monedaBtnActive : ''}`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'moneda', value: 'ARS' })}
              disabled={isCuotaHija}
            >
              ARS
            </button>
            <button
              className={`${styles.monedaBtn} ${moneda === 'USD' ? styles.monedaBtnActive : ''}`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'moneda', value: 'USD' })}
              disabled={isCuotaHija}
            >
              USD
            </button>
          </div>
        </div>

        {isCuotaHija && (
          <div className={styles.cuotaHijaWarning}>
            Monto, moneda, tipo y fecha no se pueden cambiar porque esta transacción es parte de una
            compra en cuotas.
          </div>
        )}

        {/* Descripción */}
        <div className={styles.section}>
          <label className={styles.sectionLabel} htmlFor="tx-desc">
            Descripción <span className={styles.fieldOptional}>(opcional)</span>
          </label>
          <input
            id="tx-desc"
            type="text"
            className={styles.textInput}
            value={descripcion}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'descripcion', value: e.target.value })}
            placeholder="Ej: Supermercado"
          />
        </div>

        {/* Categoría Grid */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Categoría</label>
          <div className={styles.catGrid}>
            {displayCategorias.map((cat) => {
              const isActive = categoriaId === cat.id
              return (
                <button
                  key={cat.id}
                  className={`${styles.catBtn} ${isActive ? styles.catBtnActive : ''}`}
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'categoriaId', value: cat.id })}
                >
                  <CategoriaIcon nombre={cat.nombre} size={40} />
                  <span className={styles.catName}>{cat.nombre}</span>
                </button>
              )
            })}
            {!showAllCats && hasMoreCats && (
              <button 
                className={styles.catBtn} 
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'showAllCats', value: true })}
              >
                <div className={styles.gripIconWrapper}>
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
            <label className={styles.sectionLabel} htmlFor="tx-billetera">
              Billetera
            </label>
            <select
              id="tx-billetera"
              className={`${styles.textInput} ${styles.selectInput}`}
              value={billeteraId}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'billeteraId', value: e.target.value })}
              disabled={isCuotaHija}
            >
              <option value="" disabled>
                Seleccionar...
              </option>
              {billeteras
                .filter((b) => b.moneda === moneda && (b.estado === 'activa' || b.id === billeteraId))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.section}>
            <label className={styles.sectionLabel} htmlFor="tx-fecha">
              Fecha
            </label>
            <input
              id="tx-fecha"
              type="date"
              className={styles.textInput}
              value={fecha}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'fecha', value: e.target.value })}
              disabled={isCuotaHija}
            />
          </div>
        </div>

        {/* Método de Pago */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Método de pago</label>
          <div className={styles.methodGrid}>
            <button
              className={`${styles.methodBtn} ${
                metodoPago === 'debito' ? styles.methodBtnActive : ''
              }`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: 'debito' })}
              disabled={isCuotaHija}
            >
              <CreditCard size={18} /> Débito
            </button>
            <button
              className={`${styles.methodBtn} ${
                metodoPago === 'transferencia' ? styles.methodBtnActive : ''
              }`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: 'transferencia' })}
              disabled={isCuotaHija}
            >
              <ArrowRightLeft size={18} /> Transfer
            </button>
            <button
              className={`${styles.methodBtn} ${
                metodoPago === 'credito' ? styles.methodBtnActive : ''
              }`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: 'credito' })}
              disabled={isCuotaHija}
            >
              <Layers size={18} /> Crédito
            </button>
            <button
              className={`${styles.methodBtn} ${
                metodoPago === 'efectivo' ? styles.methodBtnActive : ''
              }`}
              onClick={() => !isCuotaHija && dispatch({ type: 'SET_FIELD', field: 'metodoPago', value: 'efectivo' })}
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
                <label className={styles.sectionLabel} htmlFor="tx-cuotas">
                  Cuotas
                </label>
                <input
                  id="tx-cuotas"
                  type="number"
                  className={`${styles.textInput} ${styles.cuotaInput}`}
                  value={cantidadCuotas}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cantidadCuotas', value: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className={styles.cuotaField}>
                <label className={styles.sectionLabel} htmlFor="tx-interes">
                  Interés % (mensual)
                </label>
                <input
                  id="tx-interes"
                  type="number"
                  step="0.1"
                  className={`${styles.textInput} ${styles.cuotaInput}`}
                  value={tasaInteres}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'tasaInteres', value: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div className={styles.cuotasSummary}>
              <div className={styles.summaryCol}>
                <span className={styles.summaryLbl}>Cuota</span>
                <span className={styles.summaryVal}>
                  {formatMonto(calculoCuotas.cuota, moneda)}
                </span>
              </div>
              <div className={`${styles.summaryCol} ${styles.summaryColRight}`}>
                <span className={styles.summaryLbl}>Total</span>
                <span className={styles.summaryVal}>
                  {formatMonto(calculoCuotas.total, moneda)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          {isEdit && (
            <button className={styles.btnDelete} onClick={handleDelete} disabled={isSubmitting}>
              Eliminar
            </button>
          )}
          <button
            className={styles.btnSubmit}
            onClick={handleSubmit}
            disabled={isSubmitting || monto === null || monto === 0 || !billeteraId}
          >
            {isSubmitting
              ? 'Guardando...'
              : metodoPago === 'credito' && !isEdit && cantidadCuotas > 1
                ? `Guardar · ${cantidadCuotas} cuotas`
                : 'Guardar transacción'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
