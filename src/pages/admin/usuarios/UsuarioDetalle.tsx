import React, { useState } from 'react'
import { sileo } from 'sileo'
import { Activity, ArrowLeft, ShieldCheck, Wallet, X } from '@/components/ui/icons'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import { AdminUsuarioDetalleSkeleton, AyudaBoton, EmptyState } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import adminService from '@/services/adminService'
import { getErrorMessage } from '@/utils/errorMessages'
import { formatMonto } from '@/utils/format'
import {
  AYUDA_COSTO_ESTIMADO,
  estadoVisual,
  explicacionEstado,
  formatearCantidad,
  tiempoRelativo,
  type TonoEstadoAdmin,
} from '@/utils/admin'
import type { ReauthPayload, UsuarioAdmin } from '@/types/admin'
import AvatarUsuario from './AvatarUsuario'
import IdentidadModal, { type ModoIdentidadAdmin } from './IdentidadModal'
import styles from './UsuariosPanel.module.css'

interface UsuarioDetalleProps {
  usuario: UsuarioAdmin | null
  loading: boolean
  error: string | null
  onBackMobile: () => void
  onCloseDesktop: () => void
  onRetry: () => void
  onUsuarioUpdated: (usuario: UsuarioAdmin) => void
  onUsuarioDeleted: (id: string) => void
}

const PASOS_INICIO: Record<string, string> = {
  datos_personales: 'Datos personales',
  ciclo_financiero: 'Ciclo financiero',
  moneda: 'Moneda',
}

