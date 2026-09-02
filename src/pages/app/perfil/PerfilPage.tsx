import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User,
  Coins,
  Shield,
  Bell,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import * as authService from '@/services/auth.service'
import usuarioService from '@/services/usuario.service'
import { getErrorMessage } from '@/utils/errorMessages'
import type { MetodosLogin } from '@/types'
import FotoCropModal from '@/components/perfil/FotoCropModal'

import { ProfileHero } from './components/ProfileHero'
import { TabGeneral } from './components/TabGeneral'
import { TabFinanzas } from './components/TabFinanzas'
import { TabSeguridad } from './components/TabSeguridad'
import { TabNotificaciones } from './components/TabNotificaciones'
import { DangerZone } from './components/DangerZone'
import { EditModals } from './components/EditModals'

import styles from './PerfilPage.module.css'

type TabType = 'perfil' | 'finanzas' | 'seguridad' | 'notificaciones' | 'peligro'

export default function PerfilPage() {
  const { usuario, updateUsuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  // ── 1. Tab Routing Sync ──────────────────────────────────────────────────
  const tabParam = new URLSearchParams(location.search).get('tab') as TabType | null
  const validTabs: TabType[] = ['perfil', 'finanzas', 'seguridad', 'notificaciones', 'peligro']
  const activeTab: TabType = validTabs.includes(tabParam as TabType) ? (tabParam as TabType) : 'perfil'

  const handleTabChange = (tab: TabType) => {
    navigate(`/app/perfil?tab=${tab}`, { replace: true })
  }

  // ── 2. Login Methods Fetching ────────────────────────────────────────────
  const [metodosLogin, setMetodosLogin] = useState<MetodosLogin | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchMetodos = async () => {
      try {
        const data = await usuarioService.getMetodosLogin(controller.signal)
        if (!controller.signal.aborted) setMetodosLogin(data)
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) return
        console.error('Error fetching metodos login:', err)
      }
    }
    fetchMetodos()
    return () => controller.abort()
  }, [usuario])

  // ── 3. Modals Management ─────────────────────────────────────────────────
  const [fotoCropOpen, setFotoCropOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'datos' | 'email' | 'telefono' | null>(null)

  const handleVerificarEmailActual = async () => {
    if (!usuario?.email) return
    try {
      const res = await authService.enviarCodigoEmail(usuario.email)
      if ((res as { verificado: boolean }).verificado) {
        if (usuario) updateUsuario({ ...usuario, email_verificado: true })
        showToast('Email verificado correctamente.', 'success')
      } else {
        navigate('/auth/verificar-email', { state: { email: usuario.email } })
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'Error al enviar el código de verificación.'), 'error')
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Page Header (Idéntico a Transacciones y Presupuestos) ────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1>Perfil</h1>
          <p className={styles.subtitle}>Gestioná tu información personal, finanzas, seguridad y alertas</p>
        </div>
      </div>

      {/* ── Master Profile Hero Card ──────────────────────────────── */}
      <ProfileHero
        usuario={usuario}
        updateUsuario={updateUsuario}
        onOpenCrop={() => setFotoCropOpen(true)}
      />

      {/* ── Segmented Tab Navigation Bar (Estilo Presupuestos) ──── */}
      <div className={styles.controlsRow}>
        <div className={styles.tabs} role="tablist" aria-label="Secciones de perfil">
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'perfil' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('perfil')}
          >
            <User size={15} />
            <span>General</span>
          </button>

          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'finanzas' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('finanzas')}
          >
            <Coins size={15} />
            <span>Finanzas & Moneda</span>
          </button>

          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'seguridad' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('seguridad')}
          >
            <Shield size={15} />
            <span>Seguridad</span>
          </button>

          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'notificaciones' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('notificaciones')}
          >
            <Bell size={15} />
            <span>Notificaciones</span>
          </button>
        </div>

        <div className={styles.dangerTabWrapper}>
          <button
            type="button"
            className={`${styles.tab} ${styles.tabDanger} ${
              activeTab === 'peligro' ? styles.tabDangerActive : ''
            }`}
            onClick={() => handleTabChange('peligro')}
          >
            <AlertTriangle size={15} />
            <span>Zona de Peligro</span>
          </button>
        </div>
      </div>

      {/* ── Tab Views Content ─────────────────────────────────────── */}
      <main className={styles.mainContent}>
        {activeTab === 'perfil' && (
          <TabGeneral
            usuario={usuario}
            onEditDatos={() => setActiveModal('datos')}
            onEditEmail={() => setActiveModal('email')}
            onEditTelefono={() => setActiveModal('telefono')}
            onVerificarEmail={handleVerificarEmailActual}
          />
        )}

        {activeTab === 'finanzas' && (
          <TabFinanzas
            usuario={usuario}
            updateUsuario={updateUsuario}
          />
        )}

        {activeTab === 'seguridad' && (
          <TabSeguridad
            usuario={usuario}
            metodosLogin={metodosLogin}
            updateUsuario={updateUsuario}
            onEditEmail={() => setActiveModal('email')}
            onEditTelefono={() => setActiveModal('telefono')}
            onVerificarEmail={handleVerificarEmailActual}
          />
        )}

        {activeTab === 'notificaciones' && (
          <TabNotificaciones />
        )}

        {activeTab === 'peligro' && (
          <DangerZone />
        )}
      </main>

      {/* ── Unified Edit Modals ────────────────────────────────────── */}
      <EditModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        usuario={usuario}
        updateUsuario={updateUsuario}
      />

      {/* ── Photo Crop Modal ──────────────────────────────────────── */}
      <FotoCropModal
        open={fotoCropOpen}
        onClose={() => setFotoCropOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}
