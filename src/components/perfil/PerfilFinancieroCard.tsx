import React, { useCallback, useEffect, useState } from 'react'
import { sileo } from 'sileo'
import { AlertCircle, CheckCircle2, Info } from '@/components/ui/icons'
import { Button } from '@/components/ui'
import { getPerfilFinanciero } from '@/services/perfilFinanciero.service'
import { triggerBienvenidaFinancieraOnce } from '@/utils/bienvenidaFinancieraManager'
import { useModal } from '@/hooks/useModal'
import { getErrorMessage } from '@/utils/errorMessages'
import type { PerfilResumen } from '@/types'
import { armarVistaPerfil, type SugerenciaMetaPerfil } from './perfilVista'
import styles from './PerfilFinancieroCard.module.css'

interface PerfilFinancieroCardProps {
  data?: PerfilResumen | null
}

export const PerfilFinancieroCard: React.FC<PerfilFinancieroCardProps> = ({ data }) => {
  const [internalPerfil, setInternalPerfil] = useState<PerfilResumen | null>(null)
  const [internalLoading, setInternalLoading] = useState(data === undefined)
  const [error, setError] = useState(false)
  const { open } = useModal()

  const perfil = data !== undefined ? data : internalPerfil
  const loading = data !== undefined ? false : internalLoading

  const loadData = useCallback(async (signal?: AbortSignal) => {
    if (data !== undefined) return
    setError(false)
    try {
      const res = await getPerfilFinanciero(signal)
      setInternalPerfil(res)
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return
      }
      console.error('Error al cargar perfil financiero:', err)
      setError(true)
    } finally {
      setInternalLoading(false)
    }
  }, [data])

  useEffect(() => {
    if (data !== undefined) return
    const controller = new AbortController()
    const run = async () => {
      await Promise.resolve()
      if (controller.signal.aborted) return
      void loadData(controller.signal)
    }
    void run()
    return () => {
      controller.abort()
    }
  }, [data, loadData])

  useEffect(() => {
    if (perfil?.mostrar_modal_bienvenida) {
      triggerBienvenidaFinancieraOnce(open, 'perfil')
    }
  }, [perfil?.mostrar_modal_bienvenida, open])

  const recargar = useCallback(() => {
    void loadData()
  }, [loadData])

  const handleAbrirMeta = useCallback(
    (sugerencia: SugerenciaMetaPerfil) => {
      try {
        open('goal', {
          data: {
            goal: null,
            sugerencia,
            onSuccess: recargar,
          },
        })
      } catch (err: unknown) {
        sileo.error({
          title: getErrorMessage(err, 'No se pudo abrir el formulario. Probá de nuevo.'),
        })
      }
    },
    [open, recargar],
  )

  if (loading || error) {
    return null
  }

  const vista = armarVistaPerfil(perfil)
  if (!vista) {
    return null
  }

  return (
    <section className={styles.pfCard} aria-label={vista.titulo}>
      <div className={styles.pfCardHeader}>
        <h2 className={styles.pfTitle}>{vista.titulo}</h2>
        <button
          type="button"
          className={styles.pfInfoBtn}
          onClick={() => open('bienvenidaFinanciera', { data: { initialTab: 'perfil' } })}
          title="Ver explicación de tu perfil financiero"
          aria-label="Ver explicación de tu perfil financiero"
        >
          <Info size={14} />
        </button>
      </div>

      {vista.subtitulo && <p className={styles.pfSubtitulo}>{vista.subtitulo}</p>}
      {vista.resumen && <p className={styles.pfResumen}>{vista.resumen}</p>}

      {vista.aviso && (
        <div className={styles.pfAviso} role="alert">
          <AlertCircle size={16} />
          <span>{vista.aviso}</span>
        </div>
      )}

      <ul className={styles.pfList}>
        {vista.filas.map((fila) => (
          <li key={fila.id} className={styles.pfRow}>
            {fila.icono === 'bien' ? (
              <CheckCircle2
                size={20}
                className={styles.pfIconGood}
                role="img"
                aria-label={fila.etiquetaIcono ?? undefined}
              />
            ) : fila.icono === 'atencion' ? (
              <AlertCircle
                size={20}
                className={styles.pfIconWarn}
                role="img"
                aria-label={fila.etiquetaIcono ?? undefined}
              />
            ) : (
              <span className={styles.pfIconEmpty} aria-hidden="true" />
            )}

            <div className={styles.pfRowBody}>
              <h3 className={styles.pfRowTitle}>{fila.titulo}</h3>
              <p className={styles.pfRowText}>{fila.texto}</p>
              {fila.notas.map((nota, idx) => (
                <p key={idx} className={styles.pfRowNote}>
                  {nota}
                </p>
              ))}
              {fila.textoBoton && fila.sugerenciaMeta && (
                <div className={styles.pfRowAction}>
                  <Button
                    variant="secondary"
                    className={styles.actionBtn}
                    onClick={() => handleAbrirMeta(fila.sugerenciaMeta!)}
                  >
                    {fila.textoBoton}
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
