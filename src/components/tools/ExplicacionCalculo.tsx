import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import styles from './ToolsComponents.module.css';

export const ExplicacionCalculo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.accordion}>
      <div 
        className={styles.accordionSummary} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.summaryLabel}>
          <Info size={16} className={styles.infoIcon} />
          ¿Cómo calculamos esto?
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      
      {isOpen && (
        <div className={styles.accordionContent}>
          <p>
            Cuando pagás en cuotas, cada cuota del futuro vale menos que hoy porque la inflación 
            erosiona el poder adquisitivo del dinero.
          </p>
          
          <p>
            Para cada cuota, calculamos su <strong>"valor real a hoy"</strong> (o valor presente) usando la fórmula:
          </p>
          
          <div className={styles.formulaBlock}>
            Valor real = Cuota ÷ (1 + inflación mensual)<sup>número de mes</sup>
          </div>
          
          <p>
            Luego sumamos todos esos valores reales de cada mes y los comparamos con el precio de contado. 
            Si la suma de las cuotas traídas a valor presente es menor que el precio de contado, entonces 
            <strong> te conviene pagar en cuotas</strong> porque terminarás entregando menos valor real de dinero.
          </p>

          <div className={styles.badgeWrapper}>
            <span className={styles.badge}>
              Mismo cálculo que usa infleta.com.ar y otras calculadoras del rubro
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplicacionCalculo;
