import { Check } from 'lucide-react'
import styles from './StepIndicator.module.css'

interface Props {
  total: number
  current: number
}

const LABELS = ['Datos', 'Ciclo', 'Moneda', 'Billetera']

export default function StepIndicator({ total, current }: Props) {
  return (
    <div className={styles.root}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current

        const circleCls = [
          styles.circle,
          done ? styles.circleDone : active ? styles.circleActive : '',
        ]
          .filter(Boolean)
          .join(' ')

        const labelCls = [styles.label, active ? styles.labelActive : '']
          .filter(Boolean)
          .join(' ')

        return (
          <div key={step} className={styles.item}>
            <div className={styles.stepCol}>
              <div className={circleCls}>
                {done ? <Check size={13} strokeWidth={3} /> : step}
              </div>
              <span className={labelCls}>{LABELS[i]}</span>
            </div>

            {i < total - 1 && (
              <div className={[styles.connector, done ? styles.connectorDone : ''].filter(Boolean).join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
