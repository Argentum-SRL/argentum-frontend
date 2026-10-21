import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  User,
  Coins,
  Shield,
  Bell,
  AlertTriangle,
} from '@/components/ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { sileo } from 'sileo'
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
import SegmentedControl from '@/components/ui/SegmentedControl'
import { EditModals } from './components/EditModals'

import styles from './PerfilPage.module.css'

type TabType = 'perfil' | 'finanzas' | 'seguridad' | 'notificaciones' | 'peligro'

export default function PerfilPage() {
  const { usuario, updateUsuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
  const [activeModal, setActiveModal] = useState<'datos' | 'email' | null>(null)

  const handleVerificarEmailActual = async () => {
    if (!usuario?.email) return
    try {
      await authService.enviarCodigoEmail(usuario.email)
      sileo.success({ title: 'Te enviamos un código de verificación a tu correo.' })
      navigate('/auth/verificar-email', { state: { email: usuario.email, from: '/app/perfil' } })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'Error al enviar el código de verificación.') })
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

      {/* ── Segmented Tab Navigation Bar (Cápsula Oficial) ──── */}
      <div className={styles.controlsRow}>
        <SegmentedControl
          options={[
            { value: 'perfil', label: 'General', icon: <User size={15} /> },
            { value: 'finanzas', label: 'Finanzas & Moneda', icon: <Coins size={15} /> },
            { value: 'seguridad', label: 'Seguridad', icon: <Shield size={15} /> },
            { value: 'notificaciones', label: 'Notificaciones', icon: <Bell size={15} /> },
          ]}
          value={activeTab === 'peligro' ? '' : activeTab}
          onChange={(val) => handleTabChange(val as TabType)}
          ariaLabel="Secciones de perfil"
          layout="inline"
        />

        <div className={styles.dangerTabWrapper}>
          <SegmentedControl
            options={[
              { value: 'peligro', label: 'Zona de Peligro', icon: <AlertTriangle size={15} /> },
            ]}
            value={activeTab === 'peligro' ? 'peligro' : ''}
            onChange={() => handleTabChange('peligro')}
            ariaLabel="Zona de peligro de perfil"
            layout="inline"
          />
        </div>
      </div>

      {/* ── Tab Views Content ─────────────────────────────────────── */}
      <main className={styles.mainContent}>
        {activeTab === 'perfil' && (
          <TabGeneral
            usuario={usuario}
            onEditDatos={() => setActiveModal('datos')}
            onEditEmail={() => setActiveModal('email')}
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
