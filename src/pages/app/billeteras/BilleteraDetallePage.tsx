import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CreditCard, Plus, Loader2, DollarSign, TrendingUp, Edit2, RefreshCw, Trash2 } from '@/components/ui/icons'
import type { Billetera, TarjetaCredito, Transaccion, Categoria, RendimientoEstimadoResponse, AjustesBilleteraResponse, AjusteSaldo } from '@/types'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { EmptyState } from '@/components/ui'
import { sileo } from 'sileo'
import { useModal } from '@/hooks/useModal'
import DayGroup from '@/components/transacciones/DayGroup'
import TarjetaCard from '@/components/tarjetas/TarjetaCard'
import TarjetaSummary from '@/components/tarjetas/TarjetaSummary'
import { PresionFuturaCard } from '@/components/tarjetas/PresionFuturaCard'
import RegistrarRendimientoModal from '@/components/billeteras/RegistrarRendimientoModal'
import ActualizarSaldoModal from '@/components/billeteras/ActualizarSaldoModal'
import { getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import { formatMonto } from '@/utils/format'
import { getErrorMessage } from '@/utils/errorMessages'
import styles from './BilleteraDetallePage.module.css'

function formatDiaMesAnio(fechaStr: string | null | undefined): string {
  if (!fechaStr) return ''
  const clean = fechaStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return clean
}

function formatDiaMes(fechaStr: string | null | undefined): string {
  if (!fechaStr) return ''
  const clean = fechaStr.split('T')[0]
  const parts = clean.split('-')
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return clean
}

const EFECTIVO_BG: Record<'ARS' | 'USD', string> = {
  ARS: 'linear-gradient(135deg, #1A3D28 0%, #0D2A1A 100%)',
  USD: 'linear-gradient(135deg, #0D2045 0%, #070f24 100%)',
}

const BilleteraDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { open, confirm } = useModal()

  const [billetera, setBilletera] = useState<Billetera | null>(null)
  const [rendimientoEstimado, setRendimientoEstimado] = useState<RendimientoEstimadoResponse | null>(null)
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false)
  const [isActualizarModalOpen, setIsActualizarModalOpen] = useState(false)
  const [ajustesData, setAjustesData] = useState<AjustesBilleteraResponse | null>(null)
  const [billeteras, setBilleteras] = useState<Billetera[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([])
  const [movimientos, setMovimientos] = useState<Transaccion[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedTarjetaIndex, setSelectedTarjetaIndex] = useState<number>(0)
  const [isResumenExpanded, setIsResumenExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'movimientos' | 'credito'>('movimientos')
  
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [logoErr, setLogoErr] = useState(false)
  const tarjetaIdParam = searchParams.get('tarjeta_id')

  // Función para manejar la selección de tarjeta desde URL
  const checkUrlParams = useCallback((cards: TarjetaCredito[]) => {
    if (tarjetaIdParam && cards.length > 0) {
      const idx = cards.findIndex(t => t.id === tarjetaIdParam)
      if (idx !== -1) {
        setSelectedTarjetaIndex(idx)
      }
    }
  }, [tarjetaIdParam])

  // Resetear la expansion al cambiar de tarjeta
  const [prevTarjetaIndex, setPrevTarjetaIndex] = useState(selectedTarjetaIndex)
  if (selectedTarjetaIndex !== prevTarjetaIndex) {
    setPrevTarjetaIndex(selectedTarjetaIndex)
    setIsResumenExpanded(false)
  }

  // Obtener información del banco para estilo
  const bank = useMemo(() => {
    if (!billetera) return undefined
    return billetera.bank_id
      ? getBankById(billetera.bank_id)
      : !billetera.es_efectivo
        ? findBankByNombre(billetera.nombre)
        : undefined
  }, [billetera])

  const logoUrl = useMemo(() => {
    return bank ? getBankLogoUrl(bank.logoPath) : ''
  }, [bank])

  const background = useMemo(() => {
    if (!billetera) return 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
    if (billetera.es_efectivo) {
      return EFECTIVO_BG[billetera.moneda] || 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
    } else if (bank?.gradiente) {
      return bank.gradiente || 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
    } else if (bank?.colorPrimario) {
      return bank.colorPrimario || 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
    } else {
      return 'linear-gradient(135deg, #0D2045 0%, #061228 100%)'
    }
  }, [billetera, bank])

  const isLight = !bank || bank.colorTexto === 'white'

  const headerCardRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      node.style.setProperty('--bdh-bg', background)
    }
  }, [background])

  // Cargar billetera inicial
  useEffect(() => {
    const controller = new AbortController()
    const loadBilletera = async () => {
      if (!id) return
      try {
        const [data, ajustesRes] = await Promise.all([
          billeteraService.getById(id, controller.signal),
          billeteraService.getAjustes(id, controller.signal),
        ])
        if (!controller.signal.aborted) {
          setBilletera(data)
          setAjustesData(ajustesRes)
          if (!data.es_efectivo && data.tna != null) {
            billeteraService.getRendimientoEstimado(data.id, controller.signal)
              .then(res => {
                if (!controller.signal.aborted) setRendimientoEstimado(res)
              })
              .catch(err => console.error(err))
          } else {
            setRendimientoEstimado(null)
          }
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
          return
        }
        console.error(error)
        sileo.error({ title: 'Billetera no encontrada' })
        navigate('/app/billeteras')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    loadBilletera()
    return () => {
      controller.abort()
    }
  }, [id, navigate])

  // Cargar datos según el tab activo
  useEffect(() => {
    if (!id || !billetera) return
    const controller = new AbortController()

    const loadTabData = async () => {
      setLoadingData(true)
      try {
        // Cargar movimientos (filtramos crédito ya que impactan vía Pago de Resumen)
        const [txs, cats, allBills] = await Promise.all([
          transaccionService.getTransacciones({ billetera_id: id }, controller.signal),
          categoriaService.getCategorias(),
          billeteraService.list(controller.signal)
        ])
        if (controller.signal.aborted) return

        const movimientosBilletera = txs.filter(tx => tx.metodo_pago !== 'credito')
        setMovimientos(movimientosBilletera)
        setCategorias(cats)
        setBilleteras(allBills)

        // Cargar tarjetas si no es efectivo
        if (billetera && !billetera.es_efectivo) {
          const data = await tarjetaService.getTarjetasPorBilletera(id, controller.signal)
          if (!controller.signal.aborted) {
            setTarjetas(data)
            checkUrlParams(data)
          }
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
          return
        }
        console.error(error)
        sileo.error({ title: 'Error al cargar datos' })
      } finally {
        if (!controller.signal.aborted) {
          setLoadingData(false)
        }
      }
    }

    loadTabData()
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, billetera?.id, checkUrlParams])

  // Agrupar movimientos por día
  const groupedMovimientos = useMemo(() => {
    const groups: Record<string, Transaccion[]> = {}
    movimientos.forEach(tx => {
      const date = tx.fecha.split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [movimientos])

  const refreshData = useCallback(async () => {
    if (!id) return
    setLoadingData(true)
    try {
      const [txs, bill, cards, ajustesRes] = await Promise.all([
        transaccionService.getTransacciones({ billetera_id: id }),
        billeteraService.getById(id),
        tarjetaService.getTarjetasPorBilletera(id),
        billeteraService.getAjustes(id),
      ])
      const movimientosBilletera = txs.filter(tx => tx.metodo_pago !== 'credito')
      setMovimientos(movimientosBilletera)
      setBilletera(bill)
      setTarjetas(cards)
      setAjustesData(ajustesRes)
      checkUrlParams(cards)
      if (!bill.es_efectivo && bill.tna != null) {
        try {
          const est = await billeteraService.getRendimientoEstimado(bill.id)
          setRendimientoEstimado(est)
        } catch (e) {
          console.error('Error al cargar rendimiento estimado', e)
        }
      } else {
        setRendimientoEstimado(null)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingData(false)
    }
  }, [id, checkUrlParams])

  const entidadNombre = useMemo(() => {
    const entId = rendimientoEstimado?.entidad_id || billetera?.bank_id || billetera?.entidad_efectiva
    if (entId) {
      const b = getBankById(entId)
      if (b) return b.nombre
    }
    return bank?.nombre || billetera?.nombre || ''
  }, [rendimientoEstimado?.entidad_id, billetera, bank])

  const handleUsarTasaAutomatica = useCallback(async () => {
    if (!billetera) return
    try {
      await billeteraService.update(billetera.id, { tna: null })
      sileo.success({ title: 'Tasa actualizada a la automática' })
      await refreshData()
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No pudimos actualizar la tasa.') })
    }
  }, [billetera, refreshData])

  const handleCargarMovimiento = useCallback((tipo?: 'egreso' | 'ingreso') => {
    if (!billetera) return
    open('transaccion', {
      data: {
        transaccion: null,
        billeteraInicialId: billetera.id,
        tipoInicial: tipo,
        billeteras,
        categorias,
        tarjetas,
        onSuccess: refreshData,
      },
    })
  }, [open, billetera, billeteras, categorias, tarjetas, refreshData])

  const handleEliminarAjuste = useCallback((ajuste: AjusteSaldo) => {
    if (!billetera) return
    const nombreBilletera = billetera.nombre

    const montoNum = ajuste.monto
    const cambio = -montoNum
    const cambioTexto = montoNum !== 0
      ? `El saldo de ${nombreBilletera} cambia en ${cambio > 0 ? '+' : ''}${formatMonto(cambio, billetera.moneda)}.`
      : ''

    confirm({
      title: '¿Borrar este control?',
      description: cambioTexto,
      variant: 'danger',
      confirmLabel: 'Borrar',
      onConfirm: async () => {
        try {
          await billeteraService.eliminarAjuste(billetera.id, ajuste.id)
          sileo.success({ title: 'Control eliminado' })
          await refreshData()
        } catch (err: unknown) {
          sileo.error({ title: getErrorMessage(err, 'No pudimos eliminar el control.') })
        }
      },
    })
  }, [billetera, confirm, refreshData])

  const handleEditarBilletera = useCallback(() => {
    if (!billetera) return
    open('editBilletera', {
      data: {
        billetera,
        billeteraPrincipalActual: billeteras.find((item) => item.es_principal),
        onEditar: async (billeteraId, payload) => {
          try {
            await billeteraService.update(billeteraId, payload)
            await refreshData()
            sileo.success({ title: 'Billetera actualizada exitosamente' })
          } catch (err: unknown) {
            sileo.error({ title: getErrorMessage(err, 'No pudimos actualizar la billetera.') })
          }
        },
      },
    })
  }, [billetera, billeteras, open, refreshData])

  const loadTarjetas = async () => {
    if (!id) return
    const data = await tarjetaService.getTarjetasPorBilletera(id)
    setTarjetas(data)
  }

  const handleCreateTarjeta = async () => {
    try {
      const allBilleteras = await billeteraService.list()
      open('tarjeta', {
        data: {
          tarjeta: null,
          billeteras: allBilleteras,
          billeteraId: id,
          onSuccess: loadTarjetas
        }
      })
    } catch (error: unknown) {
      console.error(error)
      sileo.error({ title: 'Error al cargar billeteras' })
    }
  }

  const handleEditTarjeta = async (tarjeta: TarjetaCredito) => {
    try {
      const allBilleteras = await billeteraService.list()
      open('tarjeta', {
        data: {
          tarjeta,
          billeteras: allBilleteras,
          onSuccess: loadTarjetas
        }
      })
    } catch (error: unknown) {
      console.error(error)
      sileo.error({ title: 'Error al cargar billeteras' })
    }
  }

  const handleArchiveTarjeta = async (tarjeta: TarjetaCredito) => {
    confirm({
      title: 'Archivar tarjeta',
      description: `¿Estás seguro de que querés archivar "${tarjeta.nombre}"?`,
      variant: 'warning',
      confirmLabel: 'Archivar',
      onConfirm: async () => {
        try {
          await tarjetaService.archivarTarjeta(tarjeta.id)
          sileo.success({ title: 'Tarjeta archivada' })
          const data = await tarjetaService.getTarjetasPorBilletera(id!)
          setTarjetas(data)
        } catch (err: unknown) {
          const error = err as { response?: { data?: { detail?: string } } }
          sileo.error({ title: error.response?.data?.detail || 'Error al archivar' })
        }
      }
    })
  }

  const handleDeleteTarjeta = async (tarjeta: TarjetaCredito) => {
    confirm({
      title: 'Eliminar tarjeta',
      description: `¿Estás seguro de que querés eliminar "${tarjeta.nombre}"? Esta acción no se puede deshacer y fallará si la tarjeta tiene transacciones.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await tarjetaService.deleteTarjeta(tarjeta.id)
          sileo.success({ title: 'Tarjeta eliminada' })
          setTarjetas(tarjetas.filter(t => t.id !== tarjeta.id))
        } catch (err: unknown) {
          const error = err as { response?: { data?: { detail?: string } } }
          sileo.error({ title: error.response?.data?.detail || 'No se puede eliminar una tarjeta con transacciones' })
        }
      }
    })
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  if (!billetera) return null

  return (
    <div className={styles.container}>
      <div 
        ref={headerCardRef}
        className={styles.headerCard}
      >
        {/* Fondo clipeado */}
        <div className={styles.headerBg}>
          <div className={styles.decoA} aria-hidden="true" />
          <div className={styles.decoB} aria-hidden="true" />
        </div>

        {/* Contenido del header adaptativo */}
        <div className={styles.headerInner}>
          <div className={styles.headerLeftCol}>
            {/* Back button */}
            <button 
              className={styles.backBtn} 
              onClick={() => navigate('/app/billeteras')}
              title="Volver a Billeteras"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Logo */}
            <div className={styles.headerLogo}>
              {billetera.es_efectivo ? (
                billetera.moneda === 'ARS'
                  ? <CreditCard size={20} strokeWidth={1.75} color="white" />
                  : <DollarSign size={20} strokeWidth={1.75} color="white" />
              ) : logoUrl && !logoErr ? (
                <img src={logoUrl} alt={bank?.nombre} onError={() => setLogoErr(true)} />
              ) : (
                <span className={styles.logoFallback}>
                  {getInitials(bank?.nombre ?? billetera.nombre)}
                </span>
              )}
            </div>

            {/* Nombre y badge */}
            <div className={styles.headerIdentity}>
              <h1 className={`${styles.headerName} ${isLight ? styles.textLight : styles.textDark}`}>
                {billetera.nombre}
              </h1>
              {billetera.es_principal && (
                <span className={`${styles.principal} ${isLight ? styles.textLight : styles.textDark}`}>
                  Principal
                </span>
              )}
            </div>

            <button
              type="button"
              className={styles.headerEditBtn}
              onClick={handleEditarBilletera}
              title="Editar billetera"
              aria-label="Editar billetera"
            >
              <Edit2 size={14} />
            </button>

            {billetera.estado !== 'archivada' && (
              <button
                type="button"
                className={styles.headerActualizarBtn}
                onClick={() => setIsActualizarModalOpen(true)}
                title="Actualizar saldo"
                aria-label="Actualizar saldo"
              >
                <RefreshCw size={13} />
                <span>Actualizar saldo</span>
              </button>
            )}
          </div>

          {/* Saldo */}
          <div className={styles.headerSaldo}>
            <span className={`${styles.headerSaldoLabel} ${isLight ? styles.textLight : styles.textDark}`}>
              Saldo actual
            </span>
            <div className={`${styles.headerSaldoValue} ${isLight ? styles.textLight : styles.textDark}`}>
              {formatMonto(billetera.saldo_actual, billetera.moneda)}
            </div>
          </div>
        </div>
      </div>

      {/* Bloque Rendimiento Estimado — solo si no es efectivo y billetera.tna existe */}
      {!billetera.es_efectivo && billetera.tna != null && (
        <section className={styles.rendimientoSection} aria-label="Rendimiento de la billetera">
          <div className={styles.rendimientoCard}>
            <div className={styles.rendimientoLeft}>
              <div className={styles.rendimientoIconCircle}>
                <TrendingUp size={20} strokeWidth={2.2} />
              </div>
              <div className={styles.rendimientoInfo}>
                <div className={styles.rendimientoHeaderRow}>
                  <span className={styles.rendimientoTitle}>Rendimiento estimado</span>
                  <span className={styles.rendimientoBadgeEstimado}>Estimado</span>
                  <span className={styles.rendimientoTnaTag}>TNA {billetera.tna}%</span>
                </div>
                <div className={styles.rendimientoMontoRow}>
                  <span className={styles.rendimientoMonto}>
                    +{formatMonto(rendimientoEstimado?.rendimiento_estimado ?? 0, billetera.moneda)}
                  </span>
                  <span className={styles.rendimientoDias}>
                    {rendimientoEstimado?.dias_transcurridos !== undefined
                      ? `en ${rendimientoEstimado.dias_transcurridos} día${rendimientoEstimado.dias_transcurridos === 1 ? '' : 's'}`
                      : 'calculando...'}
                  </span>
                </div>
                <div className={styles.rendimientoDisclaimer}>
                  {rendimientoEstimado?.tasa_vieja ? (
                    <span>
                      No tenemos la tasa actualizada de {entidadNombre} (último dato del {formatDiaMesAnio(rendimientoEstimado.fecha_dato_tasa)}). Cuando te paguen, anotalo con «Registrar rendimiento».
                    </span>
                  ) : rendimientoEstimado?.origen_tasa === 'manual' ? (
                    <div className={styles.rendimientoManualRow}>
                      <span>
                        {billetera.tna}% TNA · tasa que cargaste.
                        {rendimientoEstimado.tna_automatica != null && ` La de hoy de ${entidadNombre} es ${rendimientoEstimado.tna_automatica}%. `}
                      </span>
                      {rendimientoEstimado.tna_automatica != null && (
                        <button
                          type="button"
                          className={styles.usarAutomaticaBtn}
                          onClick={handleUsarTasaAutomatica}
                        >
                          Usar la automática
                        </button>
                      )}
                    </div>
                  ) : (
                    <span>
                      {billetera.tna}% TNA · tasa de hoy de {entidadNombre}
                      {rendimientoEstimado?.fecha_dato_tasa ? ` (dato del ${formatDiaMes(rendimientoEstimado.fecha_dato_tasa)})` : ''}
                      {rendimientoEstimado?.tope != null && rendimientoEstimado.tope > 0 ? `. Rinde hasta ${formatMonto(rendimientoEstimado.tope, billetera.moneda)}.` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.rendimientoAction}>
              <button
                type="button"
                className={styles.registrarRendimientoBtn}
                onClick={() => setIsRegistrarModalOpen(true)}
              >
                <Plus size={16} strokeWidth={2.5} />
                Registrar rendimiento
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Switch de pestañas solo para mobile (solo si no es efectivo) */}
      {!billetera.es_efectivo && (
        <div className={styles.tabsContainer} role="tablist" aria-label="Secciones de la billetera">
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'movimientos'}
            className={`${styles.tabBtn} ${activeTab === 'movimientos' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('movimientos')}
          >
            Movimientos
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'credito'}
            className={`${styles.tabBtn} ${activeTab === 'credito' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('credito')}
          >
            Crédito
          </button>
        </div>
      )}

      <div className={styles.contentGrid}>
        {/* Columna izquierda: Movimientos */}
        <section className={`${styles.movimientosSection} ${!billetera.es_efectivo && activeTab !== 'movimientos' ? styles.hiddenMobile : ''}`}>
          <h2 className={styles.sectionTitle}>Movimientos</h2>
          {loadingData ? (
            <div className={styles.tabLoading}>
              <Loader2 className="animate-spin" size={24} color="var(--text-3)" />
            </div>
          ) : movimientos.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Sin movimientos"
              description="Esta billetera aún no tiene transacciones registradas."
            />
          ) : (
            <div className={styles.movimientosList}>
              {groupedMovimientos.map(([fecha, txs]) => (
                <DayGroup
                  key={fecha}
                  fecha={fecha}
                  transacciones={txs}
                  categorias={categorias}
                  billeteras={[billetera]}
                  hideWallet={true}
                />
              ))}
            </div>
          )}
          {/* Sección Controles de Saldo — visible solo si hay ajustes */}
          {ajustesData && ajustesData.ajustes.length > 0 && (
            <div className={styles.controlesSection}>
              <h3 className={styles.controlesTitle}>Controles de saldo</h3>
              {ajustesData.cobertura.mostrar && ajustesData.cobertura.desde && (
                <p className={styles.coberturaFrase}>
                  Desde el {formatDiaMesAnio(ajustesData.cobertura.desde)}, de cada $100 que salieron de {billetera.nombre}, cargaste ${ajustesData.cobertura.por_cada_100}.
                </p>
              )}
              <div className={styles.controlesList}>
                {ajustesData.ajustes.map((ajuste) => {
                  const montoNum = ajuste.monto
                  const montoLabel = montoNum === 0
                    ? 'Sin diferencia'
                    : `Ajuste de ${montoNum > 0 ? '+' : ''}${formatMonto(montoNum, billetera.moneda)}`
                  return (
                    <div key={ajuste.id} className={styles.controlRow}>
                      <div className={styles.controlInfo}>
                        <span className={styles.controlFecha}>{formatDiaMesAnio(ajuste.fecha)}</span>
                        <span className={styles.controlMonto}>{montoLabel}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteControlBtn}
                        onClick={() => handleEliminarAjuste(ajuste)}
                        title="Borrar control"
                        aria-label="Borrar control"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Columna derecha: Tarjetas (solo si no es efectivo) */}
        {!billetera.es_efectivo && (
          <section className={`${styles.tarjetasSection} ${activeTab !== 'credito' ? styles.hiddenMobile : ''}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tarjetas de crédito</h2>
            </div>

            {loadingData ? (
              <div className={styles.tabLoading}>
                <Loader2 className="animate-spin" size={24} color="var(--text-3)" />
              </div>
            ) : tarjetas.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Sin tarjetas registradas"
                description="Agregá una tarjeta para que el sistema calcule automáticamente los vencimientos de tus cuotas."
                actionLabel="Agregar tarjeta"
                onActionClick={handleCreateTarjeta}
              />
            ) : (
              <>
                {/* Carousel de tarjetas */}
                <div className={`${styles.carouselContainer} ${isResumenExpanded ? styles.carouselContainerShrunk : ''}`}>
                  <button
                    className={styles.carouselBtn}
                    onClick={() => setSelectedTarjetaIndex((i) => (i - 1 + (tarjetas.length + 1)) % (tarjetas.length + 1))}
                    aria-label="Tarjeta anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className={styles.carouselPreview}>
                    {selectedTarjetaIndex < tarjetas.length ? (
                      <TarjetaCard
                        tarjeta={tarjetas[selectedTarjetaIndex]}
                        billetera={billetera}
                        onEdit={handleEditTarjeta}
                        onArchive={handleArchiveTarjeta}
                        onDelete={handleDeleteTarjeta}
                        isShrunk={isResumenExpanded}
                      />
                    ) : (
                      <div className={styles.nuevaTarjetaGhost} onClick={handleCreateTarjeta}>
                        <div className={styles.ghostInner}>
                          <Plus size={32} strokeWidth={1.5} />
                          <span>Nueva tarjeta</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className={styles.carouselBtn}
                    onClick={() => setSelectedTarjetaIndex((i) => (i + 1) % (tarjetas.length + 1))}
                    aria-label="Próxima tarjeta"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Indicador de posición del carrusel */}
                <div className={styles.carouselIndicator}>
                  {[...Array(tarjetas.length + 1)].map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.indicator} ${index === selectedTarjetaIndex ? styles.indicatorActive : ''}`}
                      onClick={() => setSelectedTarjetaIndex(index)}
                      aria-label={`Ir a slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Resumen de la tarjeta seleccionada — solo si no es el slide ghost */}
                {tarjetas.length > 0 && selectedTarjetaIndex < tarjetas.length && (
                  <div className={styles.tarjetaSummary}>
                    <TarjetaSummary 
                      tarjeta={tarjetas[selectedTarjetaIndex]} 
                      billeteras={billeteras}
                      onRefresh={refreshData}
                      isExpanded={isResumenExpanded}
                      onToggleExpand={() => setIsResumenExpanded(!isResumenExpanded)}
                    />
                  </div>
                )}

                {/* Componente de compromisos de cuotas futuras de la tarjeta actual */}
                {selectedTarjetaIndex < tarjetas.length && (
                  <PresionFuturaCard 
                    tarjetaId={tarjetas[selectedTarjetaIndex].id}
                    tarjetaNombre={tarjetas[selectedTarjetaIndex].nombre}
                    meses={6} 
                  />
                )}
              </>
            )}
          </section>
        )}
      </div>

      <RegistrarRendimientoModal
        isOpen={isRegistrarModalOpen}
        onClose={() => setIsRegistrarModalOpen(false)}
        onSuccess={(updated) => {
          setBilletera(updated)
          refreshData()
        }}
        billetera={billetera}
        rendimientoEstimado={rendimientoEstimado?.rendimiento_estimado}
      />

      <ActualizarSaldoModal
        billetera={billetera}
        isOpen={isActualizarModalOpen}
        onClose={() => setIsActualizarModalOpen(false)}
        onActualizado={refreshData}
        onCargarMovimiento={handleCargarMovimiento}
      />
    </div>
  )
}

export default BilleteraDetallePage
