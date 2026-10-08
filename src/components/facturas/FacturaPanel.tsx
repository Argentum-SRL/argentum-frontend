import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Modal, Button, DateInput, SelectInput } from '@/components/ui'
import { AlertCircle, Loader2 } from '@/components/ui/icons'
import type { Factura, Billetera } from '@/types'
import facturaService from '@/services/factura.service'
import transaccionService from '@/services/transaccion.service'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import { sileo } from 'sileo'
import styles from './FacturaPanel.module.css'

interface FacturaPanelProps {
  isOpen: boolean
  onClose: () => void
  facturaId: string | null
  billeteras: Billetera[]
  onSuccess: () => void
}

function getTodayArgentina(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}

function getVencimientoTexto(fechaVencimiento: string): string {
  const hoyStr = getTodayArgentina()
  const partes = fechaVencimiento.split('-')
  const ddmm = partes.length === 3 ? `${partes[2]}/${partes[1]}` : fechaVencimiento

  if (fechaVencimiento === hoyStr) {
    return 'Vence hoy'
  }
  if (fechaVencimiento < hoyStr) {
    return `Venció el ${ddmm}`
  }
  return `Vence el ${ddmm}`
}

export const FacturaPanel: React.FC<FacturaPanelProps> = ({
  isOpen,
  onClose,
  facturaId,
  billeteras,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [factura, setFactura] = useState<Factura | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userSelectedBilleteraId, setUserSelectedBilleteraId] = useState<string>('')
  const [fechaPago, setFechaPago] = useState<string>(getTodayArgentina)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Cargar factura al abrir el panel (depende solo de isOpen y facturaId)
  useEffect(() => {
    if (!isOpen || !facturaId) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const cargar = async () => {
      setLoading(true)
      setError(null)
      setConfirmandoBorrado(false)
      setSubmitting(false)
      try {
        const facturas = await facturaService.listar(controller.signal)
        if (!isMounted) return

        const encontrada = facturas.find(f => f.id === facturaId)
        if (encontrada) {
          setFactura(encontrada)
          setFechaPago(getTodayArgentina())
        } else {
          setError('No encontramos la factura seleccionada.')
        }
      } catch (err) {
        if (!isMounted) return
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return
        }
        setError(getErrorMessage(err, 'No pudimos cargar los datos de la factura.'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void cargar()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [isOpen, facturaId])

  const billeterasValidas = useMemo(() => {
    if (!factura) return []
    return billeteras.filter(
      b => b.estado === 'activa' && b.moneda === factura.moneda && !b.es_inversion
    )
  }, [billeteras, factura])

  const principal = useMemo(() => {
    return billeterasValidas.find(b => b.es_principal) || billeterasValidas[0]
  }, [billeterasValidas])

  // La billetera por defecto se elige automáticamente si no hay selección de usuario o ya no es válida
  const selectedBilleteraId = useMemo(() => {
    if (userSelectedBilleteraId && billeterasValidas.some(b => b.id === userSelectedBilleteraId)) {
      return userSelectedBilleteraId
    }
    return principal?.id || ''
  }, [userSelectedBilleteraId, billeterasValidas, principal])

  const walletOptions = useMemo(() => {
    return billeterasValidas.map(b => ({
      value: b.id,
      label: `${b.nombre} (${formatMonto(b.saldo_actual, b.moneda)})`,
    }))
  }, [billeterasValidas])

  const handlePagar = useCallback(async () => {
    if (!factura) return

    if (!factura.categoria_id) {
      setError('No pude anotarla: falta la categoría.')
      return
    }

    if (!selectedBilleteraId) {
      setError('Tenés que seleccionar una billetera.')
      return
    }

    const billeteraElegida = billeteras.find(b => b.id === selectedBilleteraId)
    const metodoPago = billeteraElegida?.es_efectivo ? 'efectivo' : 'debito'

    setSubmitting(true)
    setError(null)

    try {
      await transaccionService.createTransaccion({
        tipo: 'egreso',
        monto: Number(factura.monto),
        moneda: factura.moneda,
        descripcion: factura.descripcion,
        categoria_id: factura.categoria_id,
        subcategoria_id: factura.subcategoria_id || null,
        billetera_id: selectedBilleteraId,
        fecha: fechaPago,
        metodo_pago: metodoPago,
        origen: 'manual',
        factura_id: factura.id,
      })

      sileo.success({ title: 'Listo, la anoté como gasto.' })
      onClose()
      onSuccess()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail
      setError(detail || getErrorMessage(err, 'No pudimos registrar el pago de la factura.'))
    } finally {
      setSubmitting(false)
    }
  }, [factura, selectedBilleteraId, billeteras, fechaPago, onClose, onSuccess])

  const handleDescartar = useCallback(async () => {
    if (!factura) return

    setSubmitting(true)
    setError(null)

    try {
      await facturaService.descartar(factura.id)
      sileo.success({ title: 'Listo, la saqué de tus próximos pagos.' })
      onClose()
      onSuccess()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail
      setError(detail || getErrorMessage(err, 'No pudimos borrar la factura.'))
    } finally {
      setSubmitting(false)
    }
  }, [factura, onClose, onSuccess])

  const handleDesmarcar = useCallback(async () => {
    if (!factura) return

    setSubmitting(true)
    setError(null)

    try {
      await facturaService.desmarcar(factura.id)
      sileo.success({ title: 'Listo, vuelve a estar pendiente.' })
      onClose()
      onSuccess()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail
      setError(detail || getErrorMessage(err, 'No pudimos desmarcar la factura.'))
    } finally {
      setSubmitting(false)
    }
  }, [factura, onClose, onSuccess])

  const categoriaSubcategoria = useMemo(() => {
    if (!factura?.categoria_nombre) return null
    if (factura.subcategoria_nombre) {
      return `${factura.categoria_nombre} · ${factura.subcategoria_nombre}`
    }
    return factura.categoria_nombre
  }, [factura])

  const tituloModal = factura ? `Factura de ${factura.descripcion}` : 'Factura'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tituloModal}
      size="sm"
    >
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingWrap}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {!loading && factura && (
          <>
            <div className={styles.headerMeta}>
              <div className={styles.monto}>
                {formatMonto(Number(factura.monto), factura.moneda)}
              </div>
              <div className={styles.subMeta}>
                <span>{getVencimientoTexto(factura.fecha_vencimiento)}</span>
                {categoriaSubcategoria && (
                  <>
                    <span className={styles.divider}>•</span>
                    <span>{categoriaSubcategoria}</span>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className={styles.errorBox} role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {factura.pagada_automaticamente ? (
              <div className={styles.autoPagadaBox}>
                <p className={styles.autoPagadaText}>
                  La marqué pagada sola porque cargaste un gasto por el mismo importe.
                </p>
                <Button
                  variant="secondary"
                  onClick={handleDesmarcar}
                  loading={submitting}
                  fullWidth
                >
                  No la pagué
                </Button>
              </div>
            ) : (
              <div className={styles.formSection}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="factura-billetera">
                    ¿Con qué la pagaste?
                  </label>
                  <SelectInput
                    id="factura-billetera"
                    value={selectedBilleteraId}
                    onChange={setUserSelectedBilleteraId}
                    options={walletOptions}
                    placeholder="Elegir billetera..."
                    disabled={submitting || billeterasValidas.length === 0}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="factura-fecha">
                    Fecha del pago
                  </label>
                  <DateInput
                    id="factura-fecha"
                    value={fechaPago}
                    onChange={setFechaPago}
                    disabled={submitting}
                  />
                </div>

                {confirmandoBorrado ? (
                  <div className={styles.confirmBox}>
                    <p className={styles.confirmText}>
                      ¿Seguro? Deja de aparecer en tus próximos pagos.
                    </p>
                    <div className={styles.confirmButtons}>
                      <Button
                        variant="danger"
                        onClick={handleDescartar}
                        loading={submitting}
                      >
                        Sí, borrar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmandoBorrado(false)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.actionsRow}>
                    <Button
                      variant="primary"
                      onClick={handlePagar}
                      loading={submitting}
                      disabled={billeterasValidas.length === 0}
                    >
                      Ya la pagué
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmandoBorrado(true)}
                      disabled={submitting}
                      className={styles.btnBorrar}
                    >
                      Borrar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!loading && !factura && error && (
          <div className={styles.errorBox} role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default FacturaPanel
