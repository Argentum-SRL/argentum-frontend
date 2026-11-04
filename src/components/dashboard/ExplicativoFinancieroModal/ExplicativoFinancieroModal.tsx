import React, { useState } from 'react'
import { X, Sparkles, TrendingUp, Activity, Layers, CheckCircle2 } from '@/components/ui/icons'
import Modal from '@/components/ui/Modal/Modal'
import SegmentedControl from '@/components/ui/SegmentedControl'
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
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel="Guía de tu perfil y tu fin de mes">
      <div className={styles.modalRoot} data-modal-frame>
        {/* Header con estética Senior Fintech */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconPill}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Guía de tus métricas</h2>
              <p className={styles.headerSubtitle}>Cómo leer tu perfil y tu fin de mes</p>
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

        {/* Selector de pestañas oficial */}
        <div className={styles.tabsWrapper}>
          <SegmentedControl<'perfil' | 'proyeccion'>
            options={[
              { value: 'perfil', label: 'Tu perfil financiero', icon: <Activity size={15} /> },
              { value: 'proyeccion', label: 'Fin de mes', icon: <TrendingUp size={15} /> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            fullWidth
            ariaLabel="Secciones del explicativo financiero"
          />
        </div>

        {/* Cuerpo del Modal */}
        <div className={styles.body}>
          {activeTab === 'perfil' ? (
            <div role="tabpanel" aria-label="Tu perfil financiero" data-modal-stack>
              <div className={styles.introBox}>
                Un diagnóstico objetivo de tus hábitos de dinero que evalúa la regularidad de tus ingresos y gastos a lo largo del tiempo, clasificándolos sin juicios morales para mostrar tu margen de maniobra real.
              </div>

              <div className={styles.sectionTitle} data-modal-section-title>Tus 6 indicadores clave</div>

              <div className={styles.kpiList} data-modal-block>
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
            <div role="tabpanel" aria-label="Fin de mes" data-modal-stack>
              <div className={styles.introBox}>
                La tarjeta «¿Cómo llegás a fin de mes?» te dice con cuánta plata llegarías al último día de tu ciclo si gastás como en tus meses anteriores.
              </div>

              <div className={styles.sectionTitle} data-modal-section-title>Qué te muestra</div>

              <div data-modal-block>
                <div className={styles.modeCard}>
                  <div className={styles.modeHeader}>
                    <Layers size={15} />
                    <span>El número grande</span>
                  </div>
                  <p className={styles.modeDesc}>
                    Es lo que te quedaría al terminar el ciclo, en un mes flojo y en uno bueno. Sale de lo que tenés libre hoy, lo que vas a cobrar antes del cierre y lo que gastaste en tus meses anteriores.
                  </p>
                </div>

                <div className={styles.modeCard}>
                  <div className={styles.modeHeader}>
                    <TrendingUp size={15} />
                    <span>Las líneas de abajo</span>
                  </div>
                  <p className={styles.modeDesc}>
                    Te dicen en cuántos de tus últimos meses no te alcanzó y, si cobrás antes del cierre, cuánto te queda libre hasta ese cobro.
                  </p>
                </div>
              </div>

              <div className={styles.activationNotice}>
                <CheckCircle2 size={16} />
                <span>Aparece cuando tenés al menos 3 meses con movimientos y la app ya sabe cuándo cobrás.</span>
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
