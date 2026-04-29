import { Wallet, Plus, CreditCard, Landmark } from 'lucide-react'

export default function BilleterasPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)]">Billeteras</h1>
          <p className="text-[var(--text-3)] font-medium mt-1">
            Gestiona tus cuentas bancarias, billeteras virtuales y efectivo.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-2xl font-bold hover:bg-[var(--primary)]/90 transition-all shadow-lg shadow-[var(--primary)]/20">
          <Plus size={20} />
          Nueva Billetera
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Billetera 1 */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-[#0D2045] to-[#1a3d82] p-8 rounded-[2rem] shadow-xl text-white">
          <div className="flex justify-between items-start mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <Landmark size={24} />
            </div>
            <p className="text-sm font-bold opacity-60">Mercado Pago</p>
          </div>
          <p className="text-sm opacity-80 mb-1">Saldo disponible</p>
          <p className="text-3xl font-black tracking-tight">$24.500,00</p>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
        </div>

        {/* Placeholder Billetera 2 */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-[#1A3D28] to-[#2d6342] p-8 rounded-[2rem] shadow-xl text-white">
          <div className="flex justify-between items-start mb-12">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <CreditCard size={24} />
            </div>
            <p className="text-sm font-bold opacity-60">Banco Galicia</p>
          </div>
          <p className="text-sm opacity-80 mb-1">Saldo disponible</p>
          <p className="text-3xl font-black tracking-tight">$182.100,00</p>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
        </div>

        {/* Botón Agregar */}
        <button className="border-2 border-dashed border-[var(--surface-alt)] rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-[var(--text-3)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all group">
          <div className="w-16 h-16 bg-[var(--surface-alt)] rounded-full flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
            <Plus size={32} />
          </div>
          <p className="font-bold">Agregar otra cuenta</p>
        </button>
      </div>
    </div>
  )
}
