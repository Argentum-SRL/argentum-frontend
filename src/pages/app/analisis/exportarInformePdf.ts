import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  AnalisisQueryParams,
  MonedaModoAnalisis,
  NaturalezaGastoFiltro,
} from '@/services/analisis.service'
import analisisService from '@/services/analisis.service'
import { formatFecha } from '@/utils/format'
import {
  nombreArchivoDescarga,
  obtenerTipoBloque,
  resumenPedido,
  type PedidoDescarga,
} from './descargaAnalisis'
import {
  DIMENSIONES,
  RGB_COLORES,
  TIPOGRAFIA,
} from './estilosArchivo'
import {
  armarContenidoPdf,
  type SeccionPdf,
} from './contenidoPdf'
import {
  medirAltoTablaPdf,
  opcionesTablaPdf,
} from './opcionesTablaPdf'

export function dibujarInformePdf(
  doc: jsPDF,
  pedido: PedidoDescarga,
  secciones: SeccionPdf[],
  fechaTexto: string,
  nombres?: Parameters<typeof resumenPedido>[1]
): void {
  // Título de la página en 16 negrita sin franja de fondo
  doc.setFont(TIPOGRAFIA.FUENTE, 'bold')
  doc.setFontSize(TIPOGRAFIA.TAMANIOS.TITULO_PAGINA)
  doc.setTextColor(
    RGB_COLORES.AZUL_MARINO[0],
    RGB_COLORES.AZUL_MARINO[1],
    RGB_COLORES.AZUL_MARINO[2]
  )
  doc.text(pedido.titulo, DIMENSIONES.MARGIN_X, 16)

  // Subtítulo en 10 cursiva
  doc.setFont(TIPOGRAFIA.FUENTE, 'italic')
  doc.setFontSize(TIPOGRAFIA.TAMANIOS.SUBTITULO_PAGINA)
  doc.setTextColor(
    RGB_COLORES.GRIS_TEXTO[0],
    RGB_COLORES.GRIS_TEXTO[1],
    RGB_COLORES.GRIS_TEXTO[2]
  )
  const subTexto = `${resumenPedido(pedido, nombres, { incluirTitulo: false })} · Generado el ${fechaTexto}`
  doc.text(subTexto, DIMENSIONES.MARGIN_X, 23)

  let cursorY = 31
  const maxUsableY = DIMENSIONES.PAGE_HEIGHT - DIMENSIONES.MARGIN_BOTTOM
  const espacioHojaVacia = maxUsableY - (DIMENSIONES.MARGIN_TOP + 4)

  for (const sec of secciones) {
    const primeraTabla = sec.tablas[0]
    const altoCabecera = 5 + (sec.nota ? 5 : 0) + 1
    const medPrimera = primeraTabla ? medirAltoTablaPdf(primeraTabla) : null

    if (medPrimera) {
      const altoRequerido = altoCabecera + medPrimera.alto
      if (
        cursorY + altoRequerido > maxUsableY &&
        medPrimera.entraEnUnaHoja &&
        altoCabecera + medPrimera.alto <= espacioHojaVacia
      ) {
        doc.addPage()
        cursorY = DIMENSIONES.MARGIN_TOP + 4
      } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
        doc.addPage()
        cursorY = DIMENSIONES.MARGIN_TOP + 4
      }
    } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
      doc.addPage()
      cursorY = DIMENSIONES.MARGIN_TOP + 4
    }

    doc.setFont(TIPOGRAFIA.FUENTE, 'bold')
    doc.setFontSize(TIPOGRAFIA.TAMANIOS.TITULO_SECCION)
    doc.setTextColor(
      RGB_COLORES.AZUL_MARINO[0],
      RGB_COLORES.AZUL_MARINO[1],
      RGB_COLORES.AZUL_MARINO[2]
    )
    doc.text(sec.titulo, DIMENSIONES.MARGIN_X, cursorY)
    cursorY += 5

    if (sec.nota) {
      doc.setFont(TIPOGRAFIA.FUENTE, 'italic')
      doc.setFontSize(TIPOGRAFIA.TAMANIOS.NOTA_SECCION)
      doc.setTextColor(
        RGB_COLORES.GRIS_MUTED[0],
        RGB_COLORES.GRIS_MUTED[1],
        RGB_COLORES.GRIS_MUTED[2]
      )
      doc.text(sec.nota, DIMENSIONES.MARGIN_X, cursorY)
      cursorY += 5
    }

    for (let i = 0; i < sec.tablas.length; i++) {
      const tabla = sec.tablas[i]
      if (i > 0) {
        if (tabla.titulo) {
          const altoTitulo = 6
          const medTabla = medirAltoTablaPdf(tabla)
          if (medTabla) {
            const altoRequerido = altoTitulo + medTabla.alto
            if (
              cursorY + altoRequerido > maxUsableY &&
              medTabla.entraEnUnaHoja &&
              altoTitulo + medTabla.alto <= espacioHojaVacia
            ) {
              doc.addPage()
              cursorY = DIMENSIONES.MARGIN_TOP + 4
            } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
              doc.addPage()
              cursorY = DIMENSIONES.MARGIN_TOP + 4
            }
          } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
            doc.addPage()
            cursorY = DIMENSIONES.MARGIN_TOP + 4
          }

          doc.setFont(TIPOGRAFIA.FUENTE, 'bold')
          doc.setFontSize(TIPOGRAFIA.TAMANIOS.TITULO_SECCION)
          doc.setTextColor(
            RGB_COLORES.AZUL_MARINO[0],
            RGB_COLORES.AZUL_MARINO[1],
            RGB_COLORES.AZUL_MARINO[2]
          )
          doc.text(tabla.titulo, DIMENSIONES.MARGIN_X, cursorY)
          cursorY += 5
        } else {
          const medTabla = medirAltoTablaPdf(tabla)
          if (medTabla) {
            if (
              cursorY + 1 + medTabla.alto > maxUsableY &&
              medTabla.entraEnUnaHoja &&
              1 + medTabla.alto <= espacioHojaVacia
            ) {
              doc.addPage()
              cursorY = DIMENSIONES.MARGIN_TOP + 4
            } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
              doc.addPage()
              cursorY = DIMENSIONES.MARGIN_TOP + 4
            }
          } else if (cursorY > DIMENSIONES.LIMITE_INICIO_SECCION_Y) {
            doc.addPage()
            cursorY = DIMENSIONES.MARGIN_TOP + 4
          }
        }
      }

      autoTable(doc, opcionesTablaPdf(doc, tabla, cursorY + 1))
      const lastY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
      cursorY = (lastY ?? cursorY) + 8
    }
  }

  // Numeración de páginas en el pie de página
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont(TIPOGRAFIA.FUENTE, 'normal')
    doc.setFontSize(TIPOGRAFIA.TAMANIOS.PIE_PAGINA)
    doc.setTextColor(
      RGB_COLORES.GRIS_MUTED[0],
      RGB_COLORES.GRIS_MUTED[1],
      RGB_COLORES.GRIS_MUTED[2]
    )
    doc.text(
      `Argentum · página ${i} de ${totalPages}`,
      DIMENSIONES.PAGE_WIDTH / 2,
      204,
      { align: 'center' }
    )
  }
}

