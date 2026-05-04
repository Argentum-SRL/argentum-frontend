
import type { Transaccion, Billetera, Categoria } from '@/types'
import TransaccionRow from './TransaccionRow'
import { formatMonto } from '@/utils/format'

interface DayGroupProps {
  fecha: string // YYYY-MM-DD
  transacciones: Transaccion[]
  categorias: Categoria[]
  billeteras: Billetera[]
  onEdit: (id: string) => void
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

export default function DayGroup({
  fecha,
  transacciones,
  categorias,
  billeteras,
  onEdit
}: DayGroupProps) {
  if (transacciones.length === 0) return null

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

  // Usamos ARS si hay transacciones en ARS, sino USD
  const mainCurrency: 'ARS' | 'USD' = totalARS !== 0 || totalUSD === 0 ? 'ARS' : 'USD'
  const total = mainCurrency === 'ARS' ? totalARS : totalUSD

  let totalColor = '#0A0D12' // neutral
  if (hasEgresos && !hasIngresos) totalColor = '#0A0D12' // egresos only -> negro o naranja? The brief says: "suma de egresos negativa si solo hay egresos, verde si solo ingresos, gris neutro si mixto" -> Actually it says "gris neutro si mixto". Wait, for egresos, should it be black? The brief doesn't specify color for egresos, just "negativa". I'll use black for negative, green for positive, gray for mixed.
  if (!hasEgresos && hasIngresos) totalColor = '#16A34A' // solo ingresos -> verde
  if (hasEgresos && hasIngresos) totalColor = '#8E9198' // mixto -> gris neutro

  const formatTotal = (val: number, cur: 'ARS' | 'USD') => {
    const sign = val < 0 ? '-' : (val > 0 ? '+' : '')
    return `${sign}${formatMonto(Math.abs(val), cur)}`
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: '0 20px', marginBottom: 12 
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0D12', margin: 0 }}>
          {getDayLabel(fecha)}
        </h3>
        <span style={{ fontSize: 13, fontWeight: 600, color: totalColor }}>
          {formatTotal(total, mainCurrency)}
        </span>
      </div>
      
      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #EDECEA' }}>
        {transacciones.map((tx, idx) => {
          const cat = categorias.find(c => c.id === tx.categoria_id)
          const bill = billeteras.find(b => b.id === tx.billetera_id)
          return (
            <div key={tx.id} style={{ borderBottom: idx < transacciones.length - 1 ? '1px solid #F5F4F0' : 'none' }}>
              <TransaccionRow
                transaccion={tx}
                categoria={cat}
                billetera={bill}
                onEdit={onEdit}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
