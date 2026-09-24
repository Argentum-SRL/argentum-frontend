import React, { useState } from 'react'
import { X, Sparkles, TrendingUp, Activity, Layers, CheckCircle2 } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import styles from './ExplicativoFinancieroModal.module.css'

interface ExplicativoFinancieroModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'perfil' | 'proyeccion'
}

export const ExplicativoFinancieroModal: React.FC<ExplicativoFinancieroModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'perfil'
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'proyeccion'>(initialTab)

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Guía de Salud y Proyección Financiera">
      <div className={styles.modalRoot}>
        {/* Header con estética Senior Fintech */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconPill}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Guía de tus métricas</h2>
              <p className={styles.headerSubtitle}>Cómo interpretar tu perfil y proyección</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar guía"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs segmentadas estilo FilterBar */}
        <div className={styles.tabsWrapper}>
          <div className={styles.tabs} role="tablist" aria-label="Secciones de la guía">
            <button
              type="button"
              role="tab"
              id="tab-perfil"
              aria-selected={activeTab === 'perfil'}
              aria-controls="panel-perfil"
              className={`${styles.tab} ${activeTab === 'perfil' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('perfil')}
            >
              <Activity size={14} />
              <span>Tu perfil financiero</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-proyeccion"
              aria-selected={activeTab === 'proyeccion'}
              aria-controls="panel-proyeccion"
              className={`${styles.tab} ${activeTab === 'proyeccion' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('proyeccion')}
            >
              <TrendingUp size={14} />
              <span>Proyección del ciclo</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className={styles.body}>
          {activeTab === 'perfil' ? (
            <div id="panel-perfil" role="tabpanel" aria-labelledby="tab-perfil">
              <div className={styles.introBox}>
                Un diagnóstico objetivo de tus hábitos de dinero que evalúa la regularidad de tus ingresos y gastos a lo largo del tiempo, clasificándolos sin juicios morales para mostrar tu margen de maniobra real.
              </div>

              <div className={styles.sectionTitle}>Tus 6 indicadores clave</div>

              <div className={styles.kpiList}>
                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Ahorro</span>
                  <p className={styles.kpiText}>
                    <strong>Margen libre:</strong> Proporción de tu ingreso típico regular que no se consume en gastos corrientes del ciclo.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Comprometido</span>
                  <p className={styles.kpiText}>
                    <strong>Costos ineludibles:</strong> Porcentaje de ingresos atado a obligaciones fijas que tenés que pagar sí o sí (alquiler, servicios, cuotas).
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Hábitos</span>
                  <p className={styles.kpiText}>
                    <strong>Estilo de vida:</strong> Consumos frecuentes y cotidianos que definen tu rutina de gastos mes a mes.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Cobertura</span>
                  <p className={styles.kpiText}>
                    <strong>Meses de colchón (Runway):</strong> Tiempo que podés sostener tu nivel de vida con tu liquidez disponible ante una interrupción de ingresos.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Volatilidad</span>
                  <p className={styles.kpiText}>
                    <strong>Variabilidad:</strong> Cuánto fluctúa tu gasto no recurrente respecto a tu nivel habitual. Menor número indica mayor previsibilidad.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Ingreso típico</span>
                  <p className={styles.kpiText}>
                    <strong>Mediana representativa:</strong> Tu ingreso mensual habitual deflactado por inflación, sin distorsión por meses con cobros extraordinarios.
                  </p>
                </div>
              </div>

              <div className={styles.activationNotice}>
                <CheckCircle2 size={16} />
                <span>Se activa automáticamente al alcanzar 3 ciclos mensuales con transacciones registradas.</span>
              </div>
            </div>
          ) : (
            <div id="panel-proyeccion" role="tabpanel" aria-labelledby="tab-proyeccion">
              <div className={styles.introBox}>
                Una estimación estadística predictiva de cómo vas a terminar tu ciclo financiero actual (entre tus fechas de cobro), ayudándote a anticipar imprevistos antes del cierre.
              </div>

              <div className={styles.sectionTitle}>Comportamiento según tu historial</div>

              <div className={styles.modeCard}>
                <div className={styles.modeHeader}>
                  <Layers size={15} />
                  <span>1. Compromisos ciertos</span>
                </div>
                <p className={styles.modeDesc}>
                  Si estás en tus primeros meses con Argentum, muestra exclusivamente tus obligaciones fijas confirmadas: cuotas de tarjetas del ciclo actual y suscripciones vigentes.
                </p>
              </div>

              <div className={styles.modeCard}>
                <div className={styles.modeHeader}>
                  <TrendingUp size={15} />
                  <span>2. Proyección calibrada</span>
                </div>
                <p className={styles.modeDesc}>
                  A partir de 3 ciclos observados, el modelo estadístico proyecta además el ritmo de tus gastos variables diarios basándose en tus patrones históricos reales.
                </p>
              </div>

              <div className={styles.sectionTitle}>Conceptos clave de la proyección</div>

              <div className={styles.kpiList}>
                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Cierre esperado</span>
                  <p className={styles.kpiText}>
                    El valor estadístico más probable con el que cerrarás el ciclo sumando fijos y variables.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Rango 80%</span>
                  <p className={styles.kpiText}>
                    Banda de seguridad estadística entre un escenario optimista (p10) y uno conservador (p90).
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Apertura</span>
                  <p className={styles.kpiText}>
                    Desglose por categoría para que puedas identificar rápidamente dónde se concentrarán tus mayores gastos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acción clara */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ExplicativoFinancieroModal
