import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Trash2, 
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Wallet
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { eliminarCuenta } from '../../services/auth.service'

export default function PerfilPage() {
  const { usuario, logout } = useAuth()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    
    setIsDeleting(true)
    try {
      await eliminarCuenta()
      setIsSuccess(true)
      // Esperamos un momento para que el usuario vea el mensaje de éxito
      setTimeout(async () => {
        await logout({ state: { message: 'Cuenta eliminada exitosamente' } })
      }, 2500)
    } catch (error) {
      console.error('Error al eliminar la cuenta:', error)
      alert('Hubo un error al intentar eliminar la cuenta. Por favor, reintenta más tarde.')
    } finally {
      setIsDeleting(false)
    }
  }

  const fechaRegistro = usuario?.fecha_registro 
    ? new Date(usuario.fecha_registro).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Desconocida'

  return (
    <div className="space-y-8 pb-12">
      {/* Header Perfil */}
      <div className="bg-white dark:bg-[var(--surface)] rounded-3xl p-8 shadow-sm border border-[var(--surface-alt)]">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[var(--gold)] flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white dark:border-[var(--surface-alt)]">
              {usuario?.nombre?.charAt(0) || 'U'}
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white dark:border-[var(--surface)] rounded-full" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-[var(--text)] mb-1">
              {usuario?.nombre} {usuario?.apellido}
            </h1>
            <p className="text-[var(--text-3)] font-medium flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              Cuenta {usuario?.auth_provider?.toUpperCase()} Verificada
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
               <span className="px-4 py-1 bg-[var(--surface-alt)] text-[var(--text-2)] rounded-full text-xs font-semibold uppercase tracking-wider">
                  ID: {usuario?.id?.substring(0, 8)}...
               </span>
               <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {usuario?.rol}
               </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Datos Personales */}
        <div className="bg-white dark:bg-[var(--surface)] rounded-3xl p-8 shadow-sm border border-[var(--surface-alt)]">
          <h2 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
            <User className="text-[var(--primary)]" size={20} />
            Datos de la Cuenta
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--page)] rounded-xl text-[var(--text-3)]">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)] font-bold uppercase tracking-tighter">Email</p>
                <p className="text-[var(--text)] font-medium">{usuario?.email || 'No asociado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--page)] rounded-xl text-[var(--text-3)]">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)] font-bold uppercase tracking-tighter">Teléfono</p>
                <p className="text-[var(--text)] font-medium">{usuario?.telefono || 'No asociado'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--page)] rounded-xl text-[var(--text-3)]">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-3)] font-bold uppercase tracking-tighter">Miembro desde</p>
                <p className="text-[var(--text)] font-medium">{fechaRegistro}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className="bg-red-50 dark:bg-red-950/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/20 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-3">
              <AlertTriangle size={20} />
              Zona de Peligro
            </h2>
            <p className="text-red-600/80 dark:text-red-400/60 text-sm mb-6 leading-relaxed">
              Eliminar tu cuenta es una acción **permanente**. Se borrarán todas tus billeteras, transacciones, presupuestos y datos personales de nuestros servidores. No se puede deshacer.
            </p>
          </div>
          
          <button 
            onClick={() => setShowConfirmDelete(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            Eliminar mi cuenta permanentemente
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--surface)] rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
              <AlertTriangle size={40} />
            </div>
            
            <h3 className="text-2xl font-extrabold text-center text-[var(--text)] mb-2">
              ¿Estás absolutamente seguro?
            </h3>
            
            {isSuccess ? (
              <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-green-600 font-bold text-lg">Cuenta eliminada con éxito</p>
                <p className="text-[var(--text-3)] text-sm text-center mt-2">
                  Tus datos han sido borrados de Argentum. <br/>Redirigiendo...
                </p>
              </div>
            ) : (
              <>
                <p className="text-[var(--text-2)] text-center mb-8">
                  Esta acción borrará definitivamente todos tus datos financieros en Argentum.
                </p>
                
                <div className="bg-[var(--page)] p-4 rounded-2xl mb-6">
                  <p className="text-xs font-bold text-[var(--text-3)] uppercase mb-2 text-center">Escribe "ELIMINAR" para confirmar</p>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINAR"
                    className="w-full text-center bg-transparent border-b-2 border-red-300 dark:border-red-900 focus:border-red-600 outline-none py-2 text-red-600 font-black tracking-[0.2em]"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                    onClick={handleDeleteAccount}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirmar Eliminación Total</>
                    )}
                  </button>
                  
                  <button 
                    disabled={isDeleting}
                    onClick={() => {
                      setShowConfirmDelete(false)
                      setDeleteConfirmText('')
                    }}
                    className="w-full py-4 text-[var(--text-2)] font-bold hover:bg-[var(--surface-alt)] rounded-2xl transition-all"
                  >
                    Mejor no, volver atrás
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
