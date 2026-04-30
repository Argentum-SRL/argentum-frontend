import { Package } from 'lucide-react'
import styles from './SuscripcionesPage.module.css'

export default function SuscripcionesPage() {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <Package size={32} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>Suscripciones</h1>
      <p className={styles.sub}>Próximamente</p>
    </div>
  )
}
