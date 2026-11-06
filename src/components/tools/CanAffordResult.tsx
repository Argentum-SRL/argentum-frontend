import React from 'react';
import { TrendingUp, Banknote, Target, RotateCcw } from '@/components/ui/icons';
import { Button } from '@/components/ui';
import type { CanAffordResult as ICanAffordResult } from '@/types/tools';
import { claseResultado, filasAhorros, type FilaAhorro } from '@/utils/permitirse';
import { formatMonto } from '@/utils/format';
import styles from './ToolsComponents.module.css';

interface CanAffordResultProps {
  resultado: ICanAffordResult;
  onReset: () => void;
  textoReset?: string;
}

const ICONO_AHORRO: Record<string, React.ReactNode> = {
  inversiones: <TrendingUp size={16} />,
  dolares: <Banknote size={16} />,
  metas: <Target size={16} />,
};

export const CanAffordResult: React.FC<CanAffordResultProps> = ({
  resultado,
  onReset,
  textoReset = 'Analizar otra compra',
}) => {
  const {
    resultado: resKey,
    titulo,
    linea_principal,
    lineas_plan,
    linea_ahorros,
    ahorros,
    linea_liberacion,
    linea_compensar,
    linea_frescura,
    linea_espera,
  } = resultado;

  const clase = claseResultado(resKey);
  const filas = filasAhorros(ahorros);

  const tituloColorClass = (() => {
    switch (clase) {
      case 'bien':
        return styles.tituloBien;
      case 'justo':
        return styles.tituloJusto;
      case 'ahorros':
        return styles.tituloAhorros;
      case 'noAlcanza':
        return styles.tituloNoAlcanza;
    }
  })();

  return (
    <div className={styles.card}>
      {/* Título grande con el color del resultado */}
      <h2 className={`${styles.tituloResultado} ${tituloColorClass}`}>
        {titulo}
      </h2>

      {/* Línea principal */}
      <p className={styles.lineaPrincipal}>
        {linea_principal}
      </p>

      {/* Bloque del plan (lineas_plan) si hay */}
      {lineas_plan && lineas_plan.length > 0 && (
        <div className={styles.bloquePlan}>
          {lineas_plan.map((linea, idx) => (
            <p key={idx} className={styles.lineaPlan}>
              {linea}
            </p>
          ))}
        </div>
      )}

      {/* Bloque de ahorros si hay */}
      {filas.length > 0 && (
        <div className={styles.bloqueAhorros}>
          {filas.map((f: FilaAhorro) => (
            <div key={f.tipo} className={styles.filaAhorro}>
              <div className={styles.filaAhorroInfo}>
                {ICONO_AHORRO[f.tipo]}
                <span>{f.nombre}</span>
                {f.detalle && (
                  <span className={styles.filaAhorroDetalle}>
                    ({f.detalle})
                  </span>
                )}
              </div>
              <span className={styles.filaAhorroMonto}>
                {formatMonto(f.monto, 'ARS')}
              </span>
            </div>
          ))}

          {linea_ahorros && (
            <div className={styles.lineaAhorrosTexto}>
              {linea_ahorros}
            </div>
          )}
        </div>
      )}

      {/* Líneas secundarias en gris chico */}
      {(linea_liberacion || linea_compensar || linea_frescura || linea_espera) && (
        <div className={styles.lineasSecundarias}>
          {linea_liberacion && (
            <p className={styles.lineaSecundaria}>
              {linea_liberacion}
            </p>
          )}
          {linea_compensar && (
            <p className={styles.lineaSecundaria}>
              {linea_compensar}
            </p>
          )}
          {linea_frescura && (
            <p className={styles.lineaSecundaria}>
              {linea_frescura}
            </p>
          )}
          {linea_espera && (
            <p className={styles.lineaSecundaria}>
              {linea_espera}
            </p>
          )}
        </div>
      )}

      {/* Botón para volver a calcular */}
      <Button
        variant="outline"
        onClick={onReset}
        fullWidth
        type="button"
      >
        <span className={styles.btnResetContent}>
          <RotateCcw size={16} />
          <span>{textoReset}</span>
        </span>
      </Button>
    </div>
  );
};

export default CanAffordResult;
