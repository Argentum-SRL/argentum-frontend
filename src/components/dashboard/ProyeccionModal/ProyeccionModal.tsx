import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import styles from './ProyeccionModal.module.css'
import type { Proyeccion } from '@/types'

interface ProyeccionModalProps {
  isOpen: boolean
  onClose: () => void
  proyeccion: Proyeccion
}

const ProyeccionModal: React.FC<ProyeccionModalProps> = ({ isOpen, onClose, proyeccion }) => {
  const n_ciclos = proyeccion?.ciclos_analizados ?? 0
  const advertencias = proyeccion?.advertencias ?? []
  const nivel_confianza = proyeccion?.nivel_confianza ?? 'medio'

  const getConfianzaLabel = () => {
    switch (nivel_confianza) {
      case 'alto': return 'Alta'
      case 'medio': return 'Media'
      case 'bajo': return 'Baja'
      default: return ''
    }
  }

  const getConfianzaDesc = () => {
    switch (nivel_confianza) {
      case 'alto': return 'Proyección confiable, buen historial disponible.'
      case 'medio': return 'Proyección orientativa, historial en construcción.'
      case 'bajo': return 'Proyección estimada, sin historial suficiente.'
      default: return ''
    }
  }

  const getConfianzaClass = () => {
    switch (nivel_confianza) {
      case 'alto': return styles.textAlto
      case 'medio': return styles.textMedio
      case 'bajo': return styles.textBajo
      default: return ''
    }
  }

  const getIndicatorClass = () => {
    switch (nivel_confianza) {
      case 'alto': return styles.indicatorAlto
      case 'medio': return styles.indicatorMedio
      case 'bajo': return styles.indicatorBajo
      default: return ''
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cómo calculamos tu proyección">
      <div className={styles.modalContent}>
        <section className={styles.section}>
          <h3>En qué se basa</h3>
          <p>
            Descomponemos tus finanzas en tres partes: compromisos ciertos (cuotas y suscripciones), recurrentes ya debitados, y gastos variables. Para los variables, analizamos tus últimos {n_ciclos} {n_ciclos === 1 ? 'ciclo completo' : 'ciclos completos'} filtrando compras atípicas y calculando una distribución de probabilidad calibrada.
          </p>
        </section>

        <section className={styles.section}>
          <h3>Cómo estimamos el gasto variable</h3>
          <p>
            Calculamos tu gasto diario básico descartando el decil superior de compras únicas para no contaminar la proyección. Luego modelamos la variabilidad con cuantiles empíricos ajustados por días restantes del ciclo y calibrados sobre el historial.
          </p>
        </section>

        <section className={styles.section}>
          <h3>Los compromisos fijos</h3>
          <p>
            Las cuotas y suscripciones que ya tenés programadas para los días que quedan del ciclo se suman como número exacto y cierto, nunca como estimación.
          </p>
        </section>

        <section className={styles.section}>
          <h3>Prueba de calibración individual</h3>
          <p>
            {proyeccion?.calibracion?.pasa_puerta ? (
              `Esta proyección superó la prueba de calibración estadística sobre tu propia historia con una cobertura observada del ${Math.round((proyeccion.calibracion.cobertura_80 ?? 0.8) * 100)}% en ${proyeccion.calibracion.ciclos_evaluados} ciclos cerrados evaluados en backtest.`
            ) : (
              proyeccion?.calibracion?.mensaje || 'Para evitar estimaciones engañosas, la proyección probabilística solo se activa si el modelo demuestra una cobertura empírica mínima del 80% y un rango informativo sobre tus ciclos cerrados.'
            )}
          </p>
        </section>

        {advertencias.length > 0 && (
          <section className={styles.section}>
            <h3>Tené en cuenta</h3>
            <div className={styles.advertenciasList}>
              {advertencias.map((adv, index) => (
                <div key={index} className={styles.advertenciaItem}>
                  <AlertTriangle size={18} className={styles.advertenciaIcon} />
                  <span className={styles.advertenciaText}>{adv}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <div className={styles.confianzaRow}>
            <div className={`${styles.indicator} ${getIndicatorClass()}`} />
            <span className={`${styles.confianzaText} ${getConfianzaClass()}`}>
              Nivel de confianza: {getConfianzaLabel()}
            </span>
          </div>
          <p className={styles.confianzaDesc}>{getConfianzaDesc()}</p>
        </footer>
      </div>
    </Modal>
  )
}

export default ProyeccionModal
