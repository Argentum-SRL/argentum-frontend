import React from 'react'
import memoriaStyles from './MemoriaComercioDialog.module.css'

export interface SugerenciaCategoriaTextoProps {
  origen: 'memoria' | 'ia' | null
  clave: string | null
}

export const SugerenciaCategoriaTexto: React.FC<SugerenciaCategoriaTextoProps> = ({
  origen,
  clave,
}) => {
  if (origen === 'memoria' && clave) {
    return (
      <p className={memoriaStyles.sugerenciaText}>
        Categoría que usaste antes para &quot;{clave}&quot;.
      </p>
    )
  }

  if (origen === 'ia') {
    return (
      <p className={memoriaStyles.sugerenciaText}>
        Elegida según la descripción. Podés cambiarla.
      </p>
    )
  }

  return null
}

export default SugerenciaCategoriaTexto
