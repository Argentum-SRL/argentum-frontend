import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import styles from './AyudaBoton.module.css';

export interface AyudaBotonProps {
  titulo: string;
  texto: string;
}

/**
 * Botón circular "?" que abre un modal de ayuda contextual.
 */
export const AyudaBoton: React.FC<AyudaBotonProps> = ({ titulo, texto }) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.ayudaBtn}
        aria-label={`Ayuda: ${titulo}`}
        onClick={() => setAbierto(true)}
      >
        ?
      </button>

      <Modal
        isOpen={abierto}
        onClose={() => setAbierto(false)}
        title={titulo}
        ariaLabel={titulo}
        size="sm"
      >
        <p className={styles.ayudaTexto}>{texto}</p>
      </Modal>
    </>
  );
};

export default AyudaBoton;
