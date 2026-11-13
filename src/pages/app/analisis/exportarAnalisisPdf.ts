import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnalisisResumenResponse } from '@/services/analisis.service'
import { formatMonto } from '@/utils/format'

export function exportarAnalisisPdf(
  data: AnalisisResumenResponse,
  tituloInforme = 'Argentum — Tu análisis'
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const moneda = data.moneda_visual

  // Encabezado editorial Argentum
  doc.setFillColor(13, 32, 69)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(tituloInforme, 14, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(
    `Período: ${data.periodo_seleccionado.etiqueta}  |  Moneda: ${moneda}`,
    14,
    21
  )

  // Bloque 1: Números principales
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('1. Números principales del período', 14, 38)

  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Valor', 'Referencia']],
    body: [
      [
        'Gastos del período',
        formatMonto(data.kpis.gastos_totales, moneda),
        data.kpis.promedio_gasto_ciclo !== null && data.kpis.promedio_gasto_ciclo !== undefined
          ? `Promedio por ciclo: ${formatMonto(data.kpis.promedio_gasto_ciclo, moneda)}`
          : '—',
      ],
      [
        'Ingresos del período',
        data.kpis.ingresos_totales !== null && data.kpis.ingresos_totales !== undefined
          ? formatMonto(data.kpis.ingresos_totales, moneda)
          : '—',
        data.kpis.promedio_ingreso_ciclo !== null && data.kpis.promedio_ingreso_ciclo !== undefined
          ? `Promedio por ciclo: ${formatMonto(data.kpis.promedio_ingreso_ciclo, moneda)}`
          : '—',
      ],
      [
        'Te quedó',
        data.kpis.balance_neto !== null && data.kpis.balance_neto !== undefined
          ? formatMonto(data.kpis.balance_neto, moneda)
          : '—',
        `${data.kpis.cantidad_operaciones} movimientos de gasto evaluados`,
      ],
      [
        'Te quedó (%)',
        data.kpis.tasa_ahorro_pct !== null && data.kpis.tasa_ahorro_pct !== undefined
          ? `${data.kpis.tasa_ahorro_pct}%`
          : '—',
        'Porcentaje retenido sobre ingresos del período',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [13, 32, 69], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  })

  // Bloque 2: Serie Ciclo a Ciclo
  const finalY1 = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 85
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('2. Evolución Ciclo a Ciclo', 14, finalY1 + 10)

  autoTable(doc, {
    startY: finalY1 + 14,
    head: [['Ciclo', 'Rango', 'Ingresos', 'Gastos', 'Te quedó', 'Te quedó (%)']],
    body: data.serie_ciclos.map((c) => [
      c.etiqueta,
      c.rango_texto,
      c.ingresos !== null && c.ingresos !== undefined ? formatMonto(c.ingresos, moneda) : '—',
      formatMonto(c.gastos, moneda),
      c.balance !== null && c.balance !== undefined ? formatMonto(c.balance, moneda) : '—',
      c.tasa_ahorro_pct !== null && c.tasa_ahorro_pct !== undefined ? `${c.tasa_ahorro_pct}%` : '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [13, 32, 69], textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  })

  // Bloque 3: Desglose por Categorías
  const finalY2 = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 150
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('3. Desglose por Categorías de Gasto', 14, finalY2 + 10)

  autoTable(doc, {
    startY: finalY2 + 14,
    head: [['Categoría', 'Monto', '% del Total', 'Movimientos', 'Subcategoría Principal']],
    body: data.desglose_categorias.map((cat) => {
      const topSub = cat.subcategorias[0]
      return [
        cat.categoria_nombre,
        formatMonto(cat.monto, moneda),
        `${cat.porcentaje_del_total}%`,
        String(cat.cantidad_movimientos),
        topSub
          ? `${topSub.subcategoria_nombre} (${topSub.porcentaje_categoria}%)`
          : '-',
      ]
    }),
    theme: 'striped',
    headStyles: { fillColor: [13, 32, 69], textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    margin: { left: 14, right: 14 },
  })

  const fileSlug = tituloInforme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  doc.save(`${fileSlug || 'argentum_informe'}.pdf`)
}

