import { memo, useMemo } from 'react'
import { Calendar } from '@/components/ui/icons'
import type { MovimientoItem, Billetera, Categoria } from '@/types'
import MovimientoRow from './MovimientoRow'
import styles from './DayGroup.module.css'

interface DayGroupProps {
  fecha: string // YYYY-MM-DD
  movimientos: MovimientoItem[]
  categorias: Categoria[]
  billeteras: Billetera[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onOpenCuotasGroup?: (grupoId: string) => void
  hideWallet?: boolean
  modo?: 'general' | 'billetera'
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
  movimientos,
  categorias,
  billeteras,
  onEdit,
  onDelete,
  onOpenCuotasGroup,
  hideWallet = false,
  modo = 'general',
}: DayGroupProps) => {
  const dayInfo = useMemo(() => getFormattedDayInfo(fecha), [fecha])

  if (movimientos.length === 0) return null

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
        {movimientos.map((mov) => {
          const catId = mov.transaccion?.categoria_id
          const cat = catId ? categorias.find(c => c.id === catId) : undefined
          const billId = mov.billetera_id || mov.transaccion?.billetera_id
          const bill = billId ? billeteras.find(b => b.id === billId) : undefined
          return (
            <MovimientoRow
              key={mov.id}
              movimiento={mov}
              categoria={cat}
              billetera={bill}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenCuotasGroup={onOpenCuotasGroup}
              hideWallet={hideWallet}
              modo={modo}
            />
          )
        })}
      </div>
    </div>
  )
})

DayGroup.displayName = 'DayGroup'

export default DayGroup
