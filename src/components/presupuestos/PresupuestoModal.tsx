import { useMemo, useEffect, useReducer, useState, useCallback } from 'react'
import {
  Target,
  Calendar,
  X,
  ChevronLeft,
  Settings,
  Plus,
  Search,
  Check,
  AlertCircle
} from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import type { Presupuesto, Categoria, Subcategoria } from '@/types'
import presupuestoService from '@/services/presupuesto.service'
import categoriaService from '@/services/categoria.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import styles from './PresupuestoModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/errorMessages'

interface PresupuestoModalProps {
  open: boolean
  onClose: () => void
  presupuesto?: Presupuesto | null
  categorias: Categoria[]
  onSuccess: () => void
}

interface FormState {
  step: 1 | 2 | 3
  slideDirection: 'forward' | 'back'
  nombre: string
  monto: number | null
  moneda: 'ARS' | 'USD'
  periodo: 'semanal' | 'quincenal' | 'mensual'
  renovacion: 'automatica' | 'manual'
  selectedCategorias: { categoria_id: string | null; subcategoria_id: string | null }[]
  searchQuery: string
  localError: string | null
  isSubmitting: boolean
}

type FormAction =
  | { type: 'RESET'; presupuesto: Presupuesto | null }
  | { type: 'SET_STEP'; step: 1 | 2 | 3; direction: 'forward' | 'back' }
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }

const initialState: FormState = {
  step: 1,
  slideDirection: 'forward',
  nombre: '',
  monto: null,
  moneda: 'ARS',
  periodo: 'mensual',
  renovacion: 'automatica',
  selectedCategorias: [],
  searchQuery: '',
  localError: null,
  isSubmitting: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'RESET':
      if (action.presupuesto) {
        return {
          ...initialState,
          nombre: action.presupuesto.nombre,
          monto: Number(action.presupuesto.monto),
          moneda: action.presupuesto.moneda as 'ARS' | 'USD',
          periodo: action.presupuesto.periodo as FormState['periodo'],
          renovacion: action.presupuesto.renovacion as FormState['renovacion'],
          selectedCategorias: action.presupuesto.categorias.map(c => ({
            categoria_id: c.categoria_id || null,
            subcategoria_id: c.subcategoria_id || null
          }))
        }
      }
      return initialState
    case 'SET_STEP':
      return { ...state, step: action.step, slideDirection: action.direction }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    default:
      return state
  }
}



