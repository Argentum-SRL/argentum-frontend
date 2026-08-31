import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import tarjetaService from '@/services/tarjeta.service'
import billeteraService from '@/services/billetera.service'
import importacionService from '@/services/importacionService'
import categoriaService from '@/services/categoria.service'
import UploadPdfResumen from './UploadPdfResumen'
import SeleccionTarjetaYBilletera from './SeleccionTarjetaYBilletera'
import ModalTitulares from './ModalTitulares'
import ModalBilleteraUSD from './ModalBilleteraUSD'
import ModalCargosBancarios from './ModalCargosBancarios'
import TablaPreviewImportacion from './TablaPreviewImportacion'
import ResultadoImportacion from './ResultadoImportacion'
import Button from '@/components/ui/Button/Button'
import type {
  TarjetaCredito,
  Billetera,
  Categoria,
  ProcesarResumenResponse,
  PreviewImportacionResponse,
  DecisionesImportacion,
  ConfirmarImportacionResponse,
  TransaccionConfirmarItem,
} from '@/types'
import styles from './ImportacionResumenSection.module.css'

export const ImportacionResumenSection: React.FC = () => {
  const { is_admin } = useAuth()
  const { showToast } = useToast()

  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [hasNoCards, setHasNoCards] = useState(false)

  // Estados del flujo
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingText, setLoadingText] = useState('Procesando el archivo de resumen...')

  // Datos del resumen procesado
  const [importacionResult, setImportacionResult] = useState<ProcesarResumenResponse | null>(null)

  // Selección de destino
  const [selectedTarjetaId, setSelectedTarjetaId] = useState('')
  const [selectedBilleteraId, setSelectedBilleteraId] = useState('')

  // Vista previa e importación decisiones (Parte 2A)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewImportacionResponse | null>(null)
  const [decisiones, setDecisiones] = useState<DecisionesImportacion>({
    titulares_seleccionados: null,
    billetera_usd_id: null,
    decision_cargos_bancarios: 'importar',
  })
  const [modalQueue, setModalQueue] = useState<('titulares' | 'billetera_usd' | 'cargos_bancarios')[]>([])
  const [currentModalIndex, setCurrentModalIndex] = useState<number | null>(null)

  // Estados de confirmación final (Parte 2B)
  const [transaccionesFinales, setTransaccionesFinales] = useState<TransaccionConfirmarItem[]>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [resultadoConfirmacion, setResultadoConfirmacion] = useState<ConfirmarImportacionResponse | null>(null)

  // Carga inicial y validación de tarjetas activas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true)
        const [tarjetasData, billeterasData, categoriasData] = await Promise.all([
          tarjetaService.getTarjetas(),
          billeteraService.list(),
          categoriaService.getCategorias(),
        ])

        const activas = tarjetasData.filter(t => t.estado === 'activa')
        setTarjetas(tarjetasData)
        setBilleteras(billeterasData)
        setCategorias(categoriasData)

        if (activas.length === 0) {
          setHasNoCards(true)
        }
      } catch (err) {
        console.error('Error al cargar datos de tarjetas/billeteras/categorías:', err)
        showToast('Error al inicializar los datos de importación.', 'error')
      } finally {
        setLoadingData(false)
      }
    }

    if (is_admin) {
      fetchData()
    }
  }, [is_admin, showToast])


  // Manejo del procesamiento del PDF
  const handleProcesarResumen = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setLoadingText('Procesando el archivo de resumen...')

    // Configurar temporizador para actualizar el mensaje a los 10 segundos
    const textTimer = setTimeout(() => {
      setLoadingText('Esto puede tardar un poco más de lo habitual con resúmenes grandes...')
    }, 10000)

    try {
      const response = await importacionService.procesarResumen(selectedFile)
      setImportacionResult(response)
      showToast('Resumen procesado con éxito.', 'success')
      setStep(2)
    } catch (err: unknown) {
      console.error('Error al procesar resumen:', err)
      const error = err as { response?: { data?: { detail?: { error?: { message?: string } } | string } } }
      const detail = typeof error.response?.data?.detail === 'object' && error.response?.data?.detail?.error?.message
        ? error.response.data.detail.error.message
        : (typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'No se pudo procesar el resumen. Verificá el archivo e intentá de nuevo.')
      showToast(detail, 'error')
    } finally {
      clearTimeout(textTimer)
      setIsProcessing(false)
    }
  }

  // Continuar desde el paso 2 y resolver los modales que hagan falta
  const handleContinuarFlujo = async () => {
    if (!selectedTarjetaId || !selectedBilleteraId) {
      showToast('Por favor, seleccioná una tarjeta y una billetera.', 'error')
      return
    }

    if (!importacionResult?.importacion_id) return

    try {
      setLoadingPreview(true)
      const preview = await importacionService.obtenerPreview(importacionResult.importacion_id, selectedTarjetaId)
      setPreviewData(preview)

      // Identificar qué modales de decisión corresponden
      const queue: ('titulares' | 'billetera_usd' | 'cargos_bancarios')[] = []
      if (preview.titulares_detectados && preview.titulares_detectados.length > 1) {
        queue.push('titulares')
      }
      if (preview.transacciones.some(t => t.moneda === 'USD')) {
        queue.push('billetera_usd')
      }
      if (preview.transacciones.some(t => t.es_cargo_bancario === true)) {
        queue.push('cargos_bancarios')
      }

      setModalQueue(queue)

      // Inicializar decisiones
      setDecisiones({
        titulares_seleccionados: preview.titulares_detectados || null,
        billetera_usd_id: null,
        decision_cargos_bancarios: 'importar',
      })

      if (queue.length > 0) {
        setCurrentModalIndex(0)
      } else {
        // Ningún modal requerido, avanzar directo a Step 3
        setCurrentModalIndex(null)
        setStep(3)
      }
    } catch (err: unknown) {
      console.error('Error al obtener la vista previa del resumen:', err)
      const error = err as { response?: { data?: { detail?: { error?: { message?: string } } | string } } }
      const detail = typeof error.response?.data?.detail === 'object' && error.response?.data?.detail?.error?.message
        ? error.response.data.detail.error.message
        : (typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Error al cargar la vista previa del resumen.')
      showToast(detail, 'error')
    } finally {
      setLoadingPreview(false)
    }
  }

  // Controladores de navegación entre modales de decisión
  const handleSiguienteModal = () => {
    if (currentModalIndex === null) return
    if (currentModalIndex === modalQueue.length - 1) {
      setCurrentModalIndex(null)
      setStep(3)
    } else {
      setCurrentModalIndex(currentModalIndex + 1)
    }
  }

  const handleAtrasModal = () => {
    if (currentModalIndex === null) return
    if (currentModalIndex === 0) {
      setCurrentModalIndex(null)
      setStep(2)
    } else {
      setCurrentModalIndex(currentModalIndex - 1)
    }
  }

  const handleConfirmarCancelacion = () => {
    if (window.confirm('¿Querés cancelar la importación completa? Se perderá todo el progreso y vas a volver a subir el archivo.')) {
      resetTodoElFlujo()
    }
  }

  const resetTodoElFlujo = () => {
    setSelectedFile(null)
    setImportacionResult(null)
    setPreviewData(null)
    setSelectedTarjetaId('')
    setSelectedBilleteraId('')
    setDecisiones({
      titulares_seleccionados: null,
      billetera_usd_id: null,
      decision_cargos_bancarios: 'importar',
    })
    setModalQueue([])
    setCurrentModalIndex(null)
    setTransaccionesFinales([])
    setResultadoConfirmacion(null)
    setStep(1)
  }

  const handleTablaChange = useCallback((items: TransaccionConfirmarItem[]) => {
    setTransaccionesFinales(items)
  }, [])

  const handleConfirmarImportacion = async () => {
    if (!importacionResult?.importacion_id) return

    const totalAImportar = transaccionesFinales.filter(t => t.incluir).length
    if (totalAImportar === 0) {
      showToast('No seleccionaste ninguna transacción para importar. Marcá al menos una para continuar o cancelá la operación.', 'info')
      return
    }

    setIsConfirming(true)
    try {
      const payload = {
        tarjeta_id: selectedTarjetaId,
        billetera_id: selectedBilleteraId,
        billetera_usd_id: decisiones.billetera_usd_id,
        titulares_seleccionados: decisiones.titulares_seleccionados,
        transacciones_finales: transaccionesFinales,
      }
      const res = await importacionService.confirmarImportacion(
        importacionResult.importacion_id,
        payload
      )
      setResultadoConfirmacion(res)
      showToast('Importación confirmada con éxito.', 'success')
    } catch (err: unknown) {
      console.error('Error al confirmar importación:', err)
      const error = err as { response?: { data?: { detail?: { error?: { message?: string } } | string } } }
      const detail = typeof error.response?.data?.detail === 'object' && error.response?.data?.detail?.error?.message
        ? error.response.data.detail.error.message
        : (typeof error.response?.data?.detail === 'string' ? error.response.data.detail : 'Error al confirmar la importación del resumen.')
      showToast(detail, 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // Si no es admin, no renderizar nada
  if (!is_admin) {
    return (
      <div className={styles.blockingCard}>
        <div className={styles.warningIconContainer}>
          <ShieldAlert size={26} />
        </div>
        <h3 className={styles.blockingTitle}>Acceso denegado</h3>
        <p className={styles.blockingText}>
          No tenés permisos de administrador para utilizar esta herramienta.
        </p>
      </div>
    )
  }

  // Estado de carga inicial
  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={36} className={styles.spinner} />
        <p className={styles.loadingTitle}>Verificando tus tarjetas activas...</p>
      </div>
    )
  }

  // Mensaje bloqueante si no tiene tarjetas de crédito activas
  if (hasNoCards) {
    return (
      <div className={styles.blockingCard}>
        <div className={styles.warningIconContainer}>
          <AlertTriangle size={26} />
        </div>
        <h3 className={styles.blockingTitle}>No se detectaron tarjetas activas</h3>
        <p className={styles.blockingText}>
          Para importar un resumen, primero necesitás tener al menos una tarjeta de crédito activa en tu cuenta.
          <br /><br />
          Para crear una, andá a la sección de <strong>Billeteras</strong>, seleccioná la billetera correspondiente y creá la tarjeta de crédito desde allí.
        </p>
      </div>
    )
  }

  // Pantalla de carga durante procesamiento
  if (isProcessing) {
    return (
      <div className={`${styles.formContainer} ${styles.loadingContainer}`}>
        <Loader2 size={36} className={styles.spinner} />
        <p className={styles.loadingTitle}>Analizando tu resumen</p>
        <p className={styles.loadingDesc}>{loadingText}</p>
      </div>
    )
  }

  // Pantalla de carga de la vista previa
  if (loadingPreview) {
    return (
      <div className={`${styles.formContainer} ${styles.loadingContainer}`}>
        <Loader2 size={36} className={styles.spinner} />
        <p className={styles.loadingTitle}>Cargando vista previa...</p>
        <p className={styles.loadingDesc}>Estamos leyendo las transacciones del resumen.</p>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${step === 3 && !resultadoConfirmacion ? styles.containerStep3 : ''}`}>
      {resultadoConfirmacion ? (
        <ResultadoImportacion
          resultado={resultadoConfirmacion}
          onReset={resetTodoElFlujo}
        />
      ) : (
        <div className={styles.formContainer}>
          {/* Step Indicator Dots */}
          <div className={styles.stepDots}>
            <div className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : styles.stepDotInactive}`} />
            <div className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : styles.stepDotInactive}`} />
            <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : styles.stepDotInactive}`} />
          </div>

          <div className={styles.formHeader}>
            {step === 2 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
                title="Atrás"
              >
                &larr;
              </button>
            )}
            <h2 className={styles.headerTitle}>
              {step === 1 && 'Subir resumen de tarjeta'}
              {step === 2 && 'Vincular tarjeta y billetera'}
              {step === 3 && 'Revisar transacciones'}
            </h2>
            <span className={styles.adminBadge}>Panel Admin</span>
          </div>

          <div className={styles.formBody}>
            {step === 1 && (
              <UploadPdfResumen
                selectedFile={selectedFile}
                onFileSelected={setSelectedFile}
              />
            )}

            {step === 2 && (
              <SeleccionTarjetaYBilletera
                tarjetas={tarjetas}
                billeteras={billeteras}
                selectedTarjetaId={selectedTarjetaId}
                selectedBilleteraId={selectedBilleteraId}
                onChangeTarjetaId={setSelectedTarjetaId}
                onChangeBilleteraId={setSelectedBilleteraId}
              />
            )}

            {step === 3 && previewData && (
              <div className={styles.previewContainer}>
                {/* Resumen compacto de vinculación */}
                <div className={styles.metaGrid}>
                  <div>
                    <span className={styles.metaItemLabel}>Banco:</span>{' '}
                    <strong className={styles.metaItemValue}>{importacionResult?.banco_detectado || 'No detectado'}</strong>
                  </div>
                  <div>
                    <span className={styles.metaItemLabel}>Tarjeta:</span>{' '}
                    <strong className={styles.metaItemValue}>{tarjetas.find(t => t.id === selectedTarjetaId)?.nombre || selectedTarjetaId}</strong>
                  </div>
                  <div>
                    <span className={styles.metaItemLabel}>Billetera ARS:</span>{' '}
                    <strong className={styles.metaItemValue}>{billeteras.find(b => b.id === selectedBilleteraId)?.nombre || selectedBilleteraId}</strong>
                  </div>
                  {decisiones.billetera_usd_id && (
                    <div>
                      <span className={styles.metaItemLabel}>Billetera USD:</span>{' '}
                      <strong className={styles.metaItemValue}>{billeteras.find(b => b.id === decisiones.billetera_usd_id)?.nombre || decisiones.billetera_usd_id}</strong>
                    </div>
                  )}
                </div>

                {/* Tabla de Preview */}
                <TablaPreviewImportacion
                  key={`${importacionResult?.importacion_id}-${decisiones.billetera_usd_id || ''}-${decisiones.decision_cargos_bancarios || ''}-${decisiones.titulares_seleccionados?.join(',') || ''}`}
                  transacciones={previewData.transacciones}
                  decisiones={decisiones}
                  categorias={categorias}
                  onChange={handleTablaChange}
                />
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            {step === 1 && (
              <>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setSelectedFile(null)}
                  disabled={!selectedFile}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleProcesarResumen}
                  disabled={!selectedFile}
                >
                  Procesar resumen
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setStep(1)}
                >
                  Atrás
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleContinuarFlujo}
                >
                  Continuar
                </button>
              </>
            )}

            {step === 3 && (
              <div className={styles.actionGroup}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleConfirmarCancelacion}
                  disabled={isConfirming}
                >
                  Cancelar
                </button>
                <Button
                  onClick={handleConfirmarImportacion}
                  loading={isConfirming}
                  disabled={isConfirming}
                  variant="primary"
                >
                  Confirmar importación
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renders secuenciales de los Modales de Decisión (Parte 2A) */}
      {currentModalIndex !== null && modalQueue[currentModalIndex] === 'titulares' && (
        <ModalTitulares
          isOpen={true}
          onClose={handleConfirmarCancelacion}
          titulares={previewData?.titulares_detectados || []}
          seleccionados={decisiones.titulares_seleccionados || []}
          onChange={seleccionados =>
            setDecisiones(prev => ({ ...prev, titulares_seleccionados: seleccionados }))
          }
          onConfirm={handleSiguienteModal}
          onBack={handleAtrasModal}
          onCancelImport={handleConfirmarCancelacion}
          currentStep={currentModalIndex}
          totalSteps={modalQueue.length}
        />
      )}

      {currentModalIndex !== null && modalQueue[currentModalIndex] === 'billetera_usd' && (
        <ModalBilleteraUSD
          isOpen={true}
          onClose={handleConfirmarCancelacion}
          billeteras={billeteras}
          selectedBilleteraUsdId={decisiones.billetera_usd_id}
          onChange={id =>
            setDecisiones(prev => ({ ...prev, billetera_usd_id: id }))
          }
          onConfirm={handleSiguienteModal}
          onBack={handleAtrasModal}
          onCancelImport={handleConfirmarCancelacion}
          currentStep={currentModalIndex}
          totalSteps={modalQueue.length}
        />
      )}

      {currentModalIndex !== null && modalQueue[currentModalIndex] === 'cargos_bancarios' && (
        <ModalCargosBancarios
          isOpen={true}
          onClose={handleConfirmarCancelacion}
          decision={decisiones.decision_cargos_bancarios}
          onChange={decision =>
            setDecisiones(prev => ({ ...prev, decision_cargos_bancarios: decision }))
          }
          onConfirm={handleSiguienteModal}
          onBack={handleAtrasModal}
          onCancelImport={handleConfirmarCancelacion}
          currentStep={currentModalIndex}
          totalSteps={modalQueue.length}
        />
      )}
    </div>
  )
}

export default ImportacionResumenSection
