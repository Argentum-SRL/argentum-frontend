import { LayoutDashboard, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <div className={styles.root}>
      {/* Bienvenida */}
      <div>
        <h1 className={styles.title}>
          ¡Hola, {usuario?.nombre}! 👋
        </h1>
        <p className={styles.subtitle}>
          Bienvenido de nuevo a Argentum. Aquí está el resumen de tus finanzas.
        </p>
      </div>

      {/* Cards de resumen */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
              <TrendingUp size={24} />
            </div>
            <span className={styles.cardBadge}>+12.5%</span>
          </div>
          <p className={styles.cardLabel}>Patrimonio Total</p>
          <p className={styles.cardAmount}>$450.200</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
              <ArrowUpRight size={24} />
            </div>
          </div>
          <p className={styles.cardLabel}>Ingresos del Mes</p>
          <p className={styles.cardAmount}>$120.000</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>
              <ArrowDownLeft size={24} />
            </div>
          </div>
          <p className={styles.cardLabel}>Gastos del Mes</p>
          <p className={styles.cardAmount}>$85.400</p>
        </div>
      </div>

      {/* Sección vacía */}
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <LayoutDashboard size={40} />
        </div>
        <h3 className={styles.emptyTitle}>Comienza a registrar tus movimientos</h3>
        <p className={styles.emptyText}>
          Aún no tienes transacciones recientes. Vincula una billetera o agrega un gasto manualmente para ver tus estadísticas.
        </p>
        <button className={styles.emptyBtn}>
          Agregar Transacción
        </button>
      </div>
    </div>
  )
}
