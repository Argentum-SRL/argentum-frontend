import { LayoutDashboard, TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text)]">
          ¡Hola, {usuario?.nombre}! 👋
        </h1>
        <p className="text-[var(--text-3)] font-medium mt-1">
          Bienvenido de nuevo a Argentum. Aquí está el resumen de tus finanzas.
        </p>
      </div>

      {/* Cards de resumen (Placeholders con estilo premium) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[var(--surface)] p-6 rounded-3xl shadow-sm border border-[var(--surface-alt)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
          <p className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider">Patrimonio Total</p>
          <p className="text-3xl font-black text-[var(--text)] mt-1">$450.200</p>
        </div>

        <div className="bg-white dark:bg-[var(--surface)] p-6 rounded-3xl shadow-sm border border-[var(--surface-alt)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ArrowUpRight size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider">Ingresos del Mes</p>
          <p className="text-3xl font-black text-[var(--text)] mt-1">$120.000</p>
        </div>

        <div className="bg-white dark:bg-[var(--surface)] p-6 rounded-3xl shadow-sm border border-[var(--surface-alt)]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <ArrowDownLeft size={24} />
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider">Gastos del Mes</p>
          <p className="text-3xl font-black text-[var(--text)] mt-1">$85.400</p>
        </div>
      </div>

      {/* Sección vacía pero con estilo */}
      <div className="bg-white dark:bg-[var(--surface)] rounded-[2.5rem] p-12 border-2 border-dashed border-[var(--surface-alt)] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-[var(--page)] rounded-full flex items-center justify-center text-[var(--text-3)] mb-6">
          <LayoutDashboard size={40} />
        </div>
        <h3 className="text-xl font-bold text-[var(--text)] mb-2">Comienza a registrar tus movimientos</h3>
        <p className="text-[var(--text-3)] max-w-md">
          Aún no tienes transacciones recientes. Vincula una billetera o agrega un gasto manualmente para ver tus estadísticas.
        </p>
        <button className="mt-8 px-8 py-3 bg-[var(--primary)] text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg shadow-[var(--primary)]/20">
          Agregar Transacción
        </button>
      </div>
    </div>
  )
}
