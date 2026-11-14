import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  DIMENSIONES,
  RGB_COLORES,
  TIPOGRAFIA,
} from './estilosArchivo'
import {
  colorCeldaPdf,
  textoCeldaPdf,
  type TablaPdf,
} from './contenidoPdf'

export function opcionesTablaPdf(
  doc: jsPDF,
  tabla: TablaPdf,
  startY: number
): Parameters<typeof autoTable>[1] {
  const bodyFormatted = tabla.filas.map((fila) => fila.map((c) => textoCeldaPdf(c)))
  const hasTotal = Boolean(tabla.total)
  const totalRowIndex = tabla.filas.length
  const allBody = hasTotal
    ? [...bodyFormatted, tabla.total!.map((c) => textoCeldaPdf(c))]
    : bodyFormatted

  return {
    startY,
    head: [tabla.encabezados],
    body: allBody,
    theme: 'plain',
    headStyles: {
      fillColor: RGB_COLORES.AZUL_MARINO,
      textColor: RGB_COLORES.BLANCO,
      fontStyle: 'bold',
      fontSize: TIPOGRAFIA.TAMANIOS.ENCABEZADO_TABLA,
      minCellHeight: DIMENSIONES.ALTO_FILA_ENCABEZADO_MM,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: TIPOGRAFIA.TAMANIOS.CELDA_TABLA,
      textColor: RGB_COLORES.TEXTO_BASE,
      minCellHeight: DIMENSIONES.ALTO_FILA_DATOS_MM,
      lineColor: RGB_COLORES.LINEA_TABLA,
      lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
    },
    margin: { left: DIMENSIONES.MARGIN_X, right: DIMENSIONES.MARGIN_X },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.halign = data.column.index === 0 ? 'left' : 'center'
      } else if (data.section === 'body') {
        const isTotal = hasTotal && data.row.index === totalRowIndex
        const rawCell = isTotal
          ? tabla.total?.[data.column.index]
          : tabla.filas[data.row.index]?.[data.column.index]

        if (isTotal) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = RGB_COLORES.FONDO_TOTAL
          data.cell.styles.minCellHeight = DIMENSIONES.ALTO_FILA_TOTAL_MM
        } else if (tabla.filasNegrita?.includes(data.row.index)) {
          data.cell.styles.fontStyle = 'bold'
        }

        const color = colorCeldaPdf(rawCell)
        if (color === 'rojo') {
          data.cell.styles.textColor = RGB_COLORES.ROJO
        } else if (color === 'verde') {
          data.cell.styles.textColor = RGB_COLORES.VERDE
        } else {
          data.cell.styles.textColor = RGB_COLORES.TEXTO_BASE
        }

        const align = tabla.alineaciones?.[data.column.index] ?? 'left'
        data.cell.styles.halign = align
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && hasTotal && data.row.index === totalRowIndex) {
        doc.setDrawColor(
          RGB_COLORES.AZUL_MARINO[0],
          RGB_COLORES.AZUL_MARINO[1],
          RGB_COLORES.AZUL_MARINO[2]
        )
        doc.setLineWidth(0.4)
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x + data.cell.width,
          data.cell.y
        )
      }
    },
  }
}

export function medirAltoTablaPdf(
  tabla: TablaPdf
): { alto: number; entraEnUnaHoja: boolean } | null {
  try {
    const draftDoc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })
    const startY = DIMENSIONES.MARGIN_TOP
    autoTable(draftDoc, opcionesTablaPdf(draftDoc, tabla, startY))
    const lastY = (
      draftDoc as unknown as { lastAutoTable?: { finalY?: number } }
    ).lastAutoTable?.finalY
    if (typeof lastY !== 'number') return null
    const pages = draftDoc.getNumberOfPages()
    const alto = pages === 1 ? lastY - startY : (pages - 1) * DIMENSIONES.PAGE_HEIGHT + (lastY - startY)
    const entraEnUnaHoja = pages === 1
    return { alto, entraEnUnaHoja }
  } catch {
    return null
  }
}
