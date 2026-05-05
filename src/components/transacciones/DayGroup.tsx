import { memo, useMemo } from 'react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import TransaccionRow from './TransaccionRow'
import { formatMonto } from '@/utils/format'
import styles from './DayGroup.module.css'

interface DayGroupProps {
  fecha: string // YYYY-MM-DD
  transacciones: Transaccion[]
  categorias: Categoria[]
  billeteras: Billetera[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

function getDayLabel(fechaStr: string): string {
  if (!fechaStr) return ''
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  if (fechaStr === todayStr) return 'Hoy'
  if (fechaStr === yesterdayStr) return 'Ayer'

  const [y, m, d] = fechaStr.split('-').map(Number)
  if (!y || !m || !d) return fechaStr
  
  return `${d} de ${MESES[m - 1]}`
}

const DayGroup = memo(({
  fecha,
  transacciones,
  categorias,
  billeteras,
  onEdit,
  onDelete,
}: DayGroupProps) => {
  const dayLabel = useMemo(() => getDayLabel(fecha), [fecha])

  const { total, mainCurrency, totalColor } = useMemo(() => {
    let totalARS = 0
    let totalUSD = 0
    let hasIngresos = false
    let hasEgresos = false

    transacciones.forEach(tx => {
      const isIngreso = tx.tipo === 'ingreso'
      if (isIngreso) hasIngresos = true
      if (!isIngreso) hasEgresos = true
      
      const rawMonto = Number(tx.monto) || 0
      const amount = isIngreso ? rawMonto : -rawMonto
      if (tx.moneda === 'ARS') totalARS += amount
      else totalUSD += amount
    })

    const mainCurr: 'ARS' | 'USD' = totalARS !== 0 || totalUSD === 0 ? 'ARS' : 'USD'
    const tot = mainCurr === 'ARS' ? totalARS : totalUSD

    let color = 'var(--text)'
    if (hasEgresos && !hasIngresos) color = 'var(--text)'
    if (!hasEgresos && hasIngresos) color = '#16A34A'
    if (hasEgresos && hasIngresos) color = 'var(--text-2)'

    return { total: tot, mainCurrency: mainCurr, totalColor: color }
  }, [transacciones])

  const totalClass = useMemo(() => {
    if (totalColor === '#16A34A') return styles.totalPos
    if (totalColor === 'var(--text-2)') return styles.totalMixed
    return styles.totalText
  }, [totalColor])

  const formatTotal = (val: number, cur: 'ARS' | 'USD') => {
    const sign = val < 0 ? '-' : (val > 0 ? '+' : '')
    return `${sign}${formatMonto(Math.abs(val), cur)}`
  }

  if (transacciones.length === 0) return null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {dayLabel}
        </h3>
        <span className={`${styles.total} ${totalClass}`}>
          {formatTotal(total, mainCurrency)}
        </span>
      </div>
      
      <div className={styles.list}>
        {transacciones.map((tx, idx) => {
          const cat = categorias.find(c => c.id === tx.categoria_id)
          const bill = billeteras.find(b => b.id === tx.billetera_id)
          return (
            <div 
              key={tx.id} 
              className={idx < transacciones.length - 1 ? styles.rowWrapperBorder : styles.rowWrapper}
            >
              <TransaccionRow
                transaccion={tx}
                categoria={cat}
                billetera={bill}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})

DayGroup.displayName = 'DayGroup'

export default DayGroup
