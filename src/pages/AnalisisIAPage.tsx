import React, { useState } from 'react'
import { Sparkles, HelpCircle } from 'lucide-react'
import { useAnalisisIA } from '@/hooks/useAnalisisIA'
import { PageSummaryBar, SelectInput, Button } from '@/components/ui'
import AnalisisCard from '@/components/analisis-ia/AnalisisCard'
import AnalisisHistorial from '@/components/analisis-ia/AnalisisHistorial'
import ExportarBoton from '@/components/analisis-ia/ExportarBoton'
import type { TipoAnalisis } from '@/types'
import styles from './AnalisisIAPage.module.css'

const tipoOptions = [
  { value: 'completo', label: 'Completo' },
  { value: 'gastos_hormiga', label: 'Gastos hormiga' },
  { value: 'suscripciones', label: 'Suscripciones' },
  { value: 'fondo_emergencia', label: 'Fondo de emergencias' },
]

const ciclosOptions = [
  { value: '2', label: '2 ciclos' },
  { value: '3', label: '3 ciclos' },
  { value: '4', label: '4 ciclos' },
  { value: '5', label: '5 ciclos' },
  { value: '6', label: '6 ciclos' },
]

export const AnalisisIAPage: React.FC = () => {
  const {
    historial,
    analisisActual,
    cargando,
    error,
    generarAnalisis,
    exportar,
    seleccionar,
    limpiarError,
  } = useAnalisisIA()

  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoAnalisis>('completo')
  const [ciclosSeleccionados, setCiclosSeleccionados] = useState<number>(3)

  const handleGenerar = async () => {
    try {
      await generarAnalisis(tipoSeleccionado, ciclosSeleccionados)
    } catch (err) {
      console.error('Error al generar análisis:', err)
    }
  }

  const handleExportar = async () => {
    return await exportar(ciclosSeleccionados)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Análisis financiero IA</h1>
          <p className={styles.subtitle}>
            Obtené resúmenes detallados y recomendaciones de salud financiera con IA
          </p>
        </div>
      </header>

      {/* Summary Bar */}
      <PageSummaryBar
        items={[
          {
            label: "Ciclos analizados",
            value: analisisActual ? `${analisisActual.ciclos_analizados} ciclos` : '-',
          },
          {
            label: "Modelo usado",
            value: analisisActual ? analisisActual.modelo_usado : '-',
          },
          {
            label: "Costo estimado",
            value: analisisActual?.costo_usd ? `US$ ${Number(analisisActual.costo_usd).toFixed(4)}` : '-',
          },
        ]}
      />

      {/* Error Global Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorText}>{error}</span>
          <button 
            className={styles.errorCloseBtn} 
            onClick={limpiarError} 
            type="button"
            aria-label="Cerrar banner de error"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.controlBox}>
            <div className={styles.controlGroup}>
              <SelectInput
                id="tipo-analisis"
                label="Tipo de análisis"
                value={tipoSeleccionado}
                onChange={(val) => setTipoSeleccionado(val as TipoAnalisis)}
                options={tipoOptions}
              />
            </div>

            <div className={styles.controlGroup}>
              <SelectInput
                id="ciclos-analizar"
                label="Ciclos a analizar"
                value={String(ciclosSeleccionados)}
                onChange={(val) => setCiclosSeleccionados(Number(val))}
                options={ciclosOptions}
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerar}
              loading={cargando}
              disabled={cargando}
              fullWidth
            >
              Generar análisis
            </Button>

            <div className={styles.separator} />

            <ExportarBoton onExportar={handleExportar} />
          </div>

          <div className={styles.historialBox}>
            <h2 className={styles.sidebarTitle}>Historial de análisis</h2>
            <div className={styles.historialListContainer}>
              <AnalisisHistorial
                items={historial}
                seleccionado={analisisActual?.id || null}
                onSeleccionar={seleccionar}
              />
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className={styles.mainContent}>
          {!analisisActual && !cargando && (
            <div className={styles.emptyState}>
              <HelpCircle className={styles.emptyIcon} size={48} />
              <h2 className={styles.emptyTitle}>Generá tu primer análisis financiero</h2>
              <p className={styles.emptySubtitle}>
                Seleccioná el tipo y la cantidad de ciclos, luego presioná Generar análisis.
              </p>
            </div>
          )}

          {cargando && !analisisActual && (
            <div className={styles.emptyState}>
              <div className={styles.loadingPulse}>
                <Sparkles className={styles.loadingIcon} size={48} />
              </div>
              <h2 className={styles.emptyTitle}>Generando análisis...</h2>
              <p className={styles.emptySubtitle}>Esto puede tardar hasta 30 segundos.</p>
            </div>
          )}

          {analisisActual && (
            <div className={styles.cardWrapper}>
              {cargando && (
                <div className={styles.updatingOverlay}>
                  <span className={styles.updatingText}>Generando nuevo análisis...</span>
                </div>
              )}
              <AnalisisCard analisis={analisisActual} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AnalisisIAPage
