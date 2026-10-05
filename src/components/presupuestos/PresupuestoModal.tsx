import { useMemo, useEffect, useReducer, useState, useCallback } from 'react'
import {
  Target,
  Calendar,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  Search,
  Check,
  AlertCircle,
  Trash2,
} from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import type { Presupuesto, Categoria, Subcategoria } from '@/types'
import presupuestoService from '@/services/presupuesto.service'
import categoriaService from '@/services/categoria.service'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import styles from './PresupuestoModal.module.css'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import { sileo } from 'sileo'
import { useAuth } from '@/hooks/useAuth'
import { useModal } from '@/hooks/useModal'
import { useAdaptiveModalHeight } from '@/hooks/useAdaptiveModalHeight'
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
  | { type: 'RESET'; presupuesto: Presupuesto | null; defaultMoneda?: 'ARS' | 'USD' }
  | { type: 'SET_STEP'; step: 1 | 2 | 3 }
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }

const initialState: FormState = {
  step: 1,
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
      return {
        ...initialState,
        moneda: action.defaultMoneda || 'ARS'
      }
    case 'SET_STEP':
      return { ...state, step: action.step }
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
  const { usuario } = useAuth()
  const { confirm } = useModal()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [fallbackCategorias, setFallbackCategorias] = useState<Categoria[]>([])
  const [allSubcategorias, setAllSubcategorias] = useState<Subcategoria[]>([])
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [animClass, setAnimClass] = useState('')

  const {
    step, nombre, monto, moneda, periodo, renovacion, selectedCategorias, searchQuery, localError, isSubmitting
  } = state

  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value } as FormAction)
    if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null } as FormAction)
  }, [localError])

  const effectiveCategorias = categorias.length > 0 ? categorias : fallbackCategorias

  // FILTRO ESTRICTO: Únicamente categorías de tipo 'egreso'
  const egresoCategorias = useMemo(() => {
    return effectiveCategorias.filter(c => c.tipo === 'egreso')
  }, [effectiveCategorias])

  const loadData = useCallback(async () => {
    try {
      const [subs, cats] = await Promise.all([
        categoriaService.getAllSubcategorias(),
        categorias.length === 0 ? categoriaService.getCategorias() : Promise.resolve([])
      ])
      setAllSubcategorias(subs)
      if (cats && cats.length > 0) {
        setFallbackCategorias(cats.filter(c => c.tipo === 'egreso'))
      }
    } catch {
      console.error('Error loading subcategorias/categorias')
    }
  }, [categorias.length])

  useEffect(() => {
    if (open) {
      const defaultMoneda = (usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET', presupuesto: presupuesto || null, defaultMoneda })
        setExpandedCats(new Set())
        setAnimClass('')
        void loadData()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, presupuesto, usuario?.moneda_principal, loadData])

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return egresoCategorias
    const q = searchQuery.toLowerCase().trim()
    return egresoCategorias.filter(cat => {
      const catMatch = cat.nombre.toLowerCase().includes(q)
      const subMatch = allSubcategorias.some(
        sub => sub.categoria_id === cat.id && sub.nombre.toLowerCase().includes(q)
      )
      return catMatch || subMatch
    })
  }, [egresoCategorias, allSubcategorias, searchQuery])

  // Hook universal de altura adaptativa (Auto-Hugging)
  const {
    headerRef: formHeaderRef,
    fieldsRef: formBodyRef,
    footerRef: formFooterRef,
    dynamicHeight,
  } = useAdaptiveModalHeight({
    enabled: open,
    deps: [
      step,
      animClass,
      nombre,
      monto,
      moneda,
      periodo,
      renovacion,
      selectedCategorias.length,
      filteredCategorias.length,
      searchQuery,
      Array.from(expandedCats).join(','),
      localError,
    ],
    extraPadding: 26,
    maxHeightRatio: 0.88,
  })

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
      if (monto > 999_999_999_999.99) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto límite no puede superar los 999.999.999.999' })
        return
      }
      const montoStr = monto.toString()
      if (montoStr.includes('.') && montoStr.split('.')[1].length > 2) {
        dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto no puede tener más de 2 decimales' })
        return
      }
    }
    if (step === 2 && selectedCategorias.length === 0) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'Seleccioná al menos una categoría' })
      return
    }

    dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
    setAnimClass(styles.slideForward)
    dispatch({ type: 'SET_STEP', step: (step + 1) as 1 | 2 | 3 })
  }

  const goBack = () => {
    dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
    setAnimClass(styles.slideBack)
    dispatch({ type: 'SET_STEP', step: (step - 1) as 1 | 2 | 3 })
  }

  // Presets inteligentes para agilizar la selección en 1 toque
  const PRESET_ESENCIALES = useMemo(() => [
    'alimentacion', 'vivienda', 'servicios', 'transporte', 'salud', 'comunicacion', 'equipamiento del hogar', 'hogar', 'banco'
  ], [])
  const PRESET_OCIO = useMemo(() => [
    'gastronomia', 'restaurante', 'restaurantes', 'restaurantes y delivery', 'recreativo', 'entretenimiento', 'indumentaria', 'educacion'
  ], [])

  const isPresetActive = useCallback((preset: 'todas' | 'esenciales' | 'ocio') => {
    if (egresoCategorias.length === 0) return false
    if (preset === 'todas') {
      return egresoCategorias.every(cat =>
        selectedCategorias.some(s => s.categoria_id === cat.id && s.subcategoria_id === null)
      )
    }
    const targets = preset === 'esenciales' ? PRESET_ESENCIALES : PRESET_OCIO
    const matchingCats = egresoCategorias.filter(c => {
      const normName = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return targets.includes(normName)
    })
    if (matchingCats.length === 0) return false
    return matchingCats.every(cat => selectedCategorias.some(s => s.categoria_id === cat.id))
  }, [egresoCategorias, selectedCategorias, PRESET_ESENCIALES, PRESET_OCIO])

  const applyPreset = useCallback((preset: 'todas' | 'esenciales' | 'ocio' | 'limpiar') => {
    if (preset === 'limpiar') {
      dispatch({ type: 'SET_FIELD', field: 'selectedCategorias', value: [] })
      return
    }
    if (preset === 'todas') {
      if (isPresetActive('todas')) {
        dispatch({ type: 'SET_FIELD', field: 'selectedCategorias', value: [] })
      } else {
        const allSelected = egresoCategorias.map(c => ({ categoria_id: c.id, subcategoria_id: null }))
        dispatch({ type: 'SET_FIELD', field: 'selectedCategorias', value: allSelected })
        if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
      }
      return
    }

    const targets = preset === 'esenciales' ? PRESET_ESENCIALES : PRESET_OCIO
    const matchingCats = egresoCategorias.filter(c => {
      const normName = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      return targets.includes(normName)
    })
    const matchingIds = new Set(matchingCats.map(c => c.id))
    const alreadyActive = matchingCats.length > 0 && matchingCats.every(cat => selectedCategorias.some(s => s.categoria_id === cat.id))

    if (alreadyActive) {
      dispatch({
        type: 'SET_FIELD',
        field: 'selectedCategorias',
        value: selectedCategorias.filter(s => !matchingIds.has(s.categoria_id || ''))
      })
    } else {
      const otherSelected = selectedCategorias.filter(s => !matchingIds.has(s.categoria_id || ''))
      const newItems = matchingCats.map(c => ({ categoria_id: c.id, subcategoria_id: null }))
      dispatch({
        type: 'SET_FIELD',
        field: 'selectedCategorias',
        value: [...otherSelected, ...newItems]
      })
      if (localError) dispatch({ type: 'SET_FIELD', field: 'localError', value: null })
    }
  }, [egresoCategorias, selectedCategorias, isPresetActive, localError, PRESET_ESENCIALES, PRESET_OCIO])

  const toggleSelection = (catId: string, subId: string | null) => {
    const catSubs = allSubcategorias.filter(s => s.categoria_id === catId)
    
    if (subId === null) {
      // Toggle de toda la categoría
      const isCurrentlySelected = selectedCategorias.some(s => s.categoria_id === catId)
      if (isCurrentlySelected) {
        dispatch({
          type: 'SET_FIELD',
          field: 'selectedCategorias',
          value: selectedCategorias.filter(s => s.categoria_id !== catId)
        })
      } else {
        dispatch({
          type: 'SET_FIELD',
          field: 'selectedCategorias',
          value: [
            ...selectedCategorias.filter(s => s.categoria_id !== catId),
            { categoria_id: catId, subcategoria_id: null }
          ]
        })
      }
    } else {
      // Toggle de subcategoría individual
      const isWholeCatSelected = selectedCategorias.some(s => s.categoria_id === catId && s.subcategoria_id === null)
      
      if (isWholeCatSelected) {
        // Si toda la categoría estaba seleccionada, ahora seleccionamos todas sus subcategorías EXCEPTO esta
        const otherSubs = catSubs.filter(s => s.id !== subId).map(s => ({ categoria_id: catId, subcategoria_id: s.id }))
        dispatch({
          type: 'SET_FIELD',
          field: 'selectedCategorias',
          value: [
            ...selectedCategorias.filter(s => s.categoria_id !== catId),
            ...otherSubs
          ]
        })
      } else {
        const isSubSelected = selectedCategorias.some(s => s.subcategoria_id === subId)
        if (isSubSelected) {
          dispatch({
            type: 'SET_FIELD',
            field: 'selectedCategorias',
            value: selectedCategorias.filter(s => s.subcategoria_id !== subId)
          })
        } else {
          // Agregamos la subcategoría
          const currentSubIds = new Set(
            selectedCategorias
              .filter(s => s.categoria_id === catId && s.subcategoria_id !== null)
              .map(s => s.subcategoria_id)
          )
          currentSubIds.add(subId)

          // Si ahora todas las subcategorías están seleccionadas, convertimos a selección total de categoría
          if (catSubs.length > 0 && currentSubIds.size === catSubs.length) {
            dispatch({
              type: 'SET_FIELD',
              field: 'selectedCategorias',
              value: [
                ...selectedCategorias.filter(s => s.categoria_id !== catId),
                { categoria_id: catId, subcategoria_id: null }
              ]
            })
          } else {
            dispatch({
              type: 'SET_FIELD',
              field: 'selectedCategorias',
              value: [
                ...selectedCategorias,
                { categoria_id: catId, subcategoria_id: subId }
              ]
            })
          }
        }
      }
    }
  }

  const toggleCatExpanded = (id: string) => {
    const next = new Set(expandedCats)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedCats(next)
  }

  const handleDelete = () => {
    if (!presupuesto) return
    confirm({
      title: '¿Eliminar presupuesto?',
      description: `Se eliminará "${presupuesto.nombre}". Los gastos y transacciones no se verán afectados.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await presupuestoService.eliminarPresupuesto(presupuesto.id)
          sileo.success({ title: 'Presupuesto eliminado' })
          onSuccess()
          onClose()
        } catch (e) {
          console.error(e)
          sileo.error({ title: getErrorMessage(e, 'No se pudo eliminar el presupuesto') })
        }
      }
    })
  }

  const handleSubmit = async () => {
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
    if (monto > 999_999_999_999.99) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto límite no puede superar los 999.999.999.999' })
      return
    }
    const montoStr = monto.toString()
    if (montoStr.includes('.') && montoStr.split('.')[1].length > 2) {
      dispatch({ type: 'SET_FIELD', field: 'localError', value: 'El monto no puede tener más de 2 decimales' })
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
        sileo.success({ title: 'Presupuesto actualizado' })
      } else {
        await presupuestoService.createPresupuesto(payload)
        sileo.success({ title: 'Presupuesto creado' })
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

  // Resumen visual de selección en el footer
  const selectedSummary = useMemo(() => {
    const totalSelected = selectedCategorias.length
    if (totalSelected === 0) return '0 seleccionadas'
    const catIds = new Set(selectedCategorias.map(s => s.categoria_id).filter(Boolean))
    const count = catIds.size
    return count === 1 ? '1 categoría' : `${count} categorías`
  }, [selectedCategorias])

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showHeader={false}
      noPadding
      autoHeight
      className={styles.modalPresupuesto}
      ariaLabel="Gestionar presupuesto"
    >
      <div
        className={styles.slidesContainer}
        style={dynamicHeight ? { height: `${dynamicHeight}px` } : undefined}
      >
        {/* Indicador de pasos superior centrado (Pill Dots) */}
        <div className={styles.stepDots} aria-hidden="true">
          <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
          <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
        </div>

        {/* ──── STEP 1: Nombre y Monto Límite ──── */}
        {step === 1 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <h2 className={styles.headerTitle}>{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h2>
                </div>
                <div className={styles.headerRightActions}>
                  {isEdit && (
                    <button
                      type="button"
                      className={styles.deleteHeaderBtn}
                      onClick={handleDelete}
                      title="Eliminar presupuesto"
                      aria-label="Eliminar presupuesto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep1}`}>
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
                    placeholder="Ej. Supermercado, Salidas, Transporte"
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
                    allowDecimals={true}
                    max={999999999999.99}
                    label="Monto límite"
                  />
                  <p className={styles.fieldHint}>Este será el límite máximo de gasto para el periodo seleccionado.</p>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ──── STEP 2: Selección de Categorías de Egreso ──── */}
        {step === 2 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                goNext()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                  <h2 className={styles.headerTitle}>¿Qué incluye?</h2>
                </div>
                <div className={styles.headerRightActions}>
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep2}`}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                {/* Buscador Superior */}
                <div className={styles.catSearchContainer}>
                  <Search size={16} className={styles.searchIcon} strokeWidth={2} />
                  <input
                    type="text"
                    className={styles.catSearchInput}
                    placeholder="Buscar categorías o subcategorías..."
                    value={searchQuery}
                    onChange={e => setField('searchQuery', e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.clearSearchBtn}
                      onClick={() => setField('searchQuery', '')}
                      title="Limpiar búsqueda"
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Atajos Rápidos de Selección en 1 toque (Presets) */}
                <div className={styles.presetsBar} role="toolbar" aria-label="Atajos de categorías">
                  <button
                    type="button"
                    className={`${styles.presetPill} ${isPresetActive('todas') ? styles.presetPillActive : ''}`}
                    onClick={() => applyPreset('todas')}
                  >
                    <span>{isPresetActive('todas') ? '✓ Todas' : 'Todas'}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${isPresetActive('esenciales') ? styles.presetPillActive : ''}`}
                    onClick={() => applyPreset('esenciales')}
                  >
                    <span>Fijos & Esenciales</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${isPresetActive('ocio') ? styles.presetPillActive : ''}`}
                    onClick={() => applyPreset('ocio')}
                  >
                    <span>Variables & Ocio</span>
                  </button>
                  {selectedCategorias.length > 0 && (
                    <button
                      type="button"
                      className={`${styles.presetPill} ${styles.presetPillClear}`}
                      onClick={() => applyPreset('limpiar')}
                      title="Desmarcar todas"
                    >
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>

                {/* Lista Espaciosa de Categorías */}
                <div className={styles.catList}>
                  {filteredCategorias.length === 0 ? (
                    <div className={styles.emptyCatList}>
                      <span>No se encontraron categorías de egreso</span>
                    </div>
                  ) : (
                    filteredCategorias.map(cat => {
                      const subs = allSubcategorias.filter(s => s.categoria_id === cat.id)
                      const isCatSelected = selectedCategorias.some(s => s.categoria_id === cat.id && s.subcategoria_id === null)
                      const selectedSubCount = selectedCategorias.filter(s => s.categoria_id === cat.id && s.subcategoria_id !== null).length
                      const isFull = isCatSelected || (subs.length > 0 && selectedSubCount === subs.length)
                      const isPartial = !isFull && selectedSubCount > 0
                      const hasAnySelection = isFull || isPartial
                      const isExpanded = expandedCats.has(cat.id) || (searchQuery.trim().length > 0 && subs.some(s => s.nombre.toLowerCase().includes(searchQuery.toLowerCase().trim())))

                      return (
                        <div
                          key={cat.id}
                          className={`${styles.catCard} ${hasAnySelection ? styles.catCardSelected : ''} ${isExpanded ? styles.catCardExpanded : ''}`}
                        >
                          {/* Área Principal de Toque (Toggle Rápido de Categoría) */}
                          <div 
                            className={styles.catCardTop}
                            onClick={() => toggleSelection(cat.id, null)}
                            role="checkbox"
                            aria-checked={isFull}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault()
                                toggleSelection(cat.id, null)
                              }
                            }}
                          >
                            <div className={styles.catCardLeft}>
                              <div className={styles.catIconWrap}>
                                <CategoriaIcon nombre={cat.nombre} size={32} />
                              </div>
                              <div className={styles.catCardInfo}>
                                <span className={styles.catCardTitle}>{cat.nombre}</span>
                                <span className={styles.catCardSubtitle}>
                                  {isFull ? (
                                    <span className={styles.subtextSuccess}>Todo incluido</span>
                                  ) : isPartial ? (
                                    <span className={styles.subtextPartial}>{selectedSubCount} de {subs.length} seleccionadas</span>
                                  ) : subs.length > 0 ? (
                                    <span>{subs.length} subcategorías</span>
                                  ) : (
                                    <span>General</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className={styles.catCardRight}>
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  className={`${styles.customSubcatBtn} ${isExpanded ? styles.customSubcatBtnActive : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCatExpanded(cat.id)
                                  }}
                                  title={isExpanded ? 'Ocultar subcategorías' : 'Ver y elegir subcategorías'}
                                  aria-label={isExpanded ? 'Ocultar subcategorías' : 'Ver y elegir subcategorías'}
                                >
                                  <span>
                                    {isExpanded
                                      ? 'Ocultar'
                                      : selectedSubCount > 0 && !isCatSelected
                                      ? `${selectedSubCount} de ${subs.length}`
                                      : `${subs.length} subcats`}
                                  </span>
                                  {isExpanded ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />}
                                </button>
                              )}

                              <div 
                                className={`${styles.checkCircle} ${isFull ? styles.checkCircleActive : isPartial ? styles.checkCirclePartial : ''}`}
                                aria-hidden="true"
                              >
                                {isFull ? (
                                  <Check size={13} strokeWidth={3} />
                                ) : isPartial ? (
                                  <div className={styles.partialDash} />
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Bandeja de Subcategorías (Chips compactos) */}
                          {isExpanded && subs.length > 0 && (
                            <div className={styles.subcatTray}>
                              <div className={styles.subcatTrayHeader}>
                                <span className={styles.subcatTrayTitle}>Subcategorías</span>
                                <button
                                  type="button"
                                  className={styles.subcatSelectAllBtn}
                                  onClick={() => toggleSelection(cat.id, null)}
                                >
                                  {isFull ? 'Deseleccionar todas' : 'Seleccionar todas'}
                                </button>
                              </div>

                              <div className={styles.subcatChipsGrid}>
                                {subs.map(sub => {
                                  const isSubSelected = isFull || selectedCategorias.some(s => s.subcategoria_id === sub.id)
                                  return (
                                    <button
                                      type="button"
                                      key={sub.id}
                                      className={`${styles.subcatChip} ${isSubSelected ? styles.subcatChipActive : ''}`}
                                      onClick={() => toggleSelection(cat.id, sub.id)}
                                    >
                                      <SubcategoriaIcon nombre={sub.nombre} parentCategory={cat.nombre} size={15} />
                                      <span className={styles.subcatChipName}>{sub.nombre}</span>
                                      {isSubSelected && <Check size={11} strokeWidth={3} className={styles.subcatCheck} />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div ref={formFooterRef} className={`${styles.formFooter} ${styles.formFooterStep2}`}>
                <div className={styles.selectedCount}>
                  <span>{selectedSummary}</span>
                </div>
                <div className={styles.footerButtonsGroup}>
                  <button type="button" className={styles.cancelBtn} onClick={goBack}>
                    Atrás
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    Continuar
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ──── STEP 3: Frecuencia y Renovación ──── */}
        {step === 3 && (
          <div className={`${styles.slide} ${animClass}`}>
            <form 
              className={styles.formContainer}
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              <div ref={formHeaderRef} className={styles.formHeader}>
                <div className={styles.headerLeft}>
                  <button type="button" className={styles.backBtn} onClick={goBack} title="Atrás" aria-label="Atrás">
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                  <h2 className={styles.headerTitle}>Frecuencia</h2>
                </div>
                <div className={styles.headerRightActions}>
                  <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar" aria-label="Cerrar">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div ref={formBodyRef} className={`${styles.formBody} ${styles.formBodyStep3}`}>
                {localError && (
                  <div className={styles.localErrorAlert}>
                    <AlertCircle size={16} />
                    <span>{localError}</span>
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Periodo de tiempo</label>
                  <div className={styles.periodSegmentedWrap} role="radiogroup" aria-label="Periodo de tiempo">
                    {(['semanal', 'quincenal', 'mensual'] as const).map(p => (
                      <button
                        type="button"
                        key={p}
                        role="radio"
                        aria-checked={periodo === p}
                        className={`${styles.periodBtn} ${periodo === p ? styles.periodBtnActive : ''}`}
                        onClick={() => setField('periodo', p)}
                      >
                        <Calendar size={15} strokeWidth={1.75} className={styles.periodBtnIcon} />
                        <span className={styles.periodBtnLabel}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Renovación</label>
                  <div className={styles.renewalOptions} role="radiogroup" aria-label="Tipo de renovación">
                    <div
                      role="radio"
                      aria-checked={renovacion === 'automatica'}
                      className={`${styles.renewalCard} ${renovacion === 'automatica' ? styles.renewalCardActive : ''}`}
                      onClick={() => setField('renovacion', 'automatica')}
                    >
                      <div className={styles.renewalLeft}>
                        <div className={styles.renewalIconWrap}>
                          <Settings size={18} strokeWidth={1.75} />
                        </div>
                        <div className={styles.renewalInfo}>
                          <span className={styles.renewalTitle}>Automática</span>
                          <p className={styles.renewalDesc}>Se reinicia solo al finalizar el periodo</p>
                        </div>
                      </div>
                      <div className={`${styles.radioCircle} ${renovacion === 'automatica' ? styles.radioCircleActive : ''}`} aria-hidden="true">
                        {renovacion === 'automatica' && <div className={styles.radioDot} />}
                      </div>
                    </div>

                    <div
                      role="radio"
                      aria-checked={renovacion === 'manual'}
                      className={`${styles.renewalCard} ${renovacion === 'manual' ? styles.renewalCardActive : ''}`}
                      onClick={() => setField('renovacion', 'manual')}
                    >
                      <div className={styles.renewalLeft}>
                        <div className={styles.renewalIconWrap}>
                          <Target size={18} strokeWidth={1.75} />
                        </div>
                        <div className={styles.renewalInfo}>
                          <span className={styles.renewalTitle}>Manual</span>
                          <p className={styles.renewalDesc}>Finaliza o se renueva cuando vos decidas</p>
                        </div>
                      </div>
                      <div className={`${styles.radioCircle} ${renovacion === 'manual' ? styles.radioCircleActive : ''}`} aria-hidden="true">
                        {renovacion === 'manual' && <div className={styles.radioDot} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={formFooterRef} className={styles.formFooter}>
                <button type="button" className={styles.cancelBtn} onClick={goBack} disabled={isSubmitting}>
                  Atrás
                </button>
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
