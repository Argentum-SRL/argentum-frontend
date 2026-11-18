import React, { useEffect, useState } from 'react'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import { Search } from '@/components/ui/icons'
import categoriaService from '@/services/categoria.service'
import { Input } from '../Input/Input'
import { Skeleton } from '../Skeleton'
import {
  combinarResultados,
  etiquetaResultado,
  textoParaBuscar,
  type ResultadoBusquedaCategoria,
} from './buscador'
import styles from './CategoriaSelector.module.css'

export interface CategoriaBuscadorProps {
  tipo: 'egreso' | 'ingreso'
  onSelectResultado: (resultado: ResultadoBusquedaCategoria) => void
  children: React.ReactNode
}

interface EstadoEndpoint {
  clave: string
  resultados: ResultadoBusquedaCategoria[]
  error: boolean
}

const ESTADO_VACIO: EstadoEndpoint = {
  clave: '',
  resultados: [],
  error: false,
}

export const CategoriaBuscador: React.FC<CategoriaBuscadorProps> = ({
  tipo,
  onSelectResultado,
  children,
}) => {
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState<EstadoEndpoint>(ESTADO_VACIO)
  const [sugerencia, setSugerencia] = useState<EstadoEndpoint>(ESTADO_VACIO)

  const consulta = textoParaBuscar(texto)
  const claveActual = consulta ? `${tipo}:${consulta}` : ''
  const necesitaSugerir = consulta.length >= 3

  // Búsqueda local en catálogo y memoria (250 ms)
  useEffect(() => {
    if (!claveActual) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const data = await categoriaService.buscar(consulta, tipo, controller.signal)
        if (!controller.signal.aborted) {
          setBusqueda({ clave: claveActual, resultados: data, error: false })
        }
      } catch {
        if (!controller.signal.aborted) {
          setBusqueda({ clave: claveActual, resultados: [], error: true })
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [claveActual, consulta, tipo])

  // Sugerencia inteligente con IA (600 ms, 3 letras o más)
  useEffect(() => {
    if (!claveActual || !necesitaSugerir) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const data = await categoriaService.sugerir(consulta, tipo, controller.signal)
        if (!controller.signal.aborted) {
          setSugerencia({ clave: claveActual, resultados: data, error: false })
        }
      } catch {
        if (!controller.signal.aborted) {
          setSugerencia({ clave: claveActual, resultados: [], error: true })
        }
      }
    }, 600)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [claveActual, consulta, necesitaSugerir, tipo])

  const handleSeleccionar = (item: ResultadoBusquedaCategoria) => {
    setTexto('')
    setBusqueda(ESTADO_VACIO)
    setSugerencia(ESTADO_VACIO)
    onSelectResultado(item)
  }

  const buscarRespondio = Boolean(claveActual) && busqueda.clave === claveActual
  const sugerirRespondio =
    !necesitaSugerir || (Boolean(claveActual) && sugerencia.clave === claveActual)

  const esperandoTodos =
    Boolean(claveActual) &&
    !buscarRespondio &&
    (!necesitaSugerir || sugerencia.clave !== claveActual)

  const esperandoSoloSugerir = Boolean(claveActual) && necesitaSugerir && !sugerirRespondio

  const buscados = buscarRespondio ? busqueda.resultados : []
  const sugeridos = necesitaSugerir && sugerirRespondio ? sugerencia.resultados : []
  const resultados = combinarResultados(sugeridos, buscados)

  const falloTotal =
    buscarRespondio &&
    sugerirRespondio &&
    busqueda.error &&
    (!necesitaSugerir || sugerencia.error)

  return (
    <>
      <Input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar categoría"
        aria-label="Buscar categoría"
        icon={<Search size={16} strokeWidth={1.75} />}
      />

      {!consulta ? (
        children
      ) : esperandoTodos ? (
        <div className={styles.subcatGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.subcatSkeleton} aria-hidden="true">
              <Skeleton variant="rounded" width={24} height={24} borderRadius={6} />
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          ))}
        </div>
      ) : falloTotal ? (
        <p className={styles.buscadorMensaje}>No se pudo buscar. Probá de nuevo.</p>
      ) : buscarRespondio && sugerirRespondio && resultados.length === 0 ? (
        <p className={styles.buscadorMensaje}>No hay categorías con ese nombre.</p>
      ) : (
        <div className={styles.buscadorResultados}>
          <div className={styles.subcatGrid}>
            {esperandoSoloSugerir && (
              <div className={styles.subcatSkeleton} aria-hidden="true">
                <Skeleton variant="rounded" width={24} height={24} borderRadius={6} />
                <Skeleton variant="text" width="60%" height={12} />
              </div>
            )}
            {resultados.map((item) => {
              const { titulo, detalle } = etiquetaResultado(item)
              return (
                <button
                  type="button"
                  key={`${item.categoria_id}-${item.subcategoria_id ?? 'otros'}`}
                  className={styles.subcatChip}
                  onClick={() => handleSeleccionar(item)}
                >
                  {item.subcategoria ? (
                    <SubcategoriaIcon
                      nombre={item.subcategoria}
                      parentCategory={item.categoria}
                      size={28}
                    />
                  ) : (
                    <CategoriaIcon nombre={item.categoria} size={28} />
                  )}
                  <span className={styles.buscadorTexto}>
                    <span className={styles.buscadorTitulo}>{titulo}</span>
                    <span className={styles.buscadorDetalle}>{detalle}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export default CategoriaBuscador
