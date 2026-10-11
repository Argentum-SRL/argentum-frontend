import type React from 'react'
import {
  Layers,
  CreditCard,
  MessageSquare,
  Info,
  DollarSign,
  Settings,
} from '@/components/ui/icons'
import {
  CheckSquare,
  MousePointerClick,
  Type,
  Sliders,
  Compass,
  Loader2,
} from 'lucide-react'

export interface CategoryMeta {
  id: string
  name: string
  count: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: string
}

export const CATEGORIES_CONFIG: CategoryMeta[] = [
  { id: 'selectores_segmentados', name: 'Pestañas y Selectores', count: 41, icon: Layers, description: 'Botones en fila para alternar entre opciones (ej: Egreso/Ingreso, Períodos, Mes/Año).' },
  { id: 'opciones_seleccionables', name: 'Tarjetas de Selección', count: 82, icon: CheckSquare, description: 'Opciones clickeables para elegir renovación automática o métodos de pago.' },
  { id: 'botones_accion', name: 'Botones de Acción', count: 533, icon: MousePointerClick, description: 'Botones principales para guardar, cancelar, confirmar o borrar.' },
  { id: 'campos_entrada', name: 'Campos de Texto e Inputs', count: 163, icon: Type, description: 'Casillas para escribir texto y campos con botón de búsqueda.' },
  { id: 'elementos_financieros', name: 'Montos y Saldos ($)', count: 85, icon: DollarSign, description: 'Saldos destacados, teclado de importes y colores semánticos (+/-).' },
  { id: 'tarjetas_paneles', name: 'Tarjetas de Cuentas y Filas', count: 350, icon: CreditCard, description: 'Diseño de tarjetas de cuentas bancarias y renglones de movimientos.' },
  { id: 'modales_dialogos', name: 'Ventanas y Modales', count: 1712, icon: MessageSquare, description: 'Bordes redondeados (16px, 20px, 24px), cabeceras y estructura de ventanas.' },
  { id: 'seleccion_avanzada', name: 'Selectores Especiales', count: 7, icon: Sliders, description: 'Paleta circular de colores y selector de categorías con iconos.' },
  { id: 'navegacion', name: 'Menús y Navegación', count: 24, icon: Compass, description: 'Barra superior en cápsula flotante y menú dock táctil para móviles.' },
  { id: 'elementos_informativos', name: 'Avisos, Badges y Alertas', count: 195, icon: Info, description: 'Etiquetas de estado (Confirmada, Pendiente), avisos en pantalla y banners.' },
  { id: 'estados_interfaz', name: 'Pantallas de Carga y Vacías', count: 140, icon: Loader2, description: 'Animación de carga LunarLoader, esqueletos de carga y pantallas vacías.' },
  { id: 'controles_especiales', name: 'Conmutadores y Ajustes', count: 22, icon: Settings, description: 'Interruptores ON/OFF estilo switch y casillas de verificación.' },
]