export default function PresupuestoModal({
  open, onClose, presupuesto, categorias, onSuccess
}: PresupuestoModalProps) {
  const isEdit = !!presupuesto
  const { showToast } = useToast()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [animClass, setAnimClass] = useState('')
  const [allSubcategorias, setAllSubcategorias] = useState<Subcategoria[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const {
    step, nombre, monto, moneda, periodo, renovacion, selectedCategorias, searchQuery, localError, isSubmitting
  } = state

  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value } as FormAction)
    if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null } as FormAction)
  }, [localError])

  const loadSubcategorias = useCallback(async () => {
    try {
      const subs = await categoriaService.getAllSubcategorias()
      setAllSubcategorias(subs)
    } catch {
      console.error('Error loading subcategorias')
    }
  }, [])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET', presupuesto: presupuesto || null })
        loadSubcategorias()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, presupuesto, loadSubcategorias])

  const goNext = () => {
    if (step === 1) {
      const trimmed = nombre.trim()
      if (!trimmed) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un nombre para el presupuesto' })
        return
      }
      if (trimmed.length > 100) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El nombre no puede tener más de 100 caracteres' })
        return
      }
      if (monto === null || monto <= 0 || isNaN(monto)) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto límite mayor a cero' })
        return
      }
      if (monto > 999_999_999_999) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto límite es demasiado grande' })
        return
      }
    }
    if (step === 2 && selectedCategorias.length === 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Seleccioná al menos una categoría' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
    setAnimClass(styles.slideForward)
    dispatch({ type: 'SET_STEP', step: (step + 1) as 1 | 2 | 3, direction: 'forward' })
  }

  const goBack = () => {
    setAnimClass(styles.slideBack)
    dispatch({ type: 'SET_STEP', step: (step - 1) as 1 | 2 | 3, direction: 'back' })
  }

  const toggleSelection = (catId: string, subId: string | null) => {
    const isSelected = selectedCategorias.some(s => s.categoria_id === catId && s.subcategoria_id === subId)
    if (isSelected) {
      dispatch({
        type: 'SET_FIELD',
        field: 'selectedCategorias',
        value: selectedCategorias.filter(s => !(s.categoria_id === catId && s.subcategoria_id === subId))
      })
    } else {
      dispatch({
        type: 'SET_FIELD',
        field: 'selectedCategorias',
        value: [...selectedCategorias, { categoria_id: catId, subcategoria_id: subId }]
      })
    }
  }

  const toggleCatExpanded = (id: string) => {
    const next = new Set(expandedCats)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedCats(next)
  }

  const handleSubmit = async () => {
    const trimmed = nombre.trim()
    if (!trimmed) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un nombre para el presupuesto' })
      return
    }
    if (monto === null || monto <= 0 || isNaN(monto)) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Ingresá un monto límite mayor a cero' })
      return
    }
    if (selectedCategorias.length === 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Seleccioná al menos una categoría' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: true })
    try {
      // Deduplicar categorías seleccionadas
      const seen = new Set<string>()
      const dedupedCategorias = selectedCategorias.filter(c => {
        const key = `${c.categoria_id}_${c.subcategoria_id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      const payload = {
        nombre: trimmed,
        monto,
        moneda,
        periodo,
        renovacion,
        categorias: dedupedCategorias
      }

      if (isEdit) {
        await presupuestoService.updatePresupuesto(presupuesto!.id, payload)
        showToast('Presupuesto actualizado', 'success')
      } else {
        await presupuestoService.createPresupuesto(payload)
        showToast('Presupuesto creado', 'success')
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      dispatch({ 
        type: 'SET_FIELD', 
        field: 'localError', 
        value: getErrorMessage(err, 'No pudimos guardar el presupuesto. Intentá de nuevo.') 
      })
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'isSubmitting', value: false })
    }
  }

  const filteredCategorias = useMemo(() => {
    const egresos = categorias.filter(c => c.tipo === 'egreso')
    if (!searchQuery.trim()) return egresos
    const q = searchQuery.toLowerCase().trim()
    return egresos.filter(cat => {
      const catMatch = cat.nombre.toLowerCase().includes(q)
      const subMatch = allSubcategorias.some(
        sub => sub.categoria_id === cat.id && sub.nombre.toLowerCase().includes(q)
      )
      return catMatch || subMatch
    })
  }, [categorias, allSubcategorias, searchQuery])

  return (
    <Modal isOpen={open} onClose={onClose} showHeader={false} noPadding autoHeight ariaLabel="Gestionar presupuesto">
      <div className={styles.slidesContainer}>
        {/* Dots */}
        <div className={styles.stepDots}>
          {[1, 2, 3].map(s => (
            <div key={s} className={`${styles.stepDot} ${step === s ? styles.stepDotActive : styles.stepDotInactive}`} />
          ))}
        </div>

        {/* STEP 1: Concepto y Monto */}
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
                <h2 className={styles.headerTitle}>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Nombre del presupuesto</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={nombre}
                    onChange={e => setField('nombre', e.target.value)}
                    placeholder="Ej: Ahorro Vacaciones o Supermercado"
                    maxLength={100}
                    autoFocus
                  />
                </div>

                <div className={styles.formField}>
                  <MontoInput
                    value={monto}
                    onChange={v => setField('monto', v)}
                    moneda={moneda}
                    onMonedaChange={m => setField('moneda', m)}
                    label="Monto límite"
                  />
                  <p className={styles.fieldHint}>Este será el límite máximo de gasto para el periodo seleccionado.</p>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Categorías */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>¿Qué incluye?</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.searchBar}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar categorías..."
                    value={searchQuery}
                    onChange={e => setField('searchQuery', e.target.value)}
                  />
                </div>

                <div className={styles.catList}>
                  {filteredCategorias.map(cat => {
                    const subs = allSubcategorias.filter(s => s.categoria_id === cat.id)
                    const isExpanded = expandedCats.has(cat.id)
                    const isCatSelected = selectedCategorias.some(s => s.categoria_id === cat.id && s.subcategoria_id === null)

                    return (
                      <div key={cat.id} className={styles.catItem}>
                        <div className={styles.catMain} onClick={() => toggleCatExpanded(cat.id)}>
                          <div className={styles.catInfo}>
                            <CategoriaIcon nombre={cat.nombre} size={32} />
                            <span className={styles.catName}>{cat.nombre}</span>
                          </div>
                          <div className={styles.catActions}>
                            <button
                              type="button"
                              className={`${styles.selectBtn} ${isCatSelected ? styles.selectBtnActive : ''}`}
                              onClick={(e) => { e.stopPropagation(); toggleSelection(cat.id, null) }}
                            >
                              {isCatSelected ? <Check size={14} /> : <Plus size={14} />}
                              Todo
                            </button>
                          </div>
                        </div>

                        {isExpanded && subs.length > 0 && (
                          <div className={styles.subList}>
                            {subs.map(sub => {
                              const isSubSelected = selectedCategorias.some(s => s.categoria_id === cat.id && s.subcategoria_id === sub.id)
                              return (
                                <div
                                  key={sub.id}
                                  className={`${styles.subItem} ${isSubSelected ? styles.subItemActive : ''}`}
                                  onClick={() => {
                                    toggleSelection(cat.id, sub.id)
                                    if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
                                  }}
                                >
                                  <div className={styles.subInfo}>
                                    <SubcategoriaIcon nombre={sub.nombre} parentCategory={cat.nombre} size={22} />
                                    <span>{sub.nombre}</span>
                                  </div>
                                  {isSubSelected && <Check size={14} />}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.formFooter}>
                <div className={styles.selectedCount}>
                  {selectedCategorias.length} seleccionadas
                </div>
                <button type="submit" className={styles.submitBtn}>Continuar</button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Temporalidad */}
        {step === 3 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div className={styles.formHeader}>
                <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás"><ChevronLeft size={20} /></button>
                <h2 className={styles.headerTitle}>Frecuencia</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar"><X size={16} /></button>
              </div>

              <div className={styles.formBody}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Periodo de tiempo</label>
                  <div className={styles.periodGrid}>
                    {(['semanal', 'quincenal', 'mensual'] as const).map(p => (
                      <button
                        type="button"
                        key={p}
                        className={`${styles.periodBtn} ${periodo === p ? styles.periodBtnActive : ''}`}
                        onClick={() => setField('periodo', p)}
                      >
                        <Calendar size={18} />
                        <span className={styles.periodBtnLabel}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Renovación</label>
                  <div className={styles.renewalOptions}>
                    <div
                      className={`${styles.renewalCard} ${renovacion === 'automatica' ? styles.renewalCardActive : ''}`}
                      onClick={() => setField('renovacion', 'automatica')}
                    >
                      <Settings size={20} className={styles.renewalIcon} />
                      <div className={styles.renewalInfo}>
                        <span className={styles.renewalTitle}>Automática</span>
                        <p className={styles.renewalDesc}>El presupuesto se reinicia solo al finalizar el periodo.</p>
                      </div>
                    </div>
                    <div
                      className={`${styles.renewalCard} ${renovacion === 'manual' ? styles.renewalCardActive : ''}`}
                      onClick={() => setField('renovacion', 'manual')}
                    >
                      <Target size={20} className={styles.renewalIcon} />
                      <div className={styles.renewalInfo}>
                        <span className={styles.renewalTitle}>Manual</span>
                        <p className={styles.renewalDesc}>Tendrás que renovar o finalizar el presupuesto manualmente.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack}>Atrás</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}
