import type { PerfilResumen } from '@/types'

export interface SugerenciaMetaPerfil {
  nombre: string
  monto_objetivo: number
  moneda: 'ARS' | 'USD'
}

export interface FilaVistaPerfil {
  id: string
  titulo: string
  texto: string
  notas: string[]
  icono: 'bien' | 'atencion' | null
  etiquetaIcono: 'Bien' | 'A mejorar' | null
  textoBoton: string | null
  sugerenciaMeta: SugerenciaMetaPerfil | null
}

export interface VistaPerfil {
  titulo: string
  subtitulo: string | null
  resumen: string | null
  aviso: string | null
  filas: FilaVistaPerfil[]
}

/**
 * Adapta la respuesta del backend de perfil financiero al modelo de vista de la tarjeta.
 */
export function armarVistaPerfil(p: PerfilResumen | null): VistaPerfil | null {
  if (!p || !p.mostrar) {
    return null
  }

  return {
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    resumen: p.resumen,
    aviso: p.aviso,
    filas: p.filas.map((fila) => ({
      id: fila.id,
      titulo: fila.titulo,
      texto: fila.texto,
      notas: fila.notas,
      icono: fila.estado === 'neutral' ? null : fila.estado,
      etiquetaIcono:
        fila.estado === 'bien'
          ? 'Bien'
          : fila.estado === 'atencion'
            ? 'A mejorar'
            : null,
      textoBoton: fila.accion?.texto_boton ?? null,
      sugerenciaMeta: fila.accion
        ? {
            nombre: fila.accion.nombre,
            monto_objetivo: Number(fila.accion.monto),
            moneda: fila.accion.moneda,
          }
        : null,
    })),
  }
}
