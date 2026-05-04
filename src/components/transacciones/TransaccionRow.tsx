
import { AlertCircle, CreditCard, RefreshCw } from 'lucide-react'
import type { Transaccion, Billetera, Categoria } from '@/types'
import { CategoriaIcon } from '@/components/ui/CategoriaIcon'
import { formatMonto } from '@/utils/format'

interface TransaccionRowProps {
  transaccion: Transaccion
  categoria?: Categoria
  billetera?: Billetera
  onEdit: (id: string) => void
}

export default function TransaccionRow({
  transaccion,
  categoria,
  billetera,
  onEdit
}: TransaccionRowProps) {
  const isIngreso = transaccion.tipo === 'ingreso'
  const isPendiente = transaccion.estado_verificacion === 'pendiente'
  const montoColor = isIngreso ? '#16A34A' : 'var(--text)'
  const rowBg = isPendiente ? 'rgba(245, 158, 11, 0.05)' : 'transparent'

  const formatHora = (fechaStr: string) => {
    // Si viene hora, la mostramos, sino evitamos "00:00" si no corresponde
    if (!fechaStr.includes('T')) return ''
    const d = new Date(fechaStr)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  const hora = formatHora(transaccion.fecha_creacion)
  
  let metodoTxt: string = transaccion.metodo_pago
  if (metodoTxt === 'transferencia') metodoTxt = 'Transferencia'
  if (metodoTxt === 'debito') metodoTxt = 'Débito'
  if (metodoTxt === 'credito') metodoTxt = 'Crédito'
  if (metodoTxt === 'efectivo') metodoTxt = 'Efectivo'

  const metaText = [
    categoria?.nombre || 'General',
    metodoTxt,
    hora
  ].filter(Boolean).join(' · ')

  return (
    <div 
      onClick={() => onEdit(transaccion.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 20px',
        background: rowBg,
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid var(--border)'
      }}
      onMouseEnter={(e) => {
        if (!isPendiente) e.currentTarget.style.background = 'var(--surface-alt)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = rowBg
      }}
    >
      <CategoriaIcon nombre={categoria?.nombre} size={40} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {transaccion.descripcion || 'Sin descripción'}
          </span>
          
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {isPendiente && (
              <span style={{
                background: '#FEF3C7', color: '#D97706', padding: '2px 6px',
                borderRadius: 4, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3
              }}>
                <AlertCircle size={8} strokeWidth={3} /> Pendiente IA
              </span>
            )}
            {transaccion.es_cuota_hija && (
              <span style={{
                background: '#EEF2FF', color: '#4F46E5', padding: '2px 6px',
                borderRadius: 4, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3
              }}>
                <CreditCard size={8} strokeWidth={3} /> Cuota
              </span>
            )}
            {transaccion.es_recurrente && (
              <span style={{
                background: '#F0FDF4', color: '#16A34A', padding: '2px 6px',
                borderRadius: 4, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3
              }}>
                <RefreshCw size={8} strokeWidth={3} /> Recurrente
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{metaText}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: montoColor }}>
          {isIngreso ? '+' : '-'}{formatMonto(transaccion.monto, transaccion.moneda)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
          {billetera?.nombre || 'Billetera eliminada'}
        </span>
      </div>
    </div>
  )
}
