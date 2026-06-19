import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const destination = (!isLoading && !isAuthenticated) ? '/login' : '/app/dashboard'

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.text}>Esta página no existe</p>
      <Link to={destination} className={styles.button}>
        Volver al inicio
      </Link>
    </div>
  )
}