function formatearFechaRegistro(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

function claseDotTono(tono: TonoEstadoAdmin): string {
  switch (tono) {
    case 'bien':
      return styles.dotBien
    case 'info':
      return styles.dotInfo
    case 'mal':
      return styles.dotMal
    case 'apagado':
      return styles.dotApagado
    case 'aviso':
    default:
      return styles.dotAviso
  }
}

export const UsuarioDetalle: React.FC<UsuarioDetalleProps> = ({
  usuario,
  loading,
  error,
  onBackMobile,
  onCloseDesktop,
  onRetry,
  onUsuarioUpdated,
  onUsuarioDeleted,
}) => {
  const { usuario: adminActual } = useAuth()
  const [confirmTipo, setConfirmTipo] = useState<'sesiones' | 'wpp' | 'suspender' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [identidadModo, setIdentidadModo] = useState<ModoIdentidadAdmin | null>(null)
  const [identidadLoading, setIdentidadLoading] = useState(false)
  const [identidadError, setIdentidadError] = useState<string | null>(null)

  const [accionDirecta, setAccionDirecta] = useState<'reset' | 'reactivar' | null>(null)

  if (loading) {
    return (
      <div className={styles.detailStack}>
        <button type="button" className={styles.backMobileBtn} onClick={onBackMobile}>
          <ArrowLeft size={16} />
          <span>Usuarios</span>
        </button>
        <AdminUsuarioDetalleSkeleton />
      </div>
    )
  }

  if (error || !usuario) {
    return (
      <div className={styles.detailStack}>
        <button type="button" className={styles.backMobileBtn} onClick={onBackMobile}>
          <ArrowLeft size={16} />
          <span>Usuarios</span>
        </button>
        <div className={styles.sectionCard}>
          <EmptyState
            variant="compact"
            title={error || 'No se pudo cargar el usuario.'}
            actionLabel="Reintentar"
            onActionClick={onRetry}
          />
        </div>
      </div>
    )
  }

  const nombreCompleto =
    [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim() ||
    usuario.email ||
    'Sin nombre'
  const esMismoAdmin = adminActual?.id === usuario.id
  const estaSuspendida = usuario.estado_cuenta === 'suspendida'
  const ahora = new Date()
  const estadoDet = estadoVisual(usuario.estado_visible)
  const dotClsEncabezado = claseDotTono(estadoDet.tono)

  const pasoInicioLabel = usuario.paso_onboarding_actual
    ? PASOS_INICIO[usuario.paso_onboarding_actual] || usuario.paso_onboarding_actual
    : null
  const textoInicio = usuario.onboarding_completado
    ? 'Completo'
    : pasoInicioLabel
    ? `Sin terminar: ${pasoInicioLabel}`
    : 'Sin terminar'

  const costo = usuario.costo_mes
  const totalArs = costo ? costo.total_ars : usuario.costo_mes_ars

  const handleMandarMail = async () => {
    try {
      setAccionDirecta('reset')
      await adminService.resetPassword(usuario.id)
      sileo.success({ title: 'Mail para cambiar la contraseña enviado.' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo hacer el cambio. Probá de nuevo.') })
    } finally {
      setAccionDirecta(null)
    }
  }

  const handleReactivar = async () => {
    try {
      setAccionDirecta('reactivar')
      const res = await adminService.cambiarEstado(usuario.id, true)
      onUsuarioUpdated(res.data)
      sileo.success({ title: 'Cuenta reactivada.' })
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo hacer el cambio. Probá de nuevo.') })
    } finally {
      setAccionDirecta(null)
    }
  }

  const handleConfirm = async () => {
    if (!confirmTipo) return
    try {
      setConfirmLoading(true)
      if (confirmTipo === 'sesiones') {
        await adminService.revocarSesiones(usuario.id)
        sileo.success({ title: 'Sesiones cerradas.' })
      } else if (confirmTipo === 'wpp') {
        const res = await adminService.desconectarWpp(usuario.id)
        onUsuarioUpdated(res.data)
        sileo.success({ title: 'WhatsApp desconectado.' })
      } else if (confirmTipo === 'suspender') {
        const res = await adminService.cambiarEstado(usuario.id, false)
        onUsuarioUpdated(res.data)
        sileo.success({ title: 'Cuenta suspendida.' })
      }
      setConfirmTipo(null)
    } catch (err: unknown) {
      sileo.error({ title: getErrorMessage(err, 'No se pudo hacer el cambio. Probá de nuevo.') })
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleIdentidadSubmit = async ({
    reauth,
    emailConfirmacion,
  }: {
    reauth: ReauthPayload
    emailConfirmacion?: string
  }) => {
    if (!identidadModo) return
    try {
      setIdentidadLoading(true)
      setIdentidadError(null)
      if (identidadModo === 'hacer_admin' || identidadModo === 'quitar_admin') {
        const hacer = identidadModo === 'hacer_admin'
        const res = await adminService.cambiarRolAdmin(usuario.id, hacer, reauth)
        onUsuarioUpdated(res.data)
        setIdentidadModo(null)
        sileo.success({ title: hacer ? 'Permisos de admin dados.' : 'Permisos de admin quitados.' })
      } else if (identidadModo === 'eliminar') {
        await adminService.eliminarCuenta(usuario.id, emailConfirmacion || '', reauth)
        const eliminadoId = usuario.id
        setIdentidadModo(null)
        sileo.success({ title: 'Cuenta eliminada.' })
        onUsuarioDeleted(eliminadoId)
      }
    } catch (err: unknown) {
      setIdentidadError(getErrorMessage(err, 'No se pudo hacer el cambio. Probá de nuevo.'))
    } finally {
      setIdentidadLoading(false)
    }
  }

  return (
    <div className={styles.detailStack}>
      <button type="button" className={styles.backMobileBtn} onClick={onBackMobile}>
        <ArrowLeft size={16} />
        <span>Usuarios</span>
      </button>

      <section className={styles.sectionCard}>
        <div className={styles.detailHeader}>
          <div className={styles.detailUserWrap}>
            <AvatarUsuario
              fotoUrl={usuario.foto_url}
              nombre={usuario.nombre}
              apellido={usuario.apellido}
              email={usuario.email}
              tamano={48}
            />
            <div className={styles.detailTitleCol}>
              <h2 className={styles.detailName}>{nombreCompleto}</h2>
              <p className={styles.detailEmail}>{usuario.email || 'Sin email'}</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCloseDesktop}
            aria-label="Cerrar panel de usuario"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.detailMetaLine}>
          <span className={styles.estadoInline}>
            <span className={`${styles.statusDot} ${dotClsEncabezado}`} aria-hidden="true" />
            <span>{estadoDet.texto}</span>
          </span>
          <span>{usuario.whatsapp_vinculado ? 'Con WhatsApp' : 'Sin WhatsApp'}</span>
          {usuario.is_admin && <span>Admin</span>}
          <span>Se registró el {formatearFechaRegistro(usuario.created_at)}</span>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Activity size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Uso</h3>
          </div>
        </div>

        <div className={styles.infoRows}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estado</span>
            <div className={styles.infoValStack}>
              <span className={styles.infoVal}>{estadoDet.texto}</span>
              <span className={styles.infoSubval}>
                {explicacionEstado(usuario.estado_visible)}
              </span>
            </div>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>En la web</span>
            <span className={styles.infoVal}>{tiempoRelativo(usuario.ultimo_uso_web, ahora)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Por WhatsApp</span>
            <span className={styles.infoVal}>
              {tiempoRelativo(usuario.ultimo_uso_whatsapp, ahora)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Movimientos este mes</span>
            <span className={styles.infoVal}>{formatearCantidad(usuario.movimientos_mes)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Inicio de la app</span>
            <span className={styles.infoVal}>{textoInicio}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Teléfono</span>
            <span className={styles.infoVal}>{usuario.telefono || 'Sin teléfono'}</span>
          </div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <Wallet size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Costo estimado este mes</h3>
          </div>
          <AyudaBoton
            titulo={AYUDA_COSTO_ESTIMADO.titulo}
            texto={AYUDA_COSTO_ESTIMADO.texto}
          />
        </div>

        <div className={styles.costBlock}>
          <span className={styles.bigCost}>{formatMonto(totalArs, 'ARS')}</span>
          {costo ? (
            <div className={styles.costLines}>
              <p className={styles.costSubline}>
                {!costo.sin_dolar && costo.ia_ars !== null && costo.dolar_oficial !== null
                  ? `IA: ${formatMonto(costo.ia_usd, 'USD')} (unos ${formatMonto(costo.ia_ars, 'ARS')} al dólar oficial de ${formatMonto(costo.dolar_oficial, 'ARS')})`
                  : `IA: ${formatMonto(costo.ia_usd, 'USD')} (falta el dólar del día)`}
              </p>
              <p className={styles.costSubline}>
                {costo.whatsapp_cobrados === 0
                  ? 'WhatsApp: sin mensajes cobrados'
                  : costo.whatsapp_cobrados === 1
                  ? `WhatsApp: 1 mensaje cobrado (${formatMonto(costo.whatsapp_ars, 'ARS')})`
                  : `WhatsApp: ${costo.whatsapp_cobrados} mensajes cobrados (${formatMonto(costo.whatsapp_ars, 'ARS')})`}
              </p>
            </div>
          ) : (
            <p className={styles.costSubline}>Sin consumo registrado este mes</p>
          )}
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconWrap}>
            <ShieldCheck size={18} />
          </div>
          <div className={styles.sectionHeaderText}>
            <h3>Acciones</h3>
          </div>
        </div>

        <div className={styles.actionsStack}>
          <div className={styles.securityRow}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Cambiar contraseña</span>
              <span className={styles.rowSubtitle}>
                {usuario.tiene_contrasena
                  ? 'Le llega un mail para elegir una nueva.'
                  : 'Entra con Google: no tiene contraseña.'}
              </span>
            </div>
            {usuario.tiene_contrasena && (
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={accionDirecta === 'reset'}
                  onClick={() => void handleMandarMail()}
                >
                  {accionDirecta === 'reset' ? 'Enviando...' : 'Mandar mail'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.securityRow}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Cerrar sus sesiones</span>
              <span className={styles.rowSubtitle}>
                Va a tener que volver a entrar en todos sus dispositivos.
              </span>
            </div>
            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={esMismoAdmin}
                title={esMismoAdmin ? 'Para cerrar tu sesión usá Salir' : undefined}
                onClick={() => setConfirmTipo('sesiones')}
              >
                Cerrar sesiones
              </button>
            </div>
          </div>

          {usuario.whatsapp_vinculado && (
            <div className={styles.securityRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>WhatsApp</span>
                <span className={styles.rowSubtitle}>
                  Desvincula su número. Lo puede volver a vincular cuando quiera.
                </span>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setConfirmTipo('wpp')}
                >
                  Desconectar
                </button>
              </div>
            </div>
          )}

          <div className={styles.securityRow}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Permisos de admin</span>
              <span className={styles.rowSubtitle}>
                {usuario.is_admin
                  ? 'Hoy puede entrar a este panel.'
                  : 'Puede entrar a este panel y hacer estas acciones.'}
              </span>
            </div>
            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={esMismoAdmin && usuario.is_admin}
                onClick={() => {
                  setIdentidadError(null)
                  setIdentidadModo(usuario.is_admin ? 'quitar_admin' : 'hacer_admin')
                }}
              >
                {usuario.is_admin ? 'Quitar admin' : 'Hacer admin'}
              </button>
            </div>
          </div>

          <div className={styles.securityRow}>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>
                {estaSuspendida ? 'Reactivar cuenta' : 'Suspender cuenta'}
              </span>
              <span className={styles.rowSubtitle}>
                {estaSuspendida
                  ? 'Va a poder volver a entrar.'
                  : 'No va a poder entrar hasta que la reactives.'}
              </span>
            </div>
            <div className={styles.rowActions}>
              {estaSuspendida ? (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={esMismoAdmin || accionDirecta === 'reactivar'}
                  onClick={() => void handleReactivar()}
                >
                  {accionDirecta === 'reactivar' ? 'Reactivando...' : 'Reactivar'}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={esMismoAdmin}
                  onClick={() => setConfirmTipo('suspender')}
                >
                  Suspender
                </button>
              )}
            </div>
          </div>

          <div className={styles.deleteSeparator}>
            <div className={styles.securityRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Eliminar cuenta</span>
                <span className={styles.rowSubtitle}>
                  Borra la cuenta y todos sus datos. No se puede deshacer.
                </span>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.btnDanger}
                  disabled={esMismoAdmin}
                  onClick={() => {
                    setIdentidadError(null)
                    setIdentidadModo('eliminar')
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmTipo === 'sesiones'}
        onClose={() => setConfirmTipo(null)}
        onConfirm={handleConfirm}
        title={`¿Cerrás las sesiones de ${nombreCompleto}?`}
        description="Va a tener que volver a entrar."
        confirmLabel="Cerrar sesiones"
        variant="warning"
        isLoading={confirmLoading}
      />

      <ConfirmModal
        isOpen={confirmTipo === 'wpp'}
        onClose={() => setConfirmTipo(null)}
        onConfirm={handleConfirm}
        title={`¿Desconectás el WhatsApp de ${nombreCompleto}?`}
        description="Lo puede volver a vincular cuando quiera."
        confirmLabel="Desconectar WhatsApp"
        variant="warning"
        isLoading={confirmLoading}
      />

      <ConfirmModal
        isOpen={confirmTipo === 'suspender'}
        onClose={() => setConfirmTipo(null)}
        onConfirm={handleConfirm}
        title={`¿Suspendés la cuenta de ${nombreCompleto}?`}
        description="No va a poder entrar hasta que la reactives."
        confirmLabel="Suspender cuenta"
        variant="danger"
        isLoading={confirmLoading}
      />

      {identidadModo && (
        <IdentidadModal
          isOpen={Boolean(identidadModo)}
          modo={identidadModo}
          nombreObjetivo={nombreCompleto}
          emailObjetivo={usuario.email}
          loading={identidadLoading}
          errorMsg={identidadError}
          onClose={() => {
            if (!identidadLoading) {
              setIdentidadModo(null)
              setIdentidadError(null)
            }
          }}
          onSubmit={handleIdentidadSubmit}
        />
      )}
    </div>
  )
}

export default UsuarioDetalle
