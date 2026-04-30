import { Clock } from 'lucide-react'
import styles from './MetasPage.module.css'

export default function MetasPage() {
  return (
    <div className={styles.root}>
      <div className={styles.icon}>
        <Clock size={32} strokeWidth={1.5} />
      </div>
      <h1 className={styles.title}>Metas</h1>
      <p className={styles.sub}>Próximamente</p>
    </div>
  )
}
