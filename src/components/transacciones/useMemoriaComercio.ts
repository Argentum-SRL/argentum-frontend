import { useState, useEffect, useCallback } from 'react'
import type { Categoria, Transaccion } from '@/types'
import memoriaComercioService from '@/services/memoriaComercio.service'
import categoriaService from '@/services/categoria.service'

export interface MemoriaDialogData {
  clave: string
  descripcion: string
  tipo: 'egreso' | 'ingreso'
  categoriaId: string
  subcategoriaId?: string | null
  categoriaNombre: string
  subcategoriaNombre?: string | null
}

export interface UseMemoriaComercioParams {
  open: boolean
  isEdit: boolean
  descripcion: string
  tipo: 'egreso' | 'ingreso'
  categoriaId: string
  subcategoriaId: string
  categorias: Categoria[]
  onAutoSelectCategoria?: (categoriaId: string, subcategoriaId: string) => void
  onClose: () => void
}

export function useMemoriaComercio({
  open,
  isEdit,
  descripcion,
  tipo,
  categoriaId,
  subcategoriaId,
  categorias,
  onAutoSelectCategoria,
  onClose,
}: UseMemoriaComercioParams) {
  const [prevOpen, setPrevOpen] = useState(open)
  const [sugerenciaClave, setSugerenciaClave] = useState<string | null>(null)
  const [showMemoriaDialog, setShowMemoriaDialog] = useState(false)
  const [memoriaDialogData, setMemoriaDialogData] = useState<MemoriaDialogData | null>(null)
  const [categoriaManual, setCategoriaManual] = useState(false)

  // Resetear estado al abrir/cerrar el modal (patrón React recomendado para derivar de props)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCategoriaManual(false)
      setSugerenciaClave(null)
      setShowMemoriaDialog(false)
      setMemoriaDialogData(null)
    }
  }

  // Memoria por comercio: sugerencia automática al tipear descripción (debounce 400ms)
  useEffect(() => {
    if (!open || isEdit) return
    const desc = descripcion.trim()
    if (!desc || (tipo !== 'egreso' && tipo !== 'ingreso')) {
      const resetTimer = setTimeout(() => {
        setSugerenciaClave(null)
      }, 0)
      return () => clearTimeout(resetTimer)
    }

    const timer = setTimeout(async () => {
      try {
        const res = await memoriaComercioService.getSugerencia(desc, tipo)
        if (res.memoria_id && !categoriaManual) {
          if (res.categoria_id) {
            onAutoSelectCategoria?.(res.categoria_id, res.subcategoria_id || '')
            setSugerenciaClave(res.clave)
          }
        } else {
          setSugerenciaClave(null)
        }
      } catch (e) {
        console.error('Error al obtener sugerencia de comercio:', e)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [descripcion, tipo, open, isEdit, onAutoSelectCategoria, categoriaManual])

  const marcarCategoriaManual = useCallback(() => {
    setCategoriaManual(true)
    setSugerenciaClave(null)
  }, [])

  const evaluarMemoriaPostGuardado = useCallback(
    async (transaccionOriginal: Transaccion) => {
      const origCatId = transaccionOriginal.categoria_id || ''
      const origSubcatId = transaccionOriginal.subcategoria_id || ''
      const newCatId = categoriaId || ''
      const newSubcatId = subcategoriaId || ''
      const cambioCategoria = newCatId !== origCatId || newSubcatId !== origSubcatId
      const descValida = descripcion.trim().length > 0
      const tipoValido = tipo === 'egreso' || tipo === 'ingreso'

      if (cambioCategoria && descValida && tipoValido) {
        try {
          const sug = await memoriaComercioService.getSugerencia(descripcion.trim(), tipo)
          const memoriaDiferente =
            !sug.memoria_id ||
            sug.categoria_id !== newCatId ||
            (sug.subcategoria_id || null) !== (newSubcatId || null)
          if (sug.clave && memoriaDiferente) {
            const catObj = categorias.find((c) => c.id === newCatId)
            const catNom = catObj?.nombre || ''
            let subcatNom: string | null = null
            if (newSubcatId) {
              try {
                const subcats = await categoriaService.getSubcategorias(newCatId)
                const subObj = subcats.find((s) => s.id === newSubcatId)
                subcatNom = subObj?.nombre || null
              } catch {
                // Fallback silencioso si falla la consulta de subcategorías
              }
            }

            setMemoriaDialogData({
              clave: sug.clave,
              descripcion: descripcion.trim(),
              tipo,
              categoriaId: newCatId,
              subcategoriaId: newSubcatId || null,
              categoriaNombre: catNom,
              subcategoriaNombre: subcatNom,
            })
            setShowMemoriaDialog(true)
            return true
          }
        } catch (e) {
          console.error('Error al evaluar memoria por comercio:', e)
        }
      }

      onClose()
      return false
    },
    [categoriaId, subcategoriaId, descripcion, tipo, categorias, onClose]
  )

  const cerrarMemoriaDialog = useCallback(() => {
    setShowMemoriaDialog(false)
    onClose()
  }, [onClose])

  return {
    sugerenciaClave,
    marcarCategoriaManual,
    evaluarMemoriaPostGuardado,
    showMemoriaDialog,
    memoriaDialogData,
    cerrarMemoriaDialog,
  }
}
