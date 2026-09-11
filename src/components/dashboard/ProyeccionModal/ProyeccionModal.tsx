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
  const nivel_confianza = (proyeccion?.nivel_confianza ?? '').toLowerCase().trim()
  const pasaPuerta = Boolean(proyeccion?.calibracion?.pasa_puerta)

  const getConfianzaLabel = () => {
    switch (nivel_confianza) {
      case 'alto':
      case 'alta':
        return 'Alta'
      case 'medio':
      case 'media':
        return 'Media'
      case 'bajo':
      case 'baja':
        return 'Baja'
      case 'sin_datos':
        return 'Sin datos'
      case 'insuficiente':
        return 'Insuficiente'
      case 'inicial':
        return 'Inicial'
      default:
        return 'En evaluación'
    }
  }

  const getConfianzaDesc = () => {
    switch (nivel_confianza) {
      case 'alto':
      case 'alta':
        return 'Proyección confiable, buen historial disponible.'
      case 'medio':
      case 'media':
        return 'Proyección orientativa, historial en construcción.'
      case 'bajo':
      case 'baja':
        return 'Proyección estimada, historial limitado o datos dispersos.'
      case 'sin_datos':
        return 'Sin observaciones históricas suficientes para calcular proyección.'
      case 'insuficiente':
        return 'Historial insuficiente para calcular una proyección confiable.'
      case 'inicial':
        return 'Primer ciclo registrado, en proceso de recopilación de historial.'
      default:
        return 'Nivel de confianza en evaluación sobre tu historial disponible.'
    }
  }

  const getConfianzaClass = () => {
    switch (nivel_confianza) {
      case 'alto':
      case 'alta':
        return styles.textAlto
      case 'medio':
      case 'media':
        return styles.textMedio
      case 'bajo':
      case 'baja':
      case 'sin_datos':
      case 'insuficiente':
      case 'inicial':
        return styles.textBajo
      default:
        return styles.textMedio
    }
  }

  const getIndicatorClass = () => {
    switch (nivel_confianza) {
      case 'alto':
      case 'alta':
        return styles.indicatorAlto
      case 'medio':
      case 'media':
        return styles.indicatorMedio
      case 'bajo':
      case 'baja':
      case 'sin_datos':
      case 'insuficiente':
      case 'inicial':
        return styles.indicatorBajo
      default:
        return styles.indicatorMedio
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

        {pasaPuerta && (
          <footer className={styles.footer}>
            <div className={styles.confianzaRow}>
              <div className={`${styles.indicator} ${getIndicatorClass()}`} />
              <span className={`${styles.confianzaText} ${getConfianzaClass()}`}>
                Nivel de confianza: {getConfianzaLabel()}
              </span>
            </div>
            <p className={styles.confianzaDesc}>{getConfianzaDesc()}</p>
          </footer>
        )}
      </div>
    </Modal>
  )
}

export default ProyeccionModal
