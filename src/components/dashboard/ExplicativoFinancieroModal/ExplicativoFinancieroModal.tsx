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
            size="lg"
            ariaLabel="Secciones del explicativo financiero"
          />
        </div>

        {/* Cuerpo del Modal */}
        <div className={styles.body}>
          {activeTab === 'perfil' ? (
            <div role="tabpanel" aria-label="Tu perfil financiero" data-modal-stack>
              <div className={styles.introBox}>
                Tu perfil financiero contesta cuatro preguntas sobre tus últimos 6 meses terminados. Cada una aparece cuando hay datos para contestarla.
              </div>

              <div className={styles.sectionTitle} data-modal-section-title>Las cuatro preguntas</div>

              <div className={styles.kpiList} data-modal-block>
                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Te sobra</span>
                  <p className={styles.kpiText}>
                    En cuántos de tus últimos meses te entró más de lo que gastaste y cuánto te quedó en promedio. Es el mismo balance que ves en Análisis. Aparece con 3 meses terminados.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Te bancás</span>
                  <p className={styles.kpiText}>
                    Cuántos meses podrías pagar tus gastos de siempre con la plata de tus cuentas, tus dólares y tus metas para imprevistos. Lo invertido no cuenta. Lo recomendable es tener de 3 a 6 meses. Aparece con 1 mes terminado.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Cuotas</span>
                  <p className={styles.kpiText}>
                    Cuánto pagás por mes de compras en cuotas y qué parte de lo que te entra se lleva. Los bancos ponen el límite en el 25%. Aparece desde el primer día.
                  </p>
                </div>

                <div className={styles.kpiItem}>
                  <span className={styles.kpiBadge}>Inflación</span>
                  <p className={styles.kpiText}>
                    Si lo que te entra hoy compra más o menos que antes, con la inflación del INDEC. Aparece con 6 meses terminados.
                  </p>
                </div>
              </div>

              <div className={styles.activationNotice}>
                <CheckCircle2 size={16} />
                <span>Arriba te decimos en cuántas de estas preguntas venís bien. Nunca te pedimos cuánto cobrás: lo sacamos de tus movimientos.</span>
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
