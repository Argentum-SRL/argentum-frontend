import { useState, useEffect, useCallback } from 'react'
import type { Billetera, Frescura } from '@/types'
import { textoDatosViejos, textoPreguntaSaldo } from '@/utils/confianza'
import { getErrorMessage } from '@/utils/errorMessages'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import ActualizarSaldoModal from '@/components/billeteras/ActualizarSaldoModal'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import { AlertCircle, Wallet, X } from '@/components/ui/icons'
import styles from './AvisosConfianza.module.css'

interface AvisosConfianzaProps {
  frescura: Frescura | null
  onActualizado: () => void
}

export default function AvisosConfianza({ frescura, onActualizado }: AvisosConfianzaProps) {
  const { open } = useModal()
  const [billeteraPregunta, setBilleteraPregunta] = useState<Billetera | null>(null)
  const [cargandoForm, setCargandoForm] = useState(false)
  const [oculta, setOculta] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const abrirModalMovimiento = useCallback(async (tipoInicial?: 'egreso' | 'ingreso', billeteraInicialId?: string) => {
    setCargandoForm(true)
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
          billeteraInicialId,
          tipoInicial,
          onSuccess: onActualizado,
        },
      })
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos abrir el formulario. Probá de nuevo.'),
      })
    } finally {
      setCargandoForm(false)
    }
  }, [open, onActualizado])

  // Pedir pregunta de saldo solo si no hay datos viejos
  useEffect(() => {
    if (frescura?.datos_viejos) {
      return
    }

    let active = true
    const controller = new AbortController()

    billeteraService.getPreguntaSaldo(controller.signal)
      .then((res) => {
        if (active && res?.billetera) {
          setBilleteraPregunta(res.billetera)
        }
      })
      .catch(() => {
        // Error de red o falla puntual al consultar la pregunta de saldo se ignora en silencio
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [frescura?.datos_viejos])

  const handleSaltear = useCallback(async () => {
    if (!billeteraPregunta) return
    try {
      await billeteraService.saltearPreguntaSaldo(billeteraPregunta.id)
      setOculta(true)
    } catch (err: unknown) {
      sileo.error({
        title: getErrorMessage(err, 'No pudimos saltear la pregunta.'),
      })
    }
  }, [billeteraPregunta])

  // 1. Caso: Datos viejos
  if (frescura?.datos_viejos) {
    if (oculta) return null

    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.mainAction}
          onClick={() => void abrirModalMovimiento()}
          disabled={cargandoForm}
        >
          <div className={styles.iconBox}>
            <AlertCircle size={16} />
          </div>
          <div className={styles.textGroup}>
            <p className={styles.datosViejosText}>
              {textoDatosViejos(frescura.dias_sin_cargar ?? 0)}
            </p>
          </div>
        </button>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => setOculta(true)}
          aria-label="Cerrar aviso"
          title="Cerrar aviso"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  // 2. Caso: Pregunta de saldo
  if (billeteraPregunta && !oculta) {
    return (
      <>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.mainAction}
            onClick={() => setModalOpen(true)}
          >
            <div className={styles.iconBox}>
              <Wallet size={16} />
            </div>
            <div className={styles.textGroup}>
              <h4 className={styles.title}>
                {textoPreguntaSaldo(billeteraPregunta.nombre)}
              </h4>
              <p className={styles.subtitle}>
                Así tus números quedan al día.
              </p>
            </div>
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => void handleSaltear()}
            aria-label="Cerrar aviso"
            title="Cerrar aviso"
          >
            <X size={15} />
          </button>
        </div>

        {modalOpen && (
          <ActualizarSaldoModal
            billetera={billeteraPregunta}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onActualizado={() => {
              setOculta(true)
              setModalOpen(false)
              onActualizado()
            }}
            onCargarMovimiento={(tipo) => {
              setModalOpen(false)
              void abrirModalMovimiento(tipo, billeteraPregunta.id)
            }}
          />
        )}
      </>
    )
  }

  return null
}
