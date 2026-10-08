import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LunarLoading,
  AtmosphericBackground,
  AtmosphericMoonIcon,
} from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Check,
  Sparkles,
} from '@/components/ui/icons'
import { IconPlayground } from './components/IconPlayground'
import styles from './AnimacionPreviewPage.module.css'

const PREVIEW_PHRASES = [
  'Rotación uniforme (Ciclo)',
  'Cada ciclo cuenta.',
  'Tu plata en orden, tu mes en equilibrio.',
  'Nuevo ciclo, nuevo balance.',
  'El dinero fluye, el control permanece.',
  'Saber exactamente hacia dónde va tu plata.',
  'Tu plata también tiene fases: ordenar, ahorrar y crecer.',
  'Un buen balance se construye fase por fase.',
  'Claridad total sobre cada uno de tus gastos.',
  'Control hoy, tranquilidad todo el mes.',
  'El ciclo continúa, tu control también.',
]

export default function AnimacionPreviewPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [viewMode, setViewMode] = useState<'icons' | 'hero' | 'ambient'>('icons')
  const [selectedPhrase, setSelectedPhrase] = useState(PREVIEW_PHRASES[0])
  const [showControls, setShowControls] = useState(true)
  const [simulatedReducedMotion, setSimulatedReducedMotion] = useState(false)

  // Escuchar tecla Escape para alternar controles (modo inmersivo limpio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowControls((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isAutoRotate = selectedPhrase === PREVIEW_PHRASES[0]

  return (
    <div
      className={`${styles.pageRoot} ${viewMode === 'icons' ? styles.scrollableRoot : ''}`}
      data-reduced-motion={simulatedReducedMotion ? 'true' : undefined}
    >
      {/* ── Vista 0: Sistema de Iconografía Animada (Playground & Auditoría Visual) ── */}
      {viewMode === 'icons' && <IconPlayground />}

      {/* ── Vista 1: Hero Fullscreen Loading Experience ────────────────────── */}
      {viewMode === 'hero' && (
        <LunarLoading
          text={isAutoRotate ? undefined : selectedPhrase}
          autoRotate={isAutoRotate}
          fullScreen={true}
        />
      )}

      {/* ── Vista 2: Ambient Background (Demostración detrás de modales/módulos) */}
      {viewMode === 'ambient' && (
        <AtmosphericBackground
          fullScreen={true}
          centered={true}
          intensity="ambient"
        >
          <div className={styles.ambientDemoCard}>
            <AtmosphericMoonIcon size={42} />
            <h2 className={styles.ambientDemoTitle}>Mareas de Luz · Filigrana Argentum</h2>
            <p className={styles.ambientDemoText}>
              Claroscuro volumétrico con mareas armónicas de liquidez y luz (curvas cáusticas de Bézier)
              junto al sello de filigrana de plata 925. Cero planetarios, cero diagramas orbitales y
              cero esferas detrás del contenido. Luz de eclipse en Modo Claro (cobre, ámbar y marfil) y
              Noche Lunar en Modo Oscuro (plata líquida y obsidiana).
            </p>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => setViewMode('hero')}
            >
              <Check size={16} />
              <span>Ver pantalla de carga fullscreen (6s)</span>
            </button>
          </div>
        </AtmosphericBackground>
      )}

      {/* ── Botón flotante para restaurar controles si fueron ocultados ───── */}
      {!showControls && (
        <button
          type="button"
          className={styles.reopenControlsBtn}
          onClick={() => setShowControls(true)}
          title="Abrir panel de control (o presionar Escape)"
        >
          <Eye size={15} />
          <span>Controles de Preview</span>
        </button>
      )}

      {/* ── Floating Control Dock para Administradores ─────────────────────── */}
      {showControls && (
        <aside className={styles.controlDock} aria-label="Controles de evaluación">
          <div className={styles.dockHeader}>
            <div className={styles.dockTitleWrap}>
              <span className={styles.adminBadge}>Admin Preview</span>
              <span className={styles.dockTitle}>
                {viewMode === 'icons'
                  ? 'Iconografía Animada · Calidad Animate UI'
                  : 'Mareas de Luz & Filigrana 925'}
              </span>
            </div>

            <div className={styles.dockActions}>
              <button
                type="button"
                className={styles.minimizeBtn}
                onClick={() => setShowControls(false)}
                title="Ocultar para ver la pantalla 100% limpia (Esc)"
              >
                <EyeOff size={13} />
                <span>Ocultar (Esc)</span>
              </button>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => navigate('/admin')}
                title="Volver al panel de administración"
              >
                <ArrowLeft size={13} />
                <span>Panel</span>
              </button>
            </div>
          </div>

          <div className={styles.dockRow}>
            {/* Selector de modo */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.tabBtn} ${viewMode === 'icons' ? styles.tabBtnActive : ''}`}
                onClick={() => setViewMode('icons')}
              >
                <Sparkles size={13} />
                <span>Iconos Animados</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${viewMode === 'hero' ? styles.tabBtnActive : ''}`}
                onClick={() => setViewMode('hero')}
              >
                <Shield size={13} />
                <span>Hero Loader</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${viewMode === 'ambient' ? styles.tabBtnActive : ''}`}
                onClick={() => setViewMode('ambient')}
              >
                <AtmosphericMoonIcon size={14} />
                <span>Fondo Ambiental</span>
              </button>
            </div>

            {/* Alternar Tema Light / Dark */}
            <button
              type="button"
              className={styles.toggleThemeBtn}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </button>

            {/* Alternar simulación Reduced Motion */}
            <button
              type="button"
              className={`${styles.toggleThemeBtn} ${simulatedReducedMotion ? styles.activeMotionBtn : ''}`}
              onClick={() => setSimulatedReducedMotion((prev) => !prev)}
              title="Simular preferencia de movimiento reducido"
            >
              <span>{simulatedReducedMotion ? 'Motion: Off' : 'Motion: Normal'}</span>
            </button>

            {/* Selector de microcopy contextual en modo Hero */}
            {viewMode === 'hero' && (
              <select
                className={styles.selectInput}
                value={selectedPhrase}
                onChange={(e) => setSelectedPhrase(e.target.value)}
                aria-label="Seleccionar microcopy contextual"
              >
                {PREVIEW_PHRASES.map((phrase) => (
                  <option key={phrase} value={phrase}>
                    {phrase}
                  </option>
                ))}
              </select>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