export async function exportarInformePdf(
  pedido: PedidoDescarga,
  nombres?: Parameters<typeof resumenPedido>[1]
): Promise<void> {
  const bloquesTipos = pedido.bloques.map((b) => obtenerTipoBloque(b))
  const needsResumen = bloquesTipos.some((t) =>
    ['kpis', 'evolucion_ciclos', 'desglose_categorias'].includes(t)
  )
  const needsComp = bloquesTipos.includes('comparativa_ciclos')
  const needsProy = bloquesTipos.includes('proyeccion_cuotas')

  const p = pedido.params || pedido.filtros || {}
  const qParams: AnalisisQueryParams = {
    moneda_modo: (p.moneda_modo as MonedaModoAnalisis) || 'solo_ars',
    ciclos: p.ciclos ?? 6,
    naturaleza: (p.naturaleza as NaturalezaGastoFiltro) || 'todos',
    billetera_id: p.billetera_id,
    tarjeta_id: p.tarjeta_id,
    categoria_id: p.categoria_id,
  }

  const [resumen, comparativa, proyeccion] = await Promise.all([
    needsResumen ? analisisService.getResumen(qParams) : Promise.resolve(null),
    needsComp
      ? analisisService.getComparativaCiclos({
          ...qParams,
          ciclo_a: p.ciclo_a,
          ciclo_b: p.ciclo_b,
        })
      : Promise.resolve(null),
    needsProy
      ? analisisService.getProyeccionCompromisos({
          moneda_modo: qParams.moneda_modo,
          meses: p.meses ?? 6,
          billetera_id: qParams.billetera_id,
          tarjeta_id: qParams.tarjeta_id,
        })
      : Promise.resolve(null),
  ])

  const secciones = armarContenidoPdf(pedido, { resumen, comparativa, proyeccion })
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const hoyStr = formatFecha(new Date())

  dibujarInformePdf(doc, pedido, secciones, hoyStr, nombres)

  const fileName = nombreArchivoDescarga(pedido.titulo, 'pdf')
  doc.save(fileName)
}
