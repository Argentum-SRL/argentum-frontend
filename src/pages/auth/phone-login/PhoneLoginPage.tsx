import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout/AuthLayout'
import WppChatMockup from '@/components/mock/WppChatMockup/WppChatMockup'
import styles from './PhoneLoginPage.module.css'

export default function PhoneLoginPage() {
  return (
    <AuthLayout title="Ingreso con teléfono" leftPanel={<WppChatMockup />}>
      <div className={styles.disabledContainer}>
        <div className={styles.iconWrap}>
          <ShieldAlert size={36} className={styles.noticeIcon} />
        </div>

        <h2 className={styles.disabledTitle}>Acceso por WhatsApp no disponible</h2>

        <p className={styles.disabledDesc}>
          Por restricciones técnicas en las políticas de entrega y ventanas de mensajería externa de Meta (WhatsApp),
          el inicio de sesión directo por número de teléfono se encuentra deshabilitado.
        </p>

        <p className={styles.disabledSubdesc}>
          Para acceder a tu cuenta de forma rápida y segura, por favor ingresá con tu correo electrónico y contraseña.
          Una vez iniciada la sesión, podés vincular tu WhatsApp directamente desde la sección Perfil.
        </p>

        <Link
          to="/login"
          className={styles.submitBtn}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>Ingresar con mail y contraseña</span>
          <ArrowRight size={18} />
        </Link>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>o</span>
          <div className={styles.dividerLine} />
        </div>

        <p className={styles.footer}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className={styles.footerLink}>
            Registrate con email
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
