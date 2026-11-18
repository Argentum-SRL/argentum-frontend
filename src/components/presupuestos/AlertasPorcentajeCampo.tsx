import { useCallback, useState } from 'react'
import { CollapseToggle } from '@/components/ui'
import { Plus, Trash2 } from '@/components/ui/icons'
import {
  MAX_AVISOS_PRESUPUESTO,
  errorFilaAlerta,
  parsearPorcentaje,
  siguienteAviso,
  textoAvisos,
  validarAlertasFormulario,
} from './alertasPresupuesto'
import styles from './AlertasPorcentajeCampo.module.css'

interface AlertasPorcentajeCampoProps {
  alertas: Array<number | null>
  onChange: (nuevas: Array<number | null>) => void
  expanded: boolean
  onToggleExpanded: () => void
  mostrarErrores?: boolean
}

const TECLAS_NAVEGACION = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Enter',
  'Home',
  'End',
])

export default function AlertasPorcentajeCampo({
  alertas,
  onChange,
  expanded,
  onToggleExpanded,
  mostrarErrores = false,
}: AlertasPorcentajeCampoProps) {
  const [tocados, setTocados] = useState<Record<number, boolean>>({})

  const actualizarIndice = useCallback(
    (indice: number, valor: number | null) => {
      const siguientes = alertas.map((actual, i) =>
        i === indice ? valor : actual
      )
      onChange(siguientes)
    },
    [alertas, onChange]
  )

  const quitarIndice = useCallback(
    (indice: number) => {
      if (alertas.length <= 1) return
      setTocados({})
      onChange(alertas.filter((_, i) => i !== indice))
    },
    [alertas, onChange]
  )

  const agregarAviso = useCallback(() => {
    if (alertas.length >= MAX_AVISOS_PRESUPUESTO) return
    const nuevo = siguienteAviso(alertas)
    if (nuevo !== null) {
      onChange([...alertas, nuevo])
    }
  }, [alertas, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (TECLAS_NAVEGACION.has(e.key) || e.ctrlKey || e.metaKey) return
      if (!/[0-9]/.test(e.key)) e.preventDefault()
    },
    []
  )

  const handlePaste = useCallback(
    (indice: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      actualizarIndice(indice, parsearPorcentaje(text))
    },
    [actualizarIndice]
  )

  const errorResumen = validarAlertasFormulario(alertas)
  const resumenValido =
    errorResumen === null
      ? textoAvisos(alertas.filter((v): v is number => v !== null))
      : null

  return (
    <div className={styles.campo} data-modal-field>
      <button
        type="button"
        className={styles.cabeceraBtn}
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? 'Ocultar avisos de presupuesto'
            : 'Modificar avisos de presupuesto'
        }
      >
        <span className={styles.fieldLabel}>Avisarme cuando llegue al</span>
        <CollapseToggle expanded={expanded} as="div" />
      </button>

      {!expanded && (
        resumenValido ? (
          <p className={styles.resumenTexto}>{resumenValido}</p>
        ) : (
          <p className={styles.errorText}>{errorResumen}</p>
        )
      )}

      {expanded && (
        <div className={styles.contenidoColapsable}>
          <div className={styles.lista}>
            {alertas.map((porcentaje, indice) => {
              const errorFila = errorFilaAlerta(
                alertas,
                indice,
                mostrarErrores || Boolean(tocados[indice])
              )
              return (
                <div key={indice} className={styles.filaGrupo}>
                  <div className={styles.fila}>
                    <div
                      className={[
                        styles.inputBox,
                        errorFila ? styles.inputBoxError : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <input
                        id={`presupuesto-alerta-${indice}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={porcentaje === null ? '' : String(porcentaje)}
                        onChange={(e) =>
                          actualizarIndice(
                            indice,
                            parsearPorcentaje(e.target.value)
                          )
                        }
                        onKeyDown={handleKeyDown}
                        onPaste={(e) => handlePaste(indice, e)}
                        onBlur={() =>
                          setTocados((prev) => ({ ...prev, [indice]: true }))
                        }
                        placeholder="80"
                        className={styles.porcentajeField}
                        aria-label={`Porcentaje del aviso ${indice + 1}`}
                        aria-invalid={errorFila ? true : undefined}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <div
                        className={styles.porcentajeDivider}
                        aria-hidden="true"
                      />
                      <span
                        className={styles.porcentajeSuffix}
                        aria-hidden="true"
                      >
                        %
                      </span>
                    </div>

                    {alertas.length > 1 && (
                      <button
                        type="button"
                        className={styles.quitarBtn}
                        onClick={() => quitarIndice(indice)}
                        title={`Quitar aviso ${indice + 1}`}
                        aria-label={`Quitar aviso ${indice + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {errorFila && <p className={styles.errorText}>{errorFila}</p>}
                </div>
              )
            })}
          </div>

          {alertas.length < MAX_AVISOS_PRESUPUESTO && (
            <button
              type="button"
              className={styles.agregarBtn}
              onClick={agregarAviso}
            >
              <Plus size={14} strokeWidth={2.2} />
              <span>Agregar aviso</span>
            </button>
          )}

          <p className={styles.fieldHint}>
            Elegí de 1 a 3 avisos entre 10% y 100%.
          </p>
        </div>
      )}
    </div>
  )
}
