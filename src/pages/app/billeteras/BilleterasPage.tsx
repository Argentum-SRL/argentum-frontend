import { Plus, CreditCard, Landmark } from 'lucide-react'
import styles from './BilleterasPage.module.css'

export default function BilleterasPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Billeteras</h1>
          <p className={styles.subtitle}>
            Gestiona tus cuentas bancarias, billeteras virtuales y efectivo.
          </p>
        </div>
        <button className={styles.newBtn}>
          <Plus size={20} />
          Nueva Billetera
        </button>
      </div>

      <div className={styles.grid}>
        {/* Placeholder Billetera 1 */}
        <div className={`${styles.walletCard} ${styles.walletCardPrimary}`}>
          <div className={styles.walletCardHeader}>
            <div className={styles.walletCardIconWrap}>
              <Landmark size={24} />
            </div>
            <p className={styles.walletCardName}>Mercado Pago</p>
          </div>
          <p className={styles.walletCardLabel}>Saldo disponible</p>
          <p className={styles.walletCardAmount}>$24.500,00</p>
          <div className={styles.walletCardGlow} />
        </div>

        {/* Placeholder Billetera 2 */}
        <div className={`${styles.walletCard} ${styles.walletCardSecondary}`}>
          <div className={styles.walletCardHeader}>
            <div className={styles.walletCardIconWrap}>
              <CreditCard size={24} />
            </div>
            <p className={styles.walletCardName}>Banco Galicia</p>
          </div>
          <p className={styles.walletCardLabel}>Saldo disponible</p>
          <p className={styles.walletCardAmount}>$182.100,00</p>
          <div className={styles.walletCardGlow} />
        </div>

        {/* Botón Agregar */}
        <button className={styles.addCard}>
          <div className={styles.addCardCircle}>
            <Plus size={32} />
          </div>
          <p className={styles.addCardText}>Agregar otra cuenta</p>
        </button>
      </div>
    </div>
  )
}
