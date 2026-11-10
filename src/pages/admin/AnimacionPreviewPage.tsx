import { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerSystemBarSurface } from '@/utils/systemTheme'
import {
  LunarLoading,
  AtmosphericBackground,
  AtmosphericMoonIcon,
  LunarLoader,
  Button,
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
  Play,
  Pause,
  RotateCcw,
} from '@/components/ui/icons'
import type { ConstellationPhase } from '@/components/ui/AtmosphericBackground/constellations.config'
import { IconPlayground } from './components/IconPlayground'
import SegmentedControl from '@/components/ui/SegmentedControl'
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

  const [viewMode, setViewMode] = useState<'icons' | 'hero' | 'ambient' | 'modular'>('icons')
  const [selectedPhrase, setSelectedPhrase] = useState(PREVIEW_PHRASES[0])
  const [showControls, setShowControls] = useState(true)
  const [simulatedReducedMotion, setSimulatedReducedMotion] = useState(false)
  const [demoBtnLoading, setDemoBtnLoading] = useState(true)

  // Estados de prueba para el Sistema de Constelaciones (Fondo Ambiental)
  const [ambientIntensity, setAmbientIntensity] = useState<'ambient' | 'hero'>('ambient')
  const [constellationSelect, setConstellationSelect] = useState<'both' | 'capricorn' | 'leo'>('both')
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1)
  const [starDensity, setStarDensity] = useState<'low' | 'medium' | 'high'>('medium')
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [resetKey, setResetKey] = useState<number>(0)
  const [cycleInfo, setCycleInfo] = useState<{ constellation: string; phase: ConstellationPhase }>({
    constellation: 'capricorn',
    phase: 'draw',
  })

  useLayoutEffect(() => {
    return registerSystemBarSurface('loading')
  }, [])

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
      className={`${styles.pageRoot} ${viewMode === 'icons' || viewMode === 'modular' ? styles.scrollableRoot : ''}`}
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

      {/* ── Vista 2: Ambient Background (Sistema de Constelaciones de Alta Relojería) */}
      {viewMode === 'ambient' && (
        <AtmosphericBackground
          fullScreen={true}
          centered={true}
          variant="constellations"
          intensity={ambientIntensity}
          constellationProps={{
            constellationSelect,
            speedMultiplier,
            isPaused,
            starDensity,
            resetKey,
            onCycleUpdate: setCycleInfo,
          }}
        >
          <div className={styles.ambientDemoCard}>
            <div className={styles.ambientBadgeRow}>
              <span className={styles.celestialBadge}>
                {cycleInfo.constellation === 'capricorn' ? 'Capricornio' : 'Leo'}
              </span>
              <span className={styles.phaseBadge}>
                {cycleInfo.phase === 'draw'
                  ? 'Dibujo progresivo (6s)'
                  : cycleInfo.phase === 'hold'
                    ? 'Permanencia (2.5s)'
                    : cycleInfo.phase === 'fade'
                      ? 'Desvanecimiento (3.2s)'
                      : 'Pausa'}
              </span>
            </div>

            <h2 className={styles.ambientDemoTitle}>Cielo de Relojería · Plata 925</h2>
            <p className={styles.ambientDemoText}>
              Cielo permanente de estrellas discretas y geometría astronómica verificada. Una estrella
              guía plateada recorre las conexiones de <strong>Capricornio</strong> y <strong>Leo</strong>{' '}
              con precisión de grabado, iluminando sus líneas de plata esterlina 925 antes de desvanecerse lentamente.
            </p>

            <div className={styles.ambientCardActions}>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => setViewMode('hero')}
              >
                <Check size={16} />
                <span>Comparar con pantalla de carga oficial</span>
              </button>
            </div>
          </div>
        </AtmosphericBackground>
      )}

      {/* ── Vista 3: Showcase del LunarLoader Modularizado (Botones y Componentes) ── */}
      {viewMode === 'modular' && (
        <div className={styles.modularShowcase}>
          <div className={styles.modularCard}>
            <div className={styles.modularHeader}>
              <LunarLoader size={32} variant="brand" />
              <div>
                <h2 className={styles.ambientDemoTitle} style={{ margin: 0 }}>LunarLoader Modular</h2>
                <p className={styles.modularSub}>
                  Animación continua de fases lunares y eclipse del Hero Loader, miniaturizada y calibrada con precisión óptica.
                </p>
              </div>
            </div>

            {/* Simulación del Botón exacto de login */}
            <div className={styles.modularSection}>
              <h3 className={styles.sectionHeader}>Botón &quot;Ingresar&quot; (Exacto de Login / Auth)</h3>
              <div className={styles.buttonDemoWrap}>
                <Button
                  loading={demoBtnLoading}
                  fullWidth
                  onClick={() => setDemoBtnLoading((prev) => !prev)}
                >
                  Ingresar
                </Button>
                <button
                  type="button"
                  className={styles.toggleLoadingBtn}
                  onClick={() => setDemoBtnLoading((prev) => !prev)}
                >
                  {demoBtnLoading ? 'Desactivar estado loading' : 'Activar estado loading'}
                </button>
              </div>
            </div>

            {/* Escala de tamaños modulares */}
            <div className={styles.modularSection}>
              <h3 className={styles.sectionHeader}>Escala de tamaños adaptativos (14px a 40px)</h3>
              <div className={styles.sizesRow}>
                {[14, 16, 18, 24, 32, 40].map((sz) => (
                  <div key={sz} className={styles.sizeItem}>
                    <div className={styles.sizeIconBox}>
                      <LunarLoader size={sz} />
                    </div>
                    <span className={styles.sizeLabel}>{sz}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variantes Brand con demostración explícita de modos */}
            <div className={styles.modularSection}>
              <h3 className={styles.sectionHeader}>
                Variante Brand según Modo del Sistema (Claro = Naranja Eclipse · Oscuro = Plata &amp; Azul Glacial)
              </h3>
              <div className={styles.sizesRow}>
                <div className={styles.sizeItem}>
                  <div className={styles.sizeIconBox} style={{ background: '#FAF7F2', borderRadius: '10px', padding: '6px' }}>
                    <LunarLoader size={28} variant="brand" themeMode="light" />
                  </div>
                  <span className={styles.sizeLabel}>Modo Claro (Naranja)</span>
                </div>
                <div className={styles.sizeItem}>
                  <div className={styles.sizeIconBox} style={{ background: '#060B14', borderRadius: '10px', padding: '6px' }}>
                    <LunarLoader size={28} variant="brand" themeMode="dark" />
                  </div>
                  <span className={styles.sizeLabel}>Modo Oscuro (Azul/Plata)</span>
                </div>
                <div className={styles.sizeItem}>
                  <div className={styles.sizeIconBox}>
                    <LunarLoader size={28} variant="brand" themeMode="auto" />
                  </div>
                  <span className={styles.sizeLabel}>Dinámico (Sistema: {theme})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                  : viewMode === 'ambient'
                    ? 'Constelaciones · Relojería & Plata 925'
                    : 'Hero Loading · Fases Lunares'}
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
            {/* Selector de modo (Cápsula Oficial) */}
            <SegmentedControl
              options={[
                { value: 'icons', label: 'Iconos Animados', icon: <Sparkles size={13} /> },
                { value: 'hero', label: 'Hero Loader', icon: <Shield size={13} /> },
                { value: 'ambient', label: 'Fondo Ambiental', icon: <AtmosphericMoonIcon size={14} /> },
                { value: 'modular', label: 'LunarLoader Modular', icon: <LunarLoader size={14} /> },
              ]}
              value={viewMode}
              onChange={(val: string) => setViewMode(val as typeof viewMode)}
              ariaLabel="Modos de animación"
              layout="inline"
            />

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

          {/* ── Fila de Controles Astronómicos Específicos para Fondo Ambiental ── */}
          {viewMode === 'ambient' && (
            <div className={styles.dockSubRow}>
              {/* Selector de Constelación */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Figura:</span>
                <select
                  className={styles.selectInput}
                  value={constellationSelect}
                  onChange={(e) => setConstellationSelect(e.target.value as typeof constellationSelect)}
                  aria-label="Seleccionar figura astronómica"
                >
                  <option value="both">Ciclo continuo (Capricornio ⇄ Leo)</option>
                  <option value="capricorn">Solo Capricornio</option>
                  <option value="leo">Solo Leo</option>
                </select>
              </div>

              {/* Intensidad Atmosférica */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Intensidad:</span>
                <button
                  type="button"
                  className={`${styles.actionIconBtn} ${ambientIntensity === 'hero' ? styles.actionIconBtnActive : ''}`}
                  onClick={() => setAmbientIntensity((prev) => (prev === 'ambient' ? 'hero' : 'ambient'))}
                  title="Alternar entre variante ambiental estándar y hero (loading)"
                >
                  {ambientIntensity === 'hero' ? 'Hero (Loading)' : 'Ambiente estándar'}
                </button>
              </div>

              {/* Velocidad del Trazado */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Velocidad:</span>
                <select
                  className={styles.selectInput}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  aria-label="Velocidad del trazado"
                >
                  <option value={0.5}>0.5x (Lenta)</option>
                  <option value={1}>1.0x (Normal)</option>
                  <option value={1.5}>1.5x (Rápida)</option>
                  <option value={2}>2.0x (Doble)</option>
                </select>
              </div>

              {/* Densidad de Estrellas */}
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Densidad:</span>
                <select
                  className={styles.selectInput}
                  value={starDensity}
                  onChange={(e) => setStarDensity(e.target.value as typeof starDensity)}
                  aria-label="Densidad del campo estelar"
                >
                  <option value="low">Baja (45)</option>
                  <option value="medium">Media (80)</option>
                  <option value="high">Alta (130)</option>
                </select>
              </div>

              {/* Pausar / Reanudar */}
              <button
                type="button"
                className={`${styles.actionIconBtn} ${isPaused ? styles.actionIconBtnActive : ''}`}
                onClick={() => setIsPaused((prev) => !prev)}
                title={isPaused ? 'Reanudar trazado' : 'Pausar trazado'}
              >
                {isPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>

              {/* Reiniciar ciclo */}
              <button
                type="button"
                className={styles.actionIconBtn}
                onClick={() => setResetKey((prev) => prev + 1)}
                title="Reiniciar ciclo de animación desde el inicio"
              >
                <RotateCcw size={13} />
                <span>Reiniciar</span>
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
