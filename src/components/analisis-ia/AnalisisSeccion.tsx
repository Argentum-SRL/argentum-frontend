import React from 'react'
import styles from './AnalisisSeccion.module.css'

interface AnalisisSeccionProps {
  titulo: string
  contenido: string | null
}

export const AnalisisSeccion: React.FC<AnalisisSeccionProps> = ({ titulo, contenido }) => {
  const sinDatos = !contenido || contenido.trim().startsWith('Sin datos suficientes')

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{titulo}</h3>
      <p className={sinDatos ? styles.contentAtenuado : styles.contentNormal}>
        {contenido || 'Sin datos suficientes para generar un análisis.'}
      </p>
    </div>
  )
}

export default AnalisisSeccion
