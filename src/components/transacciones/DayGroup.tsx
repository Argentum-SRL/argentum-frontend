import { memo, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import TransaccionRow from './TransaccionRow'
import styles from './DayGroup.module.css'

interface DayGroupProps {
  fecha: string // YYYY-MM-DD
  transacciones: Transaccion[]
  categorias: Categoria[]
  billeteras: Billetera[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

function getFormattedDayInfo(fechaStr: string) {
  if (!fechaStr) return { title: '', subtitle: '', isToday: false, isYesterday: false }
  
  const [y, m, d] = fechaStr.split('-').map(Number)
  if (!y || !m || !d) return { title: fechaStr, subtitle: '', isToday: false, isYesterday: false }

  const targetDate = new Date(y, m - 1, d)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  const isToday = fechaStr === todayStr
  const isYesterday = fechaStr === yesterdayStr
  const isDifferentYear = y !== today.getFullYear()
  
  const diaSemana = DIAS_SEMANA[targetDate.getDay()]
  const mesNombre = MESES[m - 1]
  const yearSuffix = isDifferentYear ? `, ${y}` : ''

  if (isToday) {
    return {
      title: 'Hoy',
      subtitle: `${diaSemana}, ${d} de ${mesNombre}${yearSuffix}`,
      isToday: true,
      isYesterday: false
    }
  }

  if (isYesterday) {
    return {
      title: 'Ayer',
      subtitle: `${diaSemana}, ${d} de ${mesNombre}${yearSuffix}`,
      isToday: false,
      isYesterday: true
    }
  }

  return {
    title: `${diaSemana}, ${d} de ${mesNombre}${yearSuffix}`,
    subtitle: '',
    isToday: false,
    isYesterday: false
  }
}

const DayGroup = memo(({
  fecha,
  transacciones,
  categorias,
  billeteras,
  onEdit,
  onDelete,
}: DayGroupProps) => {
  const dayInfo = useMemo(() => getFormattedDayInfo(fecha), [fecha])

  if (transacciones.length === 0) return null

  return (
    <div className={styles.dayGroupWrapper}>
      {/* ── Day Header ─────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <div className={styles.titleContainer}>
            <Calendar size={14} className={styles.calendarIcon} />
            <h3 className={styles.title}>{dayInfo.title}</h3>
          </div>
          {dayInfo.subtitle && (
            <span className={styles.subtitle}>{dayInfo.subtitle}</span>
          )}
        </div>
      </div>
      
      {/* ── Group Card List ────────────────────────────────────────────── */}
      <div className={styles.cardContainer}>
        {transacciones.map((tx) => {
          const cat = categorias.find(c => c.id === tx.categoria_id)
          const bill = billeteras.find(b => b.id === tx.billetera_id)
          return (
            <TransaccionRow
              key={tx.id}
              transaccion={tx}
              categoria={cat}
              billetera={bill}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </div>
  )
})

DayGroup.displayName = 'DayGroup'

export default DayGroup
