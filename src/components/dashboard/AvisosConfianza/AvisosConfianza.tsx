import { useState, useEffect, useCallback } from 'react'
import type { Billetera, ControlSaldoPreview, Frescura } from '@/types'
import { textoDatosViejos, textoPreguntaSaldo } from '@/utils/confianza'
import { getErrorMessage } from '@/utils/errorMessages'
import { nuevaClaveOperacion } from '@/services/api'
import { useModal } from '@/hooks/useModal'
import { sileo } from 'sileo'
import MontoInput from '@/components/ui/MontoInput/MontoInput'
import ActualizarSaldoModal from '@/components/billeteras/ActualizarSaldoModal'
import billeteraService from '@/services/billetera.service'
import categoriaService from '@/services/categoria.service'
import tarjetaService from '@/services/tarjeta.service'
import { AlertCircle, Wallet } from '@/components/ui/icons'
import styles from './AvisosConfianza.module.css'

interface AvisosConfianzaProps {
  frescura: Frescura | null
  onActualizado: () => void
}

export default function AvisosConfianza({ frescura, onActualizado }: AvisosConfianzaProps) {
  const { open } = useModal()
  const [billeteraPregunta, setBilleteraPregunta] = useState<Billetera | null>(null)
  const [monto, setMonto] = useState<number | null>(null)
  const [revisando, setRevisando] = useState(false)
  const [cargandoForm, setCargandoForm] = useState(false)
  const [oculta, setOculta] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewModal, setPreviewModal] = useState<ControlSaldoPreview | null>(null)

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

  // 1. Caso: Datos viejos
  if (frescura?.datos_viejos) {
    if (oculta) return null

    return (
      <div className={styles.container}>
        <div className={styles.datosViejosBox}>
          <div className={styles.leftGroup}>
            <div className={styles.iconBox}>
              <AlertCircle size={16} />
            </div>
            <p className={styles.datosViejosText}>
              {textoDatosViejos(frescura.dias_sin_cargar ?? 0)}
            </p>
          </div>
          <button
            type="button"
            className={styles.btnCargar}
            onClick={() => void abrirModalMovimiento()}
            disabled={cargandoForm}
          >
            {cargandoForm ? 'Abriendo...' : 'Cargar movimiento'}
          </button>
        </div>
      </div>
    )
  }

  // 2. Caso: Pregunta de saldo
  if (billeteraPregunta && !oculta) {
    const isMontoValid = monto !== null && !isNaN(monto) && monto >= 0

    const handleListo = async () => {
      if (!isMontoValid || monto === null || revisando) return

      setRevisando(true)
      try {
        const preview = await billeteraService.getControlSaldo(billeteraPregunta.id, monto)
        if (preview.guardar_directo) {
          await billeteraService.actualizarSaldo(
            billeteraPregunta.id,
            { saldo_declarado: preview.saldo_declarado, rendimiento: null },
            nuevaClaveOperacion()
          )
          setOculta(true)
          sileo.success({ title: 'Listo, tu saldo quedó al día.' })
          onActualizado()
        } else {
          setPreviewModal(preview)
          setModalOpen(true)
        }
      } catch (err: unknown) {
        sileo.error({
          title: getErrorMessage(err, 'No pudimos revisar el saldo. Probá de nuevo.'),
        })
      } finally {
        setRevisando(false)
      }
    }

    const handleSaltear = async () => {
      try {
        await billeteraService.saltearPreguntaSaldo(billeteraPregunta.id)
        setOculta(true)
      } catch (err: unknown) {
        sileo.error({
          title: getErrorMessage(err, 'No pudimos saltear la pregunta.'),
        })
      }
    }

    return (
      <>
        <div className={styles.container}>
          <div className={styles.preguntaSaldoBox}>
            <div className={styles.leftGroup}>
              <div className={styles.iconBox}>
                <Wallet size={16} />
              </div>
              <div className={styles.preguntaSaldoInfo}>
                <h4 className={styles.preguntaSaldoTitle}>
                  {textoPreguntaSaldo(billeteraPregunta.nombre)}
                </h4>
                <p className={styles.preguntaSaldoSubtitle}>
                  Así tus números quedan al día.
                </p>
              </div>
            </div>

            <div className={styles.preguntaSaldoForm}>
              <div className={styles.montoWrap}>
                <MontoInput
                  value={monto}
                  onChange={setMonto}
                  moneda={billeteraPregunta.moneda}
                  allowDecimals
                  size="sm"
                  compact
                  disabled={revisando}
                />
              </div>

              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={styles.btnListo}
                  onClick={() => void handleListo()}
                  disabled={!isMontoValid || revisando}
                >
                  {revisando ? 'Revisando...' : 'Listo'}
                </button>
                <button
                  type="button"
                  className={styles.btnSaltear}
                  onClick={() => void handleSaltear()}
                  disabled={revisando}
                >
                  Saltear
                </button>
              </div>
            </div>
          </div>
        </div>

        {modalOpen && (
          <ActualizarSaldoModal
            billetera={billeteraPregunta}
            isOpen={modalOpen}
            previewInicial={previewModal}
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

