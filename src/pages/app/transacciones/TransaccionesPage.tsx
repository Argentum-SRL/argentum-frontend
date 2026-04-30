import { ArrowLeftRight } from 'lucide-react'
import styles from './TransaccionesPage.module.css'

export default function TransaccionesPage() {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <ArrowLeftRight size={32} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>Transacciones</h1>
      <p className={styles.sub}>Próximamente</p>
    </div>
  )
}
