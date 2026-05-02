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
  const { n_ciclos, pesos, advertencias, nivel_confianza } = {
    n_ciclos: proyeccion.ciclos_analizados,
    pesos: proyeccion.pesos,
    advertencias: proyeccion.advertencias,
    nivel_confianza: proyeccion.nivel_confianza
  }

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
            Miramos tus últimos {n_ciclos} {n_ciclos === 1 ? 'ciclo completo' : 'ciclos completos'} y calculamos cuánto gastaste en promedio en cada categoría. Eso es la base de la proyección.
          </p>
        </section>

        <section className={styles.section}>
          <h3>Cómo se combina con este ciclo</h3>
          <p>
            Tu comportamiento actual tiene un {Math.round(pesos.ciclo_actual * 100)}% de peso en la proyección. El historial tiene un {Math.round(pesos.historial * 100)}%. Esto evita que un gasto puntual grande distorsione todo.
          </p>
        </section>

        <section className={styles.section}>
          <h3>Los compromisos fijos</h3>
          <p>
            Las cuotas y suscripciones que ya tenés programadas para los días que quedan del ciclo se suman como número exacto, no como estimación.
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
