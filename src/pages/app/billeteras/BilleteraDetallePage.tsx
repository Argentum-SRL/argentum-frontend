import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CreditCard, Plus, Loader2, DollarSign } from 'lucide-react'
import type { Billetera, TarjetaCredito, Transaccion, Categoria } from '@/types'
import billeteraService from '@/services/billetera.service'
import tarjetaService from '@/services/tarjeta.service'
import transaccionService from '@/services/transaccion.service'
import categoriaService from '@/services/categoria.service'
import { Button } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import DayGroup from '@/components/transacciones/DayGroup'
import TarjetaCard from '@/components/tarjetas/TarjetaCard'
import TarjetaSummary from '@/components/tarjetas/TarjetaSummary'
import { PresionFuturaCard } from '@/components/tarjetas/PresionFuturaCard'
import { formatSaldo, getBankById, findBankByNombre, getBankLogoUrl, getInitials } from '@/lib/utils/billeteras.utils'
import styles from './BilleteraDetallePage.module.css'

const EFECTIVO_BG: Record<'ARS' | 'USD', string> = {
  ARS: 'linear-gradient(135deg, #1A3D28 0%, #0D2A1A 100%)',
  USD: 'linear-gradient(135deg, #0D2045 0%, #070f24 100%)',
}

const BilleteraDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { open, confirm } = useModal()

  const [billetera, setBilletera] = useState<Billetera | null>(null)
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
        const data = await billeteraService.getById(id, controller.signal)
        if (!controller.signal.aborted) {
          setBilletera(data)
        }
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
          return
        }
        console.error(error)
        showToast('Billetera no encontrada', 'error')
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
  }, [id, navigate, showToast])

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
          categoriaService.getCategorias(controller.signal),
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
        showToast('Error al cargar datos', 'error')
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
  }, [id, billetera?.id, showToast, checkUrlParams])

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
      const [txs, bill, cards] = await Promise.all([
        transaccionService.getTransacciones({ billetera_id: id }),
        billeteraService.getById(id),
        tarjetaService.getTarjetasPorBilletera(id)
      ])
      const movimientosBilletera = txs.filter(tx => tx.metodo_pago !== 'credito')
      setMovimientos(movimientosBilletera)
      setBilletera(bill)
      setTarjetas(cards)
      checkUrlParams(cards)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingData(false)
    }
  }, [id, checkUrlParams])

  const handleEditMovimiento = useCallback((txId: string) => {
    const tx = movimientos.find(t => t.id === txId)
    if (!tx || !billetera) return
    open('transaccion', {
      data: {
        transaccion: tx,
        billeteras: billeteras,
        categorias,
        tarjetas,
        onSuccess: refreshData,
      },
    })
  }, [movimientos, billetera, billeteras, categorias, tarjetas, open, refreshData])

  const handleDeleteMovimiento = useCallback((txId: string) => {
    const tx = movimientos.find(t => t.id === txId)
    if (!tx) return
    confirm({
      title: 'Eliminar transacción',
      description: '¿Estás seguro de que querés eliminar esta transacción? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          await transaccionService.deleteTransaccion(txId)
          showToast('Transacción eliminada', 'success')
          refreshData()
        } catch (e) {
          console.error(e)
          showToast('Error al eliminar la transacción', 'error')
        }
      },
    })
  }, [movimientos, confirm, showToast, refreshData])

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
      showToast('Error al cargar billeteras', 'error')
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
      showToast('Error al cargar billeteras', 'error')
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
          showToast('Tarjeta archivada', 'success')
          const data = await tarjetaService.getTarjetasPorBilletera(id!)
          setTarjetas(data)
        } catch (err: unknown) {
          const error = err as { response?: { data?: { detail?: string } } }
          showToast(error.response?.data?.detail || 'Error al archivar', 'error')
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
          showToast('Tarjeta eliminada', 'success')
          setTarjetas(tarjetas.filter(t => t.id !== tarjeta.id))
        } catch (err: unknown) {
          const error = err as { response?: { data?: { detail?: string } } }
          showToast(error.response?.data?.detail || 'No se puede eliminar una tarjeta con transacciones', 'error')
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

            {/* Nombre y detalle */}
            <div className={styles.headerIdentity}>
              <h1 className={`${styles.headerName} ${isLight ? styles.textLight : styles.textDark}`}>
                {billetera.nombre}
              </h1>
              <span className={`${styles.headerDetail} ${isLight ? styles.textLight : styles.textDark}`}>
                {billetera.es_principal && <span className={styles.principal}>Principal</span>}
                {billetera.moneda}
              </span>
            </div>
          </div>

          {/* Saldo */}
          <div className={styles.headerSaldo}>
            <span className={styles.headerSaldoLabel}>Saldo actual</span>
            <div className={`${styles.headerSaldoValue} ${isLight ? styles.textLight : styles.textDark}`}>
              {formatSaldo(billetera.saldo_actual, billetera.moneda)}
            </div>
          </div>
        </div>
      </div>

      {/* Switch de pestañas solo para mobile (solo si no es efectivo) */}
      {!billetera.es_efectivo && (
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'movimientos' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('movimientos')}
          >
            Movimientos
          </button>
          <button 
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
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CreditCard size={48} />
              </div>
              <h3 className={styles.emptyTitle}>Sin movimientos</h3>
              <p className={styles.emptyText}>
                Esta billetera aún no tiene transacciones registradas.
              </p>
            </div>
          ) : (
            <div className={styles.movimientosList}>
              {groupedMovimientos.map(([fecha, txs]) => (
                <DayGroup
                  key={fecha}
                  fecha={fecha}
                  transacciones={txs}
                  categorias={categorias}
                  billeteras={[billetera]}
                  onEdit={handleEditMovimiento}
                  onDelete={handleDeleteMovimiento}
                />
              ))}
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
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CreditCard size={48} />
                </div>
                <h3 className={styles.emptyTitle}>Sin tarjetas registradas</h3>
                <p className={styles.emptyText}>
                  Agregá una tarjeta para que el sistema calcule automáticamente los vencimientos de tus cuotas.
                </p>
                <Button onClick={handleCreateTarjeta}>Agregar tarjeta</Button>
              </div>
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

                {/* Resumen de la tarjeta seleccionada — solo si no es el slide ghost */}
                {tarjetas.length > 0 && selectedTarjetaIndex < tarjetas.length && (
                  <div className={styles.tarjetaSummary}>
                    <TarjetaSummary 
                      tarjeta={tarjetas[selectedTarjetaIndex]} 
                      billeteras={billeteras}
                      categorias={categorias}
                      todasLasTarjetas={tarjetas}
                      onRefresh={refreshData}
                      isExpanded={isResumenExpanded}
                      onToggleExpand={() => setIsResumenExpanded(!isResumenExpanded)}
                    />
                  </div>
                )}

                {/* Indicador de posición */}
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

                {/* Nuevo componente de presión financiera futura */}
                <PresionFuturaCard meses={6} />
              </>
            )}
          </section>
        )}
      </div>

    </div>
  )
}

export default BilleteraDetallePage
