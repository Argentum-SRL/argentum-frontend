import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import { Lightbulb } from '@/components/ui/icons'
import { ThumbsUp, ThumbsDown, BellOff } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Consejo, RespuestaConsejo } from '@/types'
import consejosService from '@/services/consejos.service'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from '../FinDeMesCard/FinDeMesCard.module.css'
import avisos from '../AvisosConfianza/AvisosConfianza.module.css'

export const ConsejoCard: React.FC = () => {
  const [consejo, setConsejo] = useState<Consejo | null>(null)
  const navigate = useNavigate()
  const { open } = useModal()

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    consejosService
      .getActual(controller.signal)
      .then((res) => {
        if (active && res?.consejo) {
          setConsejo(res.consejo)
        }
      })
      .catch(() => {
        // En caso de fallo o aborto se ignora y no se muestra tarjeta
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const handleResponder = useCallback(
    async (respuesta: RespuestaConsejo) => {
      if (!consejo) return
      try {
        await consejosService.responder(consejo.id, respuesta)
        setConsejo(null)
      } catch {
        sileo.error({ title: 'No pudimos guardar tu respuesta.' })
      }
    },
    [consejo],
  )

  const handleAccion = useCallback(async () => {
    if (!consejo?.accion) return

    if (consejo.accion === 'crear_meta') {
      const sugerencia = consejo.accion_datos
        ? {
            nombre: String(consejo.accion_datos.nombre || ''),
            monto_objetivo: Number(consejo.accion_datos.monto || 0),
            moneda: (consejo.accion_datos.moneda as 'ARS' | 'USD') || 'ARS',
          }
        : null

      open('goal', {
        data: {
          goal: null,
          sugerencia,
          onSuccess: () => {},
        },
      })
    } else if (consejo.accion === 'ver_movimientos') {
      navigate('/app/transacciones')
    } else if (consejo.accion === 'cargar_ingreso') {
      try {
        const [billeteras, categorias, tarjetas] = await Promise.all([
          billeteraService.list(),
          categoriaService.getCategorias(),
          tarjetaService.getTarjetas(),
        ])
        open('transaccion', {
          data: {
            transaccion: null,
            billeteras,
            categorias,
            tarjetas,
            tipoInicial: 'ingreso',
            onSuccess: () => {},
          },
        })
      } catch (err: unknown) {
        sileo.error({
          title: getErrorMessage(err, 'No pudimos abrir el formulario. Probá de nuevo.'),
        })
      }
    }
  }, [consejo, open, navigate])

  if (!consejo) {
    return null
  }

  const accionTexto = consejo.accion_texto

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Lightbulb size={18} className={styles.headerIcon} />
          <h2 className={styles.title}>Un dato para vos</h2>
        </div>
        <div className={styles.titleGroup}>
          <button
            type="button"
            className={avisos.closeBtn}
            onClick={() => void handleResponder('sirvio')}
            title="Me sirvió"
            aria-label="Me sirvió"
          >
            <ThumbsUp size={15} />
          </button>
          <button
            type="button"
            className={avisos.closeBtn}
            onClick={() => void handleResponder('no_sirve')}
            title="No me sirve"
            aria-label="No me sirve"
          >
            <ThumbsDown size={15} />
          </button>
          <button
            type="button"
            className={avisos.closeBtn}
            onClick={() => void handleResponder('no_avisar')}
            title="No me avises más de esto"
            aria-label="No me avises más de esto"
          >
            <BellOff size={15} />
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.subtitulo}>{consejo.texto}</p>
        {consejo.accion && accionTexto && (
          <div className={styles.titleGroup}>
            <Button variant="secondary" onClick={() => void handleAccion()}>
              {accionTexto}
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}

export default ConsejoCard

