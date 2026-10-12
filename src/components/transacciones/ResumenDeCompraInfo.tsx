import type { ResumenDeCompraResponse } from '@/types'
import { formatDDMM } from '@/hooks/useResumenDeCompra'
import styles from './ResumenDeCompraInfo.module.css'

interface ResumenDeCompraInfoProps {
  resumen: ResumenDeCompraResponse | null
  loading: boolean
  error: boolean
  proximoResumen: boolean
  onChangeProximoResumen: (value: boolean) => void
}

export default function ResumenDeCompraInfo({
  resumen,
  loading,
  error,
  proximoResumen,
  onChangeProximoResumen,
}: ResumenDeCompraInfoProps) {
  // Mientras carga
  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.texto}>Calculando el resumen…</p>
      </div>
    )
  }

  // Si falla
  if (error || !resumen) {
    return (
      <div className={styles.container}>
        <p className={styles.texto}>No pudimos calcular el resumen.</p>
      </div>
    )
  }

  const cierreStr = formatDDMM(resumen.fecha_cierre)
  const vencimientoStr = formatDDMM(resumen.fecha_vencimiento)

  return (
    <div className={styles.container}>
      {!proximoResumen ? (
        <>
          <p className={styles.texto}>
            Entra en el resumen que cierra el <strong>{cierreStr}</strong> y vence el <strong>{vencimientoStr}</strong>.
          </p>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => onChangeProximoResumen(true)}
          >
            ¿El banco la pasó al resumen siguiente? Cambiar
          </button>
        </>
      ) : (
        <>
          <p className={styles.texto}>
            La pasaste al resumen siguiente: cierra el <strong>{cierreStr}</strong> y vence el <strong>{vencimientoStr}</strong>.
          </p>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => onChangeProximoResumen(false)}
          >
            Volver al automático
          </button>
        </>
      )}
    </div>
  )
}
