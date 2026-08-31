import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Transaccion } from '@/types'

interface TransaccionConRelaciones extends Transaccion {
  billetera?: { nombre?: string } | null
  categoria?: { nombre?: string } | null
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fmtFecha(iso: string): string {
  if (!iso) return '—'
  const [, m, d] = iso.split('T')[0].split('-').map(Number)
  return `${d} ${MESES[m - 1]}`
}

function fmtFechaConAnio(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

function formatMonto(n: number): string {
  return Math.abs(n).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

export function exportarTransaccionesPDF(params: {
  transacciones: Transaccion[]
  resumen: { totalIngresos: number; totalEgresos: number; balance: number }
  filters: { fecha_desde?: string; fecha_hasta?: string }
  usuario: { nombre: string | null; apellido: string | null } | null
}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // --- LOGO LUNA (SVG a canvas via jsPDF) ---
  doc.setFillColor(138, 149, 168)
  doc.circle(21, 17, 4.8, 'F')
  doc.setFillColor(255, 255, 255)
  doc.circle(24.6, 17, 3.8, 'F')

  // --- WORDMARK ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(13, 32, 69)
  doc.text('Argentum', 30, 19)

  // --- NOMBRE DEL USUARIO ---
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(82, 86, 95)
  const nombreUsuario = params.usuario
    ? `${params.usuario.nombre ?? ''} ${params.usuario.apellido ?? ''}`.trim()
    : ''
  doc.text(nombreUsuario, 194, 19, { align: 'right' })

  // --- LÍNEA DIVISORIA ---
  doc.setDrawColor(138, 149, 168)
  doc.setLineWidth(0.3)
  doc.line(16, 23, 194, 23)

  // --- TÍTULO DEL EXTRACTO ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(82, 86, 95)
  doc.text('EXTRACTO DE MOVIMIENTOS', 16, 30)

  // --- PERÍODO ---
  let labelPeriodo = 'Período completo'
  if (params.filters.fecha_desde && params.filters.fecha_hasta) {
    const y1 = params.filters.fecha_desde.split('-')[0]
    const y2 = params.filters.fecha_hasta.split('-')[0]
    if (y1 === y2) {
      labelPeriodo = `${fmtFecha(params.filters.fecha_desde)} — ${fmtFecha(params.filters.fecha_hasta)} · ${y1}`
    } else {
      labelPeriodo = `${fmtFechaConAnio(params.filters.fecha_desde)} — ${fmtFechaConAnio(params.filters.fecha_hasta)}`
    }
  } else if (params.filters.fecha_desde) {
    labelPeriodo = `Desde ${fmtFechaConAnio(params.filters.fecha_desde)}`
  } else if (params.filters.fecha_hasta) {
    labelPeriodo = `Hasta ${fmtFechaConAnio(params.filters.fecha_hasta)}`
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(13, 32, 69)
  doc.text(labelPeriodo, 16, 37)

  // --- RECUADRO DE RESUMEN ---
  doc.setFillColor(237, 236, 234)
  doc.roundedRect(16, 42, 178, 20, 2, 2, 'F')

  // Fila 1 Labels
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(82, 86, 95)
  doc.text('INGRESOS', 24, 49)
  doc.text('EGRESOS', 88, 49)
  doc.text('BALANCE', 152, 49)

  // Fila 2 Valores
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)

  // Ingresos
  doc.setTextColor(26, 61, 40)
  doc.text(`+$ ${formatMonto(params.resumen.totalIngresos)}`, 24, 57)

  // Egresos
  doc.setTextColor(180, 40, 40)
  doc.text(`-$ ${formatMonto(params.resumen.totalEgresos)}`, 88, 57)

  // Balance
  const bal = params.resumen.balance
  if (bal >= 0) {
    doc.setTextColor(26, 61, 40)
    doc.text(`+$ ${formatMonto(bal)}`, 152, 57)
  } else {
    doc.setTextColor(180, 40, 40)
    doc.text(`-$ ${formatMonto(Math.abs(bal))}`, 152, 57)
  }

  // --- TABLA DE MOVIMIENTOS ---
  const filas = params.transacciones.map(t => {
    const tx = t as TransaccionConRelaciones
    return {
      fecha: fmtFecha(tx.fecha),
      desc: tx.descripcion || tx.subcategoria?.nombre || '—',
      cat: tx.subcategoria?.nombre
           ? tx.categoria?.nombre ?? '—'
           : tx.categoria?.nombre ?? '—',
      bill: tx.billetera?.nombre ?? '—',
      monto: (tx.tipo === 'ingreso' ? '+' : '-') + '$ ' +
             formatMonto(Number(tx.monto))
    }
  })

  autoTable(doc, {
    startY: 68,
    margin: { left: 16, right: 16 },
    head: [['Fecha', 'Descripción', 'Categoría', 'Billetera', 'Monto']],
    body: filas.map(f => [f.fecha, f.desc, f.cat, f.bill, f.monto]),
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 60 },
      2: { cellWidth: 42 },
      3: { cellWidth: 30 },
      4: { cellWidth: 24, halign: 'right' }
    },
    headStyles: {
      fillColor: [13, 32, 69],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [10, 13, 18],
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }
    },
    alternateRowStyles: {
      fillColor: [245, 244, 240]
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const val = data.cell.raw as string
        if (val.startsWith('+')) {
          data.cell.styles.textColor = [26, 61, 40]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [180, 40, 40]
        }
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      const pageNum = data.pageNumber
      const footerY = 285

      doc.setDrawColor(138, 149, 168)
      doc.setLineWidth(0.3)
      doc.line(16, footerY - 3, 194, footerY - 3)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(138, 149, 168)
      
      const hoy = new Date()
      const fechaGen = `Generado el ${hoy.getDate()} ${
        MESES[hoy.getMonth()]} ${hoy.getFullYear()}`
      doc.text(fechaGen + ' · miargentum.com', 16, footerY)
      doc.text(`${pageNum} / ${pageCount}`, 194, footerY, { align: 'right' })
    }
  })

  const desde = params.filters.fecha_desde ?? 'inicio'
  const hasta = params.filters.fecha_hasta ?? 'fin'
  doc.save(`argentum-extracto-${desde}-${hasta}.pdf`)
}
