/**
 * Estilos canónicos para PDF y Excel de Análisis.
 * Mismos valores que app/services/excel_estilos.py.
 */

export const HEX_COLORES = {
  AZUL_MARINO: '1F3864',
  GRIS_TEXTO: '595959',
  GRIS_MUTED: '7F7F7F',
  LINEA_TABLA: 'D9E1F2',
  FONDO_TOTAL: 'EEF3FA',
  BLANCO: 'FFFFFF',
  ROJO: 'FF0000',
  VERDE: '008000',
  TEXTO_BASE: '000000',
} as const

export function hexToRgb(hex: string): [number, number, number] {
  const num = parseInt(hex, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export const RGB_COLORES = {
  AZUL_MARINO: hexToRgb(HEX_COLORES.AZUL_MARINO),
  GRIS_TEXTO: hexToRgb(HEX_COLORES.GRIS_TEXTO),
  GRIS_MUTED: hexToRgb(HEX_COLORES.GRIS_MUTED),
  LINEA_TABLA: hexToRgb(HEX_COLORES.LINEA_TABLA),
  FONDO_TOTAL: hexToRgb(HEX_COLORES.FONDO_TOTAL),
  BLANCO: hexToRgb(HEX_COLORES.BLANCO),
  ROJO: hexToRgb(HEX_COLORES.ROJO),
  VERDE: hexToRgb(HEX_COLORES.VERDE),
  TEXTO_BASE: hexToRgb(HEX_COLORES.TEXTO_BASE),
} as const

export const TIPOGRAFIA = {
  FUENTE: 'helvetica' as const,
  TAMANIOS: {
    TITULO_PAGINA: 16,
    SUBTITULO_PAGINA: 10,
    TITULO_SECCION: 13,
    NOTA_SECCION: 10,
    ENCABEZADO_TABLA: 10,
    CELDA_TABLA: 9,
    PIE_PAGINA: 8,
  },
} as const

export const DIMENSIONES = {
  PAGE_WIDTH: 297,
  PAGE_HEIGHT: 210,
  MARGIN_X: 14,
  MARGIN_TOP: 14,
  MARGIN_BOTTOM: 14,
  CONTENT_WIDTH: 269,
  ALTO_FILA_ENCABEZADO_MM: 8,
  ALTO_FILA_DATOS_MM: 6.5,
  ALTO_FILA_TOTAL_MM: 7,
  LIMITE_INICIO_SECCION_Y: 178.5,
} as const
