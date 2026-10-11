import {
  ShieldCheck,
  RefreshCw,
  Download,
  Moon,
  Sun,
  AlertTriangle,
} from '@/components/ui/icons'
import { Layout, Database } from 'lucide-react'
import styles from './DisenoHeader.module.css'

interface Props {
  isDarkMode: boolean
  onToggleTheme: () => void
  onReaudit: () => void
  isReauditing: boolean
  onExport: () => void
  syncStatus?: 'synced' | 'saving' | 'conflict' | 'offline_local'
  syncSource?: 'backend' | 'local'
}

export default function DisenoHeader({
  isDarkMode,
  onToggleTheme,
  onReaudit,
  isReauditing,
  onExport,
  syncStatus = 'synced',
  syncSource = 'backend',
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.breadcrumb}>
          <span>Administración</span>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>Catálogo y Auditoría de Diseño</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {syncStatus === 'conflict' && (
            <div className={`${styles.syncBadge} ${styles.syncConflict}`}>
              <AlertTriangle size={12} />
              <span>Conflicto Concurrencia (409)</span>
            </div>
          )}

          {syncStatus === 'saving' && (
            <div className={`${styles.syncBadge} ${styles.syncSaving}`}>
              <RefreshCw size={12} className={styles.spinIcon} />
              <span>Guardando en Servidor...</span>
            </div>
          )}

          {syncStatus === 'synced' && syncSource === 'backend' && (
            <div className={`${styles.syncBadge} ${styles.syncSynced}`} title="Decisiones sincronizadas con backend">
              <Database size={12} />
              <span>Backend Fuente de Verdad</span>
            </div>
          )}

          {syncSource === 'local' && syncStatus !== 'saving' && syncStatus !== 'conflict' && (
            <div className={`${styles.syncBadge} ${styles.syncLocal}`} title="Almacenamiento local activo">
              <Database size={12} />
              <span>Modo Local (Fallback)</span>
            </div>
          )}

          <div className={styles.authBadge}>
            <ShieldCheck size={14} strokeWidth={2.2} />
            <span>Acceso Admin Verificado</span>
          </div>
        </div>
      </div>

      <div className={styles.headerMain}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIcon}>
            <Layout size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className={styles.title}>Estudio de Diseño de Argentum</h1>
            <p className={styles.subtitle}>
              Mirá cómo se ven hoy los componentes en la app, comparalos visualmente y elegí cuál querés que sea el diseño oficial definitivo.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.themeToggleBtn}
            onClick={onToggleTheme}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={onExport}
            title="Exportar especificación completa en JSON"
          >
            <Download size={15} />
            <span>Exportar JSON</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
            onClick={onReaudit}
            disabled={isReauditing}
            title="Re-ejecutar análisis de código estático"
          >
            <RefreshCw size={15} className={isReauditing ? styles.spinIcon : ''} />
            <span>{isReauditing ? 'Auditando...' : 'Re-auditar Código'}</span>
          </button>
        </div>
      </div>

      {/* Banner de Guía Rápida Fácil */}
      <div className={styles.guideBanner}>
        <div className={styles.guideIcon}>💡</div>
        <div className={styles.guideContent}>
          <span className={styles.guideTitle}>¿Cómo usar este laboratorio en 3 pasos simples?</span>
          <p className={styles.guideSteps}>
            <strong>1.</strong> Elegí una categoría en el menú de la izquierda &nbsp;•&nbsp; 
            <strong>2.</strong> Mirá y probá las opciones en vivo &nbsp;•&nbsp; 
            <strong>3.</strong> Tocá <strong>"Elegir este diseño"</strong> en el que más te guste para unificar la app. ¡Eso es todo!
          </p>
        </div>
      </div>
    </header>
  )
}
