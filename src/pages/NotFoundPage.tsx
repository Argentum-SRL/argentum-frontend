import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AtmosphericBackground, AtmosphericCard } from '@/components/ui'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const destination = (!isLoading && !isAuthenticated) ? '/login' : '/app/dashboard'

  return (
    <AtmosphericBackground role="main">
      <AtmosphericCard>
        <div className={styles.iconWrapper} aria-hidden="true">
          <AlertCircle size={32} />
        </div>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Esta página no existe</h2>
        <p className={styles.text}>
          La dirección a la que intentás acceder no se encuentra disponible, fue movida o nunca existió.
        </p>
        <div className={styles.actions}>
          <Link to={destination} className={styles.primaryButton}>
            <Home size={16} />
            <span>Volver al inicio</span>
          </Link>
          <button type="button" onClick={() => navigate(-1)} className={styles.secondaryButton}>
            <ArrowLeft size={16} />
            <span>Volver atrás</span>
          </button>
        </div>
      </AtmosphericCard>
    </AtmosphericBackground>
  )
}
