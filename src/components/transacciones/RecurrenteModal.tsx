import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import recurrenteService from '@/services/recurrente.service'
import type { TransaccionRecurrente, Billetera, Categoria } from '@/types'
import Modal from '@/components/ui/Modal/Modal'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import BilleteraCard from '@/components/billeteras/BilleteraCard'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { ChevronLeft, X, GripHorizontal } from 'lucide-react'
import styles from './RecurrenteModal.module.css'

interface RecurrenteModalProps {
  isOpen: boolean
  onClose: () => void
  recurrente: TransaccionRecurrente | null
  billeteras: Billetera[]
  categorias: Categoria[]
  onSuccess: () => Promise<void> | void
}

function getInitialFormData(recurrente: TransaccionRecurrente | null, billeteras: Billetera[]) {
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

  const activas = billeteras.filter(b => b.estado === 'activa')
  const best = activas.find(b => b.es_principal && b.saldo_actual > 0) ||
    activas.find(b => b.saldo_actual > 0) ||
    activas.find(b => b.es_principal) ||
    activas[0]

  return {
    tipo: 'egreso' as 'ingreso' | 'egreso',
    descripcion: '',
    monto: null as number | null,
    moneda: (best?.moneda as 'ARS' | 'USD') || 'ARS',
    billetera_id: best?.id || '',
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
  const [formData, setFormData] = useState(() => getInitialFormData(recurrente, billeteras))
  
  const [step, setStep] = useState<1 | 2>(1)
  const [animClass, setAnimClass] = useState('')
  const [showAllCats, setShowAllCats] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevRecurrente, setPrevRecurrente] = useState(recurrente)

  if (isOpen !== prevIsOpen || recurrente !== prevRecurrente) {
    setPrevIsOpen(isOpen)
    setPrevRecurrente(recurrente)
    if (isOpen) {
      setFormData(getInitialFormData(recurrente, billeteras))
      setStep(1)
      setAnimClass('')
      setShowAllCats(false)
      setIsSubmitting(false)
    }
  }

  const goNext = () => {
    if (!formData.monto) {
      showToast('Ingresá un monto válido', 'error')
      return
    }
    if (!formData.billetera_id) {
      showToast('Seleccioná una billetera', 'error')
      return
    }
    setAnimClass(styles.slideForward)
    setStep(2)
  }

  const goBack = () => {
    setAnimClass(styles.slideBack)
    setStep(1)
  }

  const handleMonedaChange = (newMoneda: 'ARS' | 'USD') => {
    const nextWallet = billeteras.find(b => b.moneda === newMoneda && b.estado === 'activa')
    setFormData(prev => ({
      ...prev,
      moneda: newMoneda,
      billetera_id: nextWallet ? nextWallet.id : ''
    }))
  }

  const handleSave = async () => {
    if (!formData.categoria_id) {
      showToast('Seleccioná una categoría', 'error')
      return
    }
    
    setIsSubmitting(true)
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
    } finally {
      setIsSubmitting(false)
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

  const billeterasFiltradas = billeteras.filter((b) => b.moneda === formData.moneda && b.estado === 'activa')
  const categoriasFiltradas = categorias.filter((c) => c.tipo === formData.tipo)

  const displayCategorias = showAllCats ? categoriasFiltradas : categoriasFiltradas.slice(0, 7)
  const hasMoreCats = categoriasFiltradas.length > 7

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Nueva recurrente">
      <div className={styles.slidesContainer}>
        {/* ── Step Indicator Dots ── */}
        <div className={styles.stepDots}>
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ════════════════════ PASO 1: Monto, Tipo y Billetera ════════════════════ */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.headerTitle}>{recurrente ? 'Editar Recurrente' : 'Nueva Recurrente'}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {/* Hero Monto */}
                <MontoInput
                  value={formData.monto}
                  onChange={(v) => setFormData({ ...formData, monto: v })}
                  moneda={formData.moneda}
                  onMonedaChange={handleMonedaChange}
                  autoFocus
                />

                {/* Tipo de Transacción */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Tipo</label>
                  <div className={styles.radioGroup}>
                    <button
                      type="button"
                      className={`${styles.radioPill} ${formData.tipo === 'egreso' ? styles.pillActiveEgreso : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'egreso', categoria_id: '' })}
                    >
                      Egreso
                    </button>
                    <button
                      type="button"
                      className={`${styles.radioPill} ${formData.tipo === 'ingreso' ? styles.pillActiveIngreso : ''}`}
                      onClick={() => setFormData({ ...formData, tipo: 'ingreso', categoria_id: '' })}
                    >
                      Ingreso
                    </button>
                  </div>
                </div>

                {/* Selección de Billetera */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>¿De qué billetera?</label>
                  <div className={styles.billeterasCarouselScroller}>
                    <div className={styles.billeterasCarousel}>
                      {billeterasFiltradas.length === 0 ? (
                        <p className={styles.noBilleteras}>No tenés billeteras en {formData.moneda}.</p>
                      ) : (
                        billeterasFiltradas.map(b => (
                          <div
                            key={b.id}
                            className={styles.billeteraSelectWrap}
                            data-active={formData.billetera_id === b.id}
                          >
                            <BilleteraCard billetera={b} className={styles.fullHeightCard} disableNavigation={true} />
                            <button
                              type="button"
                              className={styles.billeteraOverlay}
                              onClick={() => setFormData({ ...formData, billetera_id: b.id })}
                              title={`Seleccionar billetera ${b.nombre}`}
                              aria-label={`Seleccionar billetera ${b.nombre}`}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════ PASO 2: Detalles, Categoría y Frecuencia ════════════════════ */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Detalles de recurrencia</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {/* Descripción */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel} htmlFor="form-desc">Descripción <span className={styles.fieldOptional}>(opcional)</span></label>
                  <input
                    id="form-desc"
                    type="text"
                    className={styles.fieldInput}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Ej: Netflix, Alquiler, Sueldo..."
                  />
                </div>

                {/* Categoría */}
                {!formData.categoria_id ? (
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Categoría</label>
                    <div className={styles.catGrid}>
                      {displayCategorias.map((cat) => (
                        <button
                          type="button"
                          key={cat.id}
                          className={`${styles.catBtn} ${formData.categoria_id === cat.id ? styles.catBtnActive : ''}`}
                          onClick={() => setFormData({ ...formData, categoria_id: cat.id })}
                        >
                          <CategoriaIcon nombre={cat.nombre} size={36} />
                          <span className={styles.catName}>{cat.nombre}</span>
                        </button>
                      ))}
                      {!showAllCats && hasMoreCats && (
                        <button type="button" className={styles.catBtn} onClick={() => setShowAllCats(true)}>
                          <div className={styles.moreCatsIconWrap}>
                            <GripHorizontal size={22} strokeWidth={1.5} />
                          </div>
                          <span className={styles.catName}>Más</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.selectedCatBanner}>
                    <div className={styles.selectedCatInfo}>
                      <CategoriaIcon nombre={categorias.find(c => c.id === formData.categoria_id)?.nombre} size={32} />
                      <div className={styles.selectedCatText}>
                        <span className={styles.selectedCatLabel}>Categoría</span>
                        <span className={styles.selectedCatName}>{categorias.find(c => c.id === formData.categoria_id)?.nombre}</span>
                      </div>
                    </div>
                    <button type="button" className={styles.changeCatBtn} onClick={() => setFormData({ ...formData, categoria_id: '' })}>Cambiar</button>
                  </div>
                )}

                {/* Frecuencia y Día */}
                <div className={styles.descFrecuenciaGrid}>
                  <div className={styles.frecuenciaRow}>
                    <div className={styles.formField}>
                      <label htmlFor="form-frecuencia" className={styles.fieldLabel}>Frecuencia</label>
                      <select
                        id="form-frecuencia"
                        className={`${styles.fieldInput} ${styles.selectInput}`}
                        value={formData.frecuencia}
                        onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as 'semanal' | 'quincenal' | 'mensual', dia_registro: 1 })}
                        title="Frecuencia de registro"
                      >
                        <option value="semanal">Semanal</option>
                        <option value="quincenal">Quincenal</option>
                        <option value="mensual">Mensual</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="form-dia" className={styles.fieldLabel}>Día de registro</label>
                      {formData.frecuencia === 'semanal' ? (
                        <select
                          id="form-dia"
                          className={`${styles.fieldInput} ${styles.selectInput}`}
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
                          className={styles.fieldInput}
                          value={formData.dia_registro}
                          onChange={(e) => setFormData({ ...formData, dia_registro: parseInt(e.target.value) || 1 })}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                {recurrente && (
                  <button type="button" className={styles.btnDelete} onClick={handleDelete}>Eliminar</button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}