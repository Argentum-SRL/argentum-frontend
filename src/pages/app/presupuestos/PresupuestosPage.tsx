import { BarChart2 } from 'lucide-react'
import styles from './PresupuestosPage.module.css'

export default function PresupuestosPage() {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <BarChart2 size={32} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>Presupuestos</h1>
      <p className={styles.sub}>Próximamente</p>
    </div>
  )
}
